export type {
  CurrentlyPlaying,
  Episode,
  Track,
} from 'spotify-types'

export type Token = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: string
}
