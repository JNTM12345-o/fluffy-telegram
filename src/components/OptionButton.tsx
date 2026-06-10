interface Props {
  option: string
  index: number
  locked: boolean
  state: 'idle' | 'correct' | 'wrong' | 'reveal-correct'
  onClick: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function OptionButton({ option, index, locked, state, onClick }: Props) {
  const base =
    'w-full relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer option-card select-none'

  let colorClasses = ''
  if (state === 'correct' || state === 'reveal-correct') {
    colorClasses =
      'border-neon-lime/80 bg-neon-lime/20 text-white shadow-[0_0_30px_rgba(163,230,53,0.4)]'
  } else if (state === 'wrong') {
    colorClasses =
      'border-rose-500/80 bg-rose-500/20 text-white shadow-[0_0_30px_rgba(248,113,113,0.4)] animate-shake'
  } else {
    colorClasses = 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/30'
  }

  const letterColor =
    state === 'correct' || state === 'reveal-correct'
      ? 'bg-neon-lime text-slate-900 border-neon-lime'
      : state === 'wrong'
        ? 'bg-rose-500 text-white border-rose-200'
        : 'bg-white/10 text-white border-white/20'

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`${base} ${colorClasses} ${locked ? 'is-locked' : ''}`}
    >
      <span
      className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-display font-bold text-lg border ${letterColor}`}
    >
      {LETTERS[index]}
    </span>
      <span className="flex-1 text-left text-base sm:text-xl font-medium">{option}</span>
      <span className="shrink-0">
        {state === 'correct' && '✅'}
        {state === 'reveal-correct' && '✅'}
        {state === 'wrong' && '❌'}
      </span>
    </button>
  )
}
