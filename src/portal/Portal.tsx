import { ClerkProvider, SignIn, SignUp, UserButton, useAuth } from '@clerk/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  ShieldCheck,
  Sun,
  Trophy,
  UserRoundCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { apiBase, useApi } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import logoOnDark from '../assets/logo.png';
import logoOnLight from '../assets/logo-dark.png';
import type { Me, Permission } from './types';
import { Button, Empty, Loading, Notice, roleLabel, trackLabel, useResource } from './shared';
import './portal.css';

const AdminDashboard = lazy(() => import('./Admin'));
const JudgeDashboard = lazy(() => import('./Judge'));
const ParticipantSection = lazy(() =>
  import('./Participant').then((module) => ({ default: module.ParticipantSection })),
);

type NavItem = { id: string; label: string; icon: LucideIcon; permission?: Permission };
const adminNav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'people', label: 'Participants', icon: Users, permission: 'people' },
  { id: 'announcements', label: 'Announcements', icon: Bell, permission: 'announcements' },
  { id: 'forms', label: 'Forms', icon: ClipboardList, permission: 'forms' },
  { id: 'responses', label: 'Response sheets', icon: FileSpreadsheet, permission: 'responses' },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays, permission: 'timeline' },
  { id: 'finance', label: 'Finances', icon: Receipt, permission: 'finance' },
  { id: 'judges', label: 'Judge access', icon: UserRoundCheck, permission: 'judging' },
  { id: 'judging', label: 'Judging', icon: ClipboardList, permission: 'judging' },
  { id: 'results', label: 'Results', icon: Trophy, permission: 'results' },
  { id: 'admins', label: 'Administrators', icon: ShieldCheck, permission: 'admins' },
  { id: 'audit', label: 'Activity log', icon: FileSpreadsheet, permission: 'audit' },
];
const participantNav: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'forms', label: 'Your forms', icon: ClipboardList },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'results', label: 'Results', icon: Trophy },
];

function Workspace({ me }: { me: Me }) {
  const api = useApi();
  const { theme, toggle } = useTheme();
  const [section, setSection] = useState(
    () => new URLSearchParams(window.location.search).get('section') || 'overview',
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const admin = me.person.role === 'owner' || me.person.role === 'admin',
    judge = me.person.role === 'judge';
  const nav = admin
    ? adminNav.filter((item) => !item.permission || me.person.permissions.includes(item.permission))
    : judge
      ? [{ id: 'overview', label: 'Your assignments', icon: ClipboardList }]
      : participantNav;
  const current = nav.find((item) => item.id === section) || {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  };
  const base = admin ? '/admin' : judge ? '/judge' : '/dashboard';
  useEffect(() => {
    window.history.replaceState(
      null,
      '',
      `${base}${section !== 'overview' ? `?section=${encodeURIComponent(section)}` : ''}`,
    );
  }, [base, section]);
  useEffect(() => {
    const onPop = () =>
      setSection(new URLSearchParams(window.location.search).get('section') || 'overview');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  function navigate(next: string) {
    if (!nav.some((item) => item.id === next)) return;
    window.history.pushState(
      null,
      '',
      `${base}${next !== 'overview' ? `?section=${encodeURIComponent(next)}` : ''}`,
    );
    setSection(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <div className="portal-shell">
      <a className="skip-link" href="#portal-main">
        Skip to content
      </a>
      <aside className={`portal-sidebar ${menuOpen ? 'is-open' : ''}`} id="portal-navigation">
        <a className="portal-brand" href="/">
          <img src={theme === 'dark' ? logoOnDark : logoOnLight} alt="VMEDITHON 3.0" />
        </a>
        <div className="portal-workspace-label">
          <span className="status-dot" />
          {admin ? 'ORGANIZER WORKSPACE' : judge ? 'JUDGING WORKSPACE' : 'PARTICIPANT WORKSPACE'}
        </div>
        <nav aria-label="Dashboard">
          {nav.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={current.id === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <span>15–16 SEP 2026</span>
          <span>VIT CHENNAI</span>
          <a href="/">Back to event website</a>
        </div>
      </aside>
      <div className="portal-workspace">
        <header className="portal-topbar">
          <button
            type="button"
            className="portal-menu"
            aria-label={menuOpen ? 'Close dashboard menu' : 'Open dashboard menu'}
            aria-expanded={menuOpen}
            aria-controls="portal-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="portal-breadcrumb">
            Workspace <span>/</span> <strong>{current.label}</strong>
          </span>
          <div className="portal-user">
            <span>
              {me.person.name}
              <small>
                {roleLabel(me.person.role)}
                {me.person.track ? ` · ${trackLabel(me.person.track)}` : ''}
              </small>
            </span>
            <Button
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onClick={toggle}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <UserButton />
          </div>
        </header>
        <main id="portal-main" className="portal-main">
          <Suspense fallback={<Loading />}>
            {admin ? (
              <AdminDashboard
                key={current.id}
                api={api}
                me={me}
                section={current.id}
                navigate={navigate}
              />
            ) : judge ? (
              <JudgeDashboard api={api} me={me} />
            ) : (
              <ParticipantSection
                key={current.id}
                section={current.id}
                api={api}
                me={me}
                navigate={navigate}
              />
            )}
          </Suspense>
        </main>
        <footer className="portal-footer">
          <span>VMEDITHON 3.0</span>
          <span>Great minds. Real builds. Human impact.</span>
        </footer>
      </div>
    </div>
  );
}
function SignedInPortal() {
  const api = useApi();
  const resource = useResource<Me>(api, '/me');
  if (resource.loading)
    return (
      <div className="portal-auth">
        <Loading />
      </div>
    );
  if (!resource.data)
    return (
      <div className="portal-auth">
        <a href="/" className="portal-back-link">
          <ArrowLeft size={16} />
          Back to event
        </a>
        <h1>Let’s get you connected.</h1>
        <Notice error={resource.error} />
        <p>
          Use the email address registered with the event. Contact the organizers if your access
          needs to be updated.
        </p>
        <div className="portal-actions">
          <Button onClick={resource.refresh}>Try again</Button>
          <UserButton />
        </div>
      </div>
    );
  return <Workspace key={resource.data.person.id} me={resource.data} />;
}
function AuthenticatedPortal() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded)
    return (
      <div className="portal-auth">
        <Loading />
      </div>
    );
  if (isSignedIn) return <SignedInPortal />;
  const signingUp = window.location.pathname.startsWith('/sign-up');
  return (
    <div className="portal-auth">
      <a href="/" className="portal-back-link">
        <ArrowLeft size={16} />
        Back to VMEDITHON
      </a>
      <p className="eyebrow">YOUR EVENT WORKSPACE</p>
      <h1>{signingUp ? 'Ready to build?' : 'Welcome back.'}</h1>
      <p>Sign in with your registered email to access your event dashboard.</p>
      {signingUp ? (
        <SignUp routing="hash" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
      ) : (
        <SignIn routing="hash" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
      )}
    </div>
  );
}
export default function Portal() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key || !apiBase)
    return (
      <div className="portal-auth">
        <a href="/" className="portal-back-link">
          <ArrowLeft size={16} />
          Back to VMEDITHON
        </a>
        <Empty title="Your event workspace is coming soon">
          The organizers will let you know when sign-in opens.
        </Empty>
      </div>
    );
  return (
    <ClerkProvider
      publishableKey={key}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <AuthenticatedPortal />
    </ClerkProvider>
  );
}
