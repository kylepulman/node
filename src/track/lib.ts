/* eslint no-console: 'off' */
import type { UUID } from 'crypto'
import { FileStorage, TypedFetch, getEnv } from '../lib/index.js'
import type { Token } from './types.js'

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
  const stored = await data.get()

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
      console.error(result)

      return ''
    }

    const expiresAt = buildExpiresAt(result.body.expires_in)

    result.body.refresh_token = stored.token?.refresh_token ?? ''

    await data.set({
      ...stored,
      expiresAt,
      token: result.body,
    })

    console.log('--- TOKEN REFRESHED ---')
    return result.body.access_token
  }

  return stored.token?.access_token ?? ''
}
