import { Metadata } from "next";
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeeStats } from "@/components/employees/employee-stats";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { NewEmployeeDialog } from "@/components/employees/new-employee-dialog";

export const metadata: Metadata = {
  title: "Empleados | ArquiManagerPro",
  description: "Gestión de empleados y recursos humanos",
};

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground mt-2">
            Gestión del equipo y recursos humanos
          </p>
        </div>
        <NewEmployeeDialog />
      </div>

      <EmployeeStats />
      <EmployeeFilters />
      <EmployeeList />
    </div>
  );
}
