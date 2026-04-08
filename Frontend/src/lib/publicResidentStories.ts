/**
 * Public/donor copy keyed only by residentId. Pseudonyms always come from
 * pseudonymForResidentId — safe if headlines/descriptions are edited or rows removed.
 */

import { pseudonymForResidentId } from '@/lib/residentPseudonym'

export interface PublicRepresentativeJourneyInput {
  residentId: number
  headline: string
  description: string
}

/** Representative stories on the public impact page (display order = array order). */
export const publicRepresentativeJourneys: PublicRepresentativeJourneyInput[] = [
  {
    residentId: 1,
    headline: 'Counseling milestone',
    description:
      'Completed a structured trauma-informed counseling cycle and transitioned to maintenance sessions with improved wellbeing scores.',
  },
  {
    residentId: 3,
    headline: 'Education progress',
    description:
      'Enrolled in secondary equivalency studies with strong attendance; on track for end-of-year assessment.',
  },
  {
    residentId: 7,
    headline: 'Reintegration planning',
    description:
      'Family reunification assessment in progress with supervised visitation and social worker coordination.',
  },
  {
    residentId: 2,
    headline: 'Health stabilization',
    description:
      'Nutrition and sleep metrics improved under coordinated medical and residential care.',
  },
]

/**
 * Resident ids highlighted for donors (order preserved). Add/remove ids here; labels and
 * fallback copy stay consistent via getPublicResidentStory.
 */
export const donorSpotlightResidentIds: readonly number[] = [1, 3, 7]

const DEFAULT_HEADLINE = 'Care participant'
const DEFAULT_DESCRIPTION =
  'Your support helps provide shelter, education, trauma-informed counseling, and reintegration planning.'

const journeyByResidentId = new Map<number, PublicRepresentativeJourneyInput>()
for (const row of publicRepresentativeJourneys) {
  journeyByResidentId.set(row.residentId, row)
}

export interface PublicResidentStory {
  residentId: number
  pseudonym: string
  headline: string
  description: string
}

/** Resolve display fields for any resident id (used by impact + donor). */
export function getPublicResidentStory(residentId: number): PublicResidentStory {
  const journey = journeyByResidentId.get(residentId)
  return {
    residentId,
    pseudonym: pseudonymForResidentId(residentId),
    headline: journey?.headline ?? DEFAULT_HEADLINE,
    description: journey?.description ?? DEFAULT_DESCRIPTION,
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
