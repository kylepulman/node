import { getEnv, TypedFetch } from '../../lib/index.js'
import { getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

const skipToNextTrack = async () => new TypedFetch<SpotifyApiErrorResponse>(
  `${getEnv('SPOTIFY_API_URL')}/me/player/next`,
  {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    method: 'POST',
  },
  'Error skipping to the next track.',
).request().then(initialResult => handleApiError(initialResult))

export default async () => {
  await skipToNextTrack()
}
