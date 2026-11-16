import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AdminShell } from '@/components/admin/AdminShell';
import { LoginForm } from '@/components/admin/LoginForm';
import { OverviewView } from '@/components/admin/OverviewView';
import { AnalyticsView } from '@/components/admin/AnalyticsView';
import { LeadsView } from '@/components/admin/LeadsView';
import { UsersView } from '@/components/admin/UsersView';
import { ContentView } from '@/components/admin/ContentView';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { preferredLocale } from './lib/locale';
import { Seo } from './lib/seo';
import { Site } from './Site';
import { HomePage } from './pages/HomePage';
import { ServicePage } from './pages/ServicePage';
import { InsightPage } from './pages/InsightPage';
import { ImprintPage, PrivacyPage } from './pages/LegalPages';
import { NotFound } from './NotFound';

/** Port of middleware.ts guard: / redirects to the preferred locale. */
const RootRedirect = () => {
  const location = useLocation();
  const target = `/${preferredLocale()}${location.pathname === '/' ? '' : location.pathname}${location.search}`;
  return <Navigate to={target} replace />;
};

/** Non-localized unknown path → redirect to the preferred locale (middleware behavior). */
const LocaleGate = () => {
  const location = useLocation();
  const first = location.pathname.split('/')[1] ?? '';
  if (isLocale(first)) return <NotFound />;
  return <Navigate to={`/${preferredLocale()}${location.pathname}${location.search}`} replace />;
};

const LocaleRoute = ({ children }: { children: (locale: Locale) => ReactNode }) => {
  const { locale } = useParams();
  if (!isLocale(locale)) return <LocaleGate />;
  return <Site>{children(locale)}</Site>;
};

const safeNext = (value: string | null) => (value && value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin');

const LoginGate = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { enabled?: boolean; authenticated?: boolean };
        setEnabled(Boolean(body.enabled));
        if (body.authenticated) window.location.href = next;
      })
      .catch(() => setEnabled(false));
  }, [next]);

  if (enabled === null) return null;
  return (
    <main className="dark min-h-screen bg-[#09090B] font-sans text-zinc-200 antialiased [background-image:none]">
      <LoginForm next={next} enabled={enabled} />
    </main>
  );
};

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="dark min-h-screen bg-[#09090B] font-sans text-zinc-200 antialiased [background-image:none]">
    <Seo locale="de" path="/admin" title="Command Center" description="Restricted" noindex />
    <AdminShell>{children}</AdminShell>
  </div>
);

export const App = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/:locale" element={<LocaleRoute>{(l) => <HomePage locale={l} />}</LocaleRoute>} />
    <Route path="/:locale/services/:slug" element={<LocaleRoute>{(l) => <ServicePage locale={l} />}</LocaleRoute>} />
    <Route path="/:locale/insights/:slug" element={<LocaleRoute>{(l) => <InsightPage locale={l} />}</LocaleRoute>} />
    <Route path="/:locale/imprint" element={<LocaleRoute>{(l) => <ImprintPage locale={l} />}</LocaleRoute>} />
    <Route path="/:locale/privacy" element={<LocaleRoute>{(l) => <PrivacyPage locale={l} />}</LocaleRoute>} />

    <Route path="/admin/login" element={<LoginGate />} />
    <Route path="/admin" element={<Panel><OverviewView /></Panel>} />
    <Route path="/admin/analytics" element={<Panel><AnalyticsView /></Panel>} />
    <Route path="/admin/leads" element={<Panel><LeadsView /></Panel>} />
    <Route path="/admin/users" element={<Panel><UsersView /></Panel>} />
    <Route path="/admin/content" element={<Panel><ContentView /></Panel>} />

    <Route path="*" element={<LocaleGate />} />
  </Routes>
);
