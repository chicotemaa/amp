import { EMPLOYEES } from "@/lib/data/employees";
import { Employee, EmployeeDepartment } from "@/lib/types/employee";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeProjectRow = Database["public"]["Tables"]["employee_projects"]["Row"];

function mapEmployeeRow(row: EmployeeRow, projectIds: number[]): Employee {
    return {
        id: row.id,
        name: row.name,
        role: row.role,
        department: row.department as EmployeeDepartment,
        email: row.email,
        phone: row.phone ?? "",
        projectIds,
        status: row.status as Employee["status"],
        avatar: row.avatar ?? "",
        hoursThisWeek: row.hours_this_week,
    };
}

export async function getEmployeesDb(): Promise<Employee[]> {
    const [{ data: employeesData, error: employeesError }, { data: linksData, error: linksError }] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("employee_projects").select("*"),
    ]);

    if (employeesError || linksError) {
        console.error("Supabase employees error:", employeesError?.message ?? linksError?.message);
        return EMPLOYEES;
    }

    const links = linksData as EmployeeProjectRow[];
    const linksByEmployee = links.reduce<Record<number, number[]>>((acc, link) => {
        if (!acc[link.employee_id]) acc[link.employee_id] = [];
        acc[link.employee_id].push(link.project_id);
        return acc;
    }, {});

    return (employeesData as EmployeeRow[]).map((row) =>
        mapEmployeeRow(row, linksByEmployee[row.id] ?? [])
    );
}

export function getEmployees(): Employee[] {
    return EMPLOYEES;
}

export function getEmployeeById(id: number): Employee | undefined {
    return EMPLOYEES.find((e) => e.id === id);
}

export function getEmployeesByProject(projectId: number): Employee[] {
    return EMPLOYEES.filter((e) => e.projectIds.includes(projectId));
}

export function getEmployeeStats() {
    const total = EMPLOYEES.length;
    const active = EMPLOYEES.filter((e) => e.status !== "Inactivo").length;
    const inProject = EMPLOYEES.filter((e) => e.projectIds.length > 0).length;
    const hoursThisWeek = EMPLOYEES.reduce((sum, e) => sum + e.hoursThisWeek, 0);

    // Unique active project IDs across all employees
    const activeProjectIds = new Set(EMPLOYEES.flatMap((e) => e.projectIds));

    return { total, active, inProject, hoursThisWeek, activeProjects: activeProjectIds.size };
}

export function getResourceUtilization(): {
    department: EmployeeDepartment;
    label: string;
    count: number;
    percentage: number;
    hoursAssigned: number;
}[] {
    const departments: EmployeeDepartment[] = ["Diseño", "Ingeniería", "Construcción", "Gestión"];
    const totalActive = EMPLOYEES.filter((e) => e.status !== "Inactivo").length;

    return departments.map((dept) => {
        const members = EMPLOYEES.filter((e) => e.department === dept && e.status !== "Inactivo");
        return {
            department: dept,
            label: dept,
            count: members.length,
            percentage: Math.round((members.length / totalActive) * 100),
            hoursAssigned: members.reduce((s, e) => s + e.hoursThisWeek, 0),
        };
    });
}

// --- SUPABASE MUTATIONS ---

export type CreateEmployeeInput = Omit<Employee, "id" | "projectIds">;

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    const newId = Date.now(); // Fallback ID
    const { data, error } = await supabase
        .from("employees")
        .insert({
            id: newId,
            name: input.name,
            role: input.role,
            department: input.department,
            email: input.email,
            phone: input.phone,
            status: input.status,
            avatar: input.avatar || null,
            hours_this_week: input.hoursThisWeek,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating employee:", error.message);
        throw new Error("No se pudo crear el empleado.");
    }

    return mapEmployeeRow(data as EmployeeRow, []);
}

export async function updateEmployee(id: number, input: Partial<Employee>): Promise<Employee> {
    const updates: Record<string, any> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.role !== undefined) updates.role = input.role;
    if (input.department !== undefined) updates.department = input.department;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.status !== undefined) updates.status = input.status;
    if (input.avatar !== undefined) updates.avatar = input.avatar;
    if (input.hoursThisWeek !== undefined) updates.hours_this_week = input.hoursThisWeek;

    const { data, error } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating employee:", error.message);
        throw new Error("No se pudo actualizar el empleado.");
    }

    return mapEmployeeRow(data as EmployeeRow, []);
}

export async function deleteEmployee(id: number): Promise<void> {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
        console.error("Error deleting employee:", error.message);
        throw new Error("No se pudo eliminar el empleado.");
    }
}
