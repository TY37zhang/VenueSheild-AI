-- Camera + incident pipeline tables for VenueShield feed/incident APIs.

create table if not exists public.cameras (
  camera_id text primary key,
  numeric_id integer unique,
  name text not null,
  zone text not null,
  source_type text not null check (source_type in ('snapshot', 'local-device', 'remote-stream')),
  stream_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.camera_state_latest (
  camera_id text primary key references public.cameras(camera_id) on delete cascade,
  status text not null check (status in ('normal', 'warning', 'alert', 'offline')),
  occupancy integer not null default 0,
  capacity integer not null default 0,
  is_live boolean not null default true,
  image_url text,
  last_updated timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.camera_state_history (
  id bigserial primary key,
  camera_id text not null references public.cameras(camera_id) on delete cascade,
  status text not null check (status in ('normal', 'warning', 'alert', 'offline')),
  occupancy integer not null default 0,
  capacity integer not null default 0,
  is_live boolean not null default true,
  image_url text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.incident_events (
  id text primary key,
  camera_id text not null references public.cameras(camera_id) on delete cascade,
  type text not null check (type in ('capacity_warning', 'capacity_critical', 'camera_offline', 'camera_recovered')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('active', 'resolved')),
  title text not null,
  description text not null,
  trigger_value numeric,
  threshold_value numeric,
  source text not null default 'rule-engine',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_camera_state_history_camera_recorded
  on public.camera_state_history(camera_id, recorded_at desc);

create index if not exists idx_incident_events_status_created
  on public.incident_events(status, created_at desc);

create index if not exists idx_incident_events_camera_created
  on public.incident_events(camera_id, created_at desc);
