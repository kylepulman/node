#!/usr/bin/env node
/* eslint no-console: 'off' */
/* eslint no-shadow: 'off' */
import { Command } from 'commander'
import type { UUID } from 'crypto'
import open from 'open'
import type { CurrentlyPlaying, Track } from 'spotify-types'
import { FileStorage, RequestError, TypedFetch, buildUrl, env, startServerInBackground } from '../lib/index.js'
import type { Token } from './types.js'

export const data = new FileStorage<{
  state?: UUID
  token?: Token
  expiresAt?: Date
}>(`${import.meta.dirname}/data.json`)

const getAccessToken = async () => {
  const stored = await data.get()

  if (stored.expiresAt && new Date() >= new Date(stored.expiresAt)) {
    const requestTokenWithRefreshToken = new TypedFetch<Token>(
      env('SPOTIFY_TOKEN_URL'),
      {
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: stored.token?.refresh_token ?? '',
        }).toString(),
        headers: {
          'Authorization': `Basic ${Buffer.from(`${env('SPOTIFY_CLIENT_ID')}:${env('SPOTIFY_CLIENT_SECRET')}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      },
      'Error refreshing token.',
    )

    const token = await requestTokenWithRefreshToken.request()

    if (token instanceof RequestError) {
      console.error(token)

      return null
    }

    if (typeof token === 'string') {
      console.log(token)

      return null
    }

    const expiresAt = new Date(Date.now() + token.expires_in * 1000)

    token.refresh_token = stored.token?.refresh_token ?? ''

    await data.set({
      ...stored,
      expiresAt,
      token,
    })

    console.log('--- TOKEN REFRESHED ---')
    return token.access_token
  }

  return stored.token?.access_token ?? ''
}

const program = new Command()

program
  .name('track')
  .action(async () => {
    const getCurrentlyPlayingTrack = new TypedFetch<CurrentlyPlaying>(
      `${env('SPOTIFY_API_URL')}/me/player/currently-playing`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken() ?? ''}`,
        },
      },
      'Error getting currently playing track.',
    )

    const body = await getCurrentlyPlayingTrack.request()

    if (body instanceof RequestError) {
      console.error(body)
      return
    }

    if (typeof body === 'string') {
      if (body) {
        console.log(body)
      }
      else {
        console.log('Nothing playing at the moment.')
      }

      return
    }

    const itemIsTrack = (body: CurrentlyPlaying, item: CurrentlyPlaying['item']): item is Track =>
      body.currently_playing_type === 'track' && item?.type === 'track'

    if (typeof body === 'object' && itemIsTrack(body, body.item)) {
      /* eslint-disable */
      const track = {
        name: body.item.name,
        artists: body.item.artists.map(artist => artist.name).join(', '),
        album: body.item.album.name,
      }
      /* eslint-enable */

      console.log(track)
      return
    }

    console.log(body)
  },
  )

program
  .command('play')
  .action(async () => {
    const resumePlayback = new TypedFetch<void>(
      `${env('SPOTIFY_API_URL')}/me/player/play`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken() ?? ''}`,
        },
        method: 'PUT',
      },
      'Error resuming playback.',
    )

    const requestError = await resumePlayback.request()

    if (
      requestError instanceof RequestError
    ) {
      console.error(requestError)
    }
  })

program
  .command('pause')
  .action(async () => {
    const pausePlayback = new TypedFetch<void>(
      `${env('SPOTIFY_API_URL')}/me/player/pause`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken() ?? ''}`,
        },
        method: 'PUT',
      },
      'Error pausing playback.',
    )

    const requestError = await pausePlayback.request()

    if (
      requestError instanceof RequestError
    ) {
      console.error(requestError)
    }
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
