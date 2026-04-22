import type { ReactNode, RefObject } from 'react'

export type DecisionStepStatus = 'active' | 'done' | 'pending'

type DecisionStepSectionProps = {
  children: ReactNode
  sectionRef?: RefObject<HTMLElement | null>
}

export function DecisionStepSection({ children, sectionRef }: DecisionStepSectionProps) {
  return (
    <section ref={sectionRef} className="scroll-mt-28">
      {children}
    </section>
  )
}
