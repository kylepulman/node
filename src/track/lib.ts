/* eslint no-console: 'off' */
import type { UUID } from 'crypto'
import { FileStorage, Result, TypedFetch, debug, getEnv } from '../lib/index.js'
import type { SpotifyApiErrorResponse, Token } from './types.js'

export const DIRNAME = import.meta.dirname

export const printMessage = (message: string, type?: 'log' | 'error' | 'warn') => {
  message = `\n${message}`

  if (type === 'error') {
    console.error(message)
  } else if (type === 'warn') {
    console.warn(message)
  } else {
    console.log(message)
  }
}

export const resultIsError = <TypeIfNot>(
  result: Result<SpotifyApiErrorResponse | TypeIfNot>,
): result is Result<SpotifyApiErrorResponse> => result.status >= 400

export const handleApiError = <TypeIfNot>(
  result: Result<SpotifyApiErrorResponse | TypeIfNot>,
) => {
  debug('handleApiError', result)

  if (resultIsError(result)) {
    if (result.body.error.reason === 'NO_ACTIVE_DEVICE') {
      printMessage(`${result.message} Please start playback at ${getEnv('SPOTIFY_PLAYER_URL')}.`, 'error')
      process.exit()
    }

    if (result.status === 401) {
      printMessage(`${result.message} Try running "track login".`, 'error')
      process.exit()
    }

    if (result.status === 403) {
      if (result.body.error.reason === 'PREMIUM_REQUIRED') {
        printMessage('You must be subscribed to Spotify Premium to use this feature.', 'warn')
        process.exit()
      }
    }

    if (result.status === 429) {
      printMessage('Too many requests.', 'error')
      process.exit()
    }

    if (result.status >= 500) {
      printMessage('Spotify is reporting a server error that is preventing this command from executing successfully. Please try again later.', 'error')
      process.exit()
    }

    printMessage('Unhandled Spotify API error response.', 'error')
    process.exit()
  }

  return result as Result<TypeIfNot>
}

export const data = new FileStorage<{
  state?: UUID
  token?: Token
  expiresAt?: Date
}>(`${import.meta.dirname}/data.json`)

export const buildExpiresAt = (expires_in: number) =>
  new Date(Date.now() + expires_in * 1000)

export const getBasicAuth = () =>
  Buffer
    .from(`${getEnv('SPOTIFY_CLIENT_ID')}:${getEnv('SPOTIFY_CLIENT_SECRET')}`)
    .toString('base64')

export const getAccessToken = async () => {
  let stored

  try {
    stored = await data.get()
  } catch (_err) {
    printMessage('Please run `track login` to connect your Spotify account with Track.', 'error')
    process.exit()
  }

  if (stored.expiresAt && new Date() >= new Date(stored.expiresAt)) {
    const requestTokenWithRefreshToken = new TypedFetch<Token>(
      getEnv('SPOTIFY_TOKEN_URL'),
      {
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: stored.token?.refresh_token ?? '',
        }).toString(),
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      },
      'Error refreshing token.',
    )

    const result = await requestTokenWithRefreshToken.request()

    if (result.status >= 400) {
      printMessage(result.message, 'error')

      return ''
    }

    const expiresAt = buildExpiresAt(result.body.expires_in)

    result.body.refresh_token = stored.token?.refresh_token ?? ''

    await data.set({
      ...stored,
      expiresAt,
      token: result.body,
    })

    printMessage('--- TOKEN REFRESHED ---')
    return result.body.access_token
  }

  return stored.token?.access_token ?? ''
}
