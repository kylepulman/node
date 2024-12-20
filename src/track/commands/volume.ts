import { buildUrl, getEnv, TypedFetch } from '../../lib/index.js'
import { getAccessToken, handleApiError, printMessage } from '../lib.js'
import type { SpotifyApiErrorResponse } from '../types.js'

const setVolumeByPercent = async (href: string) =>
  new TypedFetch<SpotifyApiErrorResponse>(
    href,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      method: 'PUT',
    },
    'Error setting the volume.',
  ).request().then(initialResult => handleApiError(initialResult))

export default async (percent: string) => {
  const percentAsNumber = Math.floor(Number(percent))

  if (percentAsNumber > 100 || percentAsNumber < 0) {
    printMessage('"percent" argument is out of range. Please enter a number between 0 and 100, inclusive.', 'error')
    return
  }

  const { href } = buildUrl(`${getEnv('SPOTIFY_API_URL')}/me/player/volume`, {
    volume_percent: percentAsNumber,
  })

  await setVolumeByPercent(href)
}
