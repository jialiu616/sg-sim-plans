import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react'
import { networkTypes } from '@/data/plans'
import { useState, useRef, useEffect } from 'react'
import type { Filters } from '@/components/FilterPanel'

export type SortKey = 'provider' | 'network' | 'planName' | 'dataSortValue' | 'networkType' | 'price'
export type SortDir = 'asc' | 'desc'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Price' },
  { key: 'dataSortValue', label: 'Data' },
  { key: 'provider', label: 'Provider' },
  { key: 'networkType', label: 'Type' },
]

interface MobileToolbarProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

export function MobileToolbar({ filters, onFiltersChange, sortKey, sortDir, onSort }: MobileToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sortOpen])

  const toggleNetworkType = (value: string) => {
    const current = filters.networkTypes
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFiltersChange({ ...filters, networkTypes: next })
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Sort'

  return (
    <div className="mobile-toolbar lg:hidden">
      <div className="px-4 pt-3 pb-2">
        {/* Quick chips + Sort */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {networkTypes.map(t => (
              <button
                key={t}
                onClick={() => toggleNetworkType(t)}
                aria-pressed={filters.networkTypes.includes(t)}
                className={`filter-chip !py-1 !px-2.5 ${filters.networkTypes.includes(t) ? 'filter-chip-active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'hsl(var(--secondary))' }}
            >
              {sortDir === 'asc'
                ? <ArrowUp className="w-3 h-3" />
                : <ArrowDown className="w-3 h-3" />
              }
              {currentSortLabel}
              <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded border border-border shadow-lg animate-fade-in overflow-hidden"
                style={{ background: 'hsl(var(--popover))' }}
              >
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => {
                      onSort(option.key)
                      setSortOpen(false)
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-accent/20 transition-colors"
                    style={{
                      color: sortKey === option.key
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--foreground))'
                    }}
                  >
                    {option.label}
                    {sortKey === option.key && (
                      sortDir === 'asc'
                        ? <ArrowUp className="w-3 h-3" />
                        : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortKey !== option.key && (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
