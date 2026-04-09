/**
 * Public/donor copy keyed only by residentId. Pseudonyms always come from
 * pseudonymForResidentId — safe if headlines/descriptions are edited or rows removed.
 */

import { pseudonymForResidentId } from '@/lib/residentPseudonym'

/** Milestone imagery for Stories of Transformation cards (under `/public`). */
const T = '/images/transformation-stories'

export interface PublicRepresentativeJourneyInput {
  residentId: number
  safehouseId: number
  /** Card photo matched to milestone theme; falls back to safehouse image if omitted. */
  cardImageSrc: string
  /** Optional object-position utility for better focal crop in fixed-height cards. */
  cardImageClassName?: string
  headline: string
  description: string
  longNarrative: string
}

/** Representative stories on the public impact page (display order = array order). */
export const publicRepresentativeJourneys: PublicRepresentativeJourneyInput[] = [
  {
    residentId: 1,
    safehouseId: 1,
    cardImageSrc: `${T}/counseling-milestone.png`,
    cardImageClassName: 'object-[50%_62%]',
    headline: 'Counseling milestone',
    description: 'Finished her counseling cycle; now in maintenance care with stronger wellbeing scores.',
    longNarrative:
      'When she arrived at Lighthouse 1, she struggled to sleep through the night and flinched at sudden sounds. Over eighteen months of weekly counseling sessions, she learned grounding techniques and slowly began to trust the adults around her. Today she sleeps peacefully, has started mentoring younger residents through their first difficult weeks, and dreams of becoming a social worker herself.',
  },
  {
    residentId: 3,
    safehouseId: 2,
    cardImageSrc: `${T}/education-progress.png`,
    cardImageClassName: 'object-[48%_58%]',
    headline: 'Education progress',
    description: 'Strong attendance in equivalency studies—on track for this year’s assessment.',
    longNarrative:
      'She had never spent a full day in a classroom before arriving at Lighthouse 2. The learning center nearby became her second home—she attended every session, asked questions constantly, and finished homework before anyone else. She is now on track to pass her secondary equivalency assessment by year-end and has told staff she wants to study nursing.',
  },
  {
    residentId: 7,
    safehouseId: 3,
    cardImageSrc: `${T}/reintegration-planning.png`,
    cardImageClassName: 'object-[50%_60%]',
    headline: 'Reintegration planning',
    description: 'Reunification assessment underway with supervised visits and her social worker.',
    longNarrative:
      'After two years of separation, she was afraid her family would not recognize her. A social worker at Lighthouse 3 coordinated supervised visits that began with short phone calls and progressed to in-person meetings. Each visit grew easier, and the trust between her and her mother slowly rebuilt. The reunification assessment is now underway, and she is expected to return home within the coming months.',
  },
  {
    residentId: 2,
    safehouseId: 4,
    cardImageSrc: `${T}/health-growth.png`,
    cardImageClassName: 'object-[50%_46%]',
    headline: 'Health stabilization',
    description: 'Nutrition and sleep improved with coordinated medical and house support.',
    longNarrative:
      'She arrived at Lighthouse 4 severely underweight and unable to sleep more than a few hours at a time. The medical team designed a personalized nutrition plan and introduced a calming bedtime routine. Within six months her weight stabilized, her sleep improved to a full eight hours, and she had the energy to join the other girls in daily activities and schoolwork.',
  },
  {
    residentId: 5,
    safehouseId: 5,
    cardImageSrc: `${T}/vocational-sewing.png`,
    cardImageClassName: 'object-[50%_52%]',
    headline: 'Vocational training',
    description: 'Completed sewing and textiles; now mentors younger residents in the workshop.',
    longNarrative:
      'She was quiet and withdrawn when she first joined the sewing workshop at Lighthouse 5, unsure whether she could learn something new. Week by week her confidence grew as she mastered stitching, pattern-cutting, and fabric selection. She completed the full program in five months and now runs a weekly session for younger residents, patiently teaching them the same skills that changed her outlook.',
  },
  {
    residentId: 6,
    safehouseId: 6,
    cardImageSrc: `${T}/art-reflection.png`,
    cardImageClassName: 'object-[50%_60%]',
    headline: 'Art therapy breakthrough',
    description: 'Built confidence in art therapy and shared her work at a community exhibition.',
    longNarrative:
      'For months she would sit in art therapy sessions at Lighthouse 6 without picking up a brush. The therapist never pushed, simply painting alongside her. One afternoon she reached for the colors and did not stop for two hours. Her paintings became a way to express feelings she could not yet say aloud. When her work was selected for a community exhibition, she stood in front of a crowd and spoke about what art means to her—the first time she had addressed strangers since arriving.',
  },
  {
    residentId: 8,
    safehouseId: 7,
    cardImageSrc: `${T}/achievement-certificate.png`,
    cardImageClassName: 'object-[50%_42%]',
    headline: 'Literacy achievement',
    description: 'Went from basic literacy to reading on her own in eight months.',
    longNarrative:
      'She could recognize a handful of letters when she arrived at Lighthouse 7 at age twelve. Daily reading sessions with a patient tutor started with picture books and graduated to short chapter stories. Within eight months she was reading independently, checking books out from the small safehouse library every week. She recently wrote her first letter—addressed to her tutor—thanking her for "opening the door to every story in the world."',
  },
  {
    residentId: 9,
    safehouseId: 8,
    cardImageSrc: `${T}/community-leadership.png`,
    cardImageClassName: 'object-[50%_54%]',
    headline: 'Community leadership',
    description: 'Chosen as a peer mentor to help new residents settle in.',
    longNarrative:
      'When she first came to Lighthouse 8 she barely spoke to anyone. Over time she found her voice through the community leadership program, learning how to listen, mediate small disagreements, and support others. Staff selected her as a peer mentor—the first person new residents meet when they walk through the door. She takes the role seriously, remembering how alone she once felt and making sure no one else has to feel that way.',
  },
  {
    residentId: 10,
    safehouseId: 9,
    cardImageSrc: `${T}/independent-living-prep.png`,
    cardImageClassName: 'object-[50%_62%]',
    headline: 'Independent living preparation',
    description: 'Training in budgeting, cooking, and job readiness for life after the safehouse.',
    longNarrative:
      'As one of the oldest residents at Lighthouse 9, she knew that life after the safehouse was approaching. The independent living program taught her how to budget a weekly allowance, cook simple nutritious meals, and prepare for job interviews. She practiced mock interviews with staff until her nerves gave way to confidence. She is now preparing to transition into a supervised apartment and has already secured a part-time position at a local business.',
  },
]

