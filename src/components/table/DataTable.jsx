import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import Spinner from '../ui/Spinner';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Table from the reference design: "Show N entries", search, sortable headers,
 * "Showing x to y of z entries" and First / Previous / Next / Last.
 *
 * columns: [{ key, header, render?(row), sortValue?(row), sortable?, className? }]
 * searchText(row) → string that the search box matches against.
 * toolbar: extra controls rendered next to the search box (e.g. filters).
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  searchText,
  initialPageSize = 25,
  initialSort,
  loading = false,
  emptyText = 'No data available in table',
  toolbar,
}) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort ?? null); // { key, dir: 'asc' | 'desc' }
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const get = col.sortValue ?? ((r) => r[col.key]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-muted">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-text focus:border-primary focus:outline-none"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {toolbar}
          {searchText && (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                aria-label="Search"
                placeholder="Search…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 pr-3 pl-9 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none sm:w-64"
              />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2/60 text-xs tracking-wide text-muted uppercase">
            <tr>
              {columns.map((col) => {
                const sortable = col.sortable !== false && !!col.header;
                const active = sort?.key === col.key;
                const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 font-semibold ${col.className ?? ''}`}
                    aria-sort={
                      active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 uppercase hover:text-text"
                      >
                        {col.header}
                        <Icon className={`size-3.5 ${active ? 'text-accent' : 'opacity-40'}`} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-muted">
                  {query ? 'No matching records found' : emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-surface-2/40">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-4 align-middle ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {sorted.length ? start + 1 : 0} to {Math.min(start + pageSize, sorted.length)} of{' '}
          {sorted.length} entries
          {query && rows.length !== sorted.length && ` (filtered from ${rows.length} total)`}
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <PageButton disabled={current === 0} onClick={() => setPage(0)}>
            First
          </PageButton>
          <PageButton disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </PageButton>
          <span className="px-3 text-text">
            {current + 1} / {pageCount}
          </span>
          <PageButton disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
            Next
          </PageButton>
          <PageButton disabled={current >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>
            Last
          </PageButton>
        </nav>
      </div>
    </div>
  );
}

function PageButton({ children, ...props }) {
  return (
    <button
      className="rounded-md px-3 py-1.5 hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
