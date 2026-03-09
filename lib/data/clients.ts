import { Client } from "@/lib/types/client";

/**
 * Canonical client data — single source of truth.
 * projectIds reference the canonical project IDs in lib/data/projects.ts.
 */
export const CLIENTS: Client[] = [
    {
        id: 1,
        name: "Sara Martínez",
        company: "Espacios Modernos S.L.",
        email: "sara@espaciosmodernos.com",
        phone: "+54 11 4123-4567",
        projectIds: [1], // Torre Residencial Marina
        lastInteraction: "2024-03-15",
        status: "Activo",
        notificationPrefs: ["email", "sms"],
        avatar: "/avatars/sara.jpg",
    },
    {
        id: 2,
        name: "Miguel Chen",
        company: "Desarrollo Urbano Co.",
        email: "mchen@desarrollourbano.com",
        phone: "+54 11 4234-5678",
        projectIds: [2, 6], // Centro Comercial + Campus Tech
        lastInteraction: "2024-03-14",
        status: "Activo",
        notificationPrefs: ["email"],
        avatar: "/avatars/miguel.jpg",
    },
    {
        id: 3,
        name: "Elena Wilson",
        company: "Constructores Sostenibles",
        email: "elena@sostenible.com",
        phone: "+54 11 4345-6789",
        projectIds: [5], // Eco-Resort Costa Verde
        lastInteraction: "2024-03-10",
        status: "Potencial",
        notificationPrefs: ["email", "push"],
        avatar: "/avatars/elena.jpg",
    },
    {
        id: 4,
        name: "Roberto Fernández",
        company: "InmoCorp S.A.",
        email: "rfernandez@inmocorp.com",
        phone: "+54 11 4456-7890",
        projectIds: [4], // Hospital Metropolitano
        lastInteraction: "2024-03-12",
        status: "Activo",
        notificationPrefs: ["email", "sms"],
        avatar: "/avatars/roberto.jpg",
    },
    {
        id: 5,
        name: "Patricia Lagos",
        company: "Lagos & Asociados",
        email: "patricia@lagosasociados.com",
        phone: "+54 11 4567-8901",
        projectIds: [3], // Complejo Deportivo Olímpico
        lastInteraction: "2024-03-08",
        status: "Activo",
        notificationPrefs: ["push"],
        avatar: "/avatars/patricia.jpg",
    },
];
