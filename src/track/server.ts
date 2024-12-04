import { RequestError, env } from '../lib/index.js'
import express from 'express'

const app = express()

app.get('/api/auth', async (req, res) => {
  const { code, error } = req.query

  if (error || typeof code !== 'string') {
    res
      .status(400)
      .json(new RequestError(
        400,
        error,
        'Error requesting authorization code.',
      ))

    return
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

  let body

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    body = await response.json()
  }
  else {
    body = await response.text()
  }

  if (response.ok) {
    res.json(body)

    process.exit()
  }

  res
    .status(response.status)
    .json(new RequestError(
      response.status,
      body,
      'Error requesting token.',
    ))

  process.exit()
})

app.listen(3000)
