import { SlidersHorizontal } from 'lucide-react'

interface FilterFABProps {
  onClick: () => void
  activeFilterCount: number
}

export function FilterFAB({ onClick, activeFilterCount }: FilterFABProps) {
  return (
    <button
      className="filter-fab lg:hidden"
      onClick={onClick}
      aria-label="Open filters"
    >
      <SlidersHorizontal className="w-5 h-5" />
      {activeFilterCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full animate-fade-in"
          style={{
            background: 'hsl(var(--destructive))',
            color: 'hsl(var(--destructive-foreground))',
          }}
        >
          {activeFilterCount}
        </span>
      )}
    </button>
  )
}
