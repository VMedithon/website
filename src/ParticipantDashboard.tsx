import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	ArrowLeft,
	Save,
	Upload,
	FileText,
	Check,
	AlertCircle,
	Clock,
	Users,
	Award,
	MessageSquare,
	Calendar,
	MapPin,
	Moon,
	Sun,
} from "lucide-react";
import logoUrl from "./assets/logo.png";
import { useTheme } from "./hooks/useTheme";
import { problemStatements, emptyParticipant, type ParticipantData } from "./data";

const STORAGE_KEY = "vmedition.participant";

function useParticipant() {
	const [data, setData] = useState<ParticipantData>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? (JSON.parse(stored) as ParticipantData) : emptyParticipant;
		} catch {
			return emptyParticipant;
		}
	});

	const persist = (next: ParticipantData) => {
		setData(next);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			/* ignore */
		}
	};

	const update = (patch: Partial<ParticipantData>) => persist({ ...data, ...patch });

	return { data, persist, update };
}

function StatusPill({ status }: { status: "pending" | "yes" | "no" }) {
	const green = status === "yes";
	const label = status === "yes" ? "Shortlisted" : status === "no" ? "Not shortlisted" : "Review pending";
	return (
		<div className={`status-pill ${green ? "green" : status === "no" ? "red" : ""}`}>
			<i />
			<span>{label}</span>
		</div>
	);
}

