import { getEnv, TypedFetch } from '../../lib/index.js'
import { getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

const resumePlayback = async () => new TypedFetch<SpotifyApiErrorResponse>(
  `${getEnv('SPOTIFY_API_URL')}/me/player/play`,
  {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    method: 'PUT',
  },
  'Error resuming playback.',
).request().then(initialResult => handleApiError(initialResult))

export default async () => {
  await resumePlayback()
}
