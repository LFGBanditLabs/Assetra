'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Shield, Upload, AlertCircle } from 'lucide-react'
import { useAssetWizard } from '@/hooks/useAssetWizard'
import { StepProgress } from '@/components/tokenization/StepProgress'
import { DocumentUploadCard } from '@/components/tokenization/DocumentUploadCard'
import { WorkflowStatus, WorkflowStage } from '@/components/tokenization/WorkflowStatus'
import { createAsset } from '@/lib/services/assets'
import { createDocumentRecord, uploadDocumentToIpfs } from '@/lib/services/documents'
import { sendWorkflowEmail } from '@/lib/services/notifications'

const documentRequirements = [
  {
    id: 'ownership',
    title: 'Proof of Ownership',
    description: 'Upload the property deed, title, or ownership certificate',
    accept: '.pdf,.png,.jpg,.jpeg',
    type: 'ASSET_DEED' as const,
  },
  {
    id: 'appraisal',
    title: 'Recent Appraisal',
    description: 'Certified appraisal within the last 12 months',
    accept: '.pdf',
    type: 'ASSET_APPRAISAL' as const,
  },
  {
    id: 'legal',
    title: 'Legal Agreements',
    description: 'Any encumbrances, liens, or governing agreements',
    accept: '.pdf',
    type: 'LEGAL_AGREEMENT' as const,
  },
  {
    id: 'certificate',
    title: 'Compliance Certificates',
    description: 'Insurance, environmental, or compliance certificates',
    accept: '.pdf,.png,.jpg,.jpeg',
    type: 'CERTIFICATE' as const,
  },
]

const stepFieldMap: Record<string, string[]> = {
  details: [
    'name',
    'description',
    'assetType',
    'propertyType',
    'location',
    'addressLine1',
    'city',
    'state',
    'country',
    'postalCode',
    'assetValue',
  ],
  documents: ['documents'],
  fractional: ['assetValue', 'totalShares', 'sharePrice', 'minInvestment', 'distributionFrequency'],
  compliance: ['compliance.legalOwner', 'compliance.accurateInfo', 'compliance.aml', 'compliance.termsAccepted', 'notifications.email'],
  review: [],
}

