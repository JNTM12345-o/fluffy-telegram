import type { Question } from '../data/questions'

interface Props {
  question: Question
  index: number
  total: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  地理: '🌍',
  科学: '🔬',
  常识: '💡',
  文学: '📚',
  编程: '💻',
  历史: '🏛️',
}

export default function QuestionCard({ question, index, total }: Props) {
  return (
    <div className="relative animate-pop-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass font-display font-bold text-neon-cyan">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-display text-sm uppercase tracking-[0.25em] text-slate-400">
            / {String(total).padStart(2, '0')}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium">
          <span>{CATEGORY_EMOJI[question.category] ?? '🎯'}</span>
          <span className="text-slate-200">{question.category}</span>
        </span>
      </div>

      <div className="relative p-6 sm:p-8 rounded-3xl glass overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-neon-purple/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-neon-cyan/10 blur-3xl pointer-events-none" />

        <h2 className="relative text-xl sm:text-3xl font-bold leading-snug text-white text-center">
          {question.text}
        </h2>
      </div>
    </div>
  )
}
