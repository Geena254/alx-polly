create table
  public.polls (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    title text not null,
    options jsonb not null,
    user_id uuid not null,
    constraint polls_pkey primary key (id),
    constraint polls_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
  );

alter table public.polls enable row level security;

create policy "Allow authorized users to create polls" on public.polls for insert with check (auth.uid() = user_id);
create policy "Allow all users to view polls" on public.polls for select using (true);
create policy "Allow authorized users to update their own polls" on public.polls for update using (auth.uid() = user_id);
create policy "Allow authorized users to delete their own polls" on public.polls for delete using (auth.uid() = user_id);