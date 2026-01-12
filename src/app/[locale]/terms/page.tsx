import { Metadata } from 'next'
import { SITE_URL, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms of service for using Kid Party RSVP platform. Learn about user accounts, content policies, service usage, and your rights and responsibilities.',
  keywords: 'terms of service, terms and conditions, user agreement, service terms, kid party rsvp terms, legal terms',
  openGraph: {
    title: 'Terms of Service - Kid Party RSVP',
    description: 'Read our terms of service for using the platform.',
    url: `${SITE_URL}/en/terms`,
    type: 'article',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service - Kid Party RSVP',
  },
  alternates: {
    canonical: `${SITE_URL}/en/terms`,
    languages: {
      'en': `${SITE_URL}/en/terms`,
      'zh': `${SITE_URL}/zh/terms`,
    },
  },
}

export default function TermsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Terms of Service', url: `${SITE_URL}/en/terms` },
  ])

  const articleSchema = generateArticleSchema({
    title: 'Terms of Service',
    description: 'Read our terms of service for using Kid Party RSVP platform.',
    datePublished: '2025-01-01',
    dateModified: '2025-01-10',
    author: 'Kid Party RSVP',
    url: `${SITE_URL}/en/terms`,
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 mb-6">Last updated: January 2025</p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neutral-600 mb-4">
              By accessing and using Kid Party RSVP, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">2. Description of Service</h2>
            <p className="text-neutral-600 mb-4">
              Kid Party RSVP is a party planning and RSVP management platform designed for parents to organize 
              children's birthday parties. Our service allows you to:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Create and manage party events</li>
              <li>Send digital invitations via QR codes</li>
              <li>Track guest RSVPs and dietary requirements</li>
              <li>Receive email notifications about party updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">3. User Accounts</h2>
            <p className="text-neutral-600 mb-4">
              To use certain features of our service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">4. User Content</h2>
            <p className="text-neutral-600 mb-4">
              You retain ownership of content you submit to our service. By submitting content, you grant us 
              a non-exclusive license to use, display, and distribute that content solely for the purpose of 
              providing our service.
            </p>
            <p className="text-neutral-600 mb-4">
              You agree not to submit content that is illegal, harmful, threatening, abusive, or otherwise objectionable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">5. Age Requirements</h2>
            <p className="text-neutral-600 mb-4">
              You must be at least 18 years old to create an account and use our service. Our service is designed
              for parents and guardians to plan children's parties. By using our service, you confirm that you are
              an adult with legal authority to provide information about the children in your care.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">6. Children's Privacy</h2>
            <p className="text-neutral-600 mb-4">
              We take children's privacy seriously. Our service collects limited information about children
              (such as names, ages, and dietary restrictions) solely for the purpose of party planning and
              guest management. This information is:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Only collected with parental/guardian consent</li>
              <li>Used exclusively for party management purposes</li>
              <li>Not shared with third parties for marketing</li>
              <li>Deleted when the party event is removed or account is closed</li>
            </ul>
            <p className="text-neutral-600 mb-4">
              Parents and guardians can request deletion of their children's information at any time by
              contacting us or deleting the party event.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">7. Payments and Refunds</h2>
            <p className="text-neutral-600 mb-4">
              Kid Party RSVP offers both free and paid features:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li><strong>Free Features:</strong> Basic party creation, RSVP management, and standard invitation templates</li>
              <li><strong>Premium Templates:</strong> One-time purchase for premium invitation designs</li>
              <li><strong>Photo Sharing:</strong> One-time purchase to enable party photo sharing</li>
            </ul>
            <p className="text-neutral-600 mb-4 font-medium">
              Refund Policy:
            </p>
            <p className="text-neutral-600 mb-4">
              All purchases of premium templates and features are <strong>final and non-refundable</strong>.
              Since digital products are delivered immediately upon purchase and can be used instantly,
              we do not offer refunds or exchanges. Please review your selection carefully before completing
              your purchase.
            </p>
            <p className="text-neutral-600 mb-4">
              If you experience technical issues preventing you from accessing a purchased feature, please
              contact us at support@kidspartyrsvp.com and we will work to resolve the issue.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">8. Privacy</h2>
            <p className="text-neutral-600 mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which explains how we collect,
              use, and protect your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">9. Prohibited Activities</h2>
            <p className="text-neutral-600 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Collect user information without consent</li>
              <li>Use the service to send spam or unsolicited communications</li>
              <li>Upload inappropriate content or content that exploits minors</li>
              <li>Create fake events or misleading invitations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">10. Account Termination</h2>
            <p className="text-neutral-600 mb-4">
              We reserve the right to suspend or terminate your account at any time if you violate these
              Terms of Service or engage in activities that harm our service or other users.
            </p>
            <p className="text-neutral-600 mb-4">
              You may delete your account at any time. Upon account deletion:
            </p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>All your party data and guest information will be permanently deleted</li>
              <li>Any purchased templates or features are non-transferable and will be forfeited</li>
              <li>This action cannot be undone</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-neutral-600 mb-4">
              The service is provided "as is" without warranties of any kind. We do not guarantee that the
              service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">12. Limitation of Liability</h2>
            <p className="text-neutral-600 mb-4">
              To the maximum extent permitted by law, Kid Party RSVP shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the service.
            </p>
            <p className="text-neutral-600 mb-4">
              Our total liability for any claims related to the service shall not exceed the amount you
              paid to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">13. Changes to Terms</h2>
            <p className="text-neutral-600 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes via email or through the service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">14. Governing Law</h2>
            <p className="text-neutral-600 mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of
              the United States. Any disputes arising from these terms or your use of the service shall
              be resolved through binding arbitration or in courts of competent jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">15. Contact Us</h2>
            <p className="text-neutral-600 mb-4">
              If you have questions about these Terms of Service, please contact us at support@kidspartyrsvp.com.
            </p>
          </section>
        </div>
      </div>
    </main>
    </>
  )
}
