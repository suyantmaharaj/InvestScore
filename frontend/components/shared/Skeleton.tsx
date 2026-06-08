export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-3 ${className}`}
      style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}
    >
      <SkeletonLine w="w-1/3" h="h-3" />
      <SkeletonLine w="w-full" h="h-8" />
      <SkeletonLine w="w-2/3" h="h-3" />
    </div>
  );
}

export function SkeletonSDGGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
      {Array.from({ length: 17 }).map((_, i) => (
        <div key={i} className="skeleton rounded-[10px] h-24" />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-7" style={{ opacity: 1 }}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonLine w="w-48" h="h-6" />
          <SkeletonLine w="w-32" h="h-4" />
        </div>
        <SkeletonLine w="w-20" h="h-6" />
      </div>
      <SkeletonCard className="h-36" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
      </div>
      <SkeletonSDGGrid />
    </div>
  );
}

export function SkeletonScorecard() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <SkeletonLine w="w-40" h="h-6" />
          <SkeletonLine w="w-64" h="h-4" />
        </div>
        <div className="skeleton w-14 h-14 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonBenchmark() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between">
        <SkeletonLine w="w-48" h="h-7" />
        <SkeletonLine w="w-24" h="h-6" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-32" />)}
      </div>
      <SkeletonCard className="h-96" />
    </div>
  );
}
