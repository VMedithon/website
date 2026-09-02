import { useState } from "react";
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

type DashboardProps = { readonly onClose: () => void };

export function Dashboard({ onClose }: DashboardProps) {
	const [active, setActive] = useState<DashboardView>("overview");
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
				<div className="profile"><div>SG</div><span><strong>Srijan G.</strong><small>Master admin</small></span><ChevronDown /></div>
			</aside>
			<section className="dash-main">
				<header className="dash-topbar">
					<div><span className="status-chip"><i /> Frontend preview</span><span>Changes are stored in this demo only</span></div>
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

function PageTitle({ eyebrow, title, action }: { readonly eyebrow: string; readonly title: string; readonly action?: string }) {
	return <div className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action && <button type="button" className="dash-primary"><Plus />{action}</button>}</div>;
}

function Overview({ navigate }: { readonly navigate: (view: DashboardView) => void }) {
	const stats = [
		{ label: "Teams registered", value: "842", note: "+68 this week", icon: Users },
		{ label: "PPT submissions", value: "614", note: "73% complete", icon: FileCheck2 },
		{ label: "Forms live", value: "08", note: "1 needs review", icon: ClipboardList },
		{ label: "Finance requests", value: "₹48.2K", note: "₹12.4K pending", icon: CircleDollarSign },
	] as const;
	return <>
		<PageTitle eyebrow="MONDAY, 31 AUGUST" title="Good evening, Srijan." action="Quick create" />
		<div className="stat-grid">{stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label}><div><span>{stat.label}</span><Icon /></div><strong>{stat.value}</strong><small>{stat.note}</small></article>; })}</div>
		<div className="dash-two-col">
			<section className="panel"><div className="panel-title"><div><span>REGISTRATION PIPELINE</span><h2>Team status</h2></div><button type="button"><MoreHorizontal /></button></div>
				<div className="pipeline">
					<div><span>All registrations</span><strong>842</strong><i style={{ width: "100%" }} /></div>
					<div><span>Payment confirmed</span><strong>706</strong><i style={{ width: "84%" }} /></div>
					<div><span>PPT submitted</span><strong>614</strong><i style={{ width: "73%" }} /></div>
					<div><span>Mentor assigned</span><strong>312</strong><i style={{ width: "37%" }} /></div>
				</div>
			</section>
			<section className="panel"><div className="panel-title"><div><span>NEEDS ATTENTION</span><h2>Action queue</h2></div></div>
				<button type="button" className="action-row" onClick={() => navigate("finance")}><span className="action-icon gold"><CircleDollarSign /></span><span><strong>12 finance requests</strong><small>Awaiting approval</small></span><ArrowUpRight /></button>
				<button type="button" className="action-row" onClick={() => navigate("submissions")}><span className="action-icon blue"><FileCheck2 /></span><span><strong>48 unassigned pitches</strong><small>Need faculty reviewers</small></span><ArrowUpRight /></button>
				<button type="button" className="action-row" onClick={() => navigate("forms")}><span className="action-icon purple"><ClipboardList /></span><span><strong>Stay preference form</strong><small>Closes in 2 days</small></span><ArrowUpRight /></button>
			</section>
		</div>
	</>;
}

function FormStudio() {
	const [fieldCount, setFieldCount] = useState(4);
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
	return <>
		<PageTitle eyebrow="OPERATIONS / FORMS" title="Form studio" action="New form" />
		<div className="studio-layout">
			<section className="panel form-list"><div className="panel-title"><div><span>8 FORMS</span><h2>Event forms</h2></div></div>
				{["Participant registration", "Overnight stay preference", "Mentor feedback", "Final submission"].map((name, index) => <button type="button" className={index === 1 ? "selected" : ""} key={name}><span><strong>{name}</strong><small>{index === 3 ? "Draft" : "Published"} · {12 + index * 4} fields</small></span><MoreHorizontal /></button>)}
			</section>
			<section className="panel builder"><div className="builder-head"><div><span className="status-chip green">Published</span><h2>Overnight stay preference</h2><p>Collect accommodation and dietary requirements from confirmed teams.</p></div><button type="button" className="secondary-button">Preview</button></div>
				<div className="field-stack">
					{fields.map((field, index) => <div className="form-field" key={field.id}><GripVertical /><span><small>FIELD {index + 1}</small><strong>{field.label}</strong></span><MoreHorizontal /></div>)}
					<button type="button" className="add-field" onClick={() => setFieldCount((count) => count + 1)}><Plus /> Add field</button>
				</div>
			</section>
		</div>
	</>;
}

function Finance() {
	return <>
		<PageTitle eyebrow="OPERATIONS / FINANCE" title="Finance desk" action="New request" />
		<div className="finance-summary"><div><span>Total approved</span><strong>₹1,82,460</strong><small>42 requests</small></div><div><span>Awaiting approval</span><strong>₹12,440</strong><small>12 requests</small></div><div><span>Budget remaining</span><strong>₹3,05,100</strong><small>62.4% available</small></div></div>
		<section className="panel table-panel"><div className="panel-title"><div><span>PAYMENT QUEUE</span><h2>Recent requests</h2></div><button type="button" className="secondary-button"><Upload /> Export report</button></div>
			<div className="data-table"><div className="table-row head"><span>REQUEST</span><span>RAISED BY</span><span>UPI ID</span><span>AMOUNT</span><span>STATUS</span></div>
				{[["Participant dinner advance", "Aarav Mehta", "aarav@okaxis", "₹8,500", "Pending"], ["Print collateral", "Design team", "vmedesign@upi", "₹3,240", "Approved"], ["Mentor travel", "S. Priya", "priya92@ybl", "₹4,800", "Paid"], ["Workshop materials", "Build team", "build.vit@okicici", "₹6,100", "Review"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 4 ? `table-status ${cell.toLowerCase()}` : ""}>{cell}</span>)}</div>)}
			</div>
		</section>
	</>;
}

