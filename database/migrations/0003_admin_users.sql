-- Admin credentials are stored as password_hash() hashes, never plaintext.
create table if not exists admin_users (
  id char(36) not null primary key,
  email varchar(254) not null,
  password_hash varchar(255) not null,
  created_at datetime(3) not null default current_timestamp(3),
  unique key admin_users_email_unique (email)
) engine = innodb default charset = utf8mb4;
