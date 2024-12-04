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

export class FileStorage<Shape extends Record<string, unknown>> {
  constructor(public path: string) {
    this.path = path
  }

  async get(): Promise<Shape> {
    const buffer = await readFile(this.path)
    const text = buffer.toString()

    return JSON.parse(text) as Shape
  }

  async set(data: Shape) {
    await writeFile(this.path, JSON.stringify(data))
  }
}
