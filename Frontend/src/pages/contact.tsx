import { Button } from '@/components/ui/button'

type TeamMember = {
  initials: string
  name: string
  title: string
  email: string
}

type SafehouseRegion = {
  region: string
  houses: { name: string; city: string; phone: string }[]
}

const teamMembers: TeamMember[] = [
  {
    initials: 'JH',
    name: 'June Holloway',
    title: 'Founder & Executive Director',
    email: 'june@lunassafehaven.org',
  },
  {
    initials: 'SR',
    name: 'Sofia Reyes',
    title: 'Director of Mental Health & Counseling',
    email: 'counseling@lunassafehaven.org',
  },
  {
    initials: 'MC',
    name: 'Maria Cruz',
    title: 'Lead Social Worker & Case Management',
    email: 'cases@lunassafehaven.org',
  },
  {
    initials: 'LT',
    name: 'Lily Tan',
    title: 'Education Program Director',
    email: 'education@lunassafehaven.org',
  },
  {
    initials: 'JP',
    name: 'James Park',
    title: 'Technology & Operations',
    email: 'tech@lunassafehaven.org',
  },
]

const safehouses: SafehouseRegion[] = [
  {
    region: 'Luzon',
    houses: [
      { name: 'Quezon City House', city: 'Quezon City, Metro Manila', phone: '+63 2 8531-1001' },
      { name: 'Baguio House', city: 'Baguio City, Cordillera', phone: '+63 74 300-1005' },
    ],
  },
  {
    region: 'Visayas',
    houses: [
      { name: 'Cebu House', city: 'Cebu City, Central Visayas', phone: '+63 32 416-1002' },
      { name: 'Iloilo House', city: 'Iloilo City, Western Visayas', phone: '+63 33 320-1004' },
      { name: 'Bacolod House', city: 'Bacolod City, Western Visayas', phone: '+63 34 435-1007' },
      { name: 'Tacloban House', city: 'Tacloban City, Eastern Visayas', phone: '+63 53 321-1008' },
    ],
  },
  {
    region: 'Mindanao',
    houses: [
      { name: 'Davao House', city: 'Davao City, Davao Region', phone: '+63 82 222-1003' },
      { name: 'Cagayan de Oro House', city: 'Cagayan de Oro, Northern Mindanao', phone: '+63 88 858-1006' },
      { name: 'General Santos House', city: 'General Santos, Soccsksargen', phone: '+63 83 552-1009' },
    ],
  },
]

export function ContactPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16 lg:px-8">
        <section className="text-center border-b border-border pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Lunas</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Whether you want to give, volunteer, refer a child, or simply learn more,
            our team is here to connect you with the right person.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">In crisis? Help is available right now.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-red-700">United States</p>
                  <a href="tel:18004224453" className="font-serif text-2xl text-red-900 hover:underline">1-800-422-4453</a>
                  <p className="text-xs text-red-700">Childhelp National Child Abuse Hotline</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-red-700">Philippines</p>
                  <a href="tel:1383" className="font-serif text-2xl text-red-900 hover:underline">1383</a>
                  <p className="text-xs text-red-700">Makabata Helpline</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-red-800/90">
                For immediate physical danger, call <strong>911</strong> (US) or <strong>117</strong> (PH).
                Do not use the contact form below for urgent safety concerns.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Organization contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">United States (HQ)</p>
              <div className="mt-4 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Phone</p>
                <p className="text-sm text-foreground">(801) 831-3323</p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Email</p>
                <a href="mailto:info@lunassafehaven.org" className="text-sm text-primary hover:underline">
                  info@lunassafehaven.org
                </a>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Mailing address</p>
                <p className="text-sm text-foreground leading-relaxed">P.O. Box 4812<br />Provo, UT 84601</p>
              </div>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Philippines (Operations)</p>
              <div className="mt-4 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Phone</p>
                <p className="text-sm text-foreground">+63 2 8531-0000</p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Email</p>
                <a href="mailto:ph@lunassafehaven.org" className="text-sm text-primary hover:underline">
                  ph@lunassafehaven.org
                </a>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Operations office</p>
                <p className="text-sm text-foreground leading-relaxed">Unit 4B, Quezon City<br />Metro Manila, Philippines</p>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Leadership &amp; team</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <article key={member.initials} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.title}</p>
                  <a href={`mailto:${member.email}`} className="mt-1 block text-xs text-primary hover:underline">
                    {member.email}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Our safehouses</h2>
          <div className="mt-4 space-y-6">
            {safehouses.map((region) => (
              <div key={region.region}>
                <p className="text-xs uppercase tracking-[0.15em] text-primary">{region.region}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {region.houses.map((house) => (
                    <article key={house.name} className="rounded-xl border border-border bg-card p-4 flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{house.name}</p>
                        <p className="text-xs text-muted-foreground">{house.city}</p>
                        <p className="mt-1 text-xs text-primary">{house.phone}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Safehouse addresses are not publicly listed to protect the privacy and safety of residents.
            These numbers connect to regional program coordinators only.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Send us a message</h2>
          <form className="mt-4 rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-xs text-muted-foreground">First name</label>
                <input id="firstName" type="text" placeholder="First name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-xs text-muted-foreground">Last name</label>
                <input id="lastName" type="text" placeholder="Last name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs text-muted-foreground">Email address</label>
                <input id="email" type="email" placeholder="you@example.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs text-muted-foreground">Phone (optional)</label>
                <input id="phone" type="tel" placeholder="+1 (___) ___-____" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="topic" className="text-xs text-muted-foreground">I&apos;m reaching out about</label>
              <select id="topic" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option>Making a donation</option>
                <option>Volunteering or contributing skills</option>
                <option>Referring a child in need</option>
                <option>Partnership or organizational inquiry</option>
                <option>Media or press inquiry</option>
                <option>General question</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs text-muted-foreground">Message</label>
              <textarea id="message" placeholder="How can we help?" className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              We typically respond within 2 business days. For urgent child safety concerns,
              please use the emergency lines above and do not use this form.
            </p>
            <Button type="button">Send message</Button>
          </form>
        </section>
      </div>
    </div>
  )
}
