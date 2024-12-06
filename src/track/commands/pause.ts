import { getEnv, TypedFetch } from '../../lib/index.js'
import { getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

const pausePlayback = async () => new TypedFetch<SpotifyApiErrorResponse>(
  `${getEnv('SPOTIFY_API_URL')}/me/player/pause`,
  {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    method: 'PUT',
  },
  'Error pausing playback.',
).request().then(initialResult => handleApiError(initialResult))

export default async () => {
  await pausePlayback()
}
