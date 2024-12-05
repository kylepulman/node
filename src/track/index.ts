#!/usr/bin/env node
/* eslint no-console: 'off' */
import { Command } from 'commander'
import open from 'open'
import { TypedFetch, buildUrl, getEnv, startServer } from '../lib/index.js'
import { data, getAccessToken } from './lib.js'
import type { CurrentlyPlaying, Episode, Track, Audiobook } from './types.js'

const program = new Command()

program
  .name('track')
  .option('--better')
  .action(async (option: { better?: boolean }) => {
    const getCurrentlyPlayingTrack = new TypedFetch<CurrentlyPlaying>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/currently-playing?additional_types=track,episode`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      },
      'Error getting currently playing track.',
    )

    const result = await getCurrentlyPlayingTrack.request()

    if (result.status >= 400) {
      console.error(result)
      return
    }

    if (result.status === 204) {
      console.log('Nothing playing at the moment.')
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

      console.log(track)
      return
    } else if (itemIsEpisode(result.body, result.body.item)) {
      if (option.better) {
        const getAudiobookById = new TypedFetch<Audiobook>(
          `${getEnv('SPOTIFY_API_URL')}/audiobooks/${result.body.item.show.id}`,
          {
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
          },
          'Error getting audiobook by ID',
        )

        const audiobookResult = await getAudiobookById.request()

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

        console.log(audiobook)
        return
      }

      /* eslint-disable */ const episode = {
        episode: result.body.item.name,
        show: result.body.item.show.name,
        publisher: result.body.item.show.publisher,
        release: new Date(result.body.item.release_date).toLocaleDateString()
      } /* eslint-enable */

      console.log(episode)
      console.warn('To get more accurate information for your audiobooks, run "track --better". Note that this will have a small impact on performance.')
      return
    } else if (result.body.currently_playing_type === 'ad') {
      console.log('Ad playing...')
      return
    }

    console.log(result)
  })

program
  .command('play')
  .action(async () => {
    const resumePlayback = new TypedFetch<void>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/play`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'PUT',
      },
      'Error resuming playback.',
    )

    const result = await resumePlayback.request()

    if (result.status >= 400) {
      console.error(result)
    }
  })

program
  .command('pause')
  .action(async () => {
    const pausePlayback = new TypedFetch<void>(
      `${getEnv('SPOTIFY_API_URL')}/me/player/pause`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        method: 'PUT',
      },
      'Error pausing playback.',
    )

    const result = await pausePlayback.request()

    if (result.status >= 400) {
      console.error(result)
    }
  })

program
  .command('login')
  .option('--open')
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

    console.log(href)

    if (option.open) {
      await open(href)
    }
  })

program.parse()
