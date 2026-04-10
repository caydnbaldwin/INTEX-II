import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { FormEvent } from 'react'

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
  const [showSentMessage, setShowSentMessage] = useState(false)

  function handleMessageSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.currentTarget.reset()
    setShowSentMessage(true)
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <section className="text-center border-b border-border pb-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Lunas</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Donations, volunteering, referrals, or questions—we&apos;re here to help.
          </p>
        </section>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,400px)] lg:items-start lg:gap-16">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Send us a message</h2>
            <form
              onSubmit={handleMessageSubmit}
              className="mt-6 rounded-xl border border-border bg-card p-7 sm:p-10 space-y-6"
            >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First name</label>
                <input id="firstName" type="text" placeholder="First name" className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last name</label>
                <input id="lastName" type="text" placeholder="Last name" className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email address</label>
                <input id="email" type="email" placeholder="you@example.com" className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
                <input id="phone" type="tel" placeholder="+1 (___) ___-____" className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-muted-foreground">I&apos;m reaching out about</label>
              <select id="topic" className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring">
                <option>Making a donation</option>
                <option>Volunteering or contributing skills</option>
                <option>Referring a child in need</option>
                <option>Partnership or organizational inquiry</option>
                <option>Media or press inquiry</option>
                <option>General question</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-muted-foreground">Message</label>
              <textarea id="message" placeholder="How can we help?" className="min-h-32 w-full rounded-md border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              We typically respond within 2 business days.
            </p>
            {showSentMessage && (
              <p className="text-base text-emerald-700 dark:text-emerald-400">
                Your message was sent.
              </p>
            )}
            <Button type="submit" size="lg">Send message</Button>
            </form>
          </section>

          <aside className="lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Leadership &amp; team</h2>
            <div className="mt-6 flex flex-col gap-4">
              {teamMembers.map((member) => (
                <article
                  key={member.email}
                  className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border">
                    <img
                      src={member.photoSrc}
                      alt=""
                      className={`h-full w-full object-cover ${member.photoClassName ?? 'object-center'}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground leading-snug">{member.title}</p>
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-1.5 block truncate text-sm text-primary hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-16 border-t border-border pt-14">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Organization contact</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">United States (HQ)</p>
              <div className="mt-5 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Phone</p>
                <p className="text-base text-foreground">(801) 831-3323</p>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Email</p>
                <a href="mailto:info@lunassafehaven.org" className="text-base text-primary hover:underline">
                  info@lunassafehaven.org
                </a>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Mailing address</p>
                <p className="text-base text-foreground leading-relaxed">P.O. Box 4812<br />Provo, UT 84601</p>
              </div>
            </article>

            <article className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Philippines (Operations)</p>
              <div className="mt-5 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Phone</p>
                <p className="text-base text-foreground">+63 2 8531-0000</p>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Email</p>
                <a href="mailto:ph@lunassafehaven.org" className="text-base text-primary hover:underline">
                  ph@lunassafehaven.org
                </a>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Operations office</p>
                <p className="text-base text-foreground leading-relaxed">Unit 4B, Quezon City<br />Metro Manila, Philippines</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
