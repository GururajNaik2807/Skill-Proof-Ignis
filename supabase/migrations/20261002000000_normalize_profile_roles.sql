-- Keep profile roles explicit and compatible with existing accounts.
alter table public.profiles
  add column if not exists role text;

update public.profiles
set role = case role
  when 'developer' then 'candidate'
  when 'employer' then 'recruiter'
  else role
end
where role in ('developer', 'employer');

update public.profiles
set role = 'candidate'
where role is null;

alter table public.profiles
  alter column role set default 'candidate',
  alter column role set not null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('candidate', 'recruiter'));