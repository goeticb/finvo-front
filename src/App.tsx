import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useAccount } from 'wagmi'
import { Layout } from '@/components/layout/Layout'
import { ConnectPage } from '@/pages/ConnectPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InvoicingPage } from '@/pages/InvoicingPage'
import { KycPage } from '@/pages/KycPage'
import { KycPendingPage } from '@/pages/KycPendingPage'
import { KycRequiredPage } from '@/pages/KycRequiredPage'
import { KycRejectedPage } from '@/pages/KycRejectedPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return <Navigate to="/connect" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/connect" replace />} />
          <Route path="connect" element={<ConnectPage />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="invoicing"
            element={
              <ProtectedRoute>
                <InvoicingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="kyc"
            element={
              <ProtectedRoute>
                <KycPage />
              </ProtectedRoute>
            }
          />
          <Route path="kyc-pending" element={<KycPendingPage />} />
          <Route path="kyc-required" element={<KycRequiredPage />} />
          <Route path="kyc-rejected" element={<KycRejectedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
