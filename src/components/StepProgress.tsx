import Icon from '@/components/Icon'

const steps = ['Profile', 'Payment', 'Proof']

export default function StepProgress({
  currentStep,
  stepProgress = 0,
}: {
  currentStep: number
  stepProgress?: number
}) {
  const percent = Math.min(100, ((currentStep - 1 + stepProgress) / steps.length) * 100)

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < currentStep
          const active = n === currentStep
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                    ? 'bg-blue-500/20 text-blue-300 ring-2 ring-blue-500'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {done ? <Icon name="check" className="h-4 w-4" /> : n}
              </span>
              <span
                className={`text-xs font-semibold ${
                  done || active ? 'text-slate-100' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}