export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-5 py-12 sm:px-8">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-surface-3" />
        <div className="h-9 w-72 rounded bg-surface-3" />
        <div className="h-4 w-96 rounded bg-surface-3" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="size-10 rounded-md bg-surface-3" />
            <div className="mt-5 h-5 w-40 rounded bg-surface-3" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-surface-3" />
              <div className="h-3 w-2/3 rounded bg-surface-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
