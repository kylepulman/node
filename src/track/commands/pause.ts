import { getEnv, TypedFetch } from '../../lib/index.js'
import { debug, getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

export default async () => {
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
}
