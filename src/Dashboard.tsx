import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser, SignInButton } from "@clerk/react";
import {
	ArrowUpRight,
	Check,
	ChevronDown,
	CircleDollarSign,
	ClipboardList,
	FileCheck2,
	FilePlus2,
	GripVertical,
	ImagePlus,
	MoreHorizontal,
	Plus,
	Send,
	ShieldCheck,
	Upload,
	Users,
	X,
} from "lucide-react";
import { dashboardNav, type DashboardView } from "./data";
import { useApi } from "./lib/api";

const ROLES = ["master_admin", "faculty_coordinator", "organizing_committee", "judge", "mentor"] as const;
const MODULES = ["forms", "finance", "submissions", "certificates"] as const;

function formatRupees(paise: number): string {
	return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function statusClass(status: string): string {
	return status.toLowerCase().replace(/_/g, "-");
}

type DashboardProps = { readonly onClose: () => void };

export function Dashboard({ onClose }: DashboardProps) {
	const [active, setActive] = useState<DashboardView>("overview");
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const name = user?.fullName ?? user?.firstName ?? "User";
	const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

	if (!isSignedIn) {
		return (
			<div className="modal-backdrop" role="presentation">
				<div className="verify-modal" role="dialog" aria-modal="true" aria-label="Sign in required" style={{ textAlign: "center" }}>
					<h2>Control Room</h2>
					<p>Sign in with your Clerk account to access the platform.</p>
					<SignInButton mode="modal" />
					<button type="button" className="icon-button close-modal" onClick={onClose} style={{ position: "absolute", top: 16, right: 16 }}><X /></button>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard-overlay">
			<aside className="dash-sidebar">
				<div className="dash-brand"><span className="brand-mark"><span>V</span></span><span>CONTROL ROOM<small>VMEDITHON 2026</small></span></div>
				<nav>
					{dashboardNav.map((item) => {
						const Icon = item.icon;
						return <button type="button" className={active === item.id ? "active" : ""} key={item.id} onClick={() => setActive(item.id)}><Icon />{item.label}</button>;
					})}
				</nav>
				<div className="profile"><div>{initials}</div><span><strong>{name}</strong><small>Master admin</small></span><ChevronDown /></div>
			</aside>
			<section className="dash-main">
				<header className="dash-topbar">
					<div><span className="status-chip"><i /> Live data</span><span>Connected to the worker API</span></div>
					<button type="button" className="icon-button" onClick={onClose} aria-label="Close platform"><X /></button>
				</header>
				<div className="dash-content">
					<DashboardContent active={active} navigate={setActive} />
				</div>
			</section>
		</div>
	);
}

function DashboardContent({ active, navigate }: { readonly active: DashboardView; readonly navigate: (view: DashboardView) => void }) {
	switch (active) {
		case "overview": return <Overview navigate={navigate} />;
		case "forms": return <FormStudio />;
		case "finance": return <Finance />;
		case "certificates": return <Certificates />;
		case "people":
		case "invitations": return <People />;
		case "submissions": return <Submissions />;
		case "settings": return <Settings />;
		default: return null;
	}
}

function PageTitle({ eyebrow, title, action, onAction }: { readonly eyebrow: string; readonly title: string; readonly action?: string; readonly onAction?: () => void }) {
	return <div className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action && <button type="button" className="dash-primary" onClick={onAction}><Plus />{action}</button>}</div>;
}

function useFetch<T>(path: string) {
	const api = useApi();
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const refetch = () => api(path).then((res) => setData(res as T)).catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		api(path)
			.then((res) => {
				if (!cancelled) {
					setData(res as T);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Failed to load");
					setLoading(false);
				}
			});
		return () => { cancelled = true; };
	}, [api, path]);

	return { data, loading, error, refetch };
}

function Empty({ message }: { readonly message: string }) {
	return <div className="panel" style={{ padding: 24 }}><p>{message}</p></div>;
}

