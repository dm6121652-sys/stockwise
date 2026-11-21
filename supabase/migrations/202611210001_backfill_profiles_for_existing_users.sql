-- Accounts that existed before the Stockwise auth trigger was installed need
-- their profile rows backfilled before getShopContext can create memberships.
begin;

insert into public.profiles(user_id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.email, '')
from auth.users u
on conflict (user_id) do update set
  email = excluded.email,
  full_name = case
    when public.profiles.full_name = '' then excluded.full_name
    else public.profiles.full_name
  end;

create or replace function public.create_shop(p_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare new_shop uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before creating a shop'; end if;

  insert into public.profiles(user_id,full_name,email)
    select u.id,coalesce(u.raw_user_meta_data->>'full_name',''),coalesce(u.email,'')
    from auth.users u where u.id=auth.uid()
    on conflict(user_id) do update set
      email=excluded.email,
      full_name=case when public.profiles.full_name='' then excluded.full_name else public.profiles.full_name end;

  if exists(select 1 from public.shop_memberships where user_id=auth.uid()) then
    return (select shop_id from public.shop_memberships where user_id=auth.uid() limit 1);
  end if;

  insert into public.shops(name)
  values(coalesce(nullif(trim(p_name),''),'My shop'))
  returning id into new_shop;

  insert into public.shop_memberships(shop_id,user_id,role)
  values(new_shop,auth.uid(),'owner');

  return new_shop;
end;
$$;

commit;
