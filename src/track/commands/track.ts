import { TypedFetch, getEnv } from '../../lib/index.js'
import { getAccessToken, handleApiError, printMessage } from '../lib.js'
import type { Audiobook, CurrentlyPlaying, Episode, SpotifyApiErrorResponse, Track } from '../types.js'

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

const getCurrentlyPlayingTrack = async () =>
  new TypedFetch<CurrentlyPlaying | SpotifyApiErrorResponse>(
    `${getEnv('SPOTIFY_API_URL')}/me/player/currently-playing?additional_types=track,episode`,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    },
    'Unable to get currently playing track.',
  ).request().then(initialResult => handleApiError(initialResult))

const getAudiobookByShowId = async (showId: string) =>
  new TypedFetch<Audiobook>(
    `${getEnv('SPOTIFY_API_URL')}/audiobooks/${showId}`,
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

export default async (option: { book?: boolean }) => {
  const result = await getCurrentlyPlayingTrack()

  if (result.status === 204) {
    printMessage('Nothing playing at the moment.')
    return
  }

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
      const audiobookResult = await getAudiobookByShowId(result.body.item.show.id)

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
          author: audiobookResult
            .body
            .authors
            .map(author => author.name).join(', '),
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

    if (!option.book) {
      printMessage('To get more accurate information for your audiobooks, run "track --book". Note that this will have a small impact on performance.', 'warn')
    }
    return
  } else if (result.body.currently_playing_type === 'ad') {
    printMessage('Ad playing...')
    return
  }

  printMessage(JSON.stringify(result, null, 2))
}
