export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-shimmer rounded-xl bg-slate-200 ${className}`} />;
}

/** Announces "Loading" to screen readers while skeletons are shown. */
export function Loading({ children, label = "Loading" }) {
  return <div role="status" aria-busy="true" aria-live="polite"><span className="sr-only">{label}…</span>{children}</div>;
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <Loading label="Loading courses">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm">
            <Skeleton className="h-36 rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-1/3" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <Loading>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-surface p-5">
            <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function DetailSkeleton() {
  return (
    <Loading>
      <Skeleton className="mb-6 h-44 w-full rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </Loading>
  );
}

export function ErrorState({ message, onRetry, status }) {
  const notFound = status === 404;
  return (
    <div role="alert" className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
      <p className="text-lg font-semibold">{notFound ? "We could not find that" : "Something went wrong"}</p>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {onRetry && !notFound && (
        <button onClick={onRetry} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Try again</button>
      )}
    </div>
  );
}
