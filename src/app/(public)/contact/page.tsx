import { Container } from '@/components/marketing/Container'
import { SectionTitle, PrimaryButton } from '@/components/marketing/MiniUI'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with VidyaFlow team for demo, onboarding, and support.',
}

export default function ContactPage() {
    return (
        <div className="py-12">
            <Container>
                <SectionTitle
                    eyebrow="Contact"
                    title="Talk to us for demo and onboarding"
                    subtitle="We help you onboard quickly with training and setup."
                />

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <h3 className="text-sm font-extrabold text-slate-900">WhatsApp / Call</h3>
                        <p className="mt-2 text-sm text-slate-600">+91-XXXXXXXXXX</p>
                        <p className="mt-1 text-sm text-slate-600">support@yourdomain.com</p>

                        <div className="mt-5">
                            <PrimaryButton href="/register">Start free trial</PrimaryButton>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="text-sm font-extrabold text-slate-900">Office</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Shivshakti Computer Academy<br />
                            Ambikapur, Chhattisgarh (India)
                        </p>
                        <p className="mt-4 text-xs text-slate-500">
                            Response time: within 24 hours (business days).
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    )
}