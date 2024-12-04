import 'dotenv/config.js'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

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

interface CustomRequestInit extends RequestInit {
  headers?: {
    'Authorization'?: string
    'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded'
  }
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

export class TypedFetch<BodyShape> {
  constructor(
    public input: string,
    public init: CustomRequestInit,
    public errorMessage: string,
  ) {
    this.input = input
    this.init = init
    this.errorMessage = errorMessage
  }

  async request(): Promise<RequestError | BodyShape | string> {
    const response = await fetch(this.input, this.init)

    let body

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      body = await response.json() as BodyShape
    }
    else {
      body = await response.text()
    }

    if (response.ok) {
      return body
    }

    return new RequestError(response.status, body, this.errorMessage)
  }
}
