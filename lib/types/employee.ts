export type EmployeeStatus = "Activo" | "En Proyecto" | "Disponible" | "Inactivo";
export type EmployeeDepartment = "Diseño" | "Ingeniería" | "Construcción" | "Gestión";

export interface Employee {
    id: number;
    name: string;
    role: string;
    department: EmployeeDepartment;
    email: string;
    phone: string;
    projectIds: number[]; // active project assignments
    status: EmployeeStatus;
    avatar: string;
    hoursThisWeek: number;
}
