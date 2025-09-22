create table
  public.comments (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    poll_id uuid not null,
    user_id uuid not null,
    content text not null,
    constraint comments_pkey primary key (id),
    constraint comments_poll_id_fkey foreign key (poll_id) references polls (id) on delete cascade,
    constraint comments_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
  );

alter table public.comments enable row level security;

create policy "Allow authorized users to create comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Allow all users to view comments" on public.comments for select using (true);
create policy "Allow authorized users to update their own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Allow authorized users to delete their own comments" on public.comments for delete using (auth.uid() = user_id);