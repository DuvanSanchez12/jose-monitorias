"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";

type CalendarProps = {
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  monthOffset?: number;
};

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Calendar({
  availableDates,
  selectedDate,
  onSelectDate,
  monthOffset = 0,
}: CalendarProps) {
  const { lang } = useI18n();
  const DAYS = lang === "es" ? DAYS_ES : DAYS_EN;
  const MONTHS = lang === "es" ? MONTHS_ES : MONTHS_EN;

  const today = new Date();
  const baseDate = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDayOfWeek = baseDate.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const availableSet = useMemo(
    () => new Set(availableDates),
    [availableDates]
  );

  const todayStr = today.toISOString().split("T")[0];

  const handleClick = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!availableSet.has(ds)) return;
    onSelectDate(ds);
  };

  const rows: React.ReactNode[] = [];
  let cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<td key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isAvailable = availableSet.has(ds);
    const isSelected = ds === selectedDate;
    const isPast = ds < todayStr;
    const isToday = ds === todayStr;
    const canSelect = isAvailable && !isPast;

    cells.push(
      <td key={day} className="p-0.5">
        <button
          type="button"
          disabled={!canSelect}
          onClick={() => handleClick(day)}
          className={`relative w-10 h-10 rounded-lg text-sm flex items-center justify-center transition-all duration-200
            ${isSelected
              ? "bg-primary text-white font-bold shadow-md shadow-primary/30 scale-105"
              : canSelect
                ? "hover:bg-primary/10 text-foreground font-medium border-2 border-primary/30 hover:border-primary hover:shadow-sm"
                : "text-zinc-300 dark:text-zinc-700 cursor-default"
            }
            ${isToday && !isSelected && canSelect ? "ring-2 ring-primary/50" : ""}
          `}
        >
          {day}
          {isAvailable && !isSelected && !isPast && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      </td>
    );

    if ((firstDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
      while (cells.length < 7) {
        cells.push(<td key={`end-${cells.length}`} />);
      }
      rows.push(<tr key={day}>{cells}</tr>);
      cells = [];
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm inline-block">
      <div className="text-center font-semibold mb-3 text-base text-foreground">
        {MONTHS[month]} {year}
      </div>
      <table className="border-collapse">
        <thead>
          <tr>
            {DAYS.map((d) => (
              <th
                key={d}
                className="w-10 h-8 text-xs font-medium text-zinc-500 uppercase tracking-wide"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