function Certificates() {
	return <>
		<PageTitle eyebrow="AUTOMATION / CERTIFICATES" title="Certificate studio" action="New template" />
		<div className="certificate-layout">
			<section className="panel cert-preview"><div className="certificate-canvas"><div className="cert-emblem">V</div><small>CERTIFICATE OF ACHIEVEMENT</small><p>This certificate is proudly presented to</p><h2>PARTICIPANT NAME</h2><p>for exceptional work in the Research Track at</p><strong>VMEDITHON 2026</strong><span>VMT26-R-0001</span></div></section>
			<section className="panel cert-controls"><div className="panel-title"><div><span>TEMPLATE SETTINGS</span><h2>Participant · Research</h2></div></div>
				<button type="button" className="upload-box"><ImagePlus /><strong>Replace background</strong><small>PNG or JPG · 1600 × 1131 recommended</small></button>
				<label>Recipient name field<select><option>Participant full name</option></select></label>
				<label>Certificate ID prefix<input value="VMT26-R-" readOnly /></label>
				<div className="control-actions"><button type="button" className="secondary-button">Save draft</button><button type="button" className="dash-primary"><Check /> Publish template</button></div>
			</section>
		</div>
	</>;
}

function People() {
	return <>
		<PageTitle eyebrow="ACCESS CONTROL" title="People & permissions" action="Invite people" />
		<section className="panel roles-panel"><div className="role-card master"><ShieldCheck /><span><small>2 ACCOUNTS</small><strong>Master admins</strong><p>Full access to all systems, data, finance, and permission controls.</p></span></div><div className="role-card"><Users /><span><small>6 ACCOUNTS</small><strong>Faculty coordinators</strong><p>Event-wide view, reviewer assignment, reporting, and overrides.</p></span></div><div className="role-card"><Users /><span><small>24 ACCOUNTS</small><strong>Organizing committee</strong><p>Granular access based on department and operational responsibility.</p></span></div></section>
		<section className="panel invite-panel"><div><span className="kicker">MAGIC-LINK ONBOARDING</span><h2>Invite someone with the right access.</h2><p>Choose a role and permissions now. The invitee receives a secure account setup link with no role selection required.</p></div><div className="invite-form"><label>Email address<input placeholder="coordinator@vit.ac.in" /></label><label>Role<select><option>Organizing committee</option><option>Faculty coordinator</option><option>Judge</option><option>Mentor</option></select></label><div className="permission-chips"><button type="button" className="active">Forms</button><button type="button">Finance</button><button type="button" className="active">Submissions</button><button type="button">Certificates</button></div><button type="button" className="dash-primary"><Send /> Send invitation</button></div></section>
	</>;
}

function Submissions() {
	return <>
		<PageTitle eyebrow="ROUND ONE / REVIEW" title="Pitch submissions" />
		<div className="submission-actions"><button type="button" className="upload-card"><Upload /><span><strong>Import Devnovate dataset</strong><small>Upload CSV, XLSX, or exported submission data</small></span><ArrowUpRight /></button><button type="button" className="upload-card"><FilePlus2 /><span><strong>Assign faculty reviewers</strong><small>48 pitches are currently unassigned</small></span><ArrowUpRight /></button></div>
		<section className="panel table-panel"><div className="panel-title"><div><span>614 SUBMISSIONS</span><h2>Latest pitches</h2></div><button type="button" className="secondary-button">Filter by track</button></div>
			<div className="data-table submissions-table"><div className="table-row head"><span>TEAM</span><span>IDEA</span><span>PROPOSED TRACK</span><span>SCORE</span><span>REVIEW</span></div>
				{[["Team Axiom", "Low-cost tactile navigation", "Research", "86", "Complete"], ["Byte Forge", "Cold-chain telemetry layer", "Industry", "—", "Unassigned"], ["Makers 17", "Modular mobility aid", "Project", "78", "Complete"], ["Neural North", "Clinical note compression", "Research", "—", "In review"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 4 ? `table-status ${cell.toLowerCase().replace(" ", "-")}` : ""}>{cell}</span>)}</div>)}
			</div>
		</section>
	</>;
}

function Settings() {
	return <><PageTitle eyebrow="CONFIGURATION" title="Event settings" /><section className="panel settings-panel"><div><h2>Deployment lock</h2><p>Once enabled, public event structure and documentation cannot be changed without a master-admin override.</p></div><button type="button" className="toggle"><span /></button></section><section className="panel settings-panel"><div><h2>Email configuration</h2><p>SMTP, DKIM, and DMARC status will appear here after infrastructure is connected.</p></div><span className="status-chip">Not connected</span></section><section className="panel settings-panel"><div><h2>Backup audit stream</h2><p>Append-only backup database health and export controls will appear here.</p></div><span className="status-chip">Frontend only</span></section></>;
}
