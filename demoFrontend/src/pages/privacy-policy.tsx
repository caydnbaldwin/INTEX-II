import { Link } from 'react-router-dom'
import { Shield, Mail, MapPin, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function PrivacyPolicy() {
  const lastUpdated = 'April 1, 2026'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Safe Haven (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and 
              ensuring the security of any personal information you provide to us. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when 
              you visit our website, use our services, or interact with us in any way.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              As a nonprofit organization serving vulnerable populations, we take data protection 
              extremely seriously and comply with applicable data protection laws, including the 
              Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and the General Data 
              Protection Regulation (GDPR) for our European visitors and donors.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Table of Contents */}
          <Card className="mb-12 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {[
                  { id: 'information-collection', title: '1. Information We Collect' },
                  { id: 'use-of-information', title: '2. How We Use Your Information' },
                  { id: 'information-sharing', title: '3. Information Sharing and Disclosure' },
                  { id: 'data-security', title: '4. Data Security' },
                  { id: 'cookies', title: '5. Cookies and Tracking Technologies' },
                  { id: 'your-rights', title: '6. Your Rights and Choices' },
                  { id: 'children-privacy', title: '7. Children\'s Privacy' },
                  { id: 'international-transfers', title: '8. International Data Transfers' },
                  { id: 'data-retention', title: '9. Data Retention' },
                  { id: 'changes', title: '10. Changes to This Policy' },
                  { id: 'contact', title: '11. Contact Us' },
                ].map((item) => (
                  <a 
                    key={item.id}
                    href={`#${item.id}`} 
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Section 1 */}
          <section id="information-collection" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              1. Information We Collect
            </h2>
            
            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              1.1 Information You Provide Directly
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account Information:</strong> When you create an account, 
                we collect your name, email address, and password.
              </li>
              <li>
                <strong className="text-foreground">Donation Information:</strong> When you make a donation, 
                we collect your name, contact information, payment details (processed securely through 
                third-party payment processors), and donation amount.
              </li>
              <li>
                <strong className="text-foreground">Communication Data:</strong> When you contact us, 
                we collect the information you provide in your messages.
              </li>
              <li>
                <strong className="text-foreground">Volunteer Information:</strong> If you volunteer with us, 
                we may collect additional information such as skills, availability, and background check data.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              1.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Device Information:</strong> Browser type, operating system, 
                device identifiers, and IP address.
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong> Pages visited, time spent on pages, 
                links clicked, and other browsing behavior.
              </li>
              <li>
                <strong className="text-foreground">Cookies:</strong> We use cookies and similar technologies 
                as described in Section 5.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              1.3 Sensitive Information
            </h3>
            <p className="text-muted-foreground">
              We do NOT collect sensitive personal information from website visitors or donors. 
              Information about our program beneficiaries (residents) is handled under separate, 
              more stringent privacy protocols and is never shared publicly or with donors in 
              any identifiable form.
            </p>
          </section>

          {/* Section 2 */}
          <section id="use-of-information" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To process and acknowledge your donations</li>
              <li>To provide you with donation receipts for tax purposes</li>
              <li>To communicate with you about our programs, impact, and opportunities to support our mission</li>
              <li>To create and manage your account</li>
              <li>To respond to your inquiries and provide support</li>
              <li>To improve our website and services</li>
              <li>To analyze donation patterns and campaign effectiveness (using aggregated, anonymized data)</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and protect the security of our systems</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="information-sharing" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              3. Information Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground mb-4">
              We do NOT sell, rent, or trade your personal information. We may share your 
              information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Service Providers:</strong> With trusted third-party 
                service providers who assist us in operating our website, processing payments, or 
                conducting our operations (subject to confidentiality agreements).
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong> When required by law, 
                court order, or governmental regulation.
              </li>
              <li>
                <strong className="text-foreground">Protection of Rights:</strong> To protect the rights, 
                property, or safety of Safe Haven, our beneficiaries, or others.
              </li>
              <li>
                <strong className="text-foreground">With Your Consent:</strong> In any other circumstances 
                where you have given explicit consent.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="data-security" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              4. Data Security
            </h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to protect your 
              personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption of data in transit using TLS/SSL</li>
              <li>Secure password hashing and storage</li>
              <li>Role-based access controls for staff</li>
              <li>Regular security assessments and updates</li>
              <li>Secure cloud hosting with reputable providers</li>
              <li>Multi-factor authentication options for accounts</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              While we strive to protect your information, no method of transmission over the 
              Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 5 */}
          <section id="cookies" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to enhance your experience on our website. 
              These include:
            </p>
            
            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              5.1 Essential Cookies
            </h3>
            <p className="text-muted-foreground">
              Required for the website to function properly. These cannot be disabled.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              5.2 Analytics Cookies
            </h3>
            <p className="text-muted-foreground">
              Help us understand how visitors interact with our website. You can opt out of 
              these through our cookie consent banner.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">
              5.3 Preference Cookies
            </h3>
            <p className="text-muted-foreground">
              Remember your preferences (such as language or display settings). These are optional.
            </p>

            <p className="text-muted-foreground mt-6">
              You can manage your cookie preferences at any time through your browser settings 
              or our cookie consent tool. Note that disabling certain cookies may affect website 
              functionality.
            </p>
          </section>

          {/* Section 6 */}
          <section id="your-rights" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              6. Your Rights and Choices
            </h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Access:</strong> Request a copy of the personal 
                information we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Correction:</strong> Request correction of inaccurate 
                or incomplete information.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> Request deletion of your personal 
                information (subject to legal retention requirements).
              </li>
              <li>
                <strong className="text-foreground">Portability:</strong> Request transfer of your data 
                to another organization.
              </li>
              <li>
                <strong className="text-foreground">Objection:</strong> Object to certain processing of 
                your information.
              </li>
              <li>
                <strong className="text-foreground">Withdraw Consent:</strong> Where processing is based 
                on consent, you may withdraw it at any time.
              </li>
              <li>
                <strong className="text-foreground">Opt-Out:</strong> Unsubscribe from marketing 
                communications at any time.
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us using the information in Section 11.
            </p>
          </section>

          {/* Section 7 */}
          <section id="children-privacy" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              Our website and services are not directed at children under 18. We do not knowingly 
              collect personal information from children through our website. If you believe we 
              have inadvertently collected information from a child, please contact us immediately, 
              and we will take steps to delete such information.
            </p>
            <p className="text-muted-foreground mt-4">
              <strong className="text-foreground">Note:</strong> Information about program beneficiaries 
              (minors in our care) is handled under entirely separate protocols, never collected 
              through this website, and protected under the strictest confidentiality standards 
              in compliance with child protection laws.
            </p>
          </section>

          {/* Section 8 */}
          <section id="international-transfers" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              8. International Data Transfers
            </h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than the 
              Philippines, including the United States (where our hosting providers are located). 
              We ensure appropriate safeguards are in place for such transfers, including 
              Standard Contractual Clauses approved by relevant data protection authorities.
            </p>
          </section>

          {/* Section 9 */}
          <section id="data-retention" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              9. Data Retention
            </h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to fulfill the purposes 
              described in this policy, unless a longer retention period is required by law. 
              Donation records are retained for at least 7 years for tax and regulatory compliance. 
              You may request deletion of your account data at any time, subject to legal retention 
              requirements.
            </p>
          </section>

          {/* Section 10 */}
          <section id="changes" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. When we make significant changes, 
              we will notify you by posting a prominent notice on our website and updating the 
              &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Section 11 - Contact */}
          <section id="contact" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy 
              or our data practices, please contact us:
            </p>
            
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Safe Haven</p>
                      <p className="text-sm text-muted-foreground">Data Protection Officer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href="mailto:privacy@safehaven.org" className="text-primary hover:underline">
                      privacy@safehaven.org
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">+63 2 1234 5678</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-muted-foreground">
                      Manila, Philippines
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-muted-foreground mt-6">
              For GDPR-related inquiries from European residents, you also have the right to 
              lodge a complaint with your local data protection authority.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By using our website or services, you acknowledge that you have read and 
              understood this Privacy Policy.
            </p>
            <p className="mt-4">
              <Link to="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
