import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companyKybSchema, type CompanyKybFormData } from '@/schemas/companyKyb.schema'
import { COUNTRIES } from '@/config/constants'
import { Button } from '@/components/ui/Button'

interface Props {
  onSubmit: (data: CompanyKybFormData) => void
  onBack: () => void
  defaultValues?: Partial<CompanyKybFormData>
  isSubmitting?: boolean
}

export function CompanyKybForm({ onSubmit, onBack, defaultValues, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyKybFormData>({
    resolver: zodResolver(companyKybSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold">Company Information (KYB)</h2>
      <p className="text-gray-500">Please provide your company details for business verification.</p>

      <div>
        <label className="label">Company Name</label>
        <input
          {...register('companyName')}
          className={`input ${errors.companyName ? 'input-error' : ''}`}
          placeholder="Acme Corporation"
        />
        {errors.companyName && (
          <p className="error-message">{errors.companyName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Registration Number</label>
          <input
            {...register('registrationNumber')}
            className={`input ${errors.registrationNumber ? 'input-error' : ''}`}
            placeholder="12345678"
          />
          {errors.registrationNumber && (
            <p className="error-message">{errors.registrationNumber.message}</p>
          )}
        </div>

        <div>
          <label className="label">Tax ID</label>
          <input
            {...register('taxId')}
            className={`input ${errors.taxId ? 'input-error' : ''}`}
            placeholder="XX-XXXXXXX"
          />
          {errors.taxId && (
            <p className="error-message">{errors.taxId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Country</label>
          <select
            {...register('country')}
            className={`input ${errors.country ? 'input-error' : ''}`}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.country && (
            <p className="error-message">{errors.country.message}</p>
          )}
        </div>

        <div>
          <label className="label">Company Type</label>
          <select
            {...register('companyType')}
            className={`input ${errors.companyType ? 'input-error' : ''}`}
          >
            <option value="">Select type</option>
            <option value="llc">LLC</option>
            <option value="corporation">Corporation</option>
            <option value="partnership">Partnership</option>
            <option value="sole_proprietor">Sole Proprietor</option>
          </select>
          {errors.companyType && (
            <p className="error-message">{errors.companyType.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Incorporation Date</label>
        <input
          {...register('incorporationDate')}
          type="date"
          className={`input ${errors.incorporationDate ? 'input-error' : ''}`}
        />
        {errors.incorporationDate && (
          <p className="error-message">{errors.incorporationDate.message}</p>
        )}
      </div>

      <div>
        <label className="label">Business Address</label>
        <textarea
          {...register('businessAddress')}
          className={`input ${errors.businessAddress ? 'input-error' : ''}`}
          rows={3}
          placeholder="123 Main St, Suite 100, New York, NY 10001"
        />
        {errors.businessAddress && (
          <p className="error-message">{errors.businessAddress.message}</p>
        )}
      </div>

      <div>
        <label className="label">Website (optional)</label>
        <input
          {...register('website')}
          type="url"
          className={`input ${errors.website ? 'input-error' : ''}`}
          placeholder="https://www.example.com"
        />
        {errors.website && (
          <p className="error-message">{errors.website.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Complete KYC/KYB'}
        </Button>
      </div>
    </form>
  )
}
