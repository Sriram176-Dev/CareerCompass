export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded bg-muted mb-2" />
      <div className="h-3 w-full rounded bg-muted mb-1" />
      <div className="h-3 w-2/3 rounded bg-muted mb-3" />
      <div className="h-1.5 w-full rounded-full bg-muted mb-3" />
      <div className="flex gap-1">
        <div className="h-5 w-14 rounded-full bg-muted" />
        <div className="h-5 w-14 rounded-full bg-muted" />
        <div className="h-5 w-14 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonRoadmap() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-72 rounded bg-muted" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div>
              <div className="h-5 w-40 rounded bg-muted mb-1" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
          {[1, 2, 3].map(j => (
            <div key={j} className="ml-6 mb-3 flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-xl p-4 ${i % 2 === 0 ? 'bg-primary/20 w-2/3' : 'bg-card border border-border w-3/4'}`}>
            <div className="h-3 w-full rounded bg-muted mb-2" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFlashcard() {
  return (
    <div className="animate-pulse">
      <div className="h-64 rounded-xl border border-border bg-card flex items-center justify-center">
        <div className="space-y-3 w-3/4">
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-2/3 rounded bg-muted mx-auto" />
          <div className="h-3 w-1/3 rounded bg-muted mx-auto mt-6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDocument() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-24 rounded bg-muted mb-3" />
        <div className="h-3 w-full rounded bg-muted mb-2" />
        <div className="h-3 w-full rounded bg-muted mb-2" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-28 rounded bg-muted mb-3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2 mb-2">
            <div className="h-5 w-14 rounded-full bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div>
          <div className="h-6 w-40 rounded bg-muted mb-2" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-16 rounded bg-muted mb-2" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
