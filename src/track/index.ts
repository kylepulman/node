#!/usr/bin/env node
/* eslint no-console: 'off' */
import { Command } from 'commander'
import open from 'open'
import { Result, TypedFetch, buildUrl, getEnv, startServer } from '../lib/index.js'
import { data, getAccessToken, printMessage } from './lib.js'
import type { Audiobook, CurrentlyPlaying, Episode, SpotifyApiErrorResponse, Track } from './types.js'

const program = new Command()

export const debug = (at: string, message: unknown) => {
  if (program.opts<{ debug?: boolean }>().debug) {
    console.log(`\n[DEBUG @ ${at}]`, message)
  }
}

const resultIsError = <TypeIfNot>(
  result: Result<SpotifyApiErrorResponse | TypeIfNot>,
): result is Result<SpotifyApiErrorResponse> => result.status >= 400

const handleApiError = <TypeIfNot>(
  result: Result<SpotifyApiErrorResponse | TypeIfNot>,
) => {
  debug('handleApiError', result)

  if (resultIsError(result)) {
    if (result.body.error.reason === 'NO_ACTIVE_DEVICE') {
      printMessage(`${result.message} Please start playback at ${getEnv('SPOTIFY_PLAYER_URL')}.`, 'error')
      process.exit()
    }

    if (result.status === 400) {
      printMessage(`${result.message} Try running "track login".`, 'error')
      process.exit()
    }

    printMessage('Unhandled Spotify API error response.', 'error')
    process.exit()
  }

  return result as Result<TypeIfNot>
}

program
  .name('track')
  .description('Control media playback from the command line. Run `track` with no commands to get information about the currently playing track.')
  .version('0.0.1')
  .option('--book', 'Get more accurate information for audiobooks. This will have a slight impact on performance.')
  .option('--debug', 'Get complete logging messages.')
  .action(async (option: { book?: boolean }) => {
    const result = await new TypedFetch<CurrentlyPlaying | SpotifyApiErrorResponse>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/currently-playing?additional_types=track,episode`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      },
      'Unable to get currently playing track.',
    ).request().then(initialResult => handleApiError(initialResult))

    if (result.status === 204) {
      printMessage('Nothing playing at the moment.')
      return
    }

    const itemIsTrack = (
      body: CurrentlyPlaying,
      item: CurrentlyPlaying['item'],
    ): item is Track =>
      body.currently_playing_type === 'track' && item?.type === 'track'

    const itemIsEpisode = (
      body: CurrentlyPlaying,
      item: CurrentlyPlaying['item'],
    ): item is Episode =>
      body.currently_playing_type === 'episode' && item?.type === 'episode'

    if (itemIsTrack(result.body, result.body.item)) {
      /* eslint-disable */ const track = {
        name: result.body.item.name,
        artists: result.body.item.artists.map(artist => artist.name).join(', '),
        album: result.body.item.album.name,
      } /* eslint-enable */

      printMessage(JSON.stringify(track, null, 2))
      return
    } else if (itemIsEpisode(result.body, result.body.item)) {
      if (option.book) {
        const audiobookResult = await new TypedFetch<Audiobook>(
          `${getEnv('SPOTIFY_API_URL')}/audiobooks/${result.body.item.show.id}`,
          {
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
          },
          'Error getting audiobook by ID',
        ).request().then((initialResult) => {
          if (initialResult.status === 404) {
            return null
          }

          return handleApiError(initialResult)
        })

        if (audiobookResult) {
          const episode = result.body.item
          const [chapter] = audiobookResult
            .body
            .chapters
            .items
            .filter(item => item.id === episode.id)

          /* eslint-disable */ const audiobook = {
            chapter: result.body.item.name,
            book: audiobookResult.body.name,
            author: audiobookResult.body.authors.map(author => author.name).join(', '),
            release: chapter?.release_date,
          } /* eslint-enable */

          printMessage(JSON.stringify(audiobook, null, 2))
          return
        }
      }

      /* eslint-disable */ const episode = {
        episode: result.body.item.name,
        show: result.body.item.show.name,
        publisher: result.body.item.show.publisher,
        release: new Date(result.body.item.release_date).toLocaleDateString()
      } /* eslint-enable */

      printMessage(JSON.stringify(episode, null, 2))
      printMessage('To get more accurate information for your audiobooks, run "track --book". Note that this will have a small impact on performance.', 'warn')
      return
    } else if (result.body.currently_playing_type === 'ad') {
      printMessage('Ad playing...')
      return
    }

    console.log(result)
  })

program
  .command('login')
  .description('Get a link to connect your Spotify account with Track.')
  .option('-o, --open', 'Open the link in a browser window.')
  .action(async (option: { open?: boolean }) => {
    startServer([`${import.meta.dirname}/server.js`])

    const state = crypto.randomUUID()

    await data.set({ state })

    const { href } = buildUrl(getEnv('SPOTIFY_AUTHORIZATION_URL'), {
      client_id: getEnv('SPOTIFY_CLIENT_ID'),
      redirect_uri: getEnv('SPOTIFY_REDIRECT_URI'),
      response_type: 'code',
      scope: getEnv('SPOTIFY_SCOPE'),
      state,
    })

    let message = href

    if (option.open) {
      message += '\n\nOpening link in a browser tab...'
      await open(href)
    }

    printMessage(message)
  })

program
  .command('logout')
  .description('Disconnect your Spotify account from Track.')
  .action(async () => {
    await data.destroy().catch(() => { }) /* eslint-disable-line no-empty-function */

    printMessage('Your Spotify account has been disconnected from Track. You may log back in with `track login`. To revoke the permissions granted to Track from Spotify, visit: https://www.spotify.com/us/account/apps/.')
  })

program
  .command('play')
  .description('Resume playback.')
  .action(async () => {
    const result = await new TypedFetch<SpotifyApiErrorResponse>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/play`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'PUT',
      },
      'Error resuming playback.',
    ).request().then(initialResult => handleApiError(initialResult))

    debug('resume playback result', result)
  })

program
  .command('pause')
  .description('Pause playback.')
  .action(async () => {
    const result = await new TypedFetch<SpotifyApiErrorResponse>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/pause`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'PUT',
      },
      'Error pausing playback.',
    ).request().then(initialResult => handleApiError(initialResult))

    debug('pause playback result', result)
  })

program
  .command('next')
  .description('Skip to the next track.')
  .action(async () => {
    const result = await new TypedFetch<SpotifyApiErrorResponse>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/next`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'POST',
      },
      'Error skipping to the next track.',
    ).request().then(initialResult => handleApiError(initialResult))

    debug('next track result', result)
  })

program
  .command('previous')
  .description('Return to the previous track.')
  .action(async () => {
    const result = await new TypedFetch<SpotifyApiErrorResponse>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/previous`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'POST',
      },
      'Error returning to the previous track.',
    ).request().then(initialResult => handleApiError(initialResult))

    debug('previous track result', result)
  })

program
  .command('volume')
  .argument('<percent>')
  .description('Set the volume by percentage.')
  .action(async (percent: string) => {
    const { href } = buildUrl(`${getEnv('SPOTIFY_API_URL')}/me/player/volume`, {
      volume_percent: percent,
    })

    const result = await new TypedFetch<SpotifyApiErrorResponse>(
      href,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'PUT',
      },
      'Error setting the volume.',
    ).request().then(initialResult => handleApiError(initialResult))

    debug('set volume result', result)
  })

program.parse()
