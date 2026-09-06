import { useEffect, useState } from "react";
import { useAuth, useUser, SignInButton } from "@clerk/react";
import { ArrowLeft, FileUp, Moon, Plus, Send, Sun, Users, X } from "lucide-react";
import logoUrl from "./assets/logo.png";
import { useTheme } from "./hooks/useTheme";
import { useApi } from "./lib/api";

type Tab = "team" | "submissions" | "forms";

const TRACKS = ["RESEARCH", "INDUSTRY", "PROJECT"] as const;

function useFetch<T>(path: string) {
	const api = useApi();
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = () =>
		api(path)
			.then((res) => setData(res as T))
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));

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

export function Participant({ onClose }: { readonly onClose: () => void }) {
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const { theme, toggle } = useTheme();
	const name = user?.fullName ?? user?.firstName ?? "Participant";
	const [tab, setTab] = useState<Tab>("team");

	if (!isSignedIn) {
		return (
			<div className="modal-backdrop" role="presentation">
				<div className="verify-modal" role="dialog" aria-modal="true" aria-label="Sign in required" style={{ textAlign: "center" }}>
					<div className="modal-brand"><img src={logoUrl} alt="VMEDITHON 2026" /></div>
					<h2>Participant portal</h2>
					<p>Sign in with your Clerk account to register your team and submit your pitch.</p>
					<SignInButton mode="modal" />
					<button type="button" className="icon-button close-modal" onClick={onClose} style={{ position: "absolute", top: 16, right: 16 }}><X /></button>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard-overlay">
			<aside className="dash-sidebar">
				<div className="dash-brand"><img className="dash-logo" src={logoUrl} alt="VMEDITHON 2026" /><span>PORTAL<small>VMEDITHON 2026</small></span></div>
				<nav>
					<button type="button" className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}><Users /> My team</button>
					<button type="button" className={tab === "submissions" ? "active" : ""} onClick={() => setTab("submissions")}><FileUp /> Submissions</button>
					<button type="button" className={tab === "forms" ? "active" : ""} onClick={() => setTab("forms")}><Send /> Forms</button>
				</nav>
				<div className="profile"><div>{name.slice(0, 2).toUpperCase()}</div><span><strong>{name}</strong><small>Participant</small></span></div>
			</aside>
			<section className="dash-main">
				<header className="dash-topbar">
					<div><span className="status-chip"><i /> Participant portal</span><span>Manage your team and round-one pitch</span></div>
					<button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle color theme">{theme === "dark" ? <Sun /> : <Moon />}</button>
					<button type="button" className="icon-button" onClick={onClose} aria-label="Close portal"><X /></button>
				</header>
				<div className="dash-content">
					{tab === "team" && <MyTeam />}
					{tab === "submissions" && <Submissions />}
					{tab === "forms" && <Forms />}
				</div>
			</section>
		</div>
	);
}