function Overview({ navigate }: { readonly navigate: (view: DashboardView) => void }) {
	const api = useApi();
	const [counts, setCounts] = useState<{ teams: number; submissions: number; pending_reviews: number; pending_finance: number; issued_certificates: number; selected_teams: number } | null>(null);
	const [forms, setForms] = useState<{ items: { id: string; title: string; status: string }[] } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		Promise.all([
			api("/staff/overview"),
			api("/staff/forms"),
		])
			.then(([overview, formsData]) => {
				setCounts(overview as typeof counts);
				setForms(formsData as typeof forms);
				setLoading(false);
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to load");
				setLoading(false);
			});
	}, [api]);

	const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
	const stats = useMemo(() => {
		if (!counts) return [];
		return [
			{ label: "Teams registered", value: String(counts.teams), note: `${counts.selected_teams} selected`, icon: Users },
			{ label: "PPT submissions", value: String(counts.submissions), note: `${counts.pending_reviews} pending review`, icon: FileCheck2 },
			{ label: "Forms live", value: String(forms?.items.filter((f) => f.status === "published").length ?? 0), note: "active forms", icon: ClipboardList },
			{ label: "Finance requests", value: formatRupees(counts.pending_finance), note: "pending", icon: CircleDollarSign },
		];
	}, [counts, forms]);

	if (loading) return <Empty message="Loading overview..." />;
	if (error) return <Empty message={error} />;

	const draftForms = forms?.items.filter((f) => f.status === "draft") ?? [];

	return <>
		<PageTitle eyebrow={date.toUpperCase()} title="Good evening." action="Quick create" />
		<div className="stat-grid">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label}><div><span>{stat.label}</span><Icon /></div><strong>{stat.value}</strong><small>{stat.note}</small></article>; })}</div>
		<div className="dash-two-col">
			<section className="panel"><div className="panel-title"><div><span>REGISTRATION PIPELINE</span><h2>Team status</h2></div><button type="button"><MoreHorizontal /></button></div>
				<div className="pipeline">
					<div><span>All registrations</span><strong>{counts?.teams ?? 0}</strong><i style={{ width: "100%" }} /></div>
					<div><span>Selected</span><strong>{counts?.selected_teams ?? 0}</strong><i style={{ width: counts?.teams ? `${(counts.selected_teams / counts.teams) * 100}%` : "0%" }} /></div>
					<div><span>PPT submitted</span><strong>{counts?.submissions ?? 0}</strong><i style={{ width: counts?.teams ? `${(counts.submissions / counts.teams) * 100}%` : "0%" }} /></div>
					<div><span>Pending reviews</span><strong>{counts?.pending_reviews ?? 0}</strong><i style={{ width: counts?.submissions ? `${(counts.pending_reviews / counts.submissions) * 100}%` : "0%" }} /></div>
				</div>
			</section>
			<section className="panel"><div className="panel-title"><div><span>NEEDS ATTENTION</span><h2>Action queue</h2></div></div>
				<button type="button" className="action-row" onClick={() => navigate("finance")}><span className="action-icon gold"><CircleDollarSign /></span><span><strong>{counts?.pending_finance ?? 0} finance requests</strong><small>Awaiting approval</small></span><ArrowUpRight /></button>
				<button type="button" className="action-row" onClick={() => navigate("submissions")}><span className="action-icon blue"><FileCheck2 /></span><span><strong>{counts?.pending_reviews ?? 0} reviews pending</strong><small>Need faculty reviewers</small></span><ArrowUpRight /></button>
				{draftForms[0]?.title && <button type="button" className="action-row" onClick={() => navigate("forms")}><span className="action-icon purple"><ClipboardList /></span><span><strong>{draftForms[0].title}</strong><small>Draft form needs publishing</small></span><ArrowUpRight /></button>}
			</section>
		</div>
	</>;
}

