import { ArrowUpDown, ArrowUp, ArrowDown, Globe, ChevronDown, ChevronUp, Smartphone } from 'lucide-react'
import { SimPlan, expandRoamingText, PROVIDER_URLS, isPlanStatusActive } from '@/data/plans'
import { useState, useMemo } from 'react'
import type { SortKey, SortDir } from '@/components/MobileToolbar'

interface PlanTableProps {
  plans: SimPlan[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function StatusBadge({ plan }: { plan: SimPlan }) {
  if (!isPlanStatusActive(plan)) return null
  const isNew = plan.status === 'new'
  return (
    <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm leading-none ml-1.5 ${
      isNew
        ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30'
        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    }`}>
      {isNew ? 'NEW' : 'UPD'}
    </span>
  )
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
  return sortDir === 'asc'
    ? <ArrowUp className="w-3 h-3 text-primary" />
    : <ArrowDown className="w-3 h-3 text-primary" />
}

export function PlanTable({ plans, sortKey, sortDir, onSort }: PlanTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => {
      let aVal: string | number = a[sortKey]
      let bVal: string | number = b[sortKey]

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [plans, sortKey, sortDir])

  const headerClass = "px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"

  return (
    <div className="border border-border rounded bg-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className={headerClass} onClick={() => onSort('provider')} scope="col" aria-sort={sortKey === 'provider' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Provider <SortIcon column="provider" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className={headerClass} onClick={() => onSort('network')} scope="col" aria-sort={sortKey === 'network' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Network <SortIcon column="network" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className={headerClass} onClick={() => onSort('planName')} scope="col" aria-sort={sortKey === 'planName' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Plan <SortIcon column="planName" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className={headerClass} onClick={() => onSort('dataSortValue')} scope="col" aria-sort={sortKey === 'dataSortValue' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Data <SortIcon column="dataSortValue" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className={headerClass} onClick={() => onSort('networkType')} scope="col" aria-sort={sortKey === 'networkType' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Type <SortIcon column="networkType" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground" scope="col">Calls</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground" scope="col">SMS</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground" scope="col">
                <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> Roaming</div>
              </th>
              <th className={headerClass} onClick={() => onSort('price')} scope="col" aria-sort={sortKey === 'price' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1">Price <SortIcon column="price" sortKey={sortKey} sortDir={sortDir} /></div>
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground" scope="col">
                <div className="flex items-center justify-center gap-1"><Smartphone className="w-3 h-3" /> eSIM</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((plan) => {
              const roamingExpanded = expandRoamingText(plan.roaming)
              return (
                <tr
                  key={plan.id}
                  className="table-row-hover border-b border-border/50 last:border-0 align-top"
                >
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                    {PROVIDER_URLS[plan.provider] ? (
                      <a href={PROVIDER_URLS[plan.provider]} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-primary/30 hover:decoration-primary">{plan.provider}</a>
                    ) : plan.provider}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{plan.network}</td>
                  <td className="px-3 py-2.5 text-foreground">
                    <div className="flex items-center">
                      {plan.planName}
                      <StatusBadge plan={plan} />
                    </div>
                    {plan.notes && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px]">
                        {plan.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{plan.data}</td>
                  <td className="px-3 py-2.5">
                    <span className={plan.networkType === '4G' ? 'badge-4g' : 'badge-5g'}>
                      {plan.networkType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{plan.callMinutes}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{plan.sms}</td>
                  <td className="px-3 py-2.5 text-muted-foreground min-w-[280px]">
                    {roamingExpanded === '-' ? (
                      <span className="text-xs text-muted-foreground/50">-</span>
                    ) : (
                      <ul className="text-xs space-y-0.5 list-none">
                        {roamingExpanded.split('; ').map((part, i) => (
                          <li key={i} className="leading-tight">{part}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-terminal-green whitespace-nowrap">
                    ${plan.price.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">/mth</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {plan.esim ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-terminal-green/15 text-terminal-green">Yes</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">No</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {sorted.map((plan) => {
          const roamingExpanded = expandRoamingText(plan.roaming)
          return (
            <div
              key={plan.id}
              className="table-row-hover"
              style={{ borderLeft: '3px solid hsl(var(--primary) / 0.3)' }}
            >
              {/* Card header: price + provider + data */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {PROVIDER_URLS[plan.provider] ? (
                        <a href={PROVIDER_URLS[plan.provider]} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground text-sm hover:text-primary transition-colors">{plan.provider}</a>
                      ) : (
                        <span className="font-medium text-foreground text-sm">{plan.provider}</span>
                      )}
                      <span className="text-xs text-muted-foreground">({plan.network})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
                      {plan.planName}
                      <StatusBadge plan={plan} />
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-semibold text-lg text-terminal-green leading-tight">
                      ${plan.price.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">/mth</span>
                  </div>
                </div>

                {/* Key specs row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{plan.data}</span>
                  <span className={plan.networkType === '4G' ? 'badge-4g' : 'badge-5g'}>
                    {plan.networkType}
                  </span>
                  {plan.esim && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-terminal-green/15 text-terminal-green">eSIM</span>
                  )}
                </div>
              </div>

              {/* Expandable details */}
              {expandedRow === plan.id ? (
                <div className="px-3 pb-3 animate-fade-in">
                  <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Calls</span>
                        <span className="text-foreground">{plan.callMinutes}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">SMS</span>
                        <span className="text-foreground">{plan.sms}</span>
                      </div>
                    </div>
                    {roamingExpanded && roamingExpanded !== '-' && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Roaming</span>
                        <ul className="text-foreground list-none space-y-0.5">
                          {roamingExpanded.split('; ').map((part, i) => (
                            <li key={i} className="leading-tight">{part}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.notes && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Notes</span>
                        <span className="text-foreground">{plan.notes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedRow(null)}
                    className="flex items-center gap-1 text-primary text-xs mt-2"
                  >
                    <ChevronUp className="w-3 h-3" />
                    Less
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setExpandedRow(plan.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-3 pb-2.5 transition-colors w-full"
                >
                  <ChevronDown className="w-3 h-3" />
                  Calls, SMS, Roaming
                </button>
              )}
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-muted-foreground text-sm">No plans match your filters.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  )
}
