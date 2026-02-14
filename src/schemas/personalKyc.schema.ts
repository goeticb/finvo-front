import { z } from 'zod'

export const personalKycSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  country: z.string().min(1, 'Country is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  idType: z.enum(['passport', 'national_id', 'drivers_license'], {
    message: 'Please select an ID type',
  }),
  idNumber: z.string().min(5, 'ID number must be at least 5 characters'),
})

export type PersonalKycFormData = z.infer<typeof personalKycSchema>
