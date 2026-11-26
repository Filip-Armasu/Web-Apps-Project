export async function apiRequest(
    endpoint,
    options = {}
  ) {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...(options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = new Error(
        data?.error ||
        data?.message ||
        'Something went wrong. Please try again.'
      )

      error.status = response.status
      throw error
    }

    return data
  }
