#!/usr/bin/env node
import { buildUrl, env, startServerInBackground } from '../lib/index.js'
import { Command } from 'commander'
import open from 'open'

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

    const { href } = buildUrl(env('SPOTIFY_AUTHORIZATION_URL'), {
      client_id: env('SPOTIFY_CLIENT_ID'),
      redirect_uri: env('SPOTIFY_REDIRECT_URI'),
      response_type: 'code',
      scope: env('SPOTIFY_SCOPE'),
    })

    console.log(href) /* eslint-disable-line no-console */

    await open(href)
  })

program.parse()
