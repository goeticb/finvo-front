const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface KycStatusResponse {
  status?: 'approved' | 'submitted' | 'rejected'
  error?: string
  reason?: string
}

export async function getKycStatus(address: string): Promise<KycStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/kyc-status?address=${address}`)
  return response.json()
}

export interface RegisterUserPayload {
  onChainAddress: string
  kyc: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    countryOfResidence: string
    nationality: string
    idType: string
    idNumber: string
  }
  kyb: {
    companyName: string
    registrationNumber: string
    taxId: string
    country: string
    companyType: string
    incorporationDate: string
    businessAddress: string
    website?: string
  }
}

export async function registerUser(payload: RegisterUserPayload): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.json()
}

export interface TokenBalance {
  token: string
  balance: string
  name: string
  symbol: string
  currency: string
  decimals: number
}

export interface ProfileResponse {
  onChainAddress: string
  status: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
  }
  companyInfo: {
    companyName: string
    registrationNumber: string
    taxId: string
    country: string
    companyType: string
    incorporationDate: string
    businessAddress: string
  }
  balances: TokenBalance[]
}

export async function getProfile(address: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profile?address=${address}`)
  return response.json()
}

export interface CompanySearchResult {
  companyName: string
  onChainAddress: string
}

export interface CreateInvoiceItemPayload {
  item: string
  quantity: number
  price: string
}

export interface CreateInvoicePayload {
  invoiceId: string
  issuer: string
  payer: string
  dueDate: string
  status: 'issued'
  currency: 'USD'
  items: CreateInvoiceItemPayload[]
  amount?: string
}

export interface CreateInvoiceResponse {
  success: boolean
  data: {
    id: string
    issuer: string
    payer: string
    amount?: string
    currency: string
    status: string
    dueDate: string
    createdAt: string
    items: CreateInvoiceItemPayload[]
  }
}

export interface InvoiceRecordItem {
  item: string
  quantity: number
  price: string
}

export interface CompanyByAddress {
  companyName: string
  onChainAddress: string
  status?: string
}

export interface InvoiceRecord {
  invoiceId: string
  issuer: string
  payer: string
  amount?: string
  currency: string
  status: string
  dueDate: string
  createdAt: string
  items: InvoiceRecordItem[]
}

export interface InvoicesByAddressData {
  issued: InvoiceRecord[]
  received: InvoiceRecord[]
}

export async function searchCompanies(
  query: string,
  limit = 10,
  signal?: AbortSignal
): Promise<CompanySearchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/companies/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    { signal }
  )
  if (!response.ok) {
    throw new Error('Failed to load companies')
  }
  const data = await response.json()
  return Array.isArray(data?.data) ? data.data : []
}

export async function getInvoicesByAddress(
  address: string,
  signal?: AbortSignal
): Promise<InvoicesByAddressData> {
  const response = await fetch(
    `${API_BASE_URL}/invoices/by-address?address=${encodeURIComponent(address)}`,
    { signal }
  )

  let payload: { data?: InvoicesByAddressData; error?: string; code?: string; message?: string } | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const code = payload?.error || payload?.code || payload?.message || 'unknown_error'
    const error = new Error(code)
    ;(error as { code?: string }).code = code
    throw error
  }

  return payload?.data ?? { issued: [], received: [] }
}

export async function getCompanyByAddress(
  address: string,
  signal?: AbortSignal
): Promise<CompanyByAddress | null> {
  const response = await fetch(
    `${API_BASE_URL}/companies/name?address=${encodeURIComponent(address)}`,
    { signal }
  )

  let payload: { data?: CompanyByAddress; error?: string; code?: string; message?: string } | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    if (response.status === 404) return null
    const code = payload?.error || payload?.code || payload?.message || 'unknown_error'
    const error = new Error(code)
    ;(error as { code?: string }).code = code
    throw error
  }

  if (payload?.data) return payload.data
  if (payload && 'companyName' in payload) return payload as CompanyByAddress
  return null
}

export async function createInvoiceRecord(
  payload: CreateInvoicePayload
): Promise<CreateInvoiceResponse> {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data: CreateInvoiceResponse | { error?: string; code?: string; message?: string } | null = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const code = data?.error || data?.code || data?.message || 'unknown_error'
    const error = new Error(code)
    ;(error as { code?: string }).code = code
    throw error
  }

  return data as CreateInvoiceResponse
}

export interface UpdateInvoiceStatusPayload {
  invoiceId: string
  status: 'issued' | 'accepted' | 'disputed' | 'canceled' | 'paid'
}

export async function updateInvoiceStatus(
  payload: UpdateInvoiceStatusPayload
): Promise<InvoiceRecord> {
  const response = await fetch(`${API_BASE_URL}/invoices/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data: { data?: InvoiceRecord; error?: string; code?: string; message?: string } | null = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const code = data?.error || data?.code || data?.message || 'unknown_error'
    const error = new Error(code)
    ;(error as { code?: string }).code = code
    throw error
  }

  if (!data?.data) {
    throw new Error('invalid_response')
  }

  return data.data
}
