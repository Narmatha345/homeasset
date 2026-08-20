import type { ReactNode } from "react";
import clsx from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  mobileCardTitle?: (row: T) => ReactNode;
}

export function Table<T>({ columns, rows, rowKey, onRowClick, mobileCardTitle }: TableProps<T>) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx("transition-colors", onRowClick && "cursor-pointer hover:bg-slate-50")}
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx("px-4 py-3 text-sm text-slate-700 align-middle", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={clsx("p-4 space-y-2", onRowClick && "cursor-pointer active:bg-slate-50")}
          >
            {mobileCardTitle && <div className="font-medium text-slate-900 text-sm">{mobileCardTitle(row)}</div>}
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">{col.header}</span>
                  <span className="text-slate-800 text-right">{col.render(row)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
