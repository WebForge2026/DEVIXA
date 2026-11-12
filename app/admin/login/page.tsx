import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LoginForm } from '@/components/admin/LoginForm';
import { ADMIN_COOKIE, adminConfig, verifySessionToken } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const safeNext = (value: string | undefined) => (value && value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin');

const LoginPage = async ({ searchParams }: { searchParams: { next?: string } }) => {
  if (await verifySessionToken(cookies().get(ADMIN_COOKIE)?.value)) redirect(safeNext(searchParams.next));
  return <LoginForm next={safeNext(searchParams.next)} enabled={adminConfig().enabled} />;
};

export default LoginPage;