function FormStudio() {
	const [fieldCount, setFieldCount] = useState(4);
	const [selected, setSelected] = useState(0);
	const { data: forms, loading, error } = useFetch<{ items: { id: string; title: string; status: string; audience: string; fieldCount?: number }[] }>("/staff/forms");

	const fields = [
		{ id: "team-id", label: "Team ID · Short answer" },
		{ id: "overnight", label: "Will your team stay overnight? · Multiple choice" },
		{ id: "member-count", label: "Number of members staying · Number" },
		{ id: "dietary", label: "Dietary requirements · Checkboxes" },
		...Array.from({ length: Math.max(0, fieldCount - 4) }, (_, order) => ({
			id: `new-field-${order + 1}`,
			label: "New question · Short answer",
		})),
	];

	if (loading) return <Empty message="Loading forms..." />;
	if (error) return <Empty message={error} />;

	const list = forms?.items ?? [];
	const current = list[selected] ?? { title: "Overnight stay preference", status: "published", audience: "team" };

	return <>
		<PageTitle eyebrow="OPERATIONS / FORMS" title="Form studio" action="New form" onAction={() => { /* TODO: open create form modal */ }} />
		<div className="studio-layout">
			<section className="panel form-list"><div className="panel-title"><div><span>{list.length} FORMS</span><h2>Event forms</h2></div></div>
				{list.length === 0 && <p style={{ padding: 16 }}>No forms yet.</p>}
				{list.map((form, index) => <button type="button" className={index === selected ? "selected" : ""} key={form.id} onClick={() => setSelected(index)}><span><strong>{form.title}</strong><small>{form.status} · {form.audience}</small></span><MoreHorizontal /></button>)}
			</section>
			<section className="panel builder"><div className="builder-head"><div><span className={`status-chip ${current.status === "published" ? "green" : ""}`}>{current.status}</span><h2>{current.title}</h2><p>{current.audience === "team" ? "Collect team-level responses." : "Collect individual participant responses."}</p></div><button type="button" className="secondary-button">Preview</button></div>
				<div className="field-stack">
					{fields.map((field, index) => <div className="form-field" key={field.id}><GripVertical /><span><small>FIELD {index + 1}</small><strong>{field.label}</strong></span><MoreHorizontal /></div>)}
					<button type="button" className="add-field" onClick={() => setFieldCount((count) => count + 1)}><Plus /> Add field</button>
				</div>
			</section>
		</div>
	</>;
}

function Finance() {
	const { data, loading, error } = useFetch<{ items: { id: string; title: string; raised_by: string; payee_name: string; upi_id: string; amount_paise: number; category: string | null; status: string; created_at: string }[]; summary: { approved_paise: number; paid_paise: number } }>("/staff/finance");

	if (loading) return <Empty message="Loading finance..." />;
	if (error) return <Empty message={error} />;

	const approved = data?.summary.approved_paise ?? 0;
	const paid = data?.summary.paid_paise ?? 0;
	const requests = data?.items ?? [];

	return <>
		<PageTitle eyebrow="OPERATIONS / FINANCE" title="Finance desk" action="New request" />
		<div className="finance-summary"><div><span>Total approved</span><strong>{formatRupees(approved)}</strong></div><div><span>Total paid</span><strong>{formatRupees(paid)}</strong></div><div><span>Open requests</span><strong>{requests.filter((r) => r.status === "pending" || r.status === "review").length}</strong></div></div>
		<section className="panel table-panel"><div className="panel-title"><div><span>PAYMENT QUEUE</span><h2>Recent requests</h2></div><button type="button" className="secondary-button"><Upload /> Export report</button></div>
			<div className="data-table"><div className="table-row head"><span>REQUEST</span><span>RAISED BY</span><span>UPI ID</span><span>AMOUNT</span><span>STATUS</span></div>
				{requests.map((row) => <div className="table-row" key={row.id}>
					<span>{row.title}</span>
					<span>{row.raised_by}</span>
					<span>{row.upi_id}</span>
					<span>{formatRupees(row.amount_paise)}</span>
					<span className={`table-status ${statusClass(row.status)}`}>{row.status}</span>
				</div>)}
				{requests.length === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No finance requests yet.</span></div>}
			</div>
		</section>
	</>;
}

function Certificates() {
	const { data: templates, loading, error } = useFetch<{ items: { id: string; name: string; track: string | null; kind: string; id_prefix: string; status: string }[] }>("/staff/certificates/templates");
	const { data: certs } = useFetch<{ items: { id: string; certificate_id: string; recipient_name: string; track: string | null; status: string; issued_at: string | null }[] }>("/staff/certificates");

	if (loading) return <Empty message="Loading certificates..." />;
	if (error) return <Empty message={error} />;

	const current = templates?.items[0] ?? { name: "Participant · Research", track: null as string | null, kind: "participant", id_prefix: "VMT26-R-", status: "draft" };

	return <>
		<PageTitle eyebrow="AUTOMATION / CERTIFICATES" title="Certificate studio" action="New template" />
		<div className="certificate-layout">
			<section className="panel cert-preview"><div className="certificate-canvas"><div className="cert-emblem">V</div><small>CERTIFICATE OF ACHIEVEMENT</small><p>This certificate is proudly presented to</p><h2>PARTICIPANT NAME</h2><p>for exceptional work in the {current.track ?? current.kind} Track at</p><strong>VMEDITHON 2026</strong><span>{current.id_prefix}0001</span></div></section>
			<section className="panel cert-controls"><div className="panel-title"><div><span>TEMPLATES</span><h2>{current.name}</h2></div></div>
				{templates?.items.length === 0 && <p>No templates yet.</p>}
				{templates?.items.map((t) => <div key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}><strong>{t.name}</strong><small> · {t.status}</small></div>)}
				<button type="button" className="upload-box"><ImagePlus /><strong>Replace background</strong><small>PNG or JPG · 1600 × 1131 recommended</small></button>
				<div className="control-actions"><button type="button" className="secondary-button">Save draft</button><button type="button" className="dash-primary"><Check /> Publish template</button></div>
			</section>
		</div>
		<section className="panel table-panel" style={{ marginTop: 24 }}><div className="panel-title"><div><span>ISSUED CERTIFICATES</span><h2>Recent certificates</h2></div></div>
			<div className="data-table"><div className="table-row head"><span>CERTIFICATE ID</span><span>RECIPIENT</span><span>TRACK</span><span>STATUS</span></div>
				{certs?.items.map((c) => <div className="table-row" key={c.id}><span>{c.certificate_id}</span><span>{c.recipient_name}</span><span>{c.track ?? "—"}</span><span className={`table-status ${statusClass(c.status)}`}>{c.status}</span></div>)}
				{(certs?.items.length ?? 0) === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No certificates issued yet.</span></div>}
			</div>
		</section>
	</>;
}

function People() {
	const api = useApi();
	const { data: members, loading: membersLoading, error: membersError } = useFetch<{ items: { id: string; full_name: string | null; email: string; role: string; permissions: string[]; status: string }[] }>("/staff/members");
	const { data: invitations, loading: invitesLoading, error: invitesError, refetch: refetchInvites } = useFetch<{ items: { id: string; email: string; role: string; status: string; permissions: string[] }[] }>("/staff/invitations");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<(typeof ROLES)[number]>("organizing_committee");
	const [permissions, setPermissions] = useState<string[]>([]);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const roleCounts = useMemo(() => {
		const counts = {} as Record<(typeof ROLES)[number], number>;
		for (const role of ROLES) counts[role] = 0;
		for (const m of members?.items ?? []) counts[m.role as (typeof ROLES)[number]] = (counts[m.role as (typeof ROLES)[number]] ?? 0) + 1;
		return counts;
	}, [members]);

	async function invite(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setMessage(null);
		try {
			await api("/staff/invitations", { method: "POST", body: JSON.stringify({ email, role, permissions }) });
			setEmail("");
			setPermissions([]);
			setMessage("Invitation sent.");
			void refetchInvites();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Failed to send invitation");
		} finally {
			setBusy(false);
		}
	}

	const loading = membersLoading || invitesLoading;
	const error = membersError || invitesError;
	if (loading) return <Empty message="Loading people..." />;
	if (error) return <Empty message={error} />;

	return <>
		<PageTitle eyebrow="ACCESS CONTROL" title="People & permissions" action="Invite people" />
		<section className="panel roles-panel">
			<div className="role-card master"><ShieldCheck /><span><small>{roleCounts.master_admin} ACCOUNTS</small><strong>Master admins</strong><p>Full access to all systems, data, finance, and permission controls.</p></span></div>
			<div className="role-card"><Users /><span><small>{roleCounts.faculty_coordinator} ACCOUNTS</small><strong>Faculty coordinators</strong><p>Event-wide view, reviewer assignment, reporting, and overrides.</p></span></div>
			<div className="role-card"><Users /><span><small>{roleCounts.organizing_committee + roleCounts.judge + roleCounts.mentor} ACCOUNTS</small><strong>Committee, judges & mentors</strong><p>Granular access based on department and operational responsibility.</p></span></div>
		</section>

		<section className="panel table-panel" style={{ marginBottom: 24 }}><div className="panel-title"><div><span>STAFF MEMBERS</span><h2>Current team</h2></div></div>
			<div className="data-table"><div className="table-row head"><span>NAME</span><span>EMAIL</span><span>ROLE</span><span>STATUS</span></div>
				{members?.items.map((m) => <div className="table-row" key={m.id}>
					<span>{m.full_name ?? "—"}</span>
					<span>{m.email}</span>
					<span className="capitalize">{m.role.replace(/_/g, " ")}</span>
					<span className={`table-status ${m.status}`}>{m.status}</span>
				</div>)}
				{(members?.items.length ?? 0) === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No staff members yet.</span></div>}
			</div>
		</section>

		<section className="panel invite-panel"><div><span className="kicker">MAGIC-LINK ONBOARDING</span><h2>Invite someone with the right access.</h2><p>Choose a role and permissions now. The invitee receives a secure account setup link with no role selection required.</p></div>
			<form className="invite-form" onSubmit={invite}>
				<label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="coordinator@vit.ac.in" required /></label>
				<label>Role<select value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
					{ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
				</select></label>
				<div className="permission-chips">
					{MODULES.map((mod) => <button type="button" key={mod} className={permissions.includes(mod) ? "active" : ""} onClick={() => setPermissions((p) => p.includes(mod) ? p.filter((x) => x !== mod) : [...p, mod])}>{mod}</button>)}
				</div>
				<button type="submit" className="dash-primary" disabled={busy}><Send /> {busy ? "Sending..." : "Send invitation"}</button>
				{message && <p>{message}</p>}
			</form>
		</section>

		{invitations && invitations.items.length > 0 && <section className="panel table-panel" style={{ marginTop: 24 }}><div className="panel-title"><div><span>PENDING INVITATIONS</span><h2>Outstanding invites</h2></div></div>
			<div className="data-table"><div className="table-row head"><span>EMAIL</span><span>ROLE</span><span>STATUS</span></div>
				{invitations.items.map((inv) => <div className="table-row" key={inv.id}><span>{inv.email}</span><span className="capitalize">{inv.role.replace(/_/g, " ")}</span><span className={`table-status ${inv.status}`}>{inv.status}</span></div>)}
			</div>
		</section>}
	</>;
}

function Submissions() {
	const api = useApi();
	const { data, loading, error, refetch } = useFetch<{ items: { id: string; team_id: string; team_name: string; round: number; kind: string; title: string; proposed_track: string; status: string; created_at: string }[] }>("/staff/submissions");
	const [importing, setImporting] = useState(false);

	async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		setImporting(true);
		const formData = new FormData();
		formData.append("file", file);
		try {
			await api("/staff/imports", { method: "POST", body: formData });
			void refetch();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Import failed");
		} finally {
			setImporting(false);
			event.target.value = "";
		}
	}

	if (loading) return <Empty message="Loading submissions..." />;
	if (error) return <Empty message={error} />;

	const items = data?.items ?? [];

	return <>
		<PageTitle eyebrow="ROUND ONE / REVIEW" title="Pitch submissions" />
		<div className="submission-actions">
			<label className="upload-card" style={{ cursor: "pointer" }}><input type="file" style={{ display: "none" }} onChange={importFile} disabled={importing} /><Upload /><span><strong>{importing ? "Importing..." : "Import Devnovate dataset"}</strong><small>Upload CSV, XLSX, or exported submission data</small></span><ArrowUpRight /></label>
			<button type="button" className="upload-card" onClick={() => { /* TODO: bulk reviewer assignment */ }}><FilePlus2 /><span><strong>Assign faculty reviewers</strong><small>{items.filter((s) => s.status === "received").length} pitches unassigned</small></span><ArrowUpRight /></button>
		</div>
		<section className="panel table-panel"><div className="panel-title"><div><span>{items.length} SUBMISSIONS</span><h2>Latest pitches</h2></div><button type="button" className="secondary-button">Filter by track</button></div>
			<div className="data-table submissions-table"><div className="table-row head"><span>TEAM</span><span>IDEA</span><span>PROPOSED TRACK</span><span>STATUS</span><span>REVIEW</span></div>
				{items.map((row) => <div className="table-row" key={row.id}>
					<span>{row.team_name}</span>
					<span>{row.title}</span>
					<span>{row.proposed_track}</span>
					<span className={`table-status ${statusClass(row.status)}`}>{row.status}</span>
					<span className={`table-status ${row.status === "assigned" ? "complete" : row.status === "scored" ? "in-review" : "unassigned"}`}>{row.status === "assigned" ? "Complete" : row.status === "scored" ? "Scored" : "In review"}</span>
				</div>)}
				{items.length === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No submissions yet.</span></div>}
			</div>
		</section>
	</>;
}

function Settings() {
	const api = useApi();
	const { data, loading, error, refetch } = useFetch<Record<string, unknown>>("/staff/settings");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const locked = data?.deployment_lock === true || data?.deployment_lock === "true";

	async function toggleLock() {
		setSaving(true);
		setMessage(null);
		try {
			await api("/staff/settings", { method: "PATCH", body: JSON.stringify({ deployment_lock: !locked }) });
			setMessage("Settings saved.");
			void refetch();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <Empty message="Loading settings..." />;
	if (error) return <Empty message={error} />;

	return <>
		<PageTitle eyebrow="CONFIGURATION" title="Event settings" />
		<section className="panel settings-panel"><div><h2>Deployment lock</h2><p>Once enabled, public event structure and documentation cannot be changed without a master-admin override.</p></div>
			<button type="button" className={`toggle ${locked ? "active" : ""}`} onClick={toggleLock} disabled={saving}><span /></button>
		</section>
		{message && <p style={{ padding: 12, background: locked ? "#e8f5e9" : "#fff3cd" }}>{message}</p>}
		<section className="panel settings-panel"><div><h2>Email configuration</h2><p>SMTP, DKIM, and DMARC status will appear here after infrastructure is connected.</p></div><span className="status-chip">Not connected</span></section>
		<section className="panel settings-panel"><div><h2>Backup audit stream</h2><p>Append-only backup database health and export controls will appear here.</p></div><span className="status-chip">Frontend only</span></section>
	</>;
}
