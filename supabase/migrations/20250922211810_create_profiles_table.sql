create table
  public.profiles (
    id uuid not null references auth.users on delete cascade,
    updated_at timestamp with time zone,
    username text unique,
    avatar_url text,
    website text,
    constraint profiles_pkey primary key (id),
    constraint username_length check (char_length(username) >= 3)
  );

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);