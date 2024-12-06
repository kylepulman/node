import { getEnv, TypedFetch } from '../../lib/index.js'
import { getAccessToken, handleApiError } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

const returnToPreviousTrack = async () =>
  new TypedFetch<SpotifyApiErrorResponse>(
    `${getEnv('SPOTIFY_API_URL')}/me/player/previous`,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      method: 'POST',
    },
    'Error returning to the previous track.',
  ).request().then(initialResult => handleApiError(initialResult))

export default async () => {
  await returnToPreviousTrack()
}