function MyTeam() {
	const api = useApi();
	const { data: team, loading, error, refetch } = useFetch<{ id: string; name: string; state: string; proposed_track: string | null; assigned_track: string | null; members: { id: string; email: string; display_name: string | null; role: string }[] }>("/me/team");
	const [creating, setCreating] = useState(false);
	const [inviting, setInviting] = useState(false);
	const [newName, setNewName] = useState("");
	const [newTrack, setNewTrack] = useState<(typeof TRACKS)[number]>("RESEARCH");
	const [inviteEmail, setInviteEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);

	async function createTeam(event: React.FormEvent) {
		event.preventDefault();
		setCreating(true);
		setMessage(null);
		try {
			await api("/teams", { method: "POST", body: JSON.stringify({ name: newName, proposed_track: newTrack }) });
			setNewName("");
			setMessage("Team created.");
			void refetch();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Failed to create team");
		} finally {
			setCreating(false);
		}
	}

	async function inviteMember(event: React.FormEvent) {
		event.preventDefault();
		setInviting(true);
		setMessage(null);
		try {
			await api("/me/team/members", { method: "POST", body: JSON.stringify({ email: inviteEmail }) });
			setInviteEmail("");
			setMessage("Invitation sent.");
			void refetch();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Failed to invite member");
		} finally {
			setInviting(false);
		}
	}

	if (loading) return <Empty message="Loading team..." />;
	if (error) {
		if (error.includes("not in a team") || error.includes("not_found")) {
			return <>
				<div className="page-title"><div><span>REGISTRATION</span><h1>Create your team</h1></div></div>
				<section className="panel invite-panel">
					<form onSubmit={createTeam} className="invite-form">
						<label>Team name<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Team Axiom" required maxLength={80} /></label>
						<label>Proposed track<select value={newTrack} onChange={(e) => setNewTrack(e.target.value as (typeof TRACKS)[number])}>{TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
						<button type="submit" className="dash-primary" disabled={creating}><Plus /> {creating ? "Creating..." : "Create team"}</button>
						{message && <p>{message}</p>}
					</form>
				</section>
			</>;
		}
		return <Empty message={error} />;
	}
	if (!team) return <Empty message="No team found." />;

	return <>
		<div className="page-title"><div><span>MY TEAM</span><h1>{team.name}</h1></div></div>
		<div className="dash-two-col">
			<section className="panel">
				<div className="panel-title"><div><span>ROSTER</span><h2>Team members</h2></div></div>
				<div className="data-table"><div className="table-row head"><span>NAME / EMAIL</span><span>ROLE</span></div>
					{team.members.map((m) => <div className="table-row" key={m.id}><span>{m.display_name ?? m.email}</span><span className={`table-status ${m.role}`}>{m.role}</span></div>)}
				</div>
			</section>
			<section className="panel invite-panel">
				<div><span className="kicker">INVITE</span><h2>Add a teammate.</h2><p>Enter their email address. They will join your team after signing in.</p></div>
				<form onSubmit={inviteMember} className="invite-form">
					<label>Email address<input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@vit.ac.in" required /></label>
					<button type="submit" className="dash-primary" disabled={inviting}><Send /> {inviting ? "Inviting..." : "Invite member"}</button>
					{message && <p>{message}</p>}
				</form>
			</section>
		</div>
	</>;
}

function Submissions() {
	const api = useApi();
	const { data: list, loading, error, refetch } = useFetch<{ items: { id: string; round: number; kind: string; title: string; proposed_track: string; status: string; file_key: string; created_at: string }[] }>("/me/submissions");
	const [uploading, setUploading] = useState(false);
	const [title, setTitle] = useState("");
	const [track, setTrack] = useState<(typeof TRACKS)[number]>("RESEARCH");
	const [message, setMessage] = useState<string | null>(null);

	async function upload(event: React.FormEvent) {
		event.preventDefault();
		const input = document.getElementById("pitch-file") as HTMLInputElement | null;
		const file = input?.files?.[0];
		if (!file) {
			setMessage("Please select a pitch file.");
			return;
		}
		setUploading(true);
		setMessage(null);
		const formData = new FormData();
		formData.append("file", file);
		formData.append("title", title);
		formData.append("proposed_track", track);
		try {
			await api("/me/submissions", { method: "POST", body: formData });
			setTitle("");
			if (input) input.value = "";
			setMessage("Pitch submitted.");
			void refetch();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Failed to submit");
		} finally {
			setUploading(false);
		}
	}

	if (loading) return <Empty message="Loading submissions..." />;
	if (error) return <Empty message={error} />;

	const items = list?.items ?? [];

	return <>
		<div className="page-title"><div><span>ROUND ONE</span><h1>Your pitch</h1></div></div>
		<section className="panel invite-panel" style={{ marginBottom: 24 }}>
			<div><span className="kicker">SUBMIT</span><h2>Upload round-one pitch.</h2><p>Accepted formats: PPT, PPTX, PDF. Maximum size 25 MB.</p></div>
			<form onSubmit={upload} className="invite-form">
				<label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Low-cost tactile navigation" required /></label>
				<label>Proposed track<select value={track} onChange={(e) => setTrack(e.target.value as (typeof TRACKS)[number])}>{TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
				<label style={{ border: "1px dashed #ccc", padding: 16, borderRadius: 8, cursor: "pointer" }}>Choose pitch file<input id="pitch-file" type="file" accept=".ppt,.pptx,.pdf" style={{ display: "none" }} required /></label>
				<button type="submit" className="dash-primary" disabled={uploading}><FileUp /> {uploading ? "Uploading..." : "Submit pitch"}</button>
				{message && <p>{message}</p>}
			</form>
		</section>
		<section className="panel table-panel">
			<div className="panel-title"><div><span>{items.length} SUBMISSIONS</span><h2>Your submissions</h2></div></div>
			<div className="data-table"><div className="table-row head"><span>TITLE</span><span>TRACK</span><span>STATUS</span></div>
				{items.map((s) => <div className="table-row" key={s.id}><span>{s.title}</span><span>{s.proposed_track}</span><span className={`table-status ${s.status.replace(/_/g, "-")}`}>{s.status}</span></div>)}
				{items.length === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No submissions yet.</span></div>}
			</div>
		</section>
	</>;
}

type FormField = { id: string; type: string; label: string; required: boolean; config?: { options?: string[] } };

function Forms() {
	const [selected, setSelected] = useState<string | null>(null);
	const { data, loading, error, refetch } = useFetch<{ items: { id: string; title: string; status: string; audience: string; closes_at: string | null }[] }>("/forms");

	if (selected) return <FormFill formId={selected} onClose={() => setSelected(null)} onSubmit={() => { setSelected(null); void refetch(); }} />;

	if (loading) return <Empty message="Loading forms..." />;
	if (error) return <Empty message={error} />;

	const items = data?.items ?? [];

	return <>
		<div className="page-title"><div><span>FORMS</span><h1>Assigned forms</h1></div></div>
		<section className="panel table-panel">
			<div className="data-table"><div className="table-row head"><span>FORM</span><span>AUDIENCE</span><span>STATUS</span></div>
				{items.map((f) => <button type="button" className="table-row" key={f.id} onClick={() => setSelected(f.id)} style={{ textAlign: "left", width: "100%" }}><span>{f.title}</span><span>{f.audience}</span><span className={`table-status ${f.status}`}>{f.status}</span></button>)}
				{items.length === 0 && <div className="table-row"><span style={{ gridColumn: "1 / -1" }}>No forms assigned to you yet.</span></div>}
			</div>
		</section>
	</>;
}

function FormFill({ formId, onClose, onSubmit }: { readonly formId: string; readonly onClose: () => void; readonly onSubmit: () => void }) {
	const api = useApi();
	const [data, setData] = useState<{ id: string; title: string; description: string | null; fields: FormField[] } | null>(null);
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		api(`/forms/${formId}`)
			.then((res) => setData(res as typeof data))
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load form"))
			.finally(() => setLoading(false));
	}, [api, formId]);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		try {
			await api(`/forms/${formId}/responses`, { method: "POST", body: JSON.stringify({ answers }) });
			onSubmit();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit");
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <Empty message="Loading form..." />;
	if (error) return <Empty message={error} />;
	if (!data) return <Empty message="Form not found." />;

	return <>
		<div className="page-title"><div><span><button type="button" className="icon-button" onClick={onClose}><ArrowLeft size={18} /></button> {data.title}</span><h1>{data.title}</h1></div></div>
		{data.description && <section className="panel" style={{ padding: 16, marginBottom: 24 }}><p>{data.description}</p></section>}
		<form onSubmit={submit} className="panel invite-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			{data.fields.map((field) => {
				const value = answers[field.id] ?? "";
				const options = field.config?.options ?? [];
				const inputId = `field-${field.id}`;
				return <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<p style={{ fontWeight: 600, margin: 0 }}>{field.label}{field.required && <span style={{ color: "red" }}> *</span>}</p>
					{field.type === "short_answer" && <input id={inputId} value={value as string} onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))} required={field.required} />}
					{field.type === "paragraph" && <textarea id={inputId} rows={4} value={value as string} onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))} required={field.required} />}
					{field.type === "number" && <input id={inputId} type="number" value={value as string} onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))} required={field.required} />}
					{field.type === "multiple_choice" && (
						<select id={inputId} value={value as string} onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))} required={field.required}>
							<option value="">Select an option</option>
							{options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
						</select>
					)}
					{field.type === "checkboxes" && (
						<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
							{options.map((opt) => {
								const values = (Array.isArray(value) ? value : [value]).filter(Boolean) as string[];
								return <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input type="checkbox" checked={values.includes(opt)} onChange={(e) => setAnswers((a) => {
										const list = (Array.isArray(a[field.id]) ? a[field.id] as string[] : a[field.id] ? [a[field.id] as string] : []);
										return { ...a, [field.id]: e.target.checked ? [...list, opt] : list.filter((v) => v !== opt) };
									})} />
									{opt}
								</label>;
							})}
						</div>
					)}

				</div>;
			})}
			{data.fields.length === 0 && <p>This form has no questions yet.</p>}
			<div style={{ display: "flex", gap: 8 }}>
				<button type="submit" className="dash-primary" disabled={saving}><Send /> {saving ? "Submitting..." : "Submit"}</button>
				<button type="button" className="secondary-button" onClick={onClose}>Back</button>
			</div>
			{error && <p>{error}</p>}
		</form>
	</>;
}
