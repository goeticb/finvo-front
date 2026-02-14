import { Card } from '@/components/ui/Card'

export function DashboardLoader() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded-md animate-pulse" />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-spin" />
            <div
              className="absolute inset-2 rounded-full border-2 border-emerald-200 animate-spin"
              style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}
            />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Loading dashboard</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Syncing profile</span>
              <span className="inline-flex items-center gap-1">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-36 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-4 w-16 bg-gray-100 rounded-md animate-pulse" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-24 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-4 w-16 bg-gray-100 rounded-md animate-pulse" />
          </div>

          <div className="flex items-center justify-center">
            <div className="relative h-40 w-40">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 animate-pulse" />
              <div className="absolute inset-6 rounded-full bg-white shadow-sm" />
              <div className="absolute inset-0 rounded-full border border-gray-200" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-full rounded-lg bg-gray-100 animate-pulse"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
