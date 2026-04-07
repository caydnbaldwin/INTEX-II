import { useEffect } from 'react'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const sections = [
  {
    id: 'who-we-are',
    title: 'Who We Are',
    content: `Lunas is a nonprofit organization dedicated to protecting and rehabilitating girls who are survivors of sexual abuse, trafficking, and exploitation. We operate safe homes across multiple regions and provide holistic care including shelter, education, counseling, and reintegration support.

**Data Controller:**
Lunas
contact@lunas.org

As the data controller, Lunas determines the purposes and means of processing personal data collected through this website and our operational systems.`,
  },
  {
    id: 'data-we-collect',
    title: 'Data We Collect',
    content: `We collect different categories of personal data depending on how you interact with our platform:

**Visitors (public site)**
- Browser cookies and session identifiers (see Cookie Policy below)
- Anonymized usage analytics (page views, referral sources)

**Donors & Supporters**
- Name, email address, phone number, and mailing address
- Donation history, amounts, and campaign participation
- Communication preferences and correspondence with our team
- Acquisition source (how you first connected with Lunas)

**Authenticated Users (Admin & Staff)**
- Login credentials (email/username, hashed password)
- Role and access level
- Activity logs for security and audit purposes

**Residents (Internal Use Only — Never Public)**
- Case records, health and wellbeing data, education progress, and counseling notes are collected and held strictly for operational case management purposes. This data is never shared publicly, is accessible only to authorized staff, and is protected with the highest level of security controls we apply.`,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Data',
    content: `We use personal data only for the purposes for which it was collected:

**To operate our donor programs**
Managing donation records, issuing acknowledgments, attributing donations to campaigns and safehouses, and communicating impact updates to supporters.

**To provide authenticated access**
Verifying identity, managing sessions, and enforcing role-based access to administrative features.

**To improve our outreach**
Analyzing which communications and social media activity lead to donor engagement, so we can be more effective with limited resources.

**To protect our residents**
Case management data is used solely to deliver care, track progress, plan interventions, and ensure the safety of the girls in our programs.

**To comply with legal obligations**
We may process data as required by applicable law, including nonprofit reporting requirements and child protection regulations.`,
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis for Processing',
    content: `Under GDPR Article 6, we rely on the following legal bases:

**Consent** — For non-essential cookies and marketing communications. You may withdraw consent at any time.

**Contract** — To process donations and fulfill commitments made to donors and supporters.

**Legitimate Interests** — To analyze our social media effectiveness and improve donor outreach, where this does not override your rights and freedoms.

**Legal Obligation** — Where processing is required to comply with applicable laws and regulations.

**Vital Interests** — For processing related to the safety and care of residents, which may include special category data (health information) processed under GDPR Article 9(2)(c).`,
  },
  {
    id: 'data-sharing',
    title: 'Who We Share Data With',
    content: `We do not sell personal data. We share data only in the following limited circumstances:

**Service Providers**
We use Microsoft Azure to host our application and databases, and Vercel to serve our frontend. These providers process data on our behalf under data processing agreements and are obligated to protect your information.

**Payment Processing**
If you make a donation online, payment information is handled by our payment processor (Stripe) and is not stored on our servers. Stripe's privacy policy governs that transaction.

**In-Country Partners**
Operational partners who deliver services at our safehouses may have access to resident case data strictly necessary for delivering care. All partners are bound by confidentiality obligations.

**Legal Requirements**
We may disclose data to law enforcement or regulatory authorities where required by law, particularly in connection with child protection obligations.

We do not transfer personal data to third parties for their own marketing purposes.`,
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    content: `Lunas operates in the Philippines. Our website and administrative platform are hosted on Microsoft Azure and Vercel infrastructure, which may be located in the United States or other jurisdictions outside the Philippines and the European Economic Area.

Where personal data is transferred internationally, we ensure appropriate safeguards are in place, including reliance on Standard Contractual Clauses (SCCs) approved by the European Commission and equivalent data protection frameworks.

If you have questions about the specific safeguards applied to your data, please contact us at contact@lunas.org.`,
  },
  {
    id: 'retention',
    title: 'How Long We Keep Your Data',
    content: `We retain personal data only as long as necessary for the purposes described in this policy:

**Donor records** — Retained for 7 years following the last donation for accounting and legal compliance purposes.

**Account credentials** — Retained for the duration of the account. Inactive accounts are reviewed annually.

**Website cookies** — Session cookies expire when you close your browser. Preference cookies (e.g., dark/light mode) are retained for up to 12 months.

**Resident case records** — Retained in accordance with applicable child welfare regulations and the organization's data governance policy. Records are archived securely after case closure.

**Audit logs** — Retained for 2 years.

After the applicable retention period, data is securely deleted or irreversibly anonymized.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: `If you are located in the European Union or a jurisdiction with equivalent privacy rights, you have the following rights regarding your personal data:

**Right to Access** — You may request a copy of the personal data we hold about you.

**Right to Rectification** — You may ask us to correct inaccurate or incomplete data.

**Right to Erasure** — You may request that we delete your personal data, subject to legal retention requirements.

**Right to Restrict Processing** — You may ask us to limit how we use your data in certain circumstances.

**Right to Data Portability** — You may request your data in a structured, machine-readable format.

**Right to Object** — You may object to processing based on legitimate interests, including profiling.

**Right to Withdraw Consent** — Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.

To exercise any of these rights, contact us at contact@lunas.org. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection supervisory authority.`,
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    content: `We use cookies and similar technologies on our website. When you first visit, a consent banner will ask for your permission before non-essential cookies are set.

**Essential Cookies**
Required for the site to function. These include authentication session tokens and security cookies. They cannot be disabled.

**Preference Cookies**
Used to remember your settings, such as light or dark mode. These are set only with your consent.

**Analytics Cookies**
Used to understand how visitors use our site (pages visited, session duration, referral source). We use anonymized, aggregated data only. Set only with your consent.

You may update your cookie preferences at any time by clearing your browser cookies or using the preference controls in your browser settings. Withdrawing consent for non-essential cookies will not affect your ability to use the site.`,
  },
  {
    id: 'children',
    title: 'A Note on Minors',
    content: `This public website is not directed at children under the age of 13, and we do not knowingly collect personal data directly from minors through our public-facing pages.

The individuals we serve — girls who are survivors of abuse and trafficking — are minors whose case data is handled entirely within our internal case management system. That data is never exposed through the public website, is protected with strict access controls, and is handled in accordance with applicable child protection laws and our organizational safeguarding policies.

If you believe a minor's data has been submitted to this site in error, please contact us immediately at contact@lunas.org.`,
  },
  {
    id: 'security',
    title: 'How We Protect Your Data',
    content: `We take data security seriously, particularly given the sensitive nature of the individuals we serve. Our security measures include:

- HTTPS encryption on all connections (TLS via Azure and Vercel)
- Passwords hashed using industry-standard algorithms; never stored in plaintext
- Role-based access control limiting data visibility to authorized users only
- Separate databases for operational data and identity/authentication data
- Automated backups and access logging
- Regular review of security configurations and access permissions

No system is completely immune to security risks. If you believe your data has been compromised, contact us immediately at contact@lunas.org.`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this privacy policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will update the "Last Updated" date at the top of this page.

We encourage you to review this policy periodically. Continued use of our website after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `If you have any questions, concerns, or requests related to this privacy policy or how we handle your data, please contact us:

**Lunas**
Email: contact@lunas.org

We are committed to resolving privacy concerns promptly and transparently. If you are not satisfied with our response, you have the right to escalate your complaint to the relevant data protection authority in your jurisdiction.`,
  },
]

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="mt-5 mb-1 font-semibold text-foreground">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    }
    if (line.trim() === '') return <br key={i} />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className="my-1.5 leading-relaxed text-muted-foreground">
        {parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-foreground">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </p>
    )
  })
}

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const lastUpdated = 'April 7, 2026'

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
      <header className="border-b border-border pb-10">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="h-8 w-8 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Lunas — Legal</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>

      <section className="border-b border-border py-10">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Lunas is a nonprofit organization. We believe that the girls and families we serve, and the donors who make our work possible, deserve complete transparency about how their information is collected, used, and protected. This policy explains our data practices in plain language.
        </p>
      </section>

      <section className="py-10">
        <Card className="border bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <nav aria-label="Policy sections">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {sections.map((s) => (
                  <li key={s.id} className="pl-1 marker:text-muted-foreground">
                    <a href={`#${s.id}`} className="text-primary hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </CardContent>
        </Card>
      </section>

      <Separator className="mb-2" />

      {sections.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 border-b border-border py-10 last:border-b-0"
          aria-labelledby={`heading-${section.id}`}
        >
          <div className="mb-6 flex items-baseline gap-4">
            <span className="min-w-[1.75rem] font-mono text-xs tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 id={`heading-${section.id}`} className="text-xl font-semibold tracking-tight text-foreground">
              {section.title}
            </h2>
          </div>
          <div className="border-l-2 border-border pl-6 sm:pl-8">{renderContent(section.content)}</div>
        </section>
      ))}

      <footer className="border-t border-border pt-10 pb-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This privacy policy was last reviewed on {lastUpdated}. Lunas is committed to transparency and will notify users of material changes via this page. This policy does not constitute legal advice. For questions, contact contact@lunas.org.
        </p>
      </footer>
    </div>
  )
}
