"use client";

/**
 * Fondo decorativo sutil — sin cuadriculado.
 * Solo usamos blobs de color con blur para un look moderno y limpio.
 */
export function BackgroundPattern() {
  return (
    <>
      {/* Blob superior izquierdo */}
      <div className="fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] -z-10 pointer-events-none" />
      {/* Blob inferior derecho */}
      <div className="fixed -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[100px] -z-10 pointer-events-none" />
      {/* Línea gradiente superior */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent -z-10 pointer-events-none" />
    </>
  );
}