import { Database, TrendingDown, Wifi, DollarSign } from 'lucide-react'
import { SimPlan } from '@/data/plans'

interface StatsBarProps {
  filteredPlans: SimPlan[]
  totalPlans: number
}

export function StatsBar({ filteredPlans, totalPlans }: StatsBarProps) {
  const cheapest = filteredPlans.length > 0
    ? Math.min(...filteredPlans.map(p => p.price))
    : 0

  const fiveGCount = filteredPlans.filter(
    p => p.networkType === "5G" || p.networkType === "5G+"
  ).length

  const avgPrice = filteredPlans.length > 0
    ? filteredPlans.reduce((sum, p) => sum + p.price, 0) / filteredPlans.length
    : 0

  const stats = [
    {
      icon: <Database className="w-3.5 h-3.5 text-primary" />,
      label: 'Plans',
      value: filteredPlans.length,
      suffix: `/ ${totalPlans}`,
    },
    {
      icon: <TrendingDown className="w-3.5 h-3.5 text-terminal-green" />,
      label: 'Cheapest',
      value: `$${cheapest.toFixed(2)}`,
      suffix: '/mth',
    },
    {
      icon: <Wifi className="w-3.5 h-3.5 text-terminal-cyan" />,
      label: '5G/5G+',
      value: fiveGCount,
      suffix: '',
    },
    {
      icon: <DollarSign className="w-3.5 h-3.5 text-terminal-amber" />,
      label: 'Avg Price',
      value: `$${avgPrice.toFixed(2)}`,
      suffix: '/mth',
    },
  ]

  return (
    <div className="flex overflow-x-auto gap-3 pb-1 hide-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible" style={{ overscrollBehaviorX: 'contain' }}>
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card min-w-[140px] snap-start shrink-0 lg:min-w-0 lg:shrink">
          <div className="flex items-center gap-2 mb-1">
            {stat.icon}
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-xl font-semibold text-foreground font-mono whitespace-nowrap">
            {stat.value}
            {stat.suffix && (
              <span className="text-xs text-muted-foreground font-normal ml-1">{stat.suffix}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
