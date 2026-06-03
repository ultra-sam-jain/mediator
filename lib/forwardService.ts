export interface ForwardResult {
  ok: boolean
  status: number
  body: string
  error?: string
}

export async function forwardToDestination(
  destinationUrl: string,
  payload: Record<string, unknown>,
): Promise<ForwardResult> {
  try {
    const res = await fetch(destinationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })

    const body = await res.text()
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        body,
        error: `Destination returned ${res.status}`,
      }
    }

    return { ok: true, status: res.status, body }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: '',
      error: err instanceof Error ? err.message : 'Forward request failed',
    }
  }
}
