# ArquiManagerPro (AMP)

Dashboard de gestión de proyectos arquitectónicos construido con Next.js 13 + TypeScript + Tailwind + Radix.

## Requisitos

- Node.js 20+
- npm 9+

## Instalación

```bash
npm ci
```

## Scripts

```bash
npm run dev        # desarrollo local
npm run lint       # lint con Next ESLint
npm run typecheck  # chequeo de tipos TypeScript
npm run test       # lint + typecheck
npm run build      # build de producción
npm run start      # servir build
```

## Estructura Principal

- `app/`: rutas App Router.
- `components/`: UI y módulos de negocio por dominio.
- `lib/data`: datasets locales (mock/demo).
- `lib/api`: capa de acceso a datos (actualmente en memoria).
- `lib/types`: tipos de dominio.
- `contexts/`: estado compartido (filtros).
- `.github/workflows/ci.yml`: pipeline de calidad/build.

## Estado Actual del Proyecto

- La autenticación es visual/demostrativa (no hay sesión real ni backend auth).
- La persistencia de documentos y presupuestos se realiza en `localStorage`.
- La capa `lib/api` usa datasets locales de `lib/data`.

## Convenciones

- TypeScript estricto (`strict: true`).
- Import alias `@/*`.
- Componentes cliente con `"use client"` solo cuando es necesario.

## CI

En cada push/PR a `main`, GitHub Actions ejecuta:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
