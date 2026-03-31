import { providers, networks, networkTypes, allRoamingCountries, COUNTRY_MAP } from '@/data/plans'
import type { Filters } from '@/components/FilterPanel'

interface FilterContentProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function FilterContent({ filters, onFiltersChange }: FilterContentProps) {
  const toggleArrayFilter = (
    key: 'providers' | 'networks' | 'networkTypes' | 'roamingCountries',
    value: string
  ) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFiltersChange({ ...filters, [key]: next })
  }

  return (
    <div className="space-y-5">
      {/* Provider */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Provider</label>
        <div className="flex flex-wrap gap-1.5">
          {providers.map(p => (
            <button
              key={p}
              onClick={() => toggleArrayFilter('providers', p)}
              aria-pressed={filters.providers.includes(p)}
              className={`filter-chip ${filters.providers.includes(p) ? 'filter-chip-active' : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Network */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Parent Network</label>
        <div className="flex flex-wrap gap-1.5">
          {networks.map(n => (
            <button
              key={n}
              onClick={() => toggleArrayFilter('networks', n)}
              aria-pressed={filters.networks.includes(n)}
              className={`filter-chip ${filters.networks.includes(n) ? 'filter-chip-active' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Network Type */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Network Type</label>
        <div className="flex flex-wrap gap-1.5">
          {networkTypes.map(t => (
            <button
              key={t}
              onClick={() => toggleArrayFilter('networkTypes', t)}
              aria-pressed={filters.networkTypes.includes(t)}
              className={`filter-chip ${filters.networkTypes.includes(t) ? 'filter-chip-active' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range (SG$) - compact inline */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Price Range (SG$/mth)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={filters.priceRange[0]}
            onChange={(e) => {
              const val = Math.max(0, Math.min(Number(e.target.value), filters.priceRange[1]))
              onFiltersChange({ ...filters, priceRange: [val, filters.priceRange[1]] })
            }}
            className="input-terminal w-16 text-center !py-1 text-xs"
          />
          <span className="text-xs text-muted-foreground">-</span>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.priceRange[1]}
            onChange={(e) => {
              const val = Math.max(filters.priceRange[0], Math.min(Number(e.target.value), 100))
              onFiltersChange({ ...filters, priceRange: [filters.priceRange[0], val] })
            }}
            className="input-terminal w-16 text-center !py-1 text-xs"
          />
        </div>
      </div>

      {/* Roaming Countries */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          Roaming Countries
          {filters.roamingCountries.length > 0 && (
            <span className="text-primary ml-1">({filters.roamingCountries.length})</span>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {allRoamingCountries.map(code => (
            <button
              key={code}
              onClick={() => toggleArrayFilter('roamingCountries', code)}
              aria-pressed={filters.roamingCountries.includes(code)}
              className={`filter-chip ${filters.roamingCountries.includes(code) ? 'filter-chip-active' : ''}`}
            >
              {COUNTRY_MAP[code] || code}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
