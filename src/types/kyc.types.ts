export interface PersonalKycData {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  country: string
  nationality: string
  idType: 'passport' | 'national_id' | 'drivers_license'
  idNumber: string
}

export interface CompanyKybData {
  companyName: string
  registrationNumber: string
  country: string
  incorporationDate: string
  companyType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietor'
  businessAddress: string
  taxId: string
  website?: string
}

export type KycStep = 'personal' | 'company' | 'complete'

export interface KycState {
  currentStep: KycStep
  personalData: PersonalKycData | null
  companyData: CompanyKybData | null
}
