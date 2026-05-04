/**
 * PageSkeleton — agency-grade shimmer skeleton screens for every app page.
 *
 * Usage:
 *   import { DashboardSkeleton } from '../components/ui/PageSkeleton'
 *   if (isLoading) return <DashboardSkeleton />
 */

import { Skeleton } from './skeleton'
import { cn } from '@/utils/utils'

/* ─── local primitive helpers ───────────────────────────── */

function SkeletonLine({ className, style, ...props }) {
    return (
        <Skeleton
            className={cn('h-4 rounded-lg', className)}
            style={style}
            {...props}
        />
    )
}

function SkeletonCard({ className, children, style, ...props }) {
    return (
        <div
            className={cn(
                'rounded-2xl border p-5',
                'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
                className,
            )}
            style={style}
            {...props}
        >
            {children}
        </div>
    )
}

/* ─── shared primitives ─────────────────────────────────── */

function PageShell({ children }) {
    return (
        <div
            className="min-h-screen w-full p-6 space-y-6 animate-fade-in"
            style={{ background: 'var(--bg-base)' }}
        >
            {children}
        </div>
    )
}

function PageHeaderSkel({ wide = false }) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <SkeletonLine className={wide ? 'w-56' : 'w-40'} style={{ height: '22px' }} />
                <SkeletonLine className="w-64" style={{ height: '14px', opacity: 0.6 }} />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
        </div>
    )
}

function MetricCardSkel() {
    return (
        <SkeletonCard className="space-y-3">
            <div className="flex items-center justify-between">
                <SkeletonLine className="w-28" style={{ height: '13px' }} />
                <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <SkeletonLine className="w-36" style={{ height: '28px' }} />
            <SkeletonLine className="w-20" style={{ height: '12px', opacity: 0.5 }} />
        </SkeletonCard>
    )
}

function ChartSkel({ height = 200 }) {
    return (
        <SkeletonCard className="space-y-4">
            <div className="flex items-center justify-between">
                <SkeletonLine className="w-32" style={{ height: '15px' }} />
                <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="rounded-xl w-full" style={{ height }} />
        </SkeletonCard>
    )
}

function TableRowSkel({ cols = 5 }) {
    return (
        <div className="flex items-center gap-4 py-3 px-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonLine
                    key={i}
                    style={{ height: '13px', flex: i === 0 ? '2' : '1', opacity: i > 2 ? 0.5 : 0.9 }}
                />
            ))}
        </div>
    )
}

function TableSkel({ rows = 6, cols = 5 }) {
    return (
        <SkeletonCard className="space-y-0 p-0 overflow-hidden">
            {/* header row */}
            <div className="flex items-center gap-4 py-3 px-5 border-b" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <SkeletonLine key={i} style={{ height: '11px', flex: i === 0 ? '2' : '1', opacity: 0.5 }} />
                ))}
            </div>
            <div className="px-5">
                {Array.from({ length: rows }).map((_, i) => <TableRowSkel key={i} cols={cols} />)}
            </div>
        </SkeletonCard>
    )
}

/* ─── Dashboard ─────────────────────────────────────────── */

export function DashboardSkeleton() {
    return (
        <PageShell>
            {/* top bar */}
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <SkeletonLine className="w-48" style={{ height: '22px' }} />
                    <SkeletonLine className="w-72" style={{ height: '13px', opacity: 0.5 }} />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
            </div>

            {/* KPI cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <MetricCardSkel key={i} />)}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <ChartSkel height={220} />
                </div>
                <ChartSkel height={220} />
            </div>

            {/* Bottom grid: table + small chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <TableSkel rows={5} cols={4} />
                </div>
                <SkeletonCard className="space-y-3">
                    <SkeletonLine className="w-32" style={{ height: '14px' }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonLine style={{ height: '12px', width: '80%' }} />
                                <SkeletonLine style={{ height: '11px', width: '50%', opacity: 0.5 }} />
                            </div>
                            <SkeletonLine className="w-12" style={{ height: '13px' }} />
                        </div>
                    ))}
                </SkeletonCard>
            </div>
        </PageShell>
    )
}

/* ─── Accounts ──────────────────────────────────────────── */

export function AccountsSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel wide />

            {/* tab bar */}
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-xl" style={{ opacity: i === 0 ? 1 : 0.5 }} />
                ))}
            </div>

            {/* summary KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <MetricCardSkel key={i} />)}
            </div>

            {/* accounts table */}
            <TableSkel rows={6} cols={5} />
        </PageShell>
    )
}

/* ─── Cost Explorer ─────────────────────────────────────── */

export function CostExplorerSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel wide />

            {/* filter bar */}
            <div className="flex flex-wrap gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 rounded-xl" style={{ width: `${80 + i * 16}px` }} />
                ))}
            </div>

            {/* main chart */}
            <ChartSkel height={280} />

            {/* breakdown cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <MetricCardSkel key={i} />)}
            </div>

            {/* service table */}
            <TableSkel rows={7} cols={5} />
        </PageShell>
    )
}

/* ─── Anomalies / Alerts ────────────────────────────────── */

