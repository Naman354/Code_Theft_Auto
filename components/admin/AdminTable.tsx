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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-cyan-300/20">
          <thead className="bg-cyan-400/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left font-accent text-xs uppercase tracking-[0.3em] text-cyan-100/85"
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
                    <td key={column.key} className="px-4 py-3 text-sm uppercase tracking-[0.12em] text-zinc-100">
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
