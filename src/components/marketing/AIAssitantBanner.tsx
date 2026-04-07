'use client'

import { Container } from './Container'
import { useReveal } from '@/hooks/useReveal'
import { IconSparkles, IconLanguage, IconRobot } from '../ui/icons'

const aiFeatures = [
  {
    icon: <IconSparkles className="w-5 h-5" />,
    title: 'Smart Fee Reminders',
    description: 'AI automatically sends personalized fee reminders in parent\'s preferred language',
  },
  {
    icon: <IconRobot className="w-5 h-5" />,
    title: 'Automated Tasks',
    description: 'Student promotion, report generation, message templates — handled by AI',
  },
  {
    icon: <IconLanguage className="w-5 h-5" />,
    title: 'Multilingual Support',
    description: 'Hindi, English, Marathi, Tamil, Telugu, Gujarati, Bengali & more',
  },
]

const userRoles = [
  { role: 'Admin', tasks: 'Fee reminders · Student promotion · Reports · Templates' },
  { role: 'Teacher', tasks: 'Attendance insights · Performance · Communication' },
  { role: 'Parent', tasks: 'Fee queries · Progress · Exam schedule · Doubts' },
  { role: 'Student', tasks: 'Homework help · Exam prep · Timetable · Queries' },
]

export function AIAssistantBanner() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Container className="section-padding">
      <div ref={ref} className="reveal">
        {/* Header — Clean */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 mb-4">
            <IconSparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Powered by AI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Your AI Assistant for{' '}
            <span className="text-blue-600">Every School Task</span>
          </h2>

          <p className="text-base text-slate-600 leading-relaxed">
            Built-in AI assistant speaks all major Indian languages. Helps admins, teachers, parents and students — saving hours every day.
          </p>
        </div>

        {/* AI Features — Minimal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {aiFeatures.map((feature, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="inline-flex p-2.5 rounded-lg bg-blue-50 text-blue-600 mb-3">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Role-Based Help — Clean */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              AI Help for Everyone
            </h3>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Different capabilities for different users
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {userRoles.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs">
                    {item.role[0]}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{item.role}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.tasks}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Languages — Clean */}
        <div className="mt-10 text-center">
          <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
            Available in 10+ Languages
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {[
              'English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు', 
              'ગુજરાતી', 'বাংলা', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ'
            ].map((lang) => (
              <span
                key={lang}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}