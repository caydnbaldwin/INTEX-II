import { Button } from '@/components/ui/button'

type TeamMember = {
  name: string
  title: string
  email: string
  /** Public URL under /public (e.g. /images/team/name.png) */
  photoSrc: string
  /** Extra classes on the avatar <img> (object-fit, position, scale, etc.) */
  photoClassName?: string
}

const teamMembers: TeamMember[] = [
  {
    name: 'June Holloway',
    title: 'Founder & Executive Director',
    email: 'june@lunassafehaven.org',
    photoSrc: '/images/team/june-holloway.png',
    photoClassName: 'object-[50%_70%] scale-[1.44] origin-center',
  },
  {
    name: 'Sofia Reyes',
    title: 'Director of Mental Health & Counseling',
    email: 'counseling@lunassafehaven.org',
    photoSrc: '/images/team/sofia-reyes.png',
  },
  {
    name: 'Maria Cruz',
    title: 'Lead Social Worker & Case Management',
    email: 'cases@lunassafehaven.org',
    photoSrc: '/images/team/maria-cruz.png',
  },
  {
    name: 'Lily Tan',
    title: 'Education Program Director',
    email: 'education@lunassafehaven.org',
    photoSrc: '/images/team/lily-tan.png',
  },
  {
    name: 'James Park',
    title: 'Technology & Operations',
    email: 'tech@lunassafehaven.org',
    photoSrc: '/images/team/james-park.png',
    photoClassName: 'object-[50%_40%]',
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
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Donations, volunteering, referrals, or questions—we&apos;re here to help.
          </p>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:items-start lg:gap-12">
          <section>
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
              We typically respond within 2 business days.
            </p>
            <Button type="button">Send message</Button>
            </form>
          </section>

          <aside className="lg:sticky lg:top-24">
            <h2 className="font-serif text-xl font-semibold text-foreground">Leadership &amp; team</h2>
            <div className="mt-4 flex flex-col gap-3">
              {teamMembers.map((member) => (
                <article
                  key={member.email}
                  className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border">
                    <img
                      src={member.photoSrc}
                      alt=""
                      className={`h-full w-full object-cover ${member.photoClassName ?? 'object-center'}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{member.title}</p>
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-1 block truncate text-xs text-primary hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-14 border-t border-border pt-12">
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
      </div>
    </div>
  )
}
