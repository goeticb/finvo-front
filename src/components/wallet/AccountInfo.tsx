import { useAccount } from 'wagmi'
import { TEMPO_EXPLORER_URL } from '@/config/constants'
import { Card } from '@/components/ui/Card'
import { useProfile } from '@/hooks/useProfile'

export function AccountInfo() {
  const { address, isConnected } = useAccount()
  const { data: profile, isLoading } = useProfile()

  if (!isConnected || !address) return null

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Account Info</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : profile ? (
        <div className="space-y-5">
          <div className="pb-5 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Personal</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{profile.personalInfo.firstName} {profile.personalInfo.lastName}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Email:</span>
                <span>{profile.personalInfo.email}</span>
              </div>
            </div>
          </div>

          <div className="pb-5 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Company</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Company:</span>
                <span className="font-medium">{profile.companyInfo.companyName}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Type:</span>
                <span className="uppercase">{profile.companyInfo.companyType}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Country:</span>
                <span className="uppercase">{profile.companyInfo.country}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Registration #:</span>
                <span className="font-mono">{profile.companyInfo.registrationNumber}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Tax ID:</span>
                <span className="font-mono">{profile.companyInfo.taxId}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Incorporated:</span>
                <span>{new Date(profile.companyInfo.incorporationDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Address:</span>
                <span className="text-right max-w-[200px]">{profile.companyInfo.businessAddress}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Wallet</h3>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-base">Address:</span>
              <a
                href={`${TEMPO_EXPLORER_URL}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-base text-blue-600 hover:underline break-all"
              >
                {address}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Unable to load profile</p>
      )}
    </Card>
  )
}