/**
 * Resident ids highlighted for donors (order preserved). Add/remove ids here; labels and
 * fallback copy stay consistent via getPublicResidentStory.
 */
export const donorSpotlightResidentIds: readonly number[] = [1, 3, 7]

const DEFAULT_HEADLINE = 'Care participant'
const DEFAULT_DESCRIPTION =
  'Your support funds shelter, education, counseling, and reintegration planning.'
const DEFAULT_LONG_NARRATIVE =
  'Every girl who enters a Lunas safehouse receives individualized care, access to education, and a path toward healing and independence. Your support makes that journey possible.'

const journeyByResidentId = new Map<number, PublicRepresentativeJourneyInput>()
for (const row of publicRepresentativeJourneys) {
  journeyByResidentId.set(row.residentId, row)
}

export interface PublicResidentStory {
  residentId: number
  safehouseId?: number
  cardImageSrc?: string
  cardImageClassName?: string
  pseudonym: string
  headline: string
  description: string
  longNarrative: string
}

/** Resolve display fields for any resident id (used by impact + donor). */
export function getPublicResidentStory(residentId: number): PublicResidentStory {
  const journey = journeyByResidentId.get(residentId)
  return {
    residentId,
    safehouseId: journey?.safehouseId,
    cardImageSrc: journey?.cardImageSrc,
    cardImageClassName: journey?.cardImageClassName,
    pseudonym: pseudonymForResidentId(residentId),
    headline: journey?.headline ?? DEFAULT_HEADLINE,
    description: journey?.description ?? DEFAULT_DESCRIPTION,
    longNarrative: journey?.longNarrative ?? DEFAULT_LONG_NARRATIVE,
  }
}

/** Stories for the public impact dashboard — follows publicRepresentativeJourneys order. */
export function listPublicImpactJourneyStories(): PublicResidentStory[] {
  return publicRepresentativeJourneys.map((j) => getPublicResidentStory(j.residentId))
}

/** Rows for donor spotlight — follows donorSpotlightResidentIds. */
export function listDonorSpotlightStories(): PublicResidentStory[] {
  return donorSpotlightResidentIds.map((id) => getPublicResidentStory(id))
}

/** Get stories for a specific safehouse. */
export function getStoriesBySafehouseId(safehouseId: number): PublicResidentStory[] {
  return publicRepresentativeJourneys
    .filter((j) => j.safehouseId === safehouseId)
    .map((j) => getPublicResidentStory(j.residentId))
}
