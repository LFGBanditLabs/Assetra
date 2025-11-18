interface ApiOptions extends RequestInit {
  headers?: HeadersInit
  parse?: 'json' | 'text'
}

export async function apiFetch<TResponse>(
  url: string,
  { headers, parse = 'json', ...rest }: ApiOptions = {},
): Promise<TResponse> {
  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || `Request failed with status ${response.status}`)
  }

  if (parse === 'text') {
    return (await response.text()) as TResponse
  }

  return (await response.json()) as TResponse
}

