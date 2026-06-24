import type { ReactNode, ChangeEvent } from "react";

interface PCFormRowProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export function PCFormRow({ label, required, children }: PCFormRowProps) {
  return (
    <div className="flex items-start border-b border-gray-200 last:border-b-0">
      <div className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </div>
      <div className="flex-1 px-3 py-2">{children}</div>
    </div>
  );
}

interface PCReadonlyInputProps {
  value: string;
}

export function PCReadonlyInput({ value }: PCReadonlyInputProps) {
  return (
    <input
      value={value}
      readOnly
      className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700 focus:outline-none"
    />
  );
}

interface PCInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}

export function PCInput({ value, onChange, placeholder, type = "text" }: PCInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none"
    />
  );
}

interface PCSelectProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
}

export function PCSelect({ value, onChange, options, placeholder }: PCSelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none"
    >
      <option value="">{placeholder ?? "-Select-"}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

interface PCTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

export function PCTextarea({ value, onChange, rows = 4 }: PCTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none"
    />
  );
}

interface PCSaveButtonProps {
  onClick: () => void;
  label?: string;
}

export function PCSaveButton({ onClick, label = "Save" }: PCSaveButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800"
    >
      {label}
    </button>
  );
}
