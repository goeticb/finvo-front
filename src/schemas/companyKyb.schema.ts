import { z } from 'zod'

export const companyKybSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  country: z.string().min(1, 'Country is required'),
  incorporationDate: z.string().min(1, 'Incorporation date is required'),
  companyType: z.enum(['llc', 'corporation', 'partnership', 'sole_proprietor'], {
    message: 'Please select a company type',
  }),
  businessAddress: z.string().min(10, 'Please enter a complete address'),
  taxId: z.string().min(1, 'Tax ID is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type CompanyKybFormData = z.infer<typeof companyKybSchema>
