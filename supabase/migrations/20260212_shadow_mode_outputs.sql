create table if not exists public.ai_shadow_latest (
  camera_id text not null references public.cameras(camera_id) on delete cascade,
  source_type text not null check (source_type in ('local-device', 'remote-stream')),
  model_key text not null,
  model_version text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  summary text not null,
  recommended_action text not null,
  tags text[] not null default '{}',
  metrics jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (camera_id, model_key)
);

create index if not exists idx_ai_shadow_latest_updated_at
  on public.ai_shadow_latest(updated_at desc);

create index if not exists idx_ai_shadow_latest_severity
  on public.ai_shadow_latest(severity, updated_at desc);
