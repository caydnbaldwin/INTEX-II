/**
 * Pseudonyms for public and donor-facing UI only. Staff/admin pages should use real names.
 */

const FLOWER_NAMES = [
  'Rose',
  'Lily',
  'Daisy',
  'Tulip',
  'Violet',
  'Jasmine',
  'Iris',
  'Peony',
  'Poppy',
  'Dahlia',
  'Marigold',
  'Lavender',
  'Sunflower',
  'Zinnia',
  'Begonia',
  'Petunia',
  'Aster',
  'Crocus',
  'Lotus',
  'Orchid',
  'Gardenia',
  'Azalea',
  'Magnolia',
  'Carnation',
  'Foxglove',
  'Snapdragon',
  'Heather',
  'Primrose',
  'Cosmos',
  'Geranium',
  'Wisteria',
  'Lilac',
] as const

function fnv1a32(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Stable label from a numeric resident id, e.g. Dahlia-17. */
export function pseudonymForResidentId(residentId: number): string {
  if (!Number.isFinite(residentId) || residentId < 0) {
    throw new RangeError('residentId must be a non-negative finite number')
  }
  const id = Math.trunc(residentId)
  const idx = fnv1a32(String(id)) % FLOWER_NAMES.length
  return `${FLOWER_NAMES[idx]}-${id}`
}
