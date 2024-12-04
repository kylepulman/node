export const buildUrl = (base: string, params: Record<string, unknown>) => {
  const url = new URL(base)

  for (const key in params) {
    if (Object.hasOwn(params, key)) {
      url.searchParams.append(key, String(params[key]))
    }
  }

  return url
}
