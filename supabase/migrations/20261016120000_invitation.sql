-- =============================================================================
-- Code d'invitation : quand l'administrateur en définit un, il faut le saisir
-- pour créer un compte. La vérification est faite par la base, à la création
-- du compte : elle ne peut pas être contournée en appelant Supabase directement.
-- =============================================================================

-- Le code est rangé hors du schéma public : il n'est jamais lisible par l'API.
create table app.signup_invitation (
  id boolean primary key default true check (id),
  code text check (code is null or code ~ '^[A-Z0-9-]{4,40}$'),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into app.signup_invitation (id, code) values (true, null);
alter table app.signup_invitation enable row level security;
revoke all on app.signup_invitation from public, anon, authenticated;

-- Majuscules, sans espaces : « solfege 2026 » devient « SOLFEGE2026 ».
create function app.normalize_invite(p text) returns text
language sql immutable set search_path = '' as $$
  select nullif(upper(regexp_replace(coalesce(p, ''), '\s+', '', 'g')), '')
$$;

-- Vérifie le code avant la création du compte et le retire des métadonnées.
-- Un compte déjà confirmé ou invité au moment de sa création (créé par un
-- administrateur) n'en a pas besoin.
create function app.check_signup_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  select code into v_code from app.signup_invitation where id;
  if v_code is not null and new.invited_at is null and new.email_confirmed_at is null
     and app.normalize_invite(new.raw_user_meta_data ->> 'invite_code') is distinct from v_code then
    raise exception 'Code d''invitation incorrect.' using errcode = '22023';
  end if;
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'invite_code';
  return new;
end;
$$;

create trigger check_signup_invite before insert on auth.users
  for each row execute function app.check_signup_invite();

-- Le formulaire d'inscription a besoin de savoir si un code est demandé (sans le connaître).
create function public.signup_requires_invite() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.signup_invitation where id and code is not null)
$$;

create function public.get_invite_code() returns text
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  return (select code from app.signup_invitation where id);
end;
$$;

-- Un code vide supprime l'obligation. Renvoie le code tel qu'il est enregistré.
create function public.set_invite_code(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_code text := app.normalize_invite(p_code);
begin
  if not app.is_admin() then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;
  if v_code is not null and v_code !~ '^[A-Z0-9-]{4,40}$' then
    raise exception 'Le code doit contenir de 4 à 40 lettres (sans accent), chiffres ou tirets.' using errcode = '22023';
  end if;
  update app.signup_invitation set code = v_code, updated_by = auth.uid(), updated_at = now() where id;
  return v_code;
end;
$$;

revoke execute on function app.normalize_invite(text) from public, anon;
revoke execute on function app.check_signup_invite() from public, anon, authenticated;
revoke execute on function public.signup_requires_invite() from public;
revoke execute on function public.get_invite_code() from public, anon;
revoke execute on function public.set_invite_code(text) from public, anon;
grant execute on function public.signup_requires_invite() to anon, authenticated;
grant execute on function public.get_invite_code() to authenticated;
grant execute on function public.set_invite_code(text) to authenticated;
