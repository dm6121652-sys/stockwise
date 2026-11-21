create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.shop_memberships (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner','employee')),
  created_at timestamptz not null default now(),
  primary key (shop_id,user_id)
);

create table if not exists public.shop_invitations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  email text not null,
  invite_code text not null unique default encode(gen_random_bytes(6),'hex'),
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  category text not null default 'Uncategorized',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_reference uuid not null,
  created_by uuid not null references auth.users(id),
  payment_method text not null check (payment_method in ('cash','transfer','card','other')),
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  unique(shop_id,client_reference)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id),
  sale_id uuid references public.sales(id),
  changed_by uuid not null references auth.users(id),
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null check (reason in ('sale','delivery','damage','correction')),
  created_at timestamptz not null default now()
);

create index if not exists products_shop_active_idx on public.products(shop_id,active,name);
create index if not exists sales_shop_created_idx on public.sales(shop_id,created_at desc);
create index if not exists movements_shop_created_idx on public.stock_movements(shop_id,created_at desc);

create or replace function public.is_shop_member(target_shop uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.shop_memberships m where m.shop_id=target_shop and m.user_id=auth.uid()) $$;

create or replace function public.is_shop_owner(target_shop uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.shop_memberships m where m.shop_id=target_shop and m.user_id=auth.uid() and m.role='owner') $$;

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
  insert into public.shops(name) values(coalesce(nullif(trim(p_name),''),'My shop')) returning id into new_shop;
  insert into public.shop_memberships(shop_id,user_id,role) values(new_shop,auth.uid(),'owner');
  return new_shop;
end;
$$;

alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.shop_memberships enable row level security;
alter table public.shop_invitations enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

create policy shops_read_for_members on public.shops for select to authenticated using (public.is_shop_member(id));
create policy profiles_read_for_shop_members on public.profiles for select to authenticated using (exists(select 1 from public.shop_memberships m where m.user_id=profiles.user_id and public.is_shop_member(m.shop_id)));
create policy profiles_update_self on public.profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy memberships_read_for_shop on public.shop_memberships for select to authenticated using (public.is_shop_member(shop_id));
create policy invitations_read_for_owners on public.shop_invitations for select to authenticated using (public.is_shop_owner(shop_id));
create policy products_read_for_members on public.products for select to authenticated using (public.is_shop_member(shop_id));
create policy products_add_by_members on public.products for insert to authenticated with check (public.is_shop_member(shop_id));
create policy products_edit_by_owner on public.products for update to authenticated using (public.is_shop_owner(shop_id)) with check (public.is_shop_owner(shop_id));
create policy products_remove_by_owner on public.products for delete to authenticated using (public.is_shop_owner(shop_id));
create policy sales_read_for_members on public.sales for select to authenticated using (public.is_shop_member(shop_id));
create policy sale_items_read_for_members on public.sale_items for select to authenticated using (exists(select 1 from public.sales s where s.id=sale_id and public.is_shop_member(s.shop_id)));
create policy movements_read_for_members on public.stock_movements for select to authenticated using (public.is_shop_member(shop_id));

revoke all on public.shops, public.profiles, public.shop_memberships, public.shop_invitations,
  public.products, public.sales, public.sale_items, public.stock_movements from anon, authenticated;
grant select on public.shops, public.profiles, public.shop_memberships, public.shop_invitations,
  public.products, public.sales, public.sale_items, public.stock_movements to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant insert on public.products to authenticated;
grant update(name,category,price,low_stock_threshold,active) on public.products to authenticated;
grant delete on public.products to authenticated;

create or replace function public.record_initial_stock()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.stock > 0 then
    insert into public.stock_movements(shop_id,product_id,changed_by,quantity_delta,reason)
    values(new.shop_id,new.id,auth.uid(),new.stock,'delivery');
  end if;
  return new;
end;
$$;
drop trigger if exists stockwise_initial_stock on public.products;
create trigger stockwise_initial_stock after insert on public.products for each row execute function public.record_initial_stock();

create or replace function public.create_shop_for_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare created_shop uuid; shop_label text; invite_value text;
begin
  insert into public.profiles(user_id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.email,''))
    on conflict(user_id) do update set full_name=excluded.full_name,email=excluded.email;
  shop_label := nullif(new.raw_user_meta_data->>'shop_name','');
  invite_value := nullif(new.raw_user_meta_data->>'invite_code','');
  if shop_label is not null then
    insert into public.shops(name) values(shop_label) returning id into created_shop;
    insert into public.shop_memberships(shop_id,user_id,role) values(created_shop,new.id,'owner');
  end if;
  if invite_value is not null then
    if not exists(select 1 from public.shop_invitations i where i.invite_code=invite_value and lower(i.email)=lower(coalesce(new.email,'')) and i.accepted_by is null) then
      raise exception 'This invitation is invalid or has already been used';
    end if;
    insert into public.shop_memberships(shop_id,user_id,role)
      select i.shop_id,new.id,'employee' from public.shop_invitations i
      where i.invite_code=invite_value and lower(i.email)=lower(coalesce(new.email,'')) and i.accepted_by is null;
    update public.shop_invitations set accepted_by=new.id
      where invite_code=invite_value and lower(email)=lower(coalesce(new.email,'')) and accepted_by is null;
  end if;
  return new;
