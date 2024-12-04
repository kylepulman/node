import 'dotenv/config.js'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

export class FileStorage<Data extends Record<string, unknown>> {
  constructor(public path: string) {
    this.path = path
  }

  async get(): Promise<Data> {
    const buffer = await readFile(this.path)
    const text = buffer.toString()

    return JSON.parse(text) as Data
  }

  async set(data: Data): Promise<void> {
    await writeFile(this.path, JSON.stringify(data))
  }
}

export class Result<Body> {
  constructor(
    public status: number,
    public body: Body,
    public message: string,
  ) {
    this.status = status
    this.body = body
    this.message = message
  }
}

export class TypedFetch<Body> {
  constructor(
    public input: string,
    public init: RequestInit & {
      headers?: {
        'Authorization'?: string
        'Content-Type'?: 'application/json' | 'application/x-www-form-urlencoded'
      }
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    },
    public message: string,
  ) {
    this.input = input
    this.init = init
    this.message = message
  }

  async request(): Promise<Result<Body>> {
    const response = await fetch(this.input, this.init)

    const isJson = response
      .headers
      .get('Content-Type')
      ?.includes('application/json') ?? false

    let body: Body

    if (isJson) {
      body = await response.json() as Body
    } else {
      body = await response.text() as Body
    }

    return new Result(response.status, body, this.message)
  }
}

export const buildUrl = (base: string, params: Record<string, unknown>) => {
  const url = new URL(base)

  for (const key in params) {
    if (Object.hasOwn(params, key)) {
      url.searchParams.append(key, String(params[key]))
    }
  }

  return url
}

export const getEnv = (name: string) => {
  const value = process.env[name]

  if (typeof value === 'string') {
    return value
  }

  throw new Error(`Could not process "${name}".`)
}

export const startServer = (args: string[]) => {
  spawn('node', args, {
    detached: true,
    stdio: 'ignore',
  }).unref()
}
