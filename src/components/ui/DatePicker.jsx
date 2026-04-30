import * as React from "react";
import { format, parse } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function DatePicker({ value, onChange, minDate, maxDate, placeholder = "Select date", className = "" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-medium shadow-depth-1 focus-visible:border-[var(--accent-primary)] focus-visible:ring-4 focus-visible:ring-[var(--accent-primary-subtle)] outline-none min-w-[120px]"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pick date"
      >
        <span>{value ? format(typeof value === "string" ? parse(value, "yyyy-MM-dd", new Date()) : value, "dd-MM-yyyy") : placeholder}</span>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 left-0 bg-[var(--bg-surface)] rounded-xl shadow-depth-3 border border-[var(--border-default)] p-2 animate-fade-in">
          <DayPicker
            mode="single"
            selected={value ? (typeof value === "string" ? parse(value, "yyyy-MM-dd", new Date()) : value) : undefined}
            onSelect={(date) => { setOpen(false); onChange && onChange(date); }}
            fromDate={minDate}
            toDate={maxDate}
            showOutsideDays
            modifiersClassNames={{ selected: "!bg-[var(--accent-primary)] !text-white" }}
            className="!bg-transparent"
            classNames={{
              months: "flex flex-col sm:flex-row gap-4",
              month: "space-y-4",
              caption: "flex justify-between items-center mb-2 px-2",
              table: "w-full border-collapse",
              head_row: "flex",
              row: "flex",
              cell: "w-8 h-8 p-0 text-center text-sm rounded-lg cursor-pointer select-none transition-colors hover:bg-[var(--bg-hover)]",
              day_selected: "!bg-[var(--accent-primary)] !text-white",
              day_today: "border border-[var(--accent-primary)]",
              day_outside: "text-[var(--text-muted)]",
              nav_button: "rounded-md p-1.5 hover:bg-[var(--bg-hover)]",
              footer: "flex justify-between items-center mt-2 px-2 text-xs text-[var(--text-muted)]",
            }}
            footer={<div className="flex w-full justify-between"><button className="underline" onClick={() => { onChange && onChange(undefined); setOpen(false); }}>Clear</button><button className="underline" onClick={() => { onChange && onChange(new Date()); setOpen(false); }}>Today</button></div>}
          />
        </div>
      )}
    </div>
  );
}
