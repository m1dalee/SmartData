"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  identifyUnknownPayments,
  recategorizeMoneyMovements,
} from "@/app/actions/categorize";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeftRight } from "lucide-react";

export function AutoIdentifyButton({ unknownCount }: { unknownCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  return (
    <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
      <div>
        <p className="font-medium text-indigo-900">
          {unknownCount} paiement{unknownCount > 1 ? "s" : ""} non identifié{unknownCount > 1 ? "s" : ""}
        </p>
        <p className="text-sm text-indigo-700/80">
          Sources : libellé bancaire → Wikipedia → Bing (DuckDuckGo en secours)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={pending || unknownCount === 0}
          onClick={() =>
            startTransition(async () => {
              const result = await identifyUnknownPayments(15);
              setMessage(result.message);
              setDetails(result.details ?? []);
              router.refresh();
            })
          }
        >
          <Search className="mr-2 h-4 w-4" />
          {pending ? "Recherche en cours..." : "Identifier par recherche web (15)"}
        </Button>

        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await recategorizeMoneyMovements();
              setMessage(result.message);
              setDetails([]);
              router.refresh();
            })
          }
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Classer les virements
        </Button>
      </div>

      {message && <p className="text-sm text-indigo-800">{message}</p>}
      {details.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-lg bg-background/80 p-2 text-xs text-muted-foreground">
          {details.map((line, i) => (
            <li key={i} className="py-0.5">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
