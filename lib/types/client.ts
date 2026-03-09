export type ClientStatus = "Activo" | "Potencial" | "Inactivo";

export interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    projectIds: number[]; // references project IDs
    lastInteraction: string; // ISO date
    status: ClientStatus;
    notificationPrefs: Array<"email" | "sms" | "push">;
    avatar: string;
}
