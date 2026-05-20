import { TaskContextCard } from '@/components/discovery/task-context-card'

type StepOneContextStackProps = {
  currentPrompt: string
}

export function StepOneContextStack({ currentPrompt }: StepOneContextStackProps) {
  return (
    <div className="space-y-3">
      <TaskContextCard currentPrompt={currentPrompt} />
    </div>
  )
}
