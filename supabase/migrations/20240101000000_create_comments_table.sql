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

create policy "Enable read access for all users" on public.comments as permissive for select to public using (true);

create policy "Enable insert for authenticated users only" on public.comments as permissive for insert to authenticated with check (true);

create policy "Enable update for users based on user_id" on public.comments as permissive for update to authenticated using ((auth.uid() = user_id));

create policy "Enable delete for users based on user_id" on public.comments as permissive for delete to authenticated using ((auth.uid() = user_id));