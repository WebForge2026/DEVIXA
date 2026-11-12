import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

const PanelLayout = ({ children }: { children: ReactNode }) => <AdminShell>{children}</AdminShell>;

export default PanelLayout;
