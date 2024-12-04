import 'dotenv/config.js'
import { readFile, writeFile } from 'node:fs/promises'
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

export const env = (name: string) => {
  const value = process.env[name]

  if (typeof value === 'string') {
    return value
  }

  throw new Error(`Could not process "${name}".`)
}

export const fileStorage = {
  get: async (path: string): Promise<Record<string, string>> => {
    const buffer = await readFile(`${path}.json`)
    const text = buffer.toString()

    return JSON.parse(text) as Record<string, string>
  },
  set: async (path: string, data: Record<string, unknown>) => {
    await writeFile(`${path}.json`, JSON.stringify(data))
  },
}
