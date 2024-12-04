#!/usr/bin/env node
/* eslint no-console: 'off' */
/* eslint no-shadow: 'off' */
import { Command } from 'commander'
import type { UUID } from 'crypto'
import open from 'open'
import type { CurrentlyPlaying, Track } from 'spotify-types'
import { FileStorage, RequestError, buildUrl, env, startServerInBackground } from '../lib/index.js'
import type { Token } from './types.js'

export const data = new FileStorage<{
  state?: UUID
  token?: Token
  expiresAt?: Date
}>(`${import.meta.dirname}/data.json`)

const program = new Command()

program
  .name('track')
  .action(async () => {
    const stored = await data.get()

    if (stored.expiresAt && new Date() >= new Date(stored.expiresAt)) {
      console.log('--- TOKEN REFRESHED ---')
    }

    const response = await fetch(`${env('SPOTIFY_API_URL')}/me/player/currently-playing`, {
      headers: {
        Authorization: `${stored.token?.token_type ?? ''} ${stored.token?.access_token ?? ''}`,
      },
    })

    let body

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      body = await response.json() as CurrentlyPlaying
    }
    else {
      body = await response.text()
    }

    if (response.ok) {
      if (response.status === 204) {
        console.log('Nothing playing at the moment.')
        return
      }

      const itemIsTrack = (body: CurrentlyPlaying, item: CurrentlyPlaying['item']): item is Track =>
        body.currently_playing_type === 'track' && item?.type === 'track'

      if (typeof body === 'object' && itemIsTrack(body, body.item)) {
        /* eslint-disable */
        body = {
          name: body.item.name,
          artists: body.item.artists.map(artist => artist.name).join(', '),
          album: body.item.album.name,
        }
        /* eslint-enable */

        console.log(body)
        return
      }

      console.log(body)
      return
    }

    console.error(new RequestError(response.status, body, 'Error getting currently playing track.'))
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

    console.log(href)

    await open(href)
  })

program.parse()
