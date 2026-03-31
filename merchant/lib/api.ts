import type { Integration } from "./mock-data"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type CheckoutProcessor = "stripe" | "NMI"

type ApiIntegration = {
  id: string
  type: "stripe" | "NMI" | "shopify"
  status: "active" | "inactive"
  creds: Record<string, string>
}

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

function toIntegration(api: ApiIntegration): Integration {
  return {
    id: api.id,
    type: api.type,
    active: api.status === "active",
    credentials: (api.creds ?? {}) as Record<string, string>,
  }
}

export async function fetchIntegrations(
  token: string,
): Promise<Integration[]> {
  const data = await apiFetch<ApiIntegration[]>(
    "/merchant/integrations",
    token,
  )
  return data.map(toIntegration)
}

export async function fetchCheckoutProcessor(
  token: string,
): Promise<CheckoutProcessor> {
  const data = await apiFetch<{ checkoutProcessor: CheckoutProcessor }>(
    "/merchant/checkout-processor",
    token,
  )
  return data.checkoutProcessor
}

export async function updateCheckoutProcessor(
  token: string,
  processor: CheckoutProcessor,
): Promise<CheckoutProcessor> {
  const data = await apiFetch<{ checkoutProcessor: CheckoutProcessor }>(
    "/merchant/checkout-processor",
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ checkoutProcessor: processor }),
    },
  )
  return data.checkoutProcessor
}

export async function updateIntegrationApi(
  token: string,
  id: string,
  updates: { status?: "active" | "inactive"; creds?: Record<string, string> },
): Promise<Integration> {
  const data = await apiFetch<ApiIntegration>(
    `/merchant/integrations/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  )
  return toIntegration(data)
}
