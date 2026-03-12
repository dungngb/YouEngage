export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-48 animate-pulse rounded-card bg-gray-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-card bg-gray-200" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="card p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-card bg-surface-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
