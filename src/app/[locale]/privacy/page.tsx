import { Metadata } from 'next'
import { SITE_URL, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Kid Party RSVP protects your privacy and handles your data. We value your trust and keep your information secure. GDPR and CCPA compliant.',
  keywords: 'privacy policy, data protection, GDPR, CCPA, data security, user privacy, kid party rsvp privacy',
  openGraph: {
    title: 'Privacy Policy - Kid Party RSVP',
    description: 'Learn how we protect your privacy and handle your data securely.',
    url: `${SITE_URL}/en/privacy`,
    type: 'article',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - Kid Party RSVP',
  },
  alternates: {
    canonical: `${SITE_URL}/en/privacy`,
    languages: {
      'en': `${SITE_URL}/en/privacy`,
      'zh': `${SITE_URL}/zh/privacy`,
    },
  },
}

export default function PrivacyPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Privacy Policy', url: `${SITE_URL}/en/privacy` },
  ])

  const articleSchema = generateArticleSchema({
    title: 'Privacy Policy',
    description: 'Learn how Kid Party RSVP protects your privacy and handles your data.',
    datePublished: '2025-01-01',
    dateModified: '2025-01-10',
    author: 'Kid Party RSVP',
    url: `${SITE_URL}/en/privacy`,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 mb-6">Last updated: January 2025</p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">1. Introduction</h2>
            <p className="text-neutral-600 mb-4">
              Kid Party RSVP ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-neutral-700 mb-3">Personal Information</h3>
            <p className="text-neutral-600 mb-4">We may collect the following personal information:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Name and email address (when you register)</li>
              <li>Children's names and ages (for party planning)</li>
              <li>Party event details (date, location, theme)</li>
              <li>Guest information (names, RSVP responses, dietary restrictions)</li>
            </ul>
            
            <h3 className="text-lg font-medium text-neutral-700 mb-3">Automatically Collected Information</h3>
            <p className="text-neutral-600 mb-4">We automatically collect:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and general location</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">3. How We Use Your Information</h2>
            <p className="text-neutral-600 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Provide and maintain our service</li>
              <li>Send party invitations and RSVP notifications</li>
              <li>Send reminder emails about upcoming parties</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about service updates</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">4. Information Sharing</h2>
            <p className="text-neutral-600 mb-4">
              We do not sell your personal information. We may share information in the following situations:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li><strong>With party hosts and guests:</strong> RSVP information is shared with party organizers</li>
              <li><strong>Service providers:</strong> We use third-party services for email delivery and hosting</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">5. Data Security</h2>
            <p className="text-neutral-600 mb-4">
              We implement appropriate security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Encryption of data in transit (HTTPS)</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">6. Children's Privacy (COPPA Compliance)</h2>
            <p className="text-neutral-600 mb-4">
              Our service is designed for parents and guardians to plan children's parties. We take children's
              privacy very seriously and comply with the Children's Online Privacy Protection Act (COPPA).
            </p>
            <p className="text-neutral-600 mb-4">
              <strong>Key points about children's data:</strong>
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>We do not knowingly collect personal information directly from children under 13</li>
              <li>All information about children (names, ages, dietary restrictions) is provided by their parents or guardians</li>
              <li>Children's information is used solely for party planning and guest management</li>
              <li>We do not share children's information with third parties for marketing purposes</li>
              <li>Parents can request deletion of their children's information at any time</li>
              <li>Children's data is automatically deleted when the associated party event is removed</li>
            </ul>
            <p className="text-neutral-600 mb-4">
              If you believe we have inadvertently collected information from a child without proper parental
              consent, please contact us immediately at privacy@kidspartyrsvp.com and we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">7. Payment Information</h2>
            <p className="text-neutral-600 mb-4">
              When you make a purchase on our platform:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Payment processing is handled securely by Stripe, a PCI-compliant payment processor</li>
              <li>We do not store your full credit card number, CVV, or other sensitive payment details on our servers</li>
              <li>We only retain transaction records (purchase date, amount, item purchased) for accounting purposes</li>
              <li>Stripe's privacy policy governs how they handle your payment information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">8. Your Rights</h2>
            <p className="text-neutral-600 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">9. Cookies</h2>
            <p className="text-neutral-600 mb-4">
              We use essential cookies to maintain your session and preferences. We do not use tracking
              cookies for advertising purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">10. Data Retention</h2>
            <p className="text-neutral-600 mb-4">
              We retain your personal information for as long as your account is active or as needed to
              provide services. Party data is retained for 1 year after the event date, after which it
              may be automatically deleted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">11. Changes to This Policy</h2>
            <p className="text-neutral-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">12. Contact Us</h2>
            <p className="text-neutral-600 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at
              privacy@kidspartyrsvp.com.
            </p>
          </section>
        </div>
      </div>
    </main>
    </>
  )
}
