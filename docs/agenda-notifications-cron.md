# Agenda Notifications Cron

El dispatch de alertas operativas puede ejecutarse de dos formas.

## Local

Con la app levantada y `.env.local` configurado:

```bash
npm run notifications:dispatch
```

Si querés automatizarlo en tu máquina cada 15 minutos:

```bash
*/15 * * * * cd /Users/matidev/Documents/Proyects/amp && /bin/zsh -lc 'npm run notifications:dispatch >> /tmp/amp-notifications.log 2>&1'
```

## Deploy

El repo incluye [vercel.json](/Users/matidev/Documents/Proyects/amp/vercel.json) con un cron cada 15 minutos sobre:

`/api/agenda-notifications/dispatch`

Para que funcione en Vercel:

- definí `CRON_SECRET`
- definí también `SUPABASE_SERVICE_ROLE_KEY`
- definí `RESEND_API_KEY`
- definí `AGENDA_NOTIFICATIONS_FROM_EMAIL`
- definí `APP_URL`

La route acepta `Authorization: Bearer <CRON_SECRET>` o `Authorization: Bearer <AGENDA_NOTIFICATION_DISPATCH_SECRET>`.
