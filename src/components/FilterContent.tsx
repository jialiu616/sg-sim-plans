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

      {/* Price Range - dual-handle slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-muted-foreground">Price Range</label>
          <span className="text-xs text-primary font-medium">
            ${filters.priceRange[0]} – ${filters.priceRange[1]}
          </span>
        </div>
        <div className="range-slider">
          <div className="range-slider__track" />
          <div
            className="range-slider__fill"
            style={{
              left: `${filters.priceRange[0]}%`,
              width: `${filters.priceRange[1] - filters.priceRange[0]}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={filters.priceRange[0]}
            onChange={(e) => {
              const val = Math.max(0, Math.min(Number(e.target.value), filters.priceRange[1]))
              onFiltersChange({ ...filters, priceRange: [val, filters.priceRange[1]] })
            }}
            className="range-slider__input"
            style={{ zIndex: filters.priceRange[0] > filters.priceRange[1] - 1 ? 5 : 3 }}
            aria-label="Minimum price"
            aria-valuenow={filters.priceRange[0]}
            aria-valuetext={`$${filters.priceRange[0]}`}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={filters.priceRange[1]}
            onChange={(e) => {
              const val = Math.max(filters.priceRange[0], Math.min(Number(e.target.value), 100))
              onFiltersChange({ ...filters, priceRange: [filters.priceRange[0], val] })
            }}
            className="range-slider__input"
            style={{ zIndex: 4 }}
            aria-label="Maximum price"
            aria-valuenow={filters.priceRange[1]}
            aria-valuetext={`$${filters.priceRange[1]}`}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-muted-foreground">$0</span>
          <span className="text-[10px] text-muted-foreground">$100</span>
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
