import type { CheckoutProcessor } from "./api"

export type Transaction = {
  id: string
  customer: string
  amount: number
  type: "sale" | "recurring"
  state: "captured" | "failed" | "auth" | "pending"
  processor: CheckoutProcessor
  lastUpdated: string
}

export type Subscription = {
  id: string
  customer: string
  amount: number
  status: "active" | "inactive"
  processor: CheckoutProcessor
  nextBillingDate: string
}

export type Integration = {
  id: string
  type: "stripe" | "NMI" | "shopify"
  active: boolean
  credentials: Record<string, string>
}

export const transactions: Transaction[] = [
  { id: "txn_001", customer: "John Doe", amount: 34.99, type: "sale", state: "captured", processor: "stripe", lastUpdated: "2026-03-13" },
  { id: "txn_002", customer: "Jane Doe", amount: 34.99, type: "sale", state: "captured", processor: "stripe", lastUpdated: "2026-03-22" },
  { id: "txn_003", customer: "Jane Doe", amount: 34.99, type: "sale", state: "failed", processor: "stripe", lastUpdated: "2026-03-22" },
  { id: "txn_004", customer: "Bob Lee", amount: 134.99, type: "recurring", state: "auth", processor: "NMI", lastUpdated: "2026-03-13" },
  { id: "txn_005", customer: "Alice Park", amount: 49.99, type: "sale", state: "captured", processor: "stripe", lastUpdated: "2026-03-14" },
  { id: "txn_006", customer: "Tom Chen", amount: 89.99, type: "sale", state: "captured", processor: "NMI", lastUpdated: "2026-03-15" },
  { id: "txn_007", customer: "Sara Kim", amount: 24.99, type: "sale", state: "pending", processor: "stripe", lastUpdated: "2026-03-16" },
  { id: "txn_008", customer: "Mike Ross", amount: 199.99, type: "recurring", state: "captured", processor: "NMI", lastUpdated: "2026-03-17" },
  { id: "txn_009", customer: "Lisa Wang", amount: 74.99, type: "sale", state: "failed", processor: "stripe", lastUpdated: "2026-03-18" },
  { id: "txn_010", customer: "Dave Liu", amount: 59.99, type: "sale", state: "captured", processor: "NMI", lastUpdated: "2026-03-19" },
  { id: "txn_011", customer: "Emma Cole", amount: 44.99, type: "recurring", state: "auth", processor: "stripe", lastUpdated: "2026-03-20" },
  { id: "txn_012", customer: "Ryan Bell", amount: 29.99, type: "sale", state: "captured", processor: "NMI", lastUpdated: "2026-03-21" },
  { id: "txn_013", customer: "Nora Cruz", amount: 149.99, type: "sale", state: "captured", processor: "stripe", lastUpdated: "2026-03-23" },
  { id: "txn_014", customer: "Leo Grant", amount: 19.99, type: "sale", state: "pending", processor: "NMI", lastUpdated: "2026-03-24" },
]

export const subscriptions: Subscription[] = [
  { id: "sub_001", customer: "Bob Lee", amount: 134.99, status: "active", processor: "NMI", nextBillingDate: "2026-04-13" },
  { id: "sub_002", customer: "Jack Clyne", amount: 34.99, status: "inactive", processor: "stripe", nextBillingDate: "2026-04-13" },
  { id: "sub_003", customer: "Mike Ross", amount: 199.99, status: "active", processor: "NMI", nextBillingDate: "2026-04-17" },
  { id: "sub_004", customer: "Emma Cole", amount: 44.99, status: "active", processor: "stripe", nextBillingDate: "2026-04-20" },
  { id: "sub_005", customer: "Sara Kim", amount: 24.99, status: "inactive", processor: "stripe", nextBillingDate: "2026-04-16" },
  { id: "sub_006", customer: "Alice Park", amount: 49.99, status: "active", processor: "NMI", nextBillingDate: "2026-04-14" },
  { id: "sub_007", customer: "Dave Liu", amount: 59.99, status: "active", processor: "stripe", nextBillingDate: "2026-04-19" },
]

export const integrations: Integration[] = [
  { id: "int_001", type: "stripe", active: true, credentials: { publishableKey: "pk_test_***", secretKey: "sk_test_***" } },
  { id: "int_002", type: "NMI", active: false, credentials: { securityKey: "", tokenizationKey: "" } },
  { id: "int_003", type: "shopify", active: false, credentials: { apiKey: "", apiSecret: "", storeName: "" } },
]
