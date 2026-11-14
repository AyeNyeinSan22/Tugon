import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

const faqItems = [
  {
    question: 'Who can submit a report?',
    answer:
      'Anyone who notices a problem with a public project can start a report. The demonstration does not require an account. Include a location and a clear description so the issue can be understood.',
  },
  {
    question: 'Does every report lead to government action?',
    answer:
      'No. Reports are reviewed by staff to verify completeness, check duplicate submissions, and determine if they meet the criteria for routing to local engineering offices.',
  },
  {
    question: 'Who reviews my report and decides what action to take?',
    answer:
      'Government staff review every report. Automated summaries only help organize details and group nearby submissions—human officers verify urgency and route cases to the responsible office.',
  },
  {
    question: 'What if there is an immediate safety hazard or emergency?',
    answer:
      'If anyone is in immediate danger—such as a live electrical wire, active structural collapse, or severe flash flooding—call 911 or your local DRRMO first before submitting a report here.',
  },
]

export default function FaqSection() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative overflow-hidden rounded-2xl border border-[#cbd5e1] bg-[#eaf2fc] shadow-[0_6px_24px_rgba(15,35,66,0.04)]"
    >
      <div className="relative p-6 sm:p-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1e3a8a]">
            {t('COMMON QUESTIONS')}
          </p>
          <h2 id="faq-heading" className="mt-1 text-xl font-extrabold tracking-tight text-[#0f2342] sm:text-2xl">
            {t('Frequently asked questions')}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#475569] sm:text-sm">
            {t('Quick answers about reporting public project issues, privacy, and review timelines.')}
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {faqItems.map(({ question, answer }, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={question}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen
                    ? 'border-[#93c5fd] bg-white shadow-xs'
                    : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'
                }`}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                  >
                    <span className="text-sm font-bold text-[#0f2342]">{t(question)}</span>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full transition-colors ${
                        isOpen
                          ? 'bg-[#1e3a8a] text-white'
                          : 'bg-[#e2e8f0] text-[#475569]'
                      }`}
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div className="border-t border-[#e2e8f0]/80 px-4 pb-4 pt-3 text-xs leading-6 text-[#475569] sm:px-5 sm:text-sm">
                    {t(answer)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}