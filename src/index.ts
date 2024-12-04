import { RequestError } from './lib/index.js'

const requestError = new RequestError(
  400,
  {
    error: 'request_error',
    message: 'there was a problem with this request',
  },
  'Error making HTTP request.')

console.log(requestError instanceof RequestError, requestError) /* eslint-disable-line no-console */
