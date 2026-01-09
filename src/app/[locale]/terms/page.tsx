import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms of service for using Kid Party RSVP platform. Learn about user accounts, content policies, and service usage.',
  alternates: {
    canonical: `${SITE_URL}/en/terms`,
    languages: {
      'en': `${SITE_URL}/en/terms`,
      'zh': `${SITE_URL}/zh/terms`,
    },
  },
}

export default function TermsPage() {
  return (
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
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">5. Privacy</h2>
            <p className="text-neutral-600 mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, 
              use, and protect your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">6. Prohibited Activities</h2>
            <p className="text-neutral-600 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-neutral-600 mb-4 space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Collect user information without consent</li>
              <li>Use the service to send spam or unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-neutral-600 mb-4">
              The service is provided "as is" without warranties of any kind. We do not guarantee that the 
              service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">8. Limitation of Liability</h2>
            <p className="text-neutral-600 mb-4">
              To the maximum extent permitted by law, Kid Party RSVP shall not be liable for any indirect, 
              incidental, special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">9. Changes to Terms</h2>
            <p className="text-neutral-600 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or through the service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4">10. Contact Us</h2>
            <p className="text-neutral-600 mb-4">
              If you have questions about these Terms of Service, please contact us at support@kidpartyrsvp.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
