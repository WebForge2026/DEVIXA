-- Bootstrap only an empty admin table. Change the temporary password immediately.
insert into admin_users (id, email, password_hash)
select uuid(), 'admin@devixa.de', '$2y$10$2NrrGWJRGi0I5hqFccqtVOeavgBKS9zfsG0xWxgtUffD/fnbWSTz.'
where not exists (select 1 from admin_users);
