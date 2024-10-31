import { Metadata } from "next";
import { CashflowOverview } from "@/components/cashflow/cashflow-overview";
import { CashflowFilters } from "@/components/cashflow/cashflow-filters";
import { CashflowTransactions } from "@/components/cashflow/cashflow-transactions";
import { CashflowStats } from "@/components/cashflow/cashflow-stats";

export const metadata: Metadata = {
  title: "Cashflow | ArquiManagerPro",
  description: "Control de ingresos y egresos",
};

export default function CashflowPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">Cashflow</h1>
        <p className="text-muted-foreground">
          Control y seguimiento de movimientos económicos
        </p>
      </div>

      <CashflowStats />
      <CashflowFilters />
      
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <CashflowOverview />
        </div>
        <div className="lg:col-span-3">
          <CashflowTransactions />
        </div>
      </div>
    </div>
  );
}