import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

const questions = [
  ['Who can submit a report?', 'Anyone who notices a problem with a public project can start a report. The demonstration does not require an account. Include a location and a clear description so the issue can be understood.'],
  ['Does every report lead to government action?', 'Not necessarily. A live service would need to review each report and determine which office is responsible and what action is appropriate. This prototype does not send reports to a government office.'],
  ['Does it cost anything?', 'This prototype is free to explore and does not require an account. It does not accept or send real reports.'],
  ['What should I do in an emergency?', 'Tugon is not an emergency service. If someone is in immediate danger, call 911 or your local DRRMO first.'],
  ['Will my location or phone number be public?', 'In this prototype, your information is not stored or submitted. The map only uses your current location to recenter after you choose “Use my current location” and grant browser permission.'],
  ['Can I track a report later?', 'A live service should provide a reference number for follow-up. The tracking page in this prototype displays sample data only; it is not connected to submitted reports.'],
]

export default function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)
  const { t } = useLanguage()

  return <section id="faq" className="rounded-xl border border-[#d5dee5] bg-[#e8f3f1] px-5 py-6 text-[#153550] shadow-sm sm:px-8 sm:py-8" aria-labelledby="faq-title">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176b70]">{t('TUGON · COMMON QUESTIONS')}</p>
    <h2 id="faq-title" className="mt-2 text-2xl font-bold sm:text-[28px]">{t('Before you send a report')}</h2>
    <div className="mt-5 divide-y divide-[#cfdddf] border-y border-[#cfdddf]">
      {questions.map(([question, answer], index) => <div key={question}>
        <h3><button type="button" onClick={() => setOpenQuestion(openQuestion === index ? null : index)} aria-expanded={openQuestion === index} aria-controls={`faq-answer-${index}`} className="flex w-full items-center justify-between gap-5 py-4 text-left text-sm font-semibold text-[#153550] hover:text-[#10565a] sm:text-base"><span>{t(question)}</span>{openQuestion === index ? <Minus className="shrink-0" size={17}/> : <Plus className="shrink-0" size={17}/>}</button></h3>
        {openQuestion === index && <p id={`faq-answer-${index}`} className="faq-answer max-w-2xl pb-4 pr-8 text-sm leading-6 text-[#516575]">{t(answer)}</p>}
      </div>)}
    </div>
  </section>
}
