export interface HousingCredentials {
  profileId: string
  encryptionKey: string
}

export function getHousingCredentials(): HousingCredentials | null {
  const profileId = process.env.HOUSING_PROFILE_ID?.trim()
  const encryptionKey = process.env.HOUSING_ENCRYPTION_KEY?.trim()
  if (!profileId || !encryptionKey) return null
  return { profileId, encryptionKey }
}

export function isHousingConfigured(): boolean {
  return getHousingCredentials() !== null
}

/** Official builder pull path from Housing CRM snippet. */
export const HOUSING_PULL_URL_BUILDER =
  'https://pahal.housing.com/api/v0/get-builder-leads'

/** Official broker pull path from Housing CRM snippet. */
export const HOUSING_PULL_URL_BROKER =
  'https://pahal.housing.com/api/v0/get-broker-leads'

export function getHousingPullUrls(): string[] {
  const custom = process.env.HOUSING_PULL_API_URL?.trim()
  if (custom) return [custom]
  return [HOUSING_PULL_URL_BUILDER, HOUSING_PULL_URL_BROKER]
}
