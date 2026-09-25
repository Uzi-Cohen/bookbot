-- HomeBulk schema for Supabase (Postgres).
-- The MVP stores everything on-device; this schema is the target for sync.
-- Exercise and program definitions ship with the app (src/data), so only
-- user data lives here. Every table is protected by row-level security.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  training_days smallint[] not null default '{0,2,4}',
  created_at timestamptz not null default now()
);

create table public.equipment (
  user_id uuid primary key references auth.users on delete cascade,
  dumbbells boolean not null default false,
  barbell boolean not null default false,
  bench boolean not null default false,
  pullup_bar boolean not null default false,
  bands boolean not null default false,
  cable boolean not null default false,
  squat_rack boolean not null default false,
  dumbbell_kg numeric(5,2) not null default 0,
  barbell_kg numeric(6,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- Exercise chosen for a program slot, overriding the default pick.
create table public.exercise_swaps (
  user_id uuid not null references auth.users on delete cascade,
  slot_id text not null,
  exercise_id text not null,
  primary key (user_id, slot_id)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  day_id text not null check (day_id in ('push', 'pull', 'legs')),
  mode text not null check (mode in ('full', 'express')),
  started_at timestamptz not null,
  finished_at timestamptz
);
create index workouts_user_started on public.workouts (user_id, started_at desc);

create table public.sets (
  id bigint generated always as identity primary key,
  workout_id uuid not null references public.workouts on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  slot_id text not null,
  exercise_id text not null,
  set_index smallint not null,
  weight_kg numeric(6,2),
  reps smallint not null
);
create index sets_user_exercise on public.sets (user_id, exercise_id);

create table public.bodyweight_entries (
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  kg numeric(5,2) not null,
  primary key (user_id, date)
);

do $$
declare t text;
begin
  foreach t in array array['equipment', 'exercise_swaps', 'workouts', 'sets', 'bodyweight_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
