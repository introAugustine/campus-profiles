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
    <div className="mb-6">
      <div className="flex justify-between text-xs font-semibold mb-2">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < currentStep
          const active = n === currentStep
          return (
            <span key={label} className={done || active ? 'text-blue-700' : 'text-gray-400'}>
              {done ? '✓' : n}. {label}
            </span>
          )
        })}
      </div>
      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-700 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}