export function AnomaliesSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel />

            {/* stat chips */}
            <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-28 rounded-full" style={{ opacity: 0.7 }} />
                ))}
            </div>

            {/* alert cards */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <SkeletonLine className="w-40" style={{ height: '14px' }} />
                                <Skeleton className="h-5 w-14 rounded-full" style={{ opacity: 0.6 }} />
                            </div>
                            <SkeletonLine style={{ height: '12px', width: '70%', opacity: 0.5 }} />
                            <SkeletonLine style={{ height: '11px', width: '45%', opacity: 0.4 }} />
                        </div>
                        <Skeleton className="h-7 w-16 rounded-lg shrink-0" style={{ opacity: 0.5 }} />
                    </SkeletonCard>
                ))}
            </div>
        </PageShell>
    )
}

/* ─── Metrics ───────────────────────────────────────────── */

export function MetricsSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel />

            {/* server selector chips */}
            <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-28 rounded-xl" style={{ opacity: i === 0 ? 1 : 0.5 }} />
                ))}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <MetricCardSkel key={i} />)}
            </div>

            {/* charts 2×2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <ChartSkel key={i} height={180} />)}
            </div>
        </PageShell>
    )
}

/* ─── Optimizer ─────────────────────────────────────────── */

export function OptimizerSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel wide />

            {/* summary banner */}
            <SkeletonCard className="flex items-center gap-6">
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <SkeletonLine className="w-48" style={{ height: '16px' }} />
                    <SkeletonLine className="w-72" style={{ height: '13px', opacity: 0.5 }} />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </SkeletonCard>

            {/* tab row */}
            <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 rounded-xl" style={{ width: `${90 + i * 10}px`, opacity: i === 0 ? 1 : 0.5 }} />
                ))}
            </div>

            {/* recommendation cards */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonCard key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <SkeletonLine className="w-52" style={{ height: '14px' }} />
                            <SkeletonLine style={{ height: '12px', width: '65%', opacity: 0.5 }} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <SkeletonLine className="w-20" style={{ height: '16px' }} />
                            <SkeletonLine className="w-12" style={{ height: '11px', opacity: 0.5 }} />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-xl shrink-0" />
                    </SkeletonCard>
                ))}
            </div>
        </PageShell>
    )
}

/* ─── Settings ──────────────────────────────────────────── */

export function SettingsSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel />

            <div className="flex gap-6">
                {/* sidebar tabs */}
                <div className="w-48 shrink-0 space-y-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-xl" style={{ opacity: i === 0 ? 1 : 0.45 }} />
                    ))}
                </div>

                {/* content panel */}
                <div className="flex-1 space-y-5">
                    {/* profile section */}
                    <SkeletonCard className="space-y-5">
                        <SkeletonLine className="w-32" style={{ height: '15px' }} />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <SkeletonLine className="w-40" style={{ height: '14px' }} />
                                <SkeletonLine className="w-56" style={{ height: '12px', opacity: 0.5 }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <SkeletonLine className="w-20" style={{ height: '11px', opacity: 0.5 }} />
                                    <Skeleton className="h-10 w-full rounded-xl" style={{ opacity: 0.6 }} />
                                </div>
                            ))}
                        </div>
                    </SkeletonCard>

                    {/* second section */}
                    <SkeletonCard className="space-y-4">
                        <SkeletonLine className="w-40" style={{ height: '14px' }} />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <SkeletonLine className="w-36" style={{ height: '13px' }} />
                                    <SkeletonLine className="w-52" style={{ height: '11px', opacity: 0.5 }} />
                                </div>
                                <Skeleton className="h-6 w-10 rounded-full shrink-0" />
                            </div>
                        ))}
                    </SkeletonCard>
                </div>
            </div>
        </PageShell>
    )
}

/* ─── Teams ─────────────────────────────────────────────── */

export function TeamsSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel />

            {/* budget summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <MetricCardSkel key={i} />)}
            </div>

            {/* team cards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonLine className="w-32" style={{ height: '14px' }} />
                                <SkeletonLine className="w-20" style={{ height: '11px', opacity: 0.5 }} />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" style={{ opacity: 0.6 }} />
                        </div>
                        {/* budget bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <SkeletonLine className="w-16" style={{ height: '11px', opacity: 0.5 }} />
                                <SkeletonLine className="w-12" style={{ height: '11px', opacity: 0.5 }} />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" style={{ opacity: 0.4 }} />
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <Skeleton key={j} className="h-6 w-6 rounded-full" style={{ opacity: 0.6, marginLeft: j > 0 ? '-6px' : 0 }} />
                            ))}
                            <SkeletonLine className="w-20 ml-2" style={{ height: '12px', opacity: 0.5 }} />
                        </div>
                    </SkeletonCard>
                ))}
            </div>
        </PageShell>
    )
}

/* ─── Reports ───────────────────────────────────────────── */

export function ReportsSkeleton() {
    return (
        <PageShell>
            <PageHeaderSkel />

            {/* report type cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} className="space-y-4 flex flex-col">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <SkeletonLine className="w-40" style={{ height: '14px' }} />
                                <SkeletonLine style={{ height: '11px', opacity: 0.5 }} />
                                <SkeletonLine style={{ height: '11px', width: '75%', opacity: 0.4 }} />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full rounded-xl mt-auto" style={{ opacity: 0.7 }} />
                    </SkeletonCard>
                ))}
            </div>

            {/* report history table */}
            <SkeletonCard className="space-y-3">
                <SkeletonLine className="w-36" style={{ height: '14px' }} />
                <TableSkel rows={5} cols={4} />
            </SkeletonCard>
        </PageShell>
    )
}
