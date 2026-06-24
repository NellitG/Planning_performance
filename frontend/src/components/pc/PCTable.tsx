import type { PCTableColumn } from "@/utils/types";

interface PCTableProps {
  columns: PCTableColumn[];
  data: Record<string, unknown>[];
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
}

export function PCTable({ columns, data, onDelete, onEdit }: PCTableProps) {
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-emerald-800"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-400">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map((col) => {
                  if (col.key === "##") {
                    return <td key="##" className="px-3 py-2 text-gray-600">{i + 1}</td>;
                  }
                  if (col.key === "execute" || col.key === "delete") {
                    return (
                      <td key={col.key} className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {onEdit && col.key === "execute" && (
                            <button
                              onClick={() => onEdit(i)}
                              className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                              title="Edit"
                            >
                              ✎
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(i)}
                              className="text-lg font-bold text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className={`px-3 py-2 ${col.link ? "text-blue-700" : "text-gray-700"}`}>
                      {(row[col.key] as string) ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
