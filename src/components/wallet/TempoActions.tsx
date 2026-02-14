import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function TempoActions() {
  const handleAction = (action: string) => {
    console.log(`Tempo action triggered: ${action}`)
    alert(`${action} - Coming soon!`)
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Tempo Actions</h2>
      <p className="text-gray-500 mb-6">
        Placeholder buttons for future Tempo blockchain interactions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="primary"
          onClick={() => handleAction('Transfer Tokens')}
          className="w-full"
        >
          Transfer Tokens
        </Button>

        <Button
          variant="primary"
          onClick={() => handleAction('Swap via DEX')}
          className="w-full"
        >
          Swap via DEX
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleAction('Create Token')}
          className="w-full"
        >
          Create Token
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleAction('Add Liquidity')}
          className="w-full"
        >
          Add Liquidity
        </Button>

        <Button
          variant="ghost"
          onClick={() => handleAction('View Policies')}
          className="w-full"
        >
          View Policies
        </Button>

        <Button
          variant="ghost"
          onClick={() => handleAction('Manage Rewards')}
          className="w-full"
        >
          Manage Rewards
        </Button>
      </div>
    </Card>
  )
}
