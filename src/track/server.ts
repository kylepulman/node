import express from 'express'
import { Result, TypedFetch, getEnv } from '../lib/index.js'
import { buildExpiresAt, data, getBasicAuth } from './lib.js'
import type { Token } from './types.js'

const requestTokenWithAuthorizationCode = (code: string) => new TypedFetch<Token>(
  getEnv('SPOTIFY_TOKEN_URL'),
  {
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: getEnv('SPOTIFY_REDIRECT_URI'),
    }).toString(),
    headers: {
      'Authorization': `Basic ${getBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  },
  'Error requesting token with authorization code.',
)

const app = express()

app.get('/api/auth', async (req, res) => {
  const { state, code, error } = req.query

  let stored = await data.get()

  if (state !== stored.state || typeof code !== 'string' || error) {
    res.status(400).json(new Result(
      400,
      error,
      'Error requesting authorization code.',
    ))

    process.exit()
  }

  const result = await requestTokenWithAuthorizationCode(code).request()

  if (result.status >= 400) {
    res.status(result.status).json(result)

    process.exit()
  }

  stored = await data.get()

  const expiresAt = buildExpiresAt(result.body.expires_in)

  await data.set({
    ...stored,
    expiresAt,
    token: result.body,
  })

  res.redirect(getEnv('SPOTIFY_PLAYER_URL'))

  process.exit()
})

app.listen(3000)
