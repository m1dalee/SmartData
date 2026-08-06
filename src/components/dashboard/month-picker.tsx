"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel, shiftMonth } from "@/lib/format";

export function MonthPicker({ month }: { month: string }) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/?month=${prev}`} aria-label="Mois précédent">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="min-w-[180px] text-center text-sm font-medium capitalize">
        {formatMonthLabel(month)}
      </span>
      <Button variant="outline" size="icon" asChild>
        <Link href={`/?month=${next}`} aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
