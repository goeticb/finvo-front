import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export function ConnectButton() {
  const { open } = useAppKit()
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])

  if (isConnected) {
    return (
      <Button variant="danger" onClick={() => disconnect()}>
        Disconnect
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => open()}
        size="lg"
        className="w-full justify-center"
      >
        Connect Wallet
      </Button>
    </div>
  )
}
