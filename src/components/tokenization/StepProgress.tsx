'use client'

import clsx from 'clsx'

interface StepProgressProps {
  steps: { id: string; title: string; description?: string }[]
  currentIndex: number
  onStepClick?: (index: number) => void
}

export function StepProgress({ steps, currentIndex, onStepClick }: StepProgressProps) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isComplete = index < currentIndex

        return (
          <li key={step.id} className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => onStepClick?.(index)}
              className={clsx(
                'mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition',
                {
                  'border-black bg-black text-white': isActive,
                  'border-black bg-white text-black': isComplete,
                  'border-gray-300 text-gray-500': !isActive && !isComplete,
                },
              )}
            >
              {isComplete ? '✓' : index + 1}
            </button>
            <div>
              <p className="font-semibold text-gray-900">{step.title}</p>
              {step.description && <p className="text-sm text-gray-500">{step.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

