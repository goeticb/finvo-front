import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { decodeEventLog } from 'viem'
import { Card } from '@/components/ui/Card'
import {
  createInvoiceRecord,
  getCompanyByAddress,
  searchCompanies,
  type CompanySearchResult,
  type CreateInvoiceItemPayload,
  type CompanyByAddress,
  type InvoiceRecord,
  updateInvoiceStatus,
} from '@/services/api'
import { INVOICE_NFT_ABI, invoiceNftAddress } from '@/contracts/invoiceNft'
import { INVOICE_FACTORING_ABI, invoiceFactoringAddress } from '@/contracts/invoiceFactoring'
import { useInvoicesByAddress } from '@/hooks/useInvoicesByAddress'
import { useProfile } from '@/hooks/useProfile'
import { ITIP20_ABI } from '@/contracts/itip20'

const PRICE_DECIMALS = 6

function toMinorUnits(value: string, decimals = PRICE_DECIMALS): bigint {
  const trimmed = value.trim()
  if (!trimmed) return 0n
  const [rawWhole = '0', fraction = ''] = trimmed.split('.')
  const whole = rawWhole === '' ? '0' : rawWhole

  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction)) {
    throw new Error('Invalid price format')
  }

  const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals)
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, '')
  return BigInt(combined || '0')
}

