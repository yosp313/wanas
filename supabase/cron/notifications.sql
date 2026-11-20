-- Run this in Supabase after enabling pg_cron and pg_net. Store the URL and secret in Vault.
-- Replace the two Vault names with the names used by the deployment.
select cron.schedule(
  'wanas-notifications-every-five-minutes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app-origin') || '/api/internal/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notification-cron-secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
