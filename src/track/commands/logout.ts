import { data, printMessage } from '../lib.js'

export default async () => {
  await data.destroy().catch(() => { }) /* eslint-disable-line no-empty-function */

  printMessage('Your Spotify account has been disconnected from Track. You may log back in with `track login`. To revoke the permissions granted to Track from Spotify, visit: https://www.spotify.com/us/account/apps/.')
}
