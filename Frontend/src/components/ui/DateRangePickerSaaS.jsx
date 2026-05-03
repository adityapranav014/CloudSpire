import { useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const calClassNames = {
  months: "flex gap-6",
  month: "space-y-1",
  month_caption: "flex justify-center relative items-center h-7",
  caption_label: "text-xs font-semibold text-[var(--text-primary)]",
  nav: "absolute inset-x-0 top-0 flex items-center justify-between",
  button_previous: "h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors",
  button_next: "h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors",
  month_grid: "w-full",
  weekdays: "flex",
  weekday: "w-8 h-7 text-[10px] font-medium text-center text-[var(--text-muted)] flex items-center justify-center",
  weeks: "flex flex-col gap-0.5 mt-2",
  week: "flex",
  day: "relative p-0",
  day_button: "h-8 w-8 text-xs flex items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] border-0 cursor-pointer bg-transparent text-[var(--text-primary)] focus:outline-none",
  today: "font-semibold text-[var(--accent-primary)]",
  outside: "opacity-30",
  disabled: "opacity-30 cursor-not-allowed pointer-events-none",
  hidden: "invisible",
  selected: "!bg-[var(--accent-primary)] !text-white hover:!bg-[var(--accent-primary-hover)] rounded-md",
  range_start: "!bg-[var(--accent-primary)] !text-white !rounded-r-none",
  range_end: "!bg-[var(--accent-primary)] !text-white !rounded-l-none",
  range_middle: "!bg-[rgba(59,130,246,0.12)] !text-[var(--accent-primary)] !rounded-none",
};

export default function DateRangePickerSaaS({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(value || { from: undefined, to: undefined });

  const handleSelect = (r) => {
    const next = r || { from: undefined, to: undefined };
    setRange(next);
    onChange?.(next);
  };

  const label = range?.from
    ? range?.to
      ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
      : `${format(range.from, "MMM d, yyyy")} – select end`
    : "Select date range";

  return (
    <Popover open={open} onOpenChange={(v) => setOpen(v)}>
      <PopoverTrigger
        className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all"
        style={{
          minWidth: 210,
          background: 'var(--bg-elevated)',
          borderColor: open ? 'var(--accent-primary)' : 'var(--border-default)',
          color: range?.from ? 'var(--text-primary)' : 'var(--text-muted)',
          outline: open ? '2px solid rgba(59,130,246,0.12)' : 'none',
          outlineOffset: '2px',
        }}
      >
        <CalendarRange size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span className="flex-1 truncate">{label}</span>
        {range?.from && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); handleSelect(undefined); }}
            className="p-0.5 rounded"
          >
            <X size={11} style={{ color: 'var(--text-muted)' }} />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" sideOffset={6}>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          showOutsideDays
          classNames={calClassNames}
          components={{
            Chevron: ({ orientation }) =>
              orientation === 'left' ? <ChevronLeft size={13} /> : <ChevronRight size={13} />,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
