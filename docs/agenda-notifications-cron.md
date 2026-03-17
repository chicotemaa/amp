# Agenda Notifications Dispatch

El dispatch de alertas operativas puede ejecutarse manualmente o con un scheduler externo.

## Local

Con la app levantada y `.env.local` configurado:

```bash
npm run notifications:dispatch
```

Si querés automatizarlo en tu máquina cada 15 minutos:

```bash
*/15 * * * * cd /Users/matidev/Documents/Proyects/amp && /bin/zsh -lc 'npm run notifications:dispatch >> /tmp/amp-notifications.log 2>&1'
```

## Scheduler externo

Si querés automatizarlo fuera de Vercel, podés invocar:

`/api/agenda-notifications/dispatch`

Variables necesarias:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `AGENDA_NOTIFICATIONS_FROM_EMAIL`
- `APP_URL`
- `AGENDA_NOTIFICATION_DISPATCH_SECRET` o `CRON_SECRET`

La route acepta `Authorization: Bearer <AGENDA_NOTIFICATION_DISPATCH_SECRET>` o `Authorization: Bearer <CRON_SECRET>`.
