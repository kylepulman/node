import { getEnv, TypedFetch } from '../../lib/index.js'
import { debug, getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

export default async () => {
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
}
