import type { Request, Response } from 'express'
import { Result, TypedFetch, getEnv } from '../../lib/index.js'
import { buildExpiresAt, data, getBasicAuth } from '../lib.js'
import type { Token } from '../types.js'

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
).request()

export default async (req: Request, res: Response) => {
  const { state, code, error } = req.query

  let stored = await data.get()

  if (state !== stored.state) {
    const result = new Result(
      400,
      'State mismatch.',
      'Error requesting authorization code. You may close this tab.',
    )

    res.status(result.status).json(result)
    process.exit(1)
  }

  if (error && error === 'access_denied') {
    const ACCESS_DENIED_HTML
      = `<body style="font-family: sans-serif; margin: 0; padding: 0 2rem; background: black; color: white; display: grid; place-items: center; height: 100vh;">
        <div style="margin: 2rem 0; max-width: 500px;">
          <p>Track has been denied authorization to access your Spotify account. The most likely cause is a rejection of necessary permissions. If this denial was made in error, you can re-authorize by running <code>track login</code>.</p>
          <p>You may close this tab.</p>
        </div>
      </body>`

    res.status(400).send(ACCESS_DENIED_HTML)
    process.exit(1)
  }

  if (error || typeof code !== 'string') {
    const result = new Result(
      400,
      error,
      'Error requesting authorization code. You can try re-authorizing by running `track login`. You may close this tab.',
    )

    res.status(result.status).json(result)
    process.exit(1)
  }

  const result = await requestTokenWithAuthorizationCode(code)

  if (result.status >= 400) {
    res.status(result.status).json(result)
    process.exit()
  }

  stored = await data.get().catch((_err: unknown) => {
    const errorResult = new Result(500, 'Error retrieving stored token.', '')

    res.status(errorResult.status).json(errorResult)
    process.exit(1)
  })

  const expiresAt = buildExpiresAt(result.body.expires_in)

  await data.set({
    ...stored,
    expiresAt,
    token: result.body,
  })

  res.redirect(getEnv('SPOTIFY_PLAYER_URL'))

  process.exit()
}
