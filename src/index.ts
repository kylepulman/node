import { buildUrl } from './lib/index.js'

const url = buildUrl('http://localhost:3000', {
  anotherParam: false,
  firstParam: 'asdf',
})

console.log(url) /* eslint-disable-line no-console */
