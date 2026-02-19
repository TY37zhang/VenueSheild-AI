alter table if exists public.incident_events
  add column if not exists acknowledged_by text,
  add column if not exists acknowledged_at timestamptz;

create index if not exists idx_incident_events_acknowledged_at
  on public.incident_events(acknowledged_at desc);
