import { Link, NavLink, useNavigate } from 'react-router'
import { useAccount, useDisconnect } from 'wagmi'
import { TEMPO_EXPLORER_URL } from '@/config/constants'

export function Header() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()

  const handleDisconnect = () => {
    disconnect()
    navigate('/connect')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Finvo
            </Link>

            {isConnected && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/invoicing" className={navLinkClass}>
                  Invoicing
                </NavLink>
              </nav>
            )}
          </div>

          {isConnected && address && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Tempo Testnet</span>
              </div>
              <a
                href={`${TEMPO_EXPLORER_URL}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </a>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
