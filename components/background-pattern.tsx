"use client";

export function BackgroundPattern() {
  return (
    <>
      {/* Patrón de fondo con polígonos */}
      <div className="fixed inset-0 -z-10 opacity-[0.02] dark:opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full bg-repeat pattern-grid" />
      </div>
      
      {/* Polígonos decorativos */}
      <div className="fixed top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-3xl rotate-12 blur-3xl" />
      <div className="fixed top-3/4 -right-48 w-96 h-96 bg-primary/10 rounded-3xl -rotate-12 blur-3xl" />
      
      {/* Gradiente superior */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Efecto de malla poligonal */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
    </>
  );
}