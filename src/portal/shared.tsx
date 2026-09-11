import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Api } from '../lib/api';
import type { Audience, Track } from './types';

export function useResource<T>(api: Api, path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    // The version deliberately reruns the request after an explicit refresh.
    void version;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    void api
      .get<T>(path, controller.signal)
      .then(setData)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(message(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, path, version]);
  return { data, error, loading, refresh };
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const running = useRef(false);
  async function run(action: () => Promise<void>, successMessage?: string) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(successMessage || null);
    } catch (e) {
      setError(message(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    success,
    run,
    clear: () => {
      setError(null);
      setSuccess(null);
    },
  };
}
export function Notice({ error, success }: { error?: string | null; success?: string | null }) {
  if (error)
    return (
      <div className="portal-notice error" role="alert">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  if (success)
    return (
      <div className="portal-notice success" role="status">
        <CheckCircle2 size={18} />
        <span>{success}</span>
      </div>
    );
  return null;
}
export function Loading() {
  return (
    <div className="portal-loading" role="status">
      <LoaderCircle size={22} className="spin" /> Loading your workspace...
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="portal-empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function SectionHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div className="portal-section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="portal-actions">{actions}</div>}
    </div>
  );
}
export function Button({
  children,
  busy = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      className={`portal-button ${props.className || ''}`}
    >
      {busy && <LoaderCircle size={15} className="spin" />}
      {children}
    </button>
  );
}
export function FieldLabel({
  label,
  children,
  hint,
}: {
  label: string;
  children: (id: string) => ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="portal-field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <span className="portal-hint">{hint}</span>}
    </div>
  );
}
export function TargetFields({
  track,
  audience,
  onTrack,
  onAudience,
}: {
  track: Track | 'all';
  audience?: Audience;
  onTrack: (value: Track | 'all') => void;
  onAudience?: (value: Audience) => void;
}) {
  return (
    <div className="portal-form-row">
      <FieldLabel label="Track">
        {(id) => (
          <select id={id} value={track} onChange={(e) => onTrack(e.target.value as Track | 'all')}>
            <option value="all">Both tracks</option>
            <option value="hackathon">Hackathon</option>
            <option value="buildathon">Buildathon</option>
          </select>
        )}
      </FieldLabel>
      {onAudience && (
        <FieldLabel label="Who should see this?">
          {(id) => (
            <select
              id={id}
              value={audience}
              onChange={(e) => onAudience(e.target.value as Audience)}
            >
              <option value="all">All participants</option>
              <option value="lead">Team leads</option>
              <option value="member">Team members</option>
            </select>
          )}
        </FieldLabel>
      )}
    </div>
  );
}
export function TrackTabs({ value, onChange }: { value: Track; onChange: (track: Track) => void }) {
  return (
    <fieldset className="portal-segment">
      <legend className="sr-only">Track</legend>
      {(['hackathon', 'buildathon'] as const).map((track) => (
        <button
          key={track}
          type="button"
          aria-pressed={value === track}
          onClick={() => onChange(track)}
        >
          {trackLabel(track)}
        </button>
      ))}
    </fieldset>
  );
}
export function Pagination({
  offset,
  count,
  onChange,
  size = 50,
}: {
  offset: number;
  count: number;
  onChange: (offset: number) => void;
  size?: number;
}) {
  if (offset === 0 && count < size) return null;
  return (
    <div className="portal-pagination">
      <Button disabled={!offset} onClick={() => onChange(Math.max(0, offset - size))}>
        <ArrowLeft size={14} />
        Previous
      </Button>
      <span>Page {Math.floor(offset / size) + 1}</span>
      <Button disabled={count < size} onClick={() => onChange(offset + size)}>
        Next
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`portal-badge ${tone}`}>{children}</span>;
}
export function trackLabel(track: string) {
  return track === 'hackathon'
    ? 'Hackathon'
    : track === 'buildathon'
      ? 'Buildathon'
      : 'Both tracks';
}
export function roleLabel(role: string) {
  return (
    (
      {
        lead: 'Team lead',
        member: 'Team member',
        judge: 'Judge',
        admin: 'Administrator',
        owner: 'Event owner',
      } as Record<string, string>
    )[role] || role
  );
}
export function dateTime(value: string | null | undefined) {
  return value
    ? `${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))} IST`
    : 'No deadline';
}
export function localInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function toISO(value: string) {
  return value ? new Date(value).toISOString() : null;
}
export function money(value: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    Number(value),
  );
}
