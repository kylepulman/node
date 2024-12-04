import { spawn } from 'node:child_process'

export const buildUrl = (base: string, params: Record<string, unknown>) => {
  const url = new URL(base)

  for (const key in params) {
    if (Object.hasOwn(params, key)) {
      url.searchParams.append(key, String(params[key]))
    }
  }

  return url
}

export class RequestError {
  constructor(
    public status: number,
    public error: unknown,
    public message: string,
  ) {
    this.status = status
    this.error = error
    this.message = message
  }
}

export const startServerInBackground = (serverArgs: string[]) => {
  spawn('node', serverArgs, {
    detached: true,
    stdio: 'ignore',
  }).unref()
}
