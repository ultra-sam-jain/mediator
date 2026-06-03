export interface SourceConfig {
  name: string
  destinationUrl: string | undefined
  active: boolean
}

export const sources: Record<string, SourceConfig> = {
  housing: {
    name: 'Housing.com',
    destinationUrl: process.env.HOUSING_GAS_URL,
    active: true,
  },
  magicbricks: {
    name: 'MagicBricks',
    destinationUrl: process.env.MAGICBRICKS_GAS_URL,
    active: true,
  },
}

export function getSource(key: string | undefined): SourceConfig | null {
  if (!key) return null
  const source = sources[key.toLowerCase()]
  if (!source?.active) return null
  return source
}

export function listActiveSources(): { id: string; name: string }[] {
  return Object.entries(sources)
    .filter(([, cfg]) => cfg.active)
    .map(([id, cfg]) => ({ id, name: cfg.name }))
}
