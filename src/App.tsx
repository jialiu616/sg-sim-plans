import { useState, useMemo } from 'react'
import { Header } from '@/components/Header'
import { StatsBar } from '@/components/StatsBar'
import { FilterPanel, type Filters } from '@/components/FilterPanel'
import { PlanTable } from '@/components/PlanTable'
import { MobileToolbar, type SortKey, type SortDir } from '@/components/MobileToolbar'
import { FilterFAB } from '@/components/FilterFAB'
import { BottomSheet } from '@/components/BottomSheet'
import { FilterContent } from '@/components/FilterContent'
import { plans, extractRoamingCountries, LAST_UPDATED } from '@/data/plans'

function App() {
  const [filters, setFilters] = useState<Filters>({
    providers: [],
    networks: [],
    networkTypes: [],
    priceRange: [0, 20],
    roamingCountries: [],
  })

  const [sortKey, setSortKey] = useState<SortKey>('price')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const activeFilterCount =
    filters.providers.length +
    filters.networks.length +
    filters.networkTypes.length +
    filters.roamingCountries.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 20 ? 1 : 0)

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      if (filters.providers.length > 0 && !filters.providers.includes(plan.provider)) {
        return false
      }

      if (filters.networks.length > 0 && !filters.networks.includes(plan.network)) {
        return false
      }

      if (filters.networkTypes.length > 0 && !filters.networkTypes.includes(plan.networkType)) {
        return false
      }

      if (plan.price < filters.priceRange[0] || plan.price > filters.priceRange[1]) {
        return false
      }

      if (filters.roamingCountries.length > 0) {
        const planCountries = extractRoamingCountries(plan.roaming)
        const hasAll = filters.roamingCountries.every(c => planCountries.includes(c))
        if (!hasAll) return false
      }

      return true
    })
  }, [filters])

  const clearFilters = () => {
    setFilters({
      providers: [],
      networks: [],
      networkTypes: [],
      priceRange: [0, 20],
      roamingCountries: [],
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle glow effect at top */}
      <div
        className="fixed top-0 left-0 right-0 h-[300px] pointer-events-none z-0"
        style={{ background: 'var(--gradient-glow)' }}
      />

      <div className="relative z-10">
        <Header />

        {/* Mobile toolbar — sticky search + quick chips + sort */}
        <MobileToolbar
          filters={filters}
          onFiltersChange={setFilters}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 lg:py-6 space-y-3 lg:space-y-4 pb-24 lg:pb-6">
          <StatsBar filteredPlans={filteredPlans} totalPlans={plans.length} />

          {/* Desktop-only filter panel */}
          <FilterPanel filters={filters} onFiltersChange={setFilters} />

          <PlanTable
            plans={filteredPlans}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />

          <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
            <p>Data sourced from provider websites and comparison platforms. Prices may vary.</p>
            <p className="mt-1">Last verified: {new Date(LAST_UPDATED + 'T00:00:00').toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </footer>
        </main>
      </div>

      {/* Mobile filter FAB */}
      <FilterFAB
        onClick={() => setIsFilterSheetOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Mobile filter bottom sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filters"
      >
        <FilterContent filters={filters} onFiltersChange={setFilters} />
        {activeFilterCount > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <button
              onClick={clearFilters}
              className="w-full py-2.5 text-xs font-medium rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear all filters ({activeFilterCount})
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

export default App