end;
$$;

drop trigger if exists stockwise_new_user_shop on auth.users;
create trigger stockwise_new_user_shop after insert on auth.users for each row execute function public.create_shop_for_new_user();

create or replace function public.invite_shop_employee(p_shop_id uuid,p_email text)
returns text language plpgsql security definer set search_path=public
as $$
declare result_code text;
begin
  if auth.uid() is null or not public.is_shop_owner(p_shop_id) then raise exception 'Only the shop owner can invite employees'; end if;
  if trim(coalesce(p_email,''))='' then raise exception 'Enter an employee email address'; end if;
  insert into public.shop_invitations(shop_id,email) values(p_shop_id,lower(trim(p_email))) returning invite_code into result_code;
  return result_code;
end;
$$;

create or replace function public.adjust_stock(p_shop_id uuid,p_product_id uuid,p_delta integer,p_reason text)
returns integer language plpgsql security definer set search_path=public
as $$
declare updated_stock integer;
begin
  if auth.uid() is null or not public.is_shop_owner(p_shop_id) then raise exception 'Only the shop owner can adjust stock'; end if;
  if p_delta=0 or p_reason not in ('delivery','damage','correction') then raise exception 'Invalid stock adjustment'; end if;
  update public.products set stock=stock+p_delta,updated_at=now()
    where id=p_product_id and shop_id=p_shop_id and stock+p_delta>=0 returning stock into updated_stock;
  if not found then raise exception 'Product not found or adjustment would make stock negative'; end if;
  insert into public.stock_movements(shop_id,product_id,changed_by,quantity_delta,reason)
    values(p_shop_id,p_product_id,auth.uid(),p_delta,p_reason);
  return updated_stock;
end;
$$;

create or replace function public.record_sale(
  p_shop_id uuid,
  p_client_reference uuid,
  p_payment_method text,
  p_items jsonb
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  new_sale uuid;
  existing_sale uuid;
  item jsonb;
  item_id uuid;
  item_quantity integer;
  item_name text;
  item_price numeric(12,2);
  item_total numeric(12,2);
  sale_total numeric(12,2) := 0;
  stock_before integer;
begin
  if auth.uid() is null or not public.is_shop_member(p_shop_id) then
    raise exception 'You do not have access to this shop';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'A sale must include at least one product';
  end if;
  if p_payment_method not in ('cash','transfer','card','other') then
    raise exception 'Invalid payment method';
  end if;
  select id into existing_sale from public.sales where shop_id=p_shop_id and client_reference=p_client_reference;
  if existing_sale is not null then return existing_sale; end if;
  insert into public.sales(shop_id,client_reference,created_by,payment_method,total)
  values(p_shop_id,p_client_reference,auth.uid(),p_payment_method,0)
  on conflict(shop_id,client_reference) do nothing returning id into new_sale;
  if new_sale is null then
    select id into existing_sale from public.sales where shop_id=p_shop_id and client_reference=p_client_reference;
    return existing_sale;
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    item_id := (item->>'product_id')::uuid;
    item_quantity := (item->>'quantity')::integer;
    if item_quantity is null or item_quantity < 1 then raise exception 'Invalid product quantity'; end if;
    select stock,name,price into stock_before,item_name,item_price
      from public.products where id=item_id and shop_id=p_shop_id and active=true for update;
    if not found then raise exception 'Product not found'; end if;
    if stock_before < item_quantity then raise exception 'Not enough stock for %',item_name; end if;
    item_total := item_price * item_quantity;
    sale_total := sale_total + item_total;
    insert into public.sale_items(sale_id,product_id,product_name,quantity,unit_price)
      values(new_sale,item_id,item_name,item_quantity,item_price);
    update public.products set stock=stock-item_quantity,updated_at=now() where id=item_id;
    insert into public.stock_movements(shop_id,product_id,sale_id,changed_by,quantity_delta,reason)
      values(p_shop_id,item_id,new_sale,auth.uid(),-item_quantity,'sale');
  end loop;
  update public.sales set total=sale_total where id=new_sale;
  return new_sale;
end;
$$;

revoke all on function public.record_sale(uuid,uuid,text,jsonb) from public, anon;
grant execute on function public.record_sale(uuid,uuid,text,jsonb) to authenticated;
revoke all on function public.create_shop(text) from public,anon;
grant execute on function public.create_shop(text) to authenticated;
revoke all on function public.is_shop_member(uuid) from public,anon;
grant execute on function public.is_shop_member(uuid) to authenticated;
revoke all on function public.is_shop_owner(uuid) from public,anon;
grant execute on function public.is_shop_owner(uuid) to authenticated;
revoke all on function public.invite_shop_employee(uuid,text) from public,anon;
grant execute on function public.invite_shop_employee(uuid,text) to authenticated;
revoke all on function public.adjust_stock(uuid,uuid,integer,text) from public,anon;
grant execute on function public.adjust_stock(uuid,uuid,integer,text) to authenticated;
