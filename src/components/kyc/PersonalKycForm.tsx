import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalKycSchema, type PersonalKycFormData } from '@/schemas/personalKyc.schema'
import { COUNTRIES } from '@/config/constants'
import { Button } from '@/components/ui/Button'

interface Props {
  onSubmit: (data: PersonalKycFormData) => void
  defaultValues?: Partial<PersonalKycFormData>
}

export function PersonalKycForm({ onSubmit, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalKycFormData>({
    resolver: zodResolver(personalKycSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold">Personal Information (KYC)</h2>
      <p className="text-gray-500">Please provide your personal details for identity verification.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">First Name</label>
          <input
            {...register('firstName')}
            className={`input ${errors.firstName ? 'input-error' : ''}`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="error-message">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="label">Last Name</label>
          <input
            {...register('lastName')}
            className={`input ${errors.lastName ? 'input-error' : ''}`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="error-message">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <input
          {...register('email')}
          type="email"
          className={`input ${errors.email ? 'input-error' : ''}`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="error-message">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="label">Date of Birth</label>
        <input
          {...register('dateOfBirth')}
          type="date"
          className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
        />
        {errors.dateOfBirth && (
          <p className="error-message">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Country of Residence</label>
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
          <label className="label">Nationality</label>
          <select
            {...register('nationality')}
            className={`input ${errors.nationality ? 'input-error' : ''}`}
          >
            <option value="">Select nationality</option>
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.nationality && (
            <p className="error-message">{errors.nationality.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">ID Type</label>
          <select
            {...register('idType')}
            className={`input ${errors.idType ? 'input-error' : ''}`}
          >
            <option value="">Select ID type</option>
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="drivers_license">Driver's License</option>
          </select>
          {errors.idType && (
            <p className="error-message">{errors.idType.message}</p>
          )}
        </div>

        <div>
          <label className="label">ID Number</label>
          <input
            {...register('idNumber')}
            className={`input ${errors.idNumber ? 'input-error' : ''}`}
            placeholder="AB123456"
          />
          {errors.idNumber && (
            <p className="error-message">{errors.idNumber.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        Continue to Company KYB
      </Button>
    </form>
  )
}
