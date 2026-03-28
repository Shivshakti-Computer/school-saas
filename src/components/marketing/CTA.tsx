import { Container } from './Container'
import { PrimaryButton, SecondaryButton } from './MiniUI'

export function CTA() {
  return (
    <div className="py-14">
      <Container>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-7 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,white,transparent_55%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-extrabold text-xs">
                VF
              </div>
              <span className="text-sm font-semibold text-white/80">VidyaFlow</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to digitize your school?
            </h3>
            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl">
              Start with a free trial and upgrade only when you are confident. We help you onboard quickly.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <PrimaryButton href="/register" className="bg-white text-indigo-700 hover:bg-indigo-50">
                Start free trial
              </PrimaryButton>
              <SecondaryButton href="/contact" className="border-white/30 bg-white/10 text-white hover:bg-white/15">
                Talk to us
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}