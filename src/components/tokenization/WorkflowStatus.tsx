'use client'

import { CheckCircle2, Clock, Loader2, Mail, Shield, Wallet } from 'lucide-react'
import clsx from 'clsx'

export type WorkflowStage =
  | 'DETAILS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUEST_CHANGES'
  | 'APPROVED'
  | 'DEPLOYING'
  | 'MINTED'

const stageMeta: Record<
  WorkflowStage,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  DETAILS_SUBMITTED: {
    label: 'Details Submitted',
    icon: Mail,
    description: 'Waiting for compliance review',
  },
  UNDER_REVIEW: {
    label: 'Compliance Review',
    icon: Shield,
    description: 'Platform administrators are verifying your documents',
  },
  REQUEST_CHANGES: {
    label: 'Action Required',
    icon: Clock,
    description: 'We need additional information or corrections',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    description: 'You are ready for on-chain deployment',
  },
  DEPLOYING: {
    label: 'Deploying Smart Contract',
    icon: Loader2,
    description: 'Minting fractional token contract on Base',
  },
  MINTED: {
    label: 'Minted On-Chain',
    icon: Wallet,
    description: 'Asset is tokenized and tradable',
  },
}

interface WorkflowStatusProps {
  currentStage: WorkflowStage
}

const orderedStages: WorkflowStage[] = [
  'DETAILS_SUBMITTED',
  'UNDER_REVIEW',
  'REQUEST_CHANGES',
  'APPROVED',
  'DEPLOYING',
  'MINTED',
]

export function WorkflowStatus({ currentStage }: WorkflowStatusProps) {
  const currentIndex = orderedStages.indexOf(currentStage)

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-gray-500">Tokenization Progress</p>
        <h3 className="text-xl font-bold">Real-time status updates</h3>
      </div>
      <ol className="space-y-4">
        {orderedStages.map((stage, index) => {
          const meta = stageMeta[stage]
          const isComplete = index < currentIndex
          const isActive = index === currentIndex
          const Icon = meta.icon
          return (
            <li
              key={stage}
              className={clsx('flex items-start gap-4 rounded-xl border p-4', {
                'border-black bg-black text-white shadow-lg': isActive,
                'border-green-200 bg-green-50 text-green-800': isComplete,
                'border-gray-200 bg-white text-gray-600': !isActive && !isComplete,
              })}
            >
              <Icon className={clsx('mt-1 h-5 w-5', { 'animate-spin': stage === 'DEPLOYING' && isActive })} />
              <div>
                <p className="font-semibold">{meta.label}</p>
                <p className="text-sm">{meta.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

