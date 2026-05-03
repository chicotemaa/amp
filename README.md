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
- `lib/data`: datasets locales usados por tests y fallback/demo.
- `lib/api`: capa de acceso a datos Supabase y helpers de dominio.
- `lib/types`: tipos de dominio.
- `contexts/`: estado compartido (filtros).
- `.github/workflows/ci.yml`: pipeline de calidad/build.

## Estado Actual del Proyecto

- La autenticación usa Supabase Auth con perfiles, roles y middleware de acceso.
- La mayor parte del dominio operativo ya persiste en Supabase: proyectos, clientes, usuarios, documentos, presupuesto, planificación, avances, incidencias, mano de obra, compras, contratos, certificados, agenda y auditoría.
- Todavía quedan datasets locales para tests/fallback y funciones legacy sin sufijo `Db`; antes del MVP deben quedar claramente separadas de la capa productiva.
- El foco actual es estabilizar el producto hacia MVP: calidad técnica, RLS, flujos de obra completos, caja/cobranzas/pagos y experiencia móvil de campo.

## Variables de Entorno

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública `anon` o `publishable`. Nunca usar `service_role`, `sb_secret_*` ni otra clave secreta porque se expone al navegador.
- `SUPABASE_SERVICE_ROLE_KEY`: clave server-only para procesos protegidos. No debe tener prefijo `NEXT_PUBLIC_`.
- `RESEND_API_KEY`, `AGENDA_NOTIFICATION_DISPATCH_SECRET`, `CRON_SECRET`: server-only.

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
