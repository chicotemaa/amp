import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | ArquiManagerPro",
  description: "Acceso al sistema de gestión de proyectos arquitectónicos",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido a ArquiManagerPro
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}