import { FilterContent } from '@/components/FilterContent'

export interface Filters {
  providers: string[]
  networks: string[]
  networkTypes: string[]
  priceRange: [number, number]
  roamingCountries: string[]
}

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const activeFilterCount =
    filters.providers.length +
    filters.networks.length +
    filters.networkTypes.length +
    filters.roamingCountries.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 20 ? 1 : 0)

  const clearFilters = () => {
    onFiltersChange({
      providers: [],
      networks: [],
      networkTypes: [],
      priceRange: [0, 20],
      roamingCountries: [],
    })
  }

  return (
    <div className="hidden lg:block border border-border rounded bg-card">
      {/* Clear button */}
      {activeFilterCount > 0 && (
        <div className="p-3 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
          >
            Clear all ({activeFilterCount})
          </button>
        </div>
      )}

      {/* Filter controls */}
      <div className={`px-3 pb-3 ${activeFilterCount > 0 ? 'border-t border-border pt-3' : 'pt-3'}`}>
        <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  )
}
