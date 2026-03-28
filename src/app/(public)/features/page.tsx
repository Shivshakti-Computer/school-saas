import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { CTA } from '@/components/marketing/CTA'

export const metadata = {
  title: 'Features',
  description: 'Explore all features of VidyaFlow — student management, attendance, fees, exams, website builder, and more.',
}

export default function FeaturesPage() {
    return (
        <>
            <div className="py-12">
                <Container>
                    <SectionTitle
                        eyebrow="Features"
                        title="Built for real school workflows"
                        subtitle="Fast admin operations, clean teacher tools, and simple parent/student experience."
                    />
                </Container>
            </div>
            <FeatureGrid />
            <CTA />
        </>
    )
}