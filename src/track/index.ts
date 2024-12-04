#!/usr/bin/env node
import { FileStorage, buildUrl, env, startServerInBackground } from '../lib/index.js'
import { Command } from 'commander'
import type { Token } from './types.js'
import type { UUID } from 'crypto'
import open from 'open'

export const data = new FileStorage<{
  state?: UUID
  token?: Token
  expiresAt?: Date
}>(`${import.meta.dirname}/data.json`)

const program = new Command()

program
  .name('track')
  .action(() => {
    console.log('Hello, Track!') /* eslint-disable-line no-console */
  })

program
  .command('login')
  .action(async () => {
    startServerInBackground([`${import.meta.dirname}/server.js`])

    const state = crypto.randomUUID()

    await data.set({ state })

    const { href } = buildUrl(env('SPOTIFY_AUTHORIZATION_URL'), {
      client_id: env('SPOTIFY_CLIENT_ID'),
      redirect_uri: env('SPOTIFY_REDIRECT_URI'),
      response_type: 'code',
      scope: env('SPOTIFY_SCOPE'),
      state,
    })

    console.log(href) /* eslint-disable-line no-console */

    await open(href)
  })

program.parse()
