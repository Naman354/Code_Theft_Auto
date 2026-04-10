import type { ReactNode } from "react";

type AdminColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type AdminTableProps<T> = {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
};

export function AdminTable<T>({ columns, rows, rowKey, emptyLabel = "No rows." }: AdminTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-black/35 backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,255,0.14)]">
      <div className="md:hidden">
        {rows.length > 0 ? (
          <div className="divide-y divide-zinc-800/80">
            {rows.map((row) => (
              <article key={rowKey(row)} className="space-y-4 px-4 py-4">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4">
                    <div className="max-w-[42%] font-accent text-[10px] uppercase tracking-[0.28em] text-cyan-100/75">
                      {column.header}
                    </div>
                    <div className="min-w-0 flex-1 text-right text-sm uppercase tracking-[0.12em] text-zinc-100">
                      {column.render(row)}
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center font-accent text-xs uppercase tracking-[0.3em] text-zinc-400">
            {emptyLabel}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-cyan-300/20">
          <thead className="bg-cyan-400/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left font-accent text-xs uppercase tracking-[0.24em] text-cyan-100/85 lg:tracking-[0.3em]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={rowKey(row)} className="transition-all duration-300 hover:bg-cyan-400/5">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm uppercase tracking-[0.08em] text-zinc-100 lg:tracking-[0.12em]">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center font-accent text-xs uppercase tracking-[0.3em] text-zinc-400"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
