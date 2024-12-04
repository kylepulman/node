import { RequestError, env } from '../lib/index.js'
import type { Token } from './types.js'
import { data } from './index.js'
import express from 'express'

const app = express()

app.get('/api/auth', async (req, res) => {
  const { state, code, error } = req.query

  let stored = await data.get()

  if (state !== stored.state || error || typeof code !== 'string') {
    res
      .status(400)
      .json(new RequestError(
        400,
        error,
        'Error requesting authorization code.',
      ))

    process.exit()
  }

  const response = await fetch(env('SPOTIFY_TOKEN_URL'), {
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: env('SPOTIFY_REDIRECT_URI'),
    }).toString(),
    headers: {
      'Authorization': `Basic ${Buffer.from(`${env('SPOTIFY_CLIENT_ID')}:${env('SPOTIFY_CLIENT_SECRET')}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const token = await response.json() as Token

  if (response.ok) {
    stored = await data.get()

    const expiresAt = new Date(Date.now() + token.expires_in * 1000)

    await data.set({
      ...stored,
      expiresAt,
      token,
    })

    const html = `<body style="
                    margin: 0; 
                    font-size: 2rem; 
                    background: black; 
                    color: white; 
                    height: 100vh;
                    display: grid; 
                    place-items: center;
                  ">Connected successfully, you may close this tab.</body>`

    res.send(html)

    process.exit()
  }

  res
    .status(response.status)
    .json(new RequestError(
      response.status,
      token,
      'Error requesting token.',
    ))

  process.exit()
})

app.listen(3000)