function formatMinorUnits(value: bigint, decimals = PRICE_DECIMALS): string {
  const negative = value < 0n
  const absValue = negative ? -value : value
  const raw = absValue.toString().padStart(decimals + 1, '0')
  const whole = raw.slice(0, -decimals) || '0'
  const fraction = raw.slice(-decimals).padStart(decimals, '0')
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

function parseDecimal(value: string | undefined): number {
  if (!value) return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeStatus(status: string): InvoiceStatus {
  if (
    status === 'issued' ||
    status === 'accepted' ||
    status === 'disputed' ||
    status === 'canceled' ||
    status === 'paid' ||
    status === 'sold to Finvo'
  ) {
    return status
  }
  return 'issued'
}

function mapInvoiceRecord(
  record: InvoiceRecord,
  role: InvoiceType,
  companyNameMap: Record<string, string>
): Invoice {
  const issuerName = companyNameMap[record.issuer] ?? record.issuer
  const payerName = companyNameMap[record.payer] ?? record.payer
  const counterpartyAddress = role === 'issued' ? record.payer : record.issuer
  const counterpartyName = role === 'issued' ? payerName : issuerName
  const lineItems: InvoiceLineItem[] = record.items.map((item) => {
    const unitPrice = parseDecimal(item.price)
    const qty = item.quantity
    return {
      qty,
      description: item.item,
      unitPrice,
      amount: unitPrice * qty,
    }
  })

  const computedAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const amount = record.amount ? parseDecimal(record.amount) : computedAmount

  return {
    id: record.invoiceId,
    invoiceNumber: record.invoiceId,
    counterparty: counterpartyName,
    counterpartyAddress: [counterpartyAddress],
    companyName: issuerName,
    companyAddress: [record.issuer],
    amount,
    currency: record.currency,
    date: record.createdAt,
    dueDate: record.dueDate,
    status: normalizeStatus(record.status),
    lineItems,
    taxRate: 0,
    terms: [],
  }
}

type InvoiceType = 'issued' | 'received'
type InvoiceStatus = 'issued' | 'accepted' | 'disputed' | 'canceled' | 'paid' | 'sold to Finvo'

interface InvoiceLineItem {
  qty: number
  description: string
  unitPrice: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  counterparty: string
  counterpartyAddress: string[]
  shipTo?: {
    name: string
    address: string[]
  }
  companyName: string
  companyAddress: string[]
  amount: number
  currency: string
  date: string
  dueDate: string
  poNumber?: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  taxRate: number
  terms: string[]
}

const statusStyles: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  issued: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Issued' },
  accepted: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Accepted' },
  disputed: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Disputed' },
  canceled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Canceled' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
  'sold to Finvo': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Sold to Finvo' },
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatTokenBalance(balance: string, decimals: number): string {
  try {
    const value = BigInt(balance)
    const divisor = BigInt(10) ** BigInt(decimals)
    const integerPart = value / divisor
    const fractionalPart = value % divisor
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmedFractional = fractionalStr.slice(0, 2)
    return `${integerPart.toLocaleString()}.${trimmedFractional}`
  } catch {
    return '0.00'
  }
}

function toMinorUnitsFromNumber(value: number, decimals = PRICE_DECIMALS): bigint {
  if (!Number.isFinite(value)) return 0n
  const fixed = value.toFixed(decimals)
  return toMinorUnits(fixed, decimals)
}

function InlineSpinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateNumeric(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface InvoiceModalProps {
  invoice: Invoice
  type: InvoiceType
  onClose: () => void
}

interface PayInvoiceModalProps {
  invoice: Invoice
  onClose: () => void
  onSuccess: (message: string) => void
}

interface CreateInvoiceFormData {
  payer: string
  payerAddress: string
  currency: string
  dueDate: string
  items: {
    item: string
    quantity: string
    price: string
  }[]
}

interface CreateInvoiceModalProps {
  onClose: () => void
  onSubmit: (data: CreateInvoiceFormData) => void
  onSuccess: (message: string) => void
}

function CreateInvoiceModal({ onClose, onSubmit, onSuccess }: CreateInvoiceModalProps) {
  const ROW_HEIGHT = 56
  const [formData, setFormData] = useState<CreateInvoiceFormData>({
    payer: '',
    payerAddress: '',
    currency: 'USD',
    dueDate: '',
    items: [{ item: '', quantity: '1', price: '' }],
  })
  const [itemsPage, setItemsPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const itemsListRef = useRef<HTMLDivElement | null>(null)
  const payerContainerRef = useRef<HTMLDivElement | null>(null)
  const [companyMatches, setCompanyMatches] = useState<CompanySearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { writeContractAsync, isPending } = useWriteContract()
  const { address: issuerAddress } = useAccount()
  const publicClient = usePublicClient()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (!issuerAddress) {
      setSubmitError('Connect your wallet to continue.')
      return
    }

    const payerAddress = formData.payerAddress.trim()
    if (!payerAddress) {
      setSubmitError('Select a company from the list.')
      return
    }

    if (!formData.dueDate) {
      setSubmitError('Choose a due date.')
      return
    }

    if (formData.currency !== 'USD' && formData.currency !== 'EUR') {
      setSubmitError('Unsupported currency selected.')
      return
    }

    const dueDateMs = new Date(`${formData.dueDate}T00:00:00.000Z`).getTime()
    if (Number.isNaN(dueDateMs)) {
      setSubmitError('Invalid due date.')
      return
    }

    const diffMs = dueDateMs - Date.now()
    const dueDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))

    const contractItems: { description: string; quantity: bigint; unitPrice: bigint }[] = []
    const backendItems: CreateInvoiceItemPayload[] = []
    for (let index = 0; index < formData.items.length; index += 1) {
      const row = formData.items[index]
      const description = row.item.trim()
      if (!description) {
        setSubmitError(`Line item ${index + 1} needs a description.`)
        return
      }

      const quantityValue = Number(row.quantity)
      if (!Number.isFinite(quantityValue) || quantityValue <= 0 || !Number.isInteger(quantityValue)) {
        setSubmitError(`Line item ${index + 1} needs a valid quantity.`)
        return
      }

      if (!row.price.trim()) {
        setSubmitError(`Line item ${index + 1} needs a price.`)
        return
      }

      let unitPrice: bigint
      try {
        unitPrice = toMinorUnits(row.price, PRICE_DECIMALS)
      } catch {
        setSubmitError(`Line item ${index + 1} has an invalid price.`)
        return
      }

      contractItems.push({
        description,
        quantity: BigInt(Math.floor(quantityValue)),
        unitPrice,
      })

      backendItems.push({
        item: description,
        quantity: Math.floor(quantityValue),
        price: formatMinorUnits(unitPrice, PRICE_DECIMALS),
      })
    }

    try {
      const hash = await writeContractAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'createInvoice',
        args: [payerAddress, formData.currency, BigInt(dueDays), contractItems],
      })

      if (!publicClient) {
        setSubmitError('Unable to confirm transaction.')
        return
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') {
        setSubmitError('Transaction reverted.')
        return
      }

      let tokenId: string | null = null
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== invoiceNftAddress.toLowerCase()) continue
        try {
          const decoded = decodeEventLog({
            abi: INVOICE_NFT_ABI,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'InvoiceCreated') {
            tokenId = (decoded.args as { tokenId?: bigint }).tokenId?.toString() ?? null
            if (tokenId) break
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (!tokenId) {
        setSubmitError('Unable to read invoice id from transaction.')
        return
      }

      const dueDateIso = `${formData.dueDate}T00:00:00.000Z`

      setIsSaving(true)
      await createInvoiceRecord({
        invoiceId: tokenId,
        issuer: issuerAddress,
        payer: payerAddress,
        dueDate: dueDateIso,
        status: 'issued',
        currency: formData.currency,
        items: backendItems,
      })
      onSuccess(`You have successfully created invoice ${tokenId}.`)
      setIsSaving(false)
      onSubmit(formData)
    } catch (error) {
      setIsSaving(false)
      const code = (error as { code?: string }).code
      const message =
        code || (error as Error)?.message || 'Failed to create invoice. Please try again.'
      setSubmitError(message)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, payer: value, payerAddress: '' }))
    setActiveIndex(-1)
    if (value.trim().length >= 2) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
      setCompanyMatches([])
      setSearchError(null)
    }
  }

  const handleSelectCompany = (company: CompanySearchResult) => {
    setFormData((prev) => ({
      ...prev,
      payer: company.companyName,
      payerAddress: company.onChainAddress,
    }))
    setIsDropdownOpen(false)
    setCompanyMatches([])
    setActiveIndex(-1)
  }

  const handlePayerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' && companyMatches.length > 0) {
        e.preventDefault()
        setIsDropdownOpen(true)
        setActiveIndex(0)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (companyMatches.length === 0 ? -1 : (prev + 1) % companyMatches.length))
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) =>
        companyMatches.length === 0 ? -1 : (prev - 1 + companyMatches.length) % companyMatches.length
      )
    }

    if (e.key === 'Enter' && activeIndex >= 0 && companyMatches[activeIndex]) {
      e.preventDefault()
      handleSelectCompany(companyMatches[activeIndex])
    }

    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
      setActiveIndex(-1)
    }
  }

  const handleItemChange = (
    index: number,
    field: 'item' | 'quantity' | 'price',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }))
  }

  const handleQuickDueDate = (daysFromNow: number) => {
    const target = new Date()
    target.setDate(target.getDate() + daysFromNow)
    const year = target.getFullYear()
    const month = String(target.getMonth() + 1).padStart(2, '0')
    const day = String(target.getDate()).padStart(2, '0')
    const dateValue = `${year}-${month}-${day}`
    setFormData((prev) => ({ ...prev, dueDate: dateValue }))
  }

  const handleAddItem = () => {
    setFormData((prev) => {
      const nextItems = [...prev.items, { item: '', quantity: '1', price: '' }]
      const safeItemsPerPage = Math.max(1, itemsPerPage)
      const nextPage = Math.floor((nextItems.length - 1) / safeItemsPerPage)
      setItemsPage(nextPage)
      return {
        ...prev,
        items: nextItems,
      }
    })
  }

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => {
      if (prev.items.length <= 1) return prev
      const nextItems = prev.items.filter((_, rowIndex) => rowIndex !== index)
      const safeItemsPerPage = Math.max(1, itemsPerPage)
      const nextLastPage = Math.max(0, Math.ceil(nextItems.length / safeItemsPerPage) - 1)
      setItemsPage((current) => Math.min(current, nextLastPage))
      return {
        ...prev,
        items: nextItems,
      }
    })
  }

  useEffect(() => {
    const element = itemsListRef.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const update = () => {
      const height = element.clientHeight
      if (!height) return
      const nextPerPage = Math.max(1, Math.floor(height / ROW_HEIGHT))
      setItemsPerPage((current) => (current === nextPerPage ? current : nextPerPage))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const safeItemsPerPage = Math.max(1, itemsPerPage)
  const totalItemPages = Math.ceil(formData.items.length / safeItemsPerPage)
  const pageStartIndex = itemsPage * safeItemsPerPage
  const pageItems = formData.items.slice(pageStartIndex, pageStartIndex + safeItemsPerPage)

  useEffect(() => {
    const query = formData.payer.trim()
    if (!isDropdownOpen || query.length < 2) {
      setCompanyMatches([])
      setIsSearching(false)
      setSearchError(null)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true)
        setSearchError(null)
        const results = await searchCompanies(query, 10, controller.signal)
        setCompanyMatches(results)
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return
        setSearchError('Unable to load companies')
        setCompanyMatches([])
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [formData.payer, isDropdownOpen])

  useEffect(() => {
    setActiveIndex((prev) =>
      companyMatches.length === 0 ? -1 : Math.min(prev, companyMatches.length - 1)
    )
  }, [companyMatches])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!payerContainerRef.current) return
      if (!payerContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setItemsPage((current) => Math.min(current, Math.max(0, totalItemPages - 1)))
  }, [totalItemPages])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-[640px] h-[720px] max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Issue New Invoice</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new invoice</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-6 py-4 flex flex-col gap-4 flex-1 min-h-0">
            {/* Payer */}
            <div ref={payerContainerRef} className="relative">
              <label htmlFor="payer" className="block text-sm font-medium text-gray-700 mb-1">
                Payer (Bill To) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="payer"
                name="payer"
                value={formData.payer}
                onChange={handlePayerChange}
                onFocus={() => {
                  if (formData.payer.trim().length >= 2) setIsDropdownOpen(true)
                }}
                onKeyDown={handlePayerKeyDown}
                placeholder="Enter client or company name"
                required
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isDropdownOpen}
                aria-controls="payer-company-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />

              {isDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {isSearching && (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                  )}
                  {!isSearching && searchError && (
                    <div className="px-3 py-2 text-sm text-red-600">{searchError}</div>
                  )}
                  {!isSearching && !searchError && companyMatches.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No companies found</div>
                  )}
                  {!isSearching && !searchError && companyMatches.length > 0 && (
                    <ul
                      id="payer-company-list"
                      role="listbox"
                      className="max-h-56 overflow-y-auto"
                    >
                      {companyMatches.map((company, index) => (
                        <li key={company.onChainAddress} role="option" aria-selected={index === activeIndex}>
                          <button
                            type="button"
                            onClick={() => handleSelectCompany(company)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              index === activeIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {company.companyName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR" disabled>
                  EUR - Euro (Coming soon)
                </option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={today}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              <div className="mt-2 flex items-center gap-2">
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleQuickDueDate(days)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            {/* Line Items */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2 min-h-8">
                <label className="block text-sm font-medium text-gray-700">
                  Line Items <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 text-xs text-gray-500 ${
                      totalItemPages > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    aria-hidden={totalItemPages <= 1}
                  >
                    <button
                      type="button"
                      onClick={() => setItemsPage((page) => Math.max(0, page - 1))}
                      disabled={itemsPage === 0}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <span>
                      {itemsPage + 1}/{totalItemPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemsPage((page) => Math.min(totalItemPages - 1, page + 1))}
                      disabled={itemsPage >= totalItemPages - 1}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add item
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                  <span>Item</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Price</span>
                </div>

                <div ref={itemsListRef} className="divide-y divide-gray-200 flex-1 min-h-0">
                  {pageItems.map((row, index) => {
                    const rowIndex = pageStartIndex + index
                    return (
                      <div
                        key={rowIndex}
                        className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-3 h-14 items-center"
                      >
                        <input
                          type="text"
                          value={row.item}
                          onChange={(e) => handleItemChange(rowIndex, 'item', e.target.value)}
                          placeholder="Service or product"
                          required
                          className="min-w-0 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(rowIndex, 'quantity', e.target.value)}
                          min="1"
                          step="1"
                          required
                          className="min-w-0 h-10 px-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="number"
                            value={row.price}
                            onChange={(e) => handleItemChange(rowIndex, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            required
                            className="flex-1 min-w-0 h-10 px-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(rowIndex)}
                            disabled={formData.items.length <= 1}
                            className="text-xs text-gray-400 hover:text-red-500 disabled:text-gray-300 shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            {submitError && (
              <p className="mb-3 text-sm text-red-600">{submitError}</p>
            )}
            <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending || isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner className="h-4 w-4" />
                  Creating...
                </span>
              ) : (
                'Create Invoice'
              )}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function InvoiceModal({ invoice, type, onClose }: InvoiceModalProps) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * invoice.taxRate
  const total = subtotal + taxAmount
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement | null>(null)

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || isDownloading) return
    setIsDownloading(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (doc) => {
          const root = doc.getElementById('invoice-pdf')
          if (!root) return

          doc.documentElement.style.backgroundColor = '#ffffff'
          doc.body.style.backgroundColor = '#ffffff'

          root.style.backgroundColor = '#ffffff'
          root.style.color = '#111827'

          const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
          elements.forEach((el) => {
            el.style.color = '#111827'
            el.style.borderColor = '#e5e7eb'
            el.style.backgroundColor = 'transparent'
            el.style.boxShadow = 'none'
          })
        },
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = canvas.height * (imgWidth / canvas.width)

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice Content */}
        <div id="invoice-pdf" ref={invoiceRef} className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-navy-900 tracking-wide" style={{ color: '#1a365d' }}>
                INVOICE
              </h1>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">{invoice.companyName}</p>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To / Invoice Details */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">BILL TO</p>
              <p className="text-sm text-gray-900">{invoice.counterparty}</p>
            </div>
            {invoice.shipTo && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">SHIP TO</p>
                <p className="text-sm text-gray-900">{invoice.shipTo.name}</p>
                {invoice.shipTo.address.map((line, i) => (
                  <p key={i} className="text-sm text-gray-600">
                    {line}
                  </p>
                ))}
              </div>
            )}
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#c53030' }}>
                    INVOICE ID
                  </span>
                  <span className="text-sm text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#c53030' }}>
                    INVOICE DATE
                  </span>
                  <span className="text-sm text-gray-900">{formatDateNumeric(invoice.date)}</span>
                </div>
                {invoice.poNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#c53030' }}>
                      P.O.#
                    </span>
                    <span className="text-sm text-gray-900">{invoice.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#c53030' }}>
                    DUE DATE
                  </span>
                  <span className="text-sm text-gray-900">{formatDateNumeric(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <div
              className="border-t-4 border-b-2"
              style={{ borderTopColor: '#1a365d', borderBottomColor: '#c53030' }}
            >
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-3 text-left text-sm font-semibold text-gray-700 w-16">QTY</th>
                    <th className="py-3 text-left text-sm font-semibold text-gray-700">DESCRIPTION</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">UNIT PRICE</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900 text-center">{item.qty}</td>
                      <td className="py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm text-gray-900">{subtotal.toFixed(2)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Sales Tax {(invoice.taxRate * 100).toFixed(2)}%</span>
                    <span className="text-sm text-gray-900">{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between py-3 border-t-2 mt-2"
                  style={{ borderTopColor: '#1a365d' }}
                >
                  <span className="text-lg font-bold" style={{ color: '#c53030' }}>
                    TOTAL
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="flex justify-end mb-8">
            <div className="text-center">
              <div
                className="font-script text-3xl italic text-gray-800"
                style={{ fontFamily: 'cursive' }}
              >
                {type === 'issued' ? 'Finvo Tech' : invoice.companyName.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 flex justify-center">
            <div
              className="text-4xl font-script italic text-center"
              style={{ fontFamily: 'cursive', color: '#1a365d' }}
            >
              Thank you
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="border-t px-8 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? 'Preparing...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PayInvoiceModal({ invoice, onClose, onSuccess }: PayInvoiceModalProps) {
  const PAYMENT_OPTIONS = [
    { label: 'Finvo USD', value: 'FUSD' },
    { label: 'BetaUSD', value: 'BetaUSD' },
    { label: 'ThetaUSD', value: 'ThetaUSD' },
    { label: 'PathUSD', value: 'PathUSD' },
    { label: 'AlphaUSD', value: 'AlphaUSD' },
  ]
  const { data: profile, isLoading, isError } = useProfile()
  const [selectedToken, setSelectedToken] = useState(PAYMENT_OPTIONS[0].value)
  const [payError, setPayError] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  const normalized = (value: string) => value.toLowerCase().replace(/\s+/g, '')

  const balances = useMemo(() => {
    const all = profile?.balances ?? []
    return PAYMENT_OPTIONS.map((option) => {
      const match = all.find(
        (token) =>
          normalized(token.symbol) === normalized(option.value) ||
          normalized(token.name) === normalized(option.label)
      )
      const balance = match ? formatTokenBalance(match.balance, match.decimals) : '0.00'
      const tokenAddress = match?.token ?? ''
      return {
        ...option,
        balance,
        tokenAddress,
      }
    })
  }, [profile?.balances])

  const selectedBalance = balances.find((balance) => balance.value === selectedToken)

  const handlePay = async () => {
    setPayError(null)
    if (!publicClient) {
      setPayError('Unable to confirm transaction.')
      return
    }

    let tokenId: bigint
    try {
      tokenId = BigInt(invoice.id)
    } catch {
      setPayError('Invalid invoice id.')
      return
    }

    if (!selectedBalance?.tokenAddress) {
      setPayError('Token address not available for selected currency.')
      return
    }

    const amountMinor = toMinorUnitsFromNumber(invoice.amount, PRICE_DECIMALS)
    if (amountMinor <= 0n) {
      setPayError('Invalid invoice amount.')
      return
    }

    setIsPaying(true)
    try {
      const approveHash = await writeContractAsync({
        address: selectedBalance.tokenAddress as `0x${string}`,
        abi: ITIP20_ABI,
        functionName: 'approve',
        args: [invoiceNftAddress, amountMinor],
      })

      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
      if (approveReceipt.status !== 'success') {
        setPayError('Approve transaction reverted.')
        return
      }

      const payHash = await writeContractAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'pay',
        args: [tokenId, selectedBalance.tokenAddress],
      })

      const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payHash })
      if (payReceipt.status !== 'success') {
        setPayError('Payment transaction reverted.')
        return
      }

      await updateInvoiceStatus({ invoiceId: invoice.id, status: 'paid' })
      await queryClient.invalidateQueries({ queryKey: ['invoicesByAddress'] })
      onSuccess(`You have successfully paid invoice ${invoice.invoiceNumber}.`)
      onClose()
    } catch (error) {
      const code = (error as { code?: string }).code
      const message = code || (error as Error)?.message || 'Failed to pay invoice.'
      setPayError(message)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Pay Invoice</h2>
          <p className="text-sm text-gray-500 mt-1">
            Invoice ID: <span className="font-medium text-gray-700">{invoice.invoiceNumber}</span>
          </p>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">Amount due</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(invoice.amount, 'USD')}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-blue-900">
              <span className="text-blue-700">Due date</span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-blue-900">
              <span className="text-blue-700">Paying</span>
              <span className="font-medium">{invoice.counterparty}</span>
            </div>
            <div className="text-xs text-blue-600">
              Funds will be transferred instantly in the selected stablecoin.
            </div>
          </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label htmlFor="paymentToken" className="block text-sm font-medium text-gray-700 mb-1">
                  Pay with
                </label>
              <select
                id="paymentToken"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Balances</p>
              <div className="space-y-2">
                {isLoading && <p className="text-sm text-gray-500">Loading balances...</p>}
                {isError && <p className="text-sm text-red-600">Unable to load balances.</p>}
                {!isLoading && !isError && balances.length === 0 && (
                  <p className="text-sm text-gray-500">No balances available.</p>
                )}
                {!isLoading && !isError && balances.length > 0 && (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    {balances.map((balance) => (
                      <div key={balance.value} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-gray-700">{balance.label}</span>
                        <span className="font-medium text-gray-900">{balance.balance}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedBalance && (
              <div className="text-xs text-gray-500">
                Selected balance: {selectedBalance.balance} {selectedBalance.label}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
          {payError && <p className="mr-auto text-sm text-red-600">{payError}</p>}
          <button
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={isPaying}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPaying ? (
              <span className="flex items-center justify-center gap-2">
                <InlineSpinner className="h-4 w-4" />
                Paying...
              </span>
            ) : (
              'Pay Invoice'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InvoicingPage() {
  const [activeTab, setActiveTab] = useState<InvoiceType>('issued')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sellTooltip, setSellTooltip] = useState<{ x: number; y: number } | null>(null)
  const SELL_TOOLTIP_WIDTH = 288
  const [disputeError, setDisputeError] = useState<string | null>(null)
  const [disputeInvoiceId, setDisputeInvoiceId] = useState<string | null>(null)
  const { writeContractAsync: writeDisputeAsync, isPending: isDisputePending } = useWriteContract()
  const disputeClient = usePublicClient()
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [acceptInvoiceId, setAcceptInvoiceId] = useState<string | null>(null)
  const { writeContractAsync: writeAcceptAsync, isPending: isAcceptPending } = useWriteContract()
  const acceptClient = usePublicClient()
  const [isAccepting, setIsAccepting] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelInvoiceId, setCancelInvoiceId] = useState<string | null>(null)
  const { writeContractAsync: writeCancelAsync, isPending: isCancelPending } = useWriteContract()
  const cancelClient = usePublicClient()
  const [isCanceling, setIsCanceling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)
  const [sellInvoiceId, setSellInvoiceId] = useState<string | null>(null)
  const { writeContractAsync: writeSellAsync, isPending: isSellPending } = useWriteContract()
  const sellClient = usePublicClient()
  const [isSelling, setIsSelling] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const queryClient = useQueryClient()
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    error: invoicesError,
  } = useInvoicesByAddress()

  const companyAddresses = useMemo(() => {
    const addresses = new Set<string>()
    invoicesData?.issued?.forEach((record) => {
      if (record.issuer) addresses.add(record.issuer)
      if (record.payer) addresses.add(record.payer)
    })
    invoicesData?.received?.forEach((record) => {
      if (record.issuer) addresses.add(record.issuer)
      if (record.payer) addresses.add(record.payer)
    })
    return Array.from(addresses)
  }, [invoicesData?.issued, invoicesData?.received])

  const companyQueries = useQueries({
    queries: companyAddresses.map((address) => ({
      queryKey: ['companyByAddress', address],
      queryFn: ({ signal }: { signal: AbortSignal }) => getCompanyByAddress(address, signal),
      enabled: !!address,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const companyNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    companyQueries.forEach((query, index) => {
      const address = companyAddresses[index]
      const data = query.data as CompanyByAddress | null | undefined
      if (address && data?.companyName) {
        map[address] = data.companyName
      }
    })
    return map
  }, [companyQueries, companyAddresses])

  const handleCreateInvoice = (data: CreateInvoiceFormData) => {
    console.log('Invoice submitted:', data)
    setShowCreateModal(false)
  }

  const handleSellInvoice = async (invoice: Invoice) => {
    setSellError(null)
    setSellInvoiceId(invoice.id)
    setIsSelling(true)

    let tokenId: bigint
    try {
      tokenId = BigInt(invoice.id)
    } catch {
      setSellError('Invalid invoice id.')
      setSellInvoiceId(null)
      return
    }

    if (!sellClient) {
      setSellError('Unable to confirm transaction.')
      setSellInvoiceId(null)
      return
    }

    try {
      const approveHash = await writeSellAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'approve',
        args: [invoiceFactoringAddress, tokenId],
      })

      const approveReceipt = await sellClient.waitForTransactionReceipt({ hash: approveHash })
      if (approveReceipt.status !== 'success') {
        setSellError('Approval transaction reverted.')
        return
      }

      const sellHash = await writeSellAsync({
        address: invoiceFactoringAddress,
        abi: INVOICE_FACTORING_ABI,
        functionName: 'sellInvoice',
        args: [tokenId],
      })

      const sellReceipt = await sellClient.waitForTransactionReceipt({ hash: sellHash })
      if (sellReceipt.status !== 'success') {
        setSellError('Sell transaction reverted.')
        return
      }

      await updateInvoiceStatus({ invoiceId: invoice.id, status: 'sold to Finvo' })
      await queryClient.invalidateQueries({ queryKey: ['invoicesByAddress'] })
      setSuccessMessage(`You have successfully sold invoice ${invoice.invoiceNumber} to Finvo.`)
    } catch (error) {
      const code = (error as { code?: string }).code
      const message =
        code || (error as Error)?.message || 'Failed to sell invoice.'
      setSellError(message)
    } finally {
      setSellInvoiceId(null)
      setIsSelling(false)
    }
  }

  const showSellTooltip = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const minX = SELL_TOOLTIP_WIDTH / 2 + 12
    const maxX = window.innerWidth - SELL_TOOLTIP_WIDTH / 2 - 12
    const clampedX = Math.min(Math.max(centerX, minX), maxX)
    setSellTooltip({ x: clampedX, y: rect.top })
  }

  useEffect(() => {
    if (!sellTooltip) return
    const handle = () => setSellTooltip(null)
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [sellTooltip])

  const handleCancelInvoice = async (invoice: Invoice) => {
    setCancelError(null)
    setCancelInvoiceId(invoice.id)
    setIsCanceling(true)

    let tokenId: bigint
    try {
      tokenId = BigInt(invoice.id)
    } catch {
      setCancelError('Invalid invoice id.')
      setCancelInvoiceId(null)
      return
    }

    if (!cancelClient) {
      setCancelError('Unable to confirm transaction.')
      setCancelInvoiceId(null)
      return
    }

    try {
      const hash = await writeCancelAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'cancelInvoice',
        args: [tokenId],
      })

      const receipt = await cancelClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') {
        setCancelError('Transaction reverted.')
        return
      }

      await updateInvoiceStatus({ invoiceId: invoice.id, status: 'canceled' })
      await queryClient.invalidateQueries({ queryKey: ['invoicesByAddress'] })
      setSuccessMessage(`You have successfully canceled invoice ${invoice.invoiceNumber}.`)
    } catch (error) {
      const code = (error as { code?: string }).code
      const message =
        code || (error as Error)?.message || 'Failed to cancel invoice.'
      setCancelError(message)
    } finally {
      setCancelInvoiceId(null)
      setIsCanceling(false)
    }
  }

  const handleAcceptInvoice = async (invoice: Invoice) => {
    setAcceptError(null)
    setAcceptInvoiceId(invoice.id)
    setIsAccepting(true)

    let tokenId: bigint
    try {
      tokenId = BigInt(invoice.id)
    } catch {
      setAcceptError('Invalid invoice id.')
      setAcceptInvoiceId(null)
      return
    }

    if (!acceptClient) {
      setAcceptError('Unable to confirm transaction.')
      setAcceptInvoiceId(null)
      return
    }

    try {
      const hash = await writeAcceptAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'acceptInvoice',
        args: [tokenId],
      })

      const receipt = await acceptClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') {
        setAcceptError('Transaction reverted.')
        return
      }

      await updateInvoiceStatus({ invoiceId: invoice.id, status: 'accepted' })
      await queryClient.invalidateQueries({ queryKey: ['invoicesByAddress'] })
      setSuccessMessage(`You have successfully accepted invoice ${invoice.invoiceNumber}.`)
    } catch (error) {
      const code = (error as { code?: string }).code
      const message =
        code || (error as Error)?.message || 'Failed to accept invoice.'
      setAcceptError(message)
    } finally {
      setAcceptInvoiceId(null)
      setIsAccepting(false)
    }
  }

  const handleDisputeInvoice = async (invoice: Invoice) => {
    setDisputeError(null)
    setDisputeInvoiceId(invoice.id)
    setIsDisputing(true)

    let tokenId: bigint
    try {
      tokenId = BigInt(invoice.id)
    } catch {
      setDisputeError('Invalid invoice id.')
      setDisputeInvoiceId(null)
      return
    }

    if (!disputeClient) {
      setDisputeError('Unable to confirm transaction.')
      setDisputeInvoiceId(null)
      return
    }

    try {
      const hash = await writeDisputeAsync({
        address: invoiceNftAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'disputeInvoice',
        args: [tokenId],
      })

      const receipt = await disputeClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') {
        setDisputeError('Transaction reverted.')
        return
      }

      await updateInvoiceStatus({ invoiceId: invoice.id, status: 'disputed' })
      await queryClient.invalidateQueries({ queryKey: ['invoicesByAddress'] })
      setSuccessMessage(`You have successfully disputed invoice ${invoice.invoiceNumber}.`)
    } catch (error) {
      const code = (error as { code?: string }).code
      const message =
        code || (error as Error)?.message || 'Failed to dispute invoice.'
      setDisputeError(message)
    } finally {
      setDisputeInvoiceId(null)
      setIsDisputing(false)
    }
  }

  const issuedInvoices = useMemo(
    () => (invoicesData?.issued ?? []).map((record) => mapInvoiceRecord(record, 'issued', companyNameMap)),
    [invoicesData?.issued, companyNameMap]
  )
  const receivedInvoices = useMemo(
    () => (invoicesData?.received ?? []).map((record) => mapInvoiceRecord(record, 'received', companyNameMap)),
    [invoicesData?.received, companyNameMap]
  )
  const invoices = activeTab === 'issued' ? issuedInvoices : receivedInvoices
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const issuedAmount = invoices
    .filter((inv) => inv.status === 'issued')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const acceptedAmount = invoices
    .filter((inv) => inv.status === 'accepted')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'issued'
              ? 'Invoices you have sent to clients'
              : 'Invoices you have received from vendors'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Issue New Invoice
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('issued')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'issued'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Issued
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {issuedInvoices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Received
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {receivedInvoices.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount, 'USD')}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-gray-500">
            {activeTab === 'issued' ? 'Issued Amount' : 'Accepted Amount'}
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(activeTab === 'issued' ? issuedAmount : acceptedAmount, 'USD')}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-gray-500">
            {activeTab === 'issued' ? 'Accepted Amount' : 'Issued Amount'}
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(activeTab === 'issued' ? acceptedAmount : issuedAmount, 'USD')}
          </p>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        {(acceptError || disputeError || cancelError || sellError) && (
          <div className="px-4 pt-4 text-sm text-red-600">
            {acceptError && <p>{acceptError}</p>}
            {disputeError && <p>{disputeError}</p>}
            {cancelError && <p>{cancelError}</p>}
            {sellError && <p>{sellError}</p>}
          </div>
        )}
        {isInvoicesLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        )}

        {isInvoicesError && (
          <div className="text-center py-12">
            <p className="text-red-600">
              {(invoicesError as Error)?.message || 'Failed to load invoices'}
            </p>
          </div>
        )}

        {!isInvoicesLoading && !isInvoicesError && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {activeTab === 'issued' ? 'Client' : 'Vendor'}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const status = statusStyles[invoice.status]
                    return (
                      <tr
                        key={invoice.id}
                        onClick={() => setSelectedInvoice(invoice)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{invoice.counterparty}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {invoice.status === 'issued' && activeTab === 'issued' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelInvoice(invoice)
                              }}
                              disabled={(isCancelPending || isCanceling) && cancelInvoiceId === invoice.id}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {(isCancelPending || isCanceling) && cancelInvoiceId === invoice.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <InlineSpinner />
                                  Canceling...
                                </span>
                              ) : (
                                'Cancel'
                              )}
                            </button>
                          )}
                          {invoice.status === 'accepted' && activeTab === 'issued' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSellInvoice(invoice)
                              }}
                              onMouseEnter={(e) => showSellTooltip(e.currentTarget)}
                              onMouseLeave={() => setSellTooltip(null)}
                              onFocus={(e) => showSellTooltip(e.currentTarget)}
                              onBlur={() => setSellTooltip(null)}
                              disabled={(isSellPending || isSelling) && sellInvoiceId === invoice.id}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {(isSellPending || isSelling) && sellInvoiceId === invoice.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <InlineSpinner />
                                  Selling...
                                </span>
                              ) : (
                                'Sell invoice'
                              )}
                            </button>
                          )}
                          {invoice.status === 'issued' && activeTab === 'received' && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAcceptInvoice(invoice)
                                }}
                                disabled={(isAcceptPending || isAccepting) && acceptInvoiceId === invoice.id}
                                className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {(isAcceptPending || isAccepting) && acceptInvoiceId === invoice.id ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <InlineSpinner />
                                    Accepting...
                                  </span>
                                ) : (
                                  'Accept'
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDisputeInvoice(invoice)
                                }}
                                disabled={(isDisputePending || isDisputing) && disputeInvoiceId === invoice.id}
                                className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {(isDisputePending || isDisputing) && disputeInvoiceId === invoice.id ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <InlineSpinner />
                                    Disputing...
                                  </span>
                                ) : (
                                  'Dispute'
                                )}
                              </button>
                            </div>
                          )}
                          {(invoice.status === 'accepted' || invoice.status === 'sold to Finvo') &&
                            activeTab === 'received' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPayInvoice(invoice)
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No invoices found</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          type={activeTab}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Pay Invoice Modal */}
      {payInvoice && (
        <PayInvoiceModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onSuccess={setSuccessMessage}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvoice}
          onSuccess={setSuccessMessage}
        />
      )}

      {sellTooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg bg-blue-50 text-blue-900 text-xs px-3 py-2 shadow-lg border border-blue-100"
          style={{
            width: `${SELL_TOOLTIP_WIDTH}px`,
            left: `${sellTooltip.x}px`,
            top: `${sellTooltip.y - 8}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          Instantly sell the invoice to the platform and receive 95% of the total amount in Finvo stablecoin (FUSD).
        </div>
      )}

      {successMessage && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSuccessMessage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success</h3>
            <p className="text-sm text-gray-600 mb-5">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
