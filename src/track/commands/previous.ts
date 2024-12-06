import { getEnv, TypedFetch } from '../../lib/index.js'
import { debug, getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

export default async () => {
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
}
