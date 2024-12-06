import open from 'open'
import { buildUrl, getEnv, startServer } from '../../lib/index.js'
import { data, DIRNAME, printMessage } from '../lib.js'

export default async (option: { open?: boolean }) => {
  startServer([`${DIRNAME}/server.js`])

  const state = crypto.randomUUID()

  await data.set({ state })

  const { href } = buildUrl(getEnv('SPOTIFY_AUTHORIZATION_URL'), {
    client_id: getEnv('SPOTIFY_CLIENT_ID'),
    redirect_uri: getEnv('SPOTIFY_REDIRECT_URI'),
    response_type: 'code',
    scope: getEnv('SPOTIFY_SCOPE'),
    state,
  })

  let message = href

  if (option.open) {
    message += '\n\nOpening link in a browser tab...'
    await open(href)
  }

  printMessage(message)
}