export default function TokenizePage() {
  const { form, steps, currentStepIndex, currentStep, nextStep, prevStep, goToStep } = useAssetWizard()
  const { register, control, watch, setValue, getValues, trigger, handleSubmit, formState } = form
  const { address } = useAccount()
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('DETAILS_SUBMITTED')
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const assetValue = watch('assetValue')
  const totalShares = watch('totalShares')

  const computedSharePrice = useMemo(() => {
    if (!assetValue || !totalShares) return 0
    const price = assetValue / totalShares
    return Number.isFinite(price) ? Number(price.toFixed(2)) : 0
  }, [assetValue, totalShares])

  useEffect(() => {
    if (computedSharePrice > 0) {
      setValue('sharePrice', computedSharePrice)
      setValue('minInvestment', Number((computedSharePrice * 10).toFixed(2)))
    }
  }, [computedSharePrice, setValue])

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        description: values.description,
        assetType: values.assetType,
        assetValue: Number(values.assetValue),
        totalShares: Number(values.totalShares),
        ipfsHash: values.documents[0]?.ipfsHash ?? '',
        location: `${values.addressLine1}, ${values.city}, ${values.country}`,
      }

      const response = await createAsset(payload, {
        walletAddress: address ?? undefined,
        email: values.notifications.email,
      })

      if (values.notifications.enableEmail) {
        await sendWorkflowEmail({
          to: values.notifications.email,
          subject: 'Assetra submission received',
          html: `<p>Your asset <strong>${values.name}</strong> was submitted successfully. We will notify you after review.</p>`,
          stage: 'DETAILS_SUBMITTED',
        })
      }

      return response.asset
    },
    onSuccess: () => {
      setSubmissionError(null)
      setWorkflowStage('UNDER_REVIEW')
      nextStep()
    },
    onError: (error: Error) => {
      setSubmissionError(error.message)
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  const handleNext = async () => {
    const step = steps[currentStepIndex]
    const fields = stepFieldMap[step.id]

    if (fields?.length) {
      const valid = await trigger(fields as any, { shouldFocus: true })
      if (!valid) {
        return
      }
    }

    if (step.id === 'review') {
      onSubmit()
      return
    }

    nextStep()
  }

  const handleDocumentUpload = async (requirementId: string, docType: (typeof documentRequirements)[number]['type'], file: File) => {
    setUploadingDocs((prev) => ({ ...prev, [requirementId]: true }))
    try {
      const { cid, url } = await uploadDocumentToIpfs(file)
      const { document } = await createDocumentRecord(
        {
          name: file.name,
          type: docType,
          ipfsHash: cid,
          fileSize: file.size,
          mimeType: file.type,
        },
        {
          walletAddress: address ?? undefined,
        },
      )

      const existingDocs = getValues('documents')
      const filteredDocs = existingDocs.filter((doc) => doc.type !== docType)
      const updatedDoc = {
        id: document.id,
        name: document.name,
        type: document.type,
        ipfsHash: document.ipfsHash,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        version: document.version,
        url,
      }

      setValue('documents', [...filteredDocs, updatedDoc], { shouldValidate: true })
      setUploadingDocs((prev) => ({ ...prev, [requirementId]: false }))
    } catch (error) {
      setUploadingDocs((prev) => ({ ...prev, [requirementId]: false }))
      console.error(error)
      setSubmissionError('Document upload failed. Please try again.')
    }
  }

  const renderStep = () => {
    switch (currentStep.id) {
      case 'details':
        return (
          <div className="grid gap-6">
            <div>
              <h2 className="text-2xl font-semibold">Asset information</h2>
              <p className="text-gray-500">Provide the core details and valuation data for your asset.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Asset name</label>
                <input
                  {...register('name')}
                  placeholder="Premium Downtown Duplex"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
                {formState.errors.name && <p className="mt-1 text-sm text-red-500">{formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Asset type</label>
                <select
                  {...register('assetType')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                >
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="COMMODITIES">Commodities</option>
                  <option value="ART">Art</option>
                  <option value="COLLECTIBLES">Collectibles</option>
                  <option value="VEHICLES">Vehicles</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe the property, condition, tenants, and revenue profile..."
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Estimated valuation (USD)</label>
                <input
                  type="number"
                  {...register('assetValue', { valueAsNumber: true })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  placeholder="1200000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Valuation method</label>
                <input
                  {...register('valuationMethod')}
                  placeholder="Income approach"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Physical address</label>
                <input
                  {...register('addressLine1')}
                  placeholder="123 Token Blvd."
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <input
                  {...register('city')}
                  placeholder="Miami"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">State / Region</label>
                <input
                  {...register('state')}
                  placeholder="FL"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <input
                  {...register('country')}
                  placeholder="USA"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Postal code</label>
                <input
                  {...register('postalCode')}
                  placeholder="33101"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />
              </div>
            </div>
          </div>
        )
      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Document room</h2>
              <p className="text-gray-500">Upload the required compliance documents. Each upload is encrypted and pinned to IPFS.</p>
            </div>

            <div className="grid gap-4">
              {documentRequirements.map((requirement) => {
                const document = getValues('documents').find((doc) => doc.type === requirement.type)
                return (
                  <DocumentUploadCard
                    key={requirement.id}
                    requirementId={requirement.id}
                    title={requirement.title}
                    description={requirement.description}
                    accept={requirement.accept}
                    document={document ?? null}
                    isUploading={uploadingDocs[requirement.id]}
                    onFileSelected={(file) => handleDocumentUpload(requirement.id, requirement.type, file)}
                  />
                )
              })}
            </div>
            {formState.errors.documents && (
              <p className="text-sm text-red-500">{formState.errors.documents.message as string}</p>
            )}
          </div>
        )
      case 'fractional':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Fractional ownership</h2>
              <p className="text-gray-500">Configure how the asset will be tokenized and offered.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-6">
                <label className="text-sm font-medium">Total shares</label>
                <input
                  type="number"
                  {...register('totalShares', { valueAsNumber: true })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />

                <label className="mt-6 block text-sm font-medium">Minimum investment (USD)</label>
                <input
                  type="number"
                  {...register('minInvestment', { valueAsNumber: true })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                />

                <label className="mt-6 block text-sm font-medium">Distribution frequency</label>
                <select
                  {...register('distributionFrequency')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>

                <label className="mt-6 block text-sm font-medium">Revenue model</label>
                <select
                  {...register('revenueModel')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                >
                  <option value="rental">Rental income</option>
                  <option value="royalty">Royalties</option>
                  <option value="yield">Yield / staking</option>
                </select>
              </div>

              <div className="rounded-3xl border border-black bg-black text-white p-6">
                <p className="text-sm uppercase tracking-wide text-white/70">Tokenomics preview</p>
                <div className="mt-6 grid gap-4">
                  <div>
                    <p className="text-sm text-white/70">Asset valuation</p>
                    <p className="text-2xl font-bold">${Number(assetValue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Share price</p>
                    <p className="text-2xl font-bold">${computedSharePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Available shares</p>
                    <p className="text-2xl font-bold">{totalShares || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Projected raise</p>
                    <p className="text-xl font-semibold">
                      ${(computedSharePrice * (totalShares || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Compliance & attestations</h2>
              <p className="text-gray-500">Confirm legal ownership and set your notification preferences.</p>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-200 p-6">
              {[
                { id: 'compliance.legalOwner', label: 'I am the legal owner or authorized representative.' },
                { id: 'compliance.accurateInfo', label: 'All submitted information is accurate and verifiable.' },
                { id: 'compliance.aml', label: 'The asset is free of sanctions, liens, and AML restrictions.' },
                { id: 'compliance.termsAccepted', label: 'I accept the Assetra tokenization terms.' },
              ].map((checkbox) => (
                <label key={checkbox.id} className="flex items-start gap-3">
                  <Controller
                    name={checkbox.id as any}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-black focus:ring-black"
                      />
                    )}
                  />
                  <span className="text-sm text-gray-700">{checkbox.label}</span>
                </label>
              ))}
              {formState.errors.compliance && (
                <p className="text-sm text-red-500">Please accept all compliance attestations.</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-gray-500">Receive workflow updates over email.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    {...register('notifications.email')}
                    placeholder="you@assetra.xyz"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>
                <label className="mt-6 flex items-center gap-3 md:mt-9">
                  <Controller
                    name="notifications.enableEmail"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-black focus:ring-black"
                      />
                    )}
                  />
                  <span className="text-sm text-gray-700">Enable stage-by-stage email updates</span>
                </label>
              </div>
            </div>
          </div>
        )
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Review submission</h2>
              <p className="text-gray-500">Confirm the information below before deploying to review.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold">Summary</h3>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Asset</dt>
                  <dd className="text-lg font-semibold">{getValues('name')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Valuation</dt>
                  <dd className="text-lg font-semibold">${Number(assetValue || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="text-lg font-semibold">
                    {getValues('addressLine1')}, {getValues('city')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Contact email</dt>
                  <dd className="text-lg font-semibold">{getValues('notifications.email')}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold">Documents</h3>
              <ul className="mt-4 space-y-3">
                {getValues('documents').map((doc) => (
                  <li key={doc.type} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                    <span className="text-sm font-medium">{doc.name}</span>
                    <span className="text-xs text-gray-500">v{doc.version ?? 1}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-black to-gray-900 p-10 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Asset Tokenization</p>
          <h1 className="mt-4 text-4xl font-semibold">Tokenize your real-world asset end-to-end</h1>
          <p className="mt-4 text-lg text-white/80">
            Submit documentation, configure fractional ownership, and deploy smart contracts in one workflow.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <StepProgress steps={steps} currentIndex={currentStepIndex} onStepClick={goToStep} />
            </div>
            <WorkflowStatus currentStage={workflowStage} />
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold">Why Assetra?</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Compliance automation & audit trail
                </li>
                <li className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> IPFS-backed document vault
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Guided review & approval
                </li>
              </ul>
            </div>
          </div>

          <form className="rounded-3xl bg-white p-8 shadow-xl" onSubmit={onSubmit}>
            {renderStep()}

            {submissionError && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {submissionError}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                >
                  Back
                </button>
              )}

              <button
                type={currentStep.id === 'review' ? 'submit' : 'button'}
                onClick={currentStep.id === 'review' ? undefined : handleNext}
                disabled={mutation.isLoading}
                className="inline-flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed"
              >
                {currentStep.id === 'review' ? (
                  mutation.isLoading ? (
                    'Submitting...'
                  ) : (
                    <>
                      Submit for Review <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

