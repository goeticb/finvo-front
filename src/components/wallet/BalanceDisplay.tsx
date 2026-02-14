import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/Card'
import { useProfile } from '@/hooks/useProfile'
import type { TokenBalance } from '@/services/api'

const TOKENS_PER_PAGE = 5

const COLORS = [
  '#F59E0B', // amber
  '#6366F1', // indigo
  '#10B981', // emerald
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EF4444', // red
]

function formatBalance(balance: string, decimals: number): string {
  const value = BigInt(balance)
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmedFractional = fractionalStr.slice(0, 2)

  return `${integerPart.toLocaleString()}.${trimmedFractional}`
}

function getNumericValue(balance: string, decimals: number): number {
  const value = BigInt(balance)
  const divisor = BigInt(10 ** decimals)
  return Number(value) / Number(divisor)
}

interface ChartData {
  name: string
  symbol: string
  value: number
  percentage: number
  balance: string
  decimals: number
}

function prepareChartData(balances: TokenBalance[]): ChartData[] {
  const data = balances.map((token) => ({
    name: token.name,
    symbol: token.symbol,
    value: getNumericValue(token.balance, token.decimals),
    balance: token.balance,
    decimals: token.decimals,
    percentage: 0,
  }))

  // Sort by value descending
  data.sort((a, b) => b.value - a.value)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }))
}

function renderCustomLabel(props: {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  percent?: number
  name?: string
}) {
  const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name = '' } = props
  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = outerRadius + 30
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs"
    >
      {`${name}: ${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

export function BalanceDisplay() {
  const { data, isLoading, isError, error } = useProfile()
  const [currentPage, setCurrentPage] = useState(0)

  const chartData = useMemo(() => {
    if (!data?.balances) return []
    return prepareChartData(data.balances)
  }, [data?.balances])

  const totalPages = Math.ceil(chartData.length / TOKENS_PER_PAGE)
  const paginatedData = chartData.slice(
    currentPage * TOKENS_PER_PAGE,
    (currentPage + 1) * TOKENS_PER_PAGE
  )

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Balances</h2>

      {isLoading && (
        <div className="space-y-3">
          <div className="w-48 h-48 mx-auto bg-gray-200 rounded-full animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between animate-pulse">
              <span className="bg-gray-200 h-5 w-24 rounded" />
              <span className="bg-gray-200 h-5 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to load balances: {error?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {data && data.balances.length === 0 && (
        <p className="text-gray-500">No token balances found</p>
      )}

      {data && data.balances.length > 0 && (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} tokens`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 h-[310px]">
            {paginatedData.map((token) => {
              const originalIndex = chartData.findIndex((t) => t.symbol === token.symbol)
              return (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[originalIndex % COLORS.length] }}
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">
                        {token.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {token.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-sm">
                    {formatBalance(token.balance, token.decimals)} {token.symbol}
                  </span>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
