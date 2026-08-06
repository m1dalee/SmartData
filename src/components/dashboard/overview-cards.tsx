import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";

type Props = {
  income: number;
  expenses: number;
  savings: number;
  totalBalance: number;
  transactionCount: number;
};

export function OverviewCards({ income, expenses, savings, totalBalance, transactionCount }: Props) {
  const cards = [
    {
      title: "Revenus du mois",
      value: formatCurrency(income),
      icon: ArrowUpRight,
      tone: "text-emerald-600",
    },
    {
      title: "Dépenses du mois",
      value: formatCurrency(expenses),
      icon: ArrowDownRight,
      tone: "text-rose-600",
    },
    {
      title: "Épargne du mois",
      value: formatCurrency(savings),
      icon: PiggyBank,
      tone: savings >= 0 ? "text-emerald-600" : "text-rose-600",
    },
    {
      title: "Solde cumulé",
      value: formatCurrency(totalBalance),
      subtitle: `${transactionCount} opérations ce mois`,
      icon: Wallet,
      tone: totalBalance >= 0 ? "text-emerald-600" : "text-rose-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, subtitle, icon: Icon, tone }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${tone}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tone}`}>{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
