interface FiltersProps {
  search: string
  status: string
  source: string
  showSourceFilter: boolean
  onSearchChange: (v: string) => void
  onStatusChange: (v: string) => void
  onSourceChange: (v: string) => void
}

export function Filters({
  search,
  status,
  source,
  showSourceFilter,
  onSearchChange,
  onStatusChange,
  onSourceChange,
}: FiltersProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Search name or phone…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="SUCCESS">Success</option>
        <option value="FAILED">Failed</option>
        <option value="PENDING">Pending</option>
      </select>
      {showSourceFilter && (
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          <option value="housing">Housing</option>
          <option value="magicbricks">MagicBricks</option>
        </select>
      )}
    </div>
  )
}
