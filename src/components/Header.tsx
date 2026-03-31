import { Signal, RefreshCw } from 'lucide-react'
import { LAST_UPDATED } from '@/data/plans'

export function Header() {
  return (
    <header className="border-b border-border" style={{ background: 'var(--gradient-header)' }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 sm:py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded border border-border bg-secondary">
              <Signal className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                SG SIM Plans
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Singapore SIM-Only Plan Comparison
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{LAST_UPDATED}</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="hidden sm:inline text-accent-foreground">Weekly refresh</span>
          </div>
        </div>
      </div>
    </header>
  )
}
