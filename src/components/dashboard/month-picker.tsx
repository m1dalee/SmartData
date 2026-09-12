"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonth } from "@/lib/format";

export function MonthPicker({ month }: { month: string }) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/15 p-1 text-brand-foreground backdrop-blur-sm">
      <Link
        href={`/?month=${prev}`}
        aria-label="Mois précédent"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="min-w-[140px] text-center text-sm font-semibold capitalize sm:min-w-[160px]">
        {formatMonthLabel(month)}
      </span>
      <Link
        href={`/?month=${next}`}
        aria-label="Mois suivant"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
