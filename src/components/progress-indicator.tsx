'use client'

import { type SSEStepType } from '@/types'

interface ProgressIndicatorProps {
  currentStep: SSEStepType | null
  error: string | null
}

const STEPS: { key: SSEStepType; label: string }[] = [
  { key: 'info', label: '영상 정보' },
  { key: 'subtitle', label: '자막 추출' },
  { key: 'correct', label: '한글 교정' },
  { key: 'summary', label: '요약 생성' },
]

const stepOrder = (step: SSEStepType): number => {
  const idx = STEPS.findIndex((s) => s.key === step)
  return idx === -1 ? -1 : idx
}

type StepState = 'done' | 'active' | 'waiting' | 'error'

const getStepState = (
  stepKey: SSEStepType,
  currentStep: SSEStepType | null,
  error: string | null,
): StepState => {
  if (!currentStep) return 'waiting'

  const currentIdx = stepOrder(currentStep)
  const thisIdx = stepOrder(stepKey)

  if (currentStep === 'complete') return 'done'

  if (currentStep === 'error' && error) {
    if (thisIdx < currentIdx) return 'done'
    if (thisIdx === currentIdx) return 'error'
    return 'waiting'
  }

  if (thisIdx < currentIdx) return 'done'
  if (thisIdx === currentIdx) return 'active'
  return 'waiting'
}

const StepIcon = ({ state }: { state: StepState }) => {
  if (state === 'done') {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )
  }

  if (state === 'active') {
    return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  }

  if (state === 'error') {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  }

  return <span className="inline-block h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
}

const stepBgClass: Record<StepState, string> = {
  done: 'bg-blue-600 dark:bg-blue-500',
  active: 'bg-blue-600 dark:bg-blue-500',
  waiting: 'bg-gray-200 dark:bg-gray-700',
  error: 'bg-red-500',
}

const stepTextClass: Record<StepState, string> = {
  done: 'text-gray-900 dark:text-white',
  active: 'text-blue-600 font-semibold dark:text-blue-400',
  waiting: 'text-gray-400 dark:text-gray-500',
  error: 'text-red-500 font-semibold',
}

export const ProgressIndicator = ({ currentStep, error }: ProgressIndicatorProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const state = getStepState(step.key, currentStep, error)

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${stepBgClass[state]}`}>
                  <StepIcon state={state} />
                </div>
                <span className={`text-xs transition-colors duration-300 ${stepTextClass[state]}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2 flex-1 self-start mt-5">
                  <div className={`h-0.5 w-full transition-colors duration-300 ${
                    stepOrder(step.key) < stepOrder(currentStep ?? 'info')
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
