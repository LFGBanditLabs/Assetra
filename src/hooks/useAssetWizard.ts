'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AssetType, DocumentType } from '@/types/asset'

const assetTypeEnum = ['REAL_ESTATE', 'COMMODITIES', 'ART', 'COLLECTIBLES', 'VEHICLES', 'OTHER'] as const
const documentTypeEnum = [
  'KYC_ID',
  'KYC_PROOF_ADDRESS',
  'ASSET_DEED',
  'ASSET_APPRAISAL',
  'LEGAL_AGREEMENT',
  'CERTIFICATE',
  'OTHER',
] as const satisfies readonly DocumentType[]

export const wizardDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(documentTypeEnum),
  ipfsHash: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
  version: z.number().int().positive().optional(),
  url: z.string().url().optional(),
})

export const assetWizardSchema = z.object({
  name: z.string().min(3, 'Name is too short').max(255),
  description: z.string().min(30, 'Provide a thorough description'),
  assetType: z.enum(assetTypeEnum) as unknown as z.ZodType<AssetType>,
  propertyType: z.string().min(3),
  location: z.string().min(3),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  valuationMethod: z.string().min(3),
  appraisalDate: z.string().optional(),
  assetValue: z.number().positive(),
  totalShares: z.number().int().positive(),
  sharePrice: z.number().positive(),
  minInvestment: z.number().positive(),
  distributionFrequency: z.enum(['monthly', 'quarterly', 'annual']),
  revenueModel: z.enum(['rental', 'royalty', 'yield']),
  documents: z.array(wizardDocumentSchema).min(1, 'Upload at least one document'),
  compliance: z.object({
    legalOwner: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
    accurateInfo: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
    aml: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
  }),
  notifications: z.object({
    email: z.string().email(),
    enableEmail: z.boolean(),
  }),
})

export type AssetWizardFormValues = z.infer<typeof assetWizardSchema>

export function useAssetWizard() {
  const form = useForm<AssetWizardFormValues>({
    resolver: zodResolver(assetWizardSchema),
    defaultValues: {
      name: '',
      description: '',
      assetType: 'REAL_ESTATE',
      propertyType: '',
      location: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      valuationMethod: 'Income approach',
      appraisalDate: '',
      assetValue: 0,
      totalShares: 1000,
      sharePrice: 0,
      minInvestment: 0,
      distributionFrequency: 'quarterly',
      revenueModel: 'rental',
      documents: [],
      compliance: {
        legalOwner: false,
        accurateInfo: false,
        aml: false,
        termsAccepted: false,
      },
      notifications: {
        email: '',
        enableEmail: true,
      },
    },
  })

  const steps = useMemo(
    () => [
      { id: 'details', title: 'Asset Details', description: 'Describe the asset' },
      { id: 'documents', title: 'Documents', description: 'Upload ownership proofs' },
      { id: 'fractional', title: 'Fractionalization', description: 'Configure shares' },
      { id: 'compliance', title: 'Compliance', description: 'Legal attestations' },
      { id: 'review', title: 'Review & Submit', description: 'Confirm submission' },
    ],
    [],
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const goToStep = (index: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, steps.length - 1)))
  }

  const nextStep = () => goToStep(currentStepIndex + 1)
  const prevStep = () => goToStep(currentStepIndex - 1)

  return {
    form,
    steps,
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    goToStep,
    nextStep,
    prevStep,
  }
}