export function ParticipantDashboard() {
	const { theme, toggle } = useTheme();
	const { data, update } = useParticipant();
	const [saved, setSaved] = useState(false);

	const submission = data.submission;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	const daysLeft = useMemo(() => {
		const now = new Date();
		const event = new Date("2026-09-15T00:00:00");
		const diff = Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diff > 0 ? diff : 0;
	}, []);

	return (
		<div className="dashboard-overlay">
			<aside className="dash-sidebar">
				<div className="dash-brand">
					<img src={logoUrl} alt="VMedition" className="dash-logo" style={{ width: 38, height: 38 }} />
					<div>
						<strong>VMedition</strong>
						<small>PARTICIPANT</small>
					</div>
				</div>
				<nav>
					<Link to="/" className="text-button" style={{ color: "#93aaa0", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12 }}>
						<ArrowLeft style={{ width: 17 }} />
						Back to site
					</Link>
				</nav>
				<div className="profile" style={{ marginTop: "auto" }}>
					<div style={{ background: "var(--brand-green)", color: "var(--brand-ink)", display: "grid", placeItems: "center", borderRadius: "50%", width: 36, height: 36, fontWeight: 800, fontSize: 11 }}>
						P
					</div>
					<span>Participant<br /><small style={{ color: "#748b82" }}>Local-only preview</small></span>
				</div>
			</aside>

			<main className="dash-main">
				<div className="dash-topbar">
					<div>
						<span style={{ fontSize: 10, color: "var(--ink-3)" }}>PARTICIPANT DASHBOARD</span>
					</div>
					<button className="theme-toggle" onClick={toggle} aria-label="Toggle theme" type="button">
						{theme === "dark" ? <Sun style={{ width: 17 }} /> : <Moon style={{ width: 17 }} />}
					</button>
				</div>

				<div className="dash-content">
					<div className="page-title">
						<div>
							<span>OVERVIEW</span>
							<h1>Your VMedition 2026 journey</h1>
						</div>
						<div className="status-chip green">
							<i />
							<span>{daysLeft} days until the event</span>
						</div>
					</div>

					<div className="stat-grid">
						<article>
							<div><span>Registration</span><Check style={{ width: 17, color: "var(--accent)" }} /></div>
							<strong>{data.registered ? "Registered" : "Not registered"}</strong>
							<small>Local-only preview</small>
						</article>
						<article>
							<div><span>Team</span><Users style={{ width: 17, color: "var(--accent)" }} /></div>
							<strong>{data.teamName || "Unnamed team"}</strong>
							<small>{`${data.teamMembers.length} members`}</small>
						</article>
						<article>
							<div><span>Challenge</span><FileText style={{ width: 17, color: "var(--accent)" }} /></div>
							<strong>{data.selectedProblem ? problemStatements.find(p => p.id === data.selectedProblem)?.title ?? "Selected" : "Not selected"}</strong>
							<small>{data.selectedProblem ? problemStatements.find(p => p.id === data.selectedProblem)?.domain : "Choose a problem statement"}</small>
						</article>
						<article>
							<div><span>Shortlisting</span><Award style={{ width: 17, color: "var(--accent)" }} /></div>
							<strong style={{ color: data.shortlisted === "yes" ? "var(--accent)" : data.shortlisted === "no" ? "var(--danger)" : "var(--brand-gold)" }}>
								{data.shortlisted === "yes" ? "Yes" : data.shortlisted === "no" ? "No" : "Pending"}
							</strong>
							<small>Round 1 review not started</small>
						</article>
					</div>

					<div className="dash-two-col">
						<form onSubmit={handleSubmit} className="panel" style={{ display: "grid", gap: 18 }}>
							<div className="panel-title">
								<div>
									<span>ROUND 1 SUBMISSION</span>
									<h2>Submit your proposal</h2>
								</div>
							</div>

							<label className="field-label">
								Team name
								<input
									value={data.teamName}
									onChange={(e) => update({ teamName: e.target.value })}
									placeholder="Your team name"
								/>
							</label>

							<label className="field-label">
								Team members (comma separated)
								<input
									value={data.teamMembers.join(", ")}
									onChange={(e) => update({ teamMembers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
									placeholder="Name 1, Name 2, ..."
								/>
							</label>

							<label className="field-label">
								Selected problem statement
								<select className="full"
									value={data.selectedProblem}
									onChange={(e) => update({ selectedProblem: e.target.value })}
								>
									<option value="">Choose a problem statement</option>
									{problemStatements.map((p) => (
										<option key={p.id} value={p.id}>{p.domain}: {p.title}</option>
									))}
								</select>
							</label>

							<label className="field-label">
								Problem understanding
								<textarea
									rows={3}
									value={submission.problemUnderstanding}
									onChange={(e) => update({ submission: { ...submission, problemUnderstanding: e.target.value } })}
									placeholder="What is the problem and who does it affect?"
								/>
							</label>

							<label className="field-label">
								Research
								<textarea
									rows={3}
									value={submission.research}
									onChange={(e) => update({ submission: { ...submission, research: e.target.value } })}
									placeholder="Existing approaches and the gap you found"
								/>
							</label>

							<label className="field-label">
								Proposed solution
								<textarea
									rows={3}
									value={submission.proposedSolution}
									onChange={(e) => update({ submission: { ...submission, proposedSolution: e.target.value } })}
									placeholder="Your solution in plain language"
								/>
							</label>

							<label className="field-label">
								Technical approach
								<textarea
									rows={3}
									value={submission.technicalApproach}
									onChange={(e) => update({ submission: { ...submission, technicalApproach: e.target.value } })}
									placeholder="Stack, architecture, and how it will be built"
								/>
							</label>

							<label className="field-label">
								Innovation / originality
								<textarea
									rows={2}
									value={submission.innovation}
									onChange={(e) => update({ submission: { ...submission, innovation: e.target.value } })}
									placeholder="What is new or non-obvious?"
								/>
							</label>

							<label className="field-label">
								Expected real-world impact
								<textarea
									rows={2}
									value={submission.impact}
									onChange={(e) => update({ submission: { ...submission, impact: e.target.value } })}
									placeholder="Who benefits and by how much?"
								/>
							</label>

							<div className="upload-box" style={{ marginTop: 4 }}>
								<Upload style={{ width: 24 }} />
								<strong>PPT / document upload</strong>
								<small>File upload is not enabled in this preview. In the final platform, documents will attach here.</small>
								<button
									type="button"
									className="secondary-button"
									onClick={() => update({ submission: { ...submission, pptUploaded: !submission.pptUploaded } })}
									style={{ marginTop: 10 }}
								>
									{submission.pptUploaded ? <Check style={{ width: 14 }} /> : <Upload style={{ width: 14 }} />}
									{submission.pptUploaded ? "Marked as uploaded" : "Mark as uploaded"}
								</button>
							</div>

							<div className="control-actions">
								<button type="submit" className="dash-primary">
									<Save style={{ width: 15 }} />
									{saved ? "Saved locally" : "Save draft locally"}
								</button>
							</div>

							<div className="note-banner" style={{ marginTop: 8 }}>
								<AlertCircle style={{ width: 18 }} />
								<span>This dashboard is local-only. No data leaves your browser until the official submission portal opens.</span>
							</div>
						</form>

						<div className="panel">
							<div className="panel-title">
								<div>
									<span>STATUS</span>
									<h2>Submission and shortlisting</h2>
								</div>
							</div>
							<div style={{ display: "grid", gap: 14 }}>
								<StatusPill status={data.shortlisted} />
								<div className="status-pill">
									<Clock style={{ width: 16 }} />
									<span>Round 2 eligibility: {data.round2Eligible ? "Eligible" : "Pending shortlisting"}</span>
								</div>
								<div className="status-pill">
									<Calendar style={{ width: 16 }} />
									<span>Deadline: to be announced</span>
								</div>
								<div className="status-pill">
									<MapPin style={{ width: 16 }} />
									<span>Venue: MG Auditorium, VIT Chennai</span>
								</div>
							</div>

							<div className="panel-title" style={{ marginTop: 34 }}>
								<div>
									<span>ANNOUNCEMENTS</span>
									<h2>Latest updates</h2>
								</div>
							</div>
							<div className="announcements">
								{data.announcements.map((a) => (
									<div key={a.text.slice(0, 30)} className="announcement">
										<small>{a.date}</small>
										<p>{a.text}</p>
									</div>
								))}
							</div>

							<div className="panel-title" style={{ marginTop: 34 }}>
								<div>
									<span>MENTORS</span>
									<h2>Your mentor panel</h2>
								</div>
							</div>
							<div className="mentor-list" style={{ display: "grid", gap: 10 }}>
								{["Student Mentors", "Faculty Mentors", "Industry Experts"].map((role) => (
									<div key={role} className="action-row" style={{ padding: "12px 0" }}>
										<span className="action-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
											<MessageSquare style={{ width: 15 }} />
										</span>
										<span>{role}<small>Assignments will appear after shortlisting</small></span>
									</div>
								))}
							</div>

							<div className="panel-title" style={{ marginTop: 34 }}>
								<div>
									<span>RESULTS & CERTIFICATES</span>
									<h2>After the event</h2>
								</div>
							</div>
							<p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
								Final submission/demo details, judging results, and certificate download links will appear here once the buildathon is complete.
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
