import { useEffect, useState } from "react";
import { useLocation, Routes, Route, Link, useNavigate } from "react-router-dom";
import {
	ArrowRight,
	MapPin,
	Calendar,
	Clock,
	Menu,
	Moon,
	Sun,
	Check,
	Award,
	FileText,
	AlertCircle,
	ExternalLink,
} from "lucide-react";
import logoDarkUrl from "./assets/logo-dark.png";
import logoUrl from "./assets/logo.png";
import { ParticipantDashboard } from "./ParticipantDashboard";
import { useTheme } from "./hooks/useTheme";
import {
	navLinks,
	journeyStages,
	roundOne,
	roundTwo,
	problemStatements,
	roundOneCriteria,
	schedule,
	mentorGroups,
	industryRefinementAreas,
	innovationHighlights,
	finalJudgingCriteria,
	faq,
	venue,
	contact,
} from "./data";
import { useReveal } from "./hooks/useReveal";

function Anchor({ id }: { id: string }) {
	return <span id={id} className="anchor" />;
}

function Nav() {
	const { theme, toggle } = useTheme();
	const [open, setOpen] = useState(false);
	const { pathname } = useLocation();

	return (
		<nav className="nav-wrap" aria-label="Main">
			<Link to="/" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
				<img src={theme === "dark" ? logoDarkUrl : logoUrl} alt="VMedition" className="nav-logo" />
			</Link>
			<div className={`nav-links ${open ? "open" : ""}`}>
				{navLinks.map((l) => (
					<Link
						key={l.id}
						to={pathname === "/" ? l.path : `/${l.path.replace(/^\//, "")}`}
						onClick={() => setOpen(false)}
					>
						{l.label}
					</Link>
				))}
				<Link to="/dashboard" className="nav-cta">
					Register
					<ArrowRight style={{ width: 14, height: 14 }} />
				</Link>
			</div>
			<button
				className="theme-toggle"
				aria-label="Toggle theme"
				onClick={toggle}
				type="button"
			>
				{theme === "dark" ? <Sun /> : <Moon />}
			</button>
			<button
				className="mobile-menu"
				aria-label="Open menu"
				onClick={() => setOpen((s) => !s)}
				type="button"
			>
				<Menu />
			</button>
		</nav>
	);
}

function Footer() {
	return (
		<footer>
			<div>
				<strong className="brand" style={{ color: "#fff" }}>VMedition 2026</strong>
				<small style={{ display: "block", marginTop: 8, color: "#748b80" }}>
					Student-driven research and buildathon at VIT Chennai.
				</small>
			</div>
			<div>
				<strong style={{ color: "#fff" }}>Contact</strong>
				<a href={`mailto:${contact.email}`}>{contact.email}</a>
				<span>{contact.institution}</span>
				<span>{contact.team}</span>
			</div>
			<div>
				<strong style={{ color: "#fff" }}>Quick links</strong>
				<Link to="/#event-flow">Event flow</Link>
				<Link to="/#schedule">Schedule</Link>
				<Link to="/#challenges">Challenges</Link>
				<Link to="/dashboard">Participant dashboard</Link>
			</div>
			<small>© 2026 Team VMedition. Operational details are subject to confirmation.</small>
		</footer>
	);
}

function Hero() {
	const { theme } = useTheme();
	const nav = useNavigate();
	return (
		<section className="hero" id="hero">
			<div className="hero-grid" />
			<div className="hero-orbit orbit-one" />
			<div className="hero-orbit orbit-two" />
			<div className="hero-copy">
				<span className="eyebrow" data-reveal>
					<span />
					24-HOUR BUILDATHON
				</span>
				<img
					src={theme === "dark" ? logoDarkUrl : logoUrl}
					alt="VMedition"
					className="hero-logo"
					data-reveal
				/>
				<h1 data-reveal data-reveal-delay="1">
					VMedition <em>2026</em>
				</h1>
				<p data-reveal data-reveal-delay="2">
					15–16 September 2026 · MG Auditorium, VIT Chennai
				</p>
				<p data-reveal data-reveal-delay="2" style={{ marginTop: 10, maxWidth: 540, fontSize: 14, color: "var(--ink-3)" }}>
					Ideate. Build. Refine. Innovate. Research-driven prototypes, industry mentors, and real impact.
				</p>
				<div className="hero-actions" data-reveal data-reveal-delay="3">
					<Link to="/dashboard" className="button primary">
						Register / Participate
						<ArrowRight style={{ width: 16, height: 16 }} />
					</Link>
					<button
						type="button"
						className="button ghost"
						onClick={() => nav("/#event-flow")}
					>
						Explore Event
						<ArrowRight style={{ width: 16, height: 16 }} />
					</button>
				</div>
			</div>
			<div className="hero-card" data-reveal data-reveal-delay="4">
				<div className="hero-card-top">
					<span>LIVE PREVIEW</span>
					<span className="live-dot">Registrations opening soon</span>
				</div>
				<div className="date-block">
					<strong>15–16</strong>
					<span>
						SEP
						<br />
						2026
					</span>
				</div>
				<div className="event-meta">
					<div>
						<MapPin />
						<div>
							<small>VENUE</small>
							<span>MG Auditorium, VIT Chennai</span>
						</div>
						</div>
					<div>
						<Clock />
						<div>
							<small>DURATION</small>
							<span>24-hour buildathon</span>
						</div>
						</div>
					<div>
						<Calendar />
						<div>
							<small>FORMAT</small>
							<span>Two rounds · Research to prototype</span>
						</div>
						</div>
				</div>
			</div>
			<div className="hero-footnote">
				<ArrowRight style={{ width: 14 }} />
				Scroll to explore the event
			</div>
		</section>
	);
}

function SectionHeading({
	kicker,
	title,
	children,
	light = false,
}: {
	kicker: string;
	title: string;
	children?: React.ReactNode;
	light?: boolean;
}) {
	return (
		<div className="section-heading" data-reveal>
			<div>
				<span className={`kicker ${light ? "light" : ""}`}>{kicker}</span>
				<h2>{title}</h2>
			</div>
			{children && <p>{children}</p>}
		</div>
	);
}

function About() {
	return (
		<section className="section" id="about">
			<Anchor id="about" />
			<div className="section-heading" data-reveal>
				<div>
					<span className="kicker">ABOUT</span>
					<h2>Student-driven innovation for real-world health.</h2>
				</div>
				<p>
					VMedition is a 24-hour buildathon where students move beyond idea pitching to research-backed, functional prototyping. Teams work on real problem statements, validate with mentors, and refine with industry experts.
				</p>
			</div>
			<div className="experience-section" data-reveal>
				<div className="experience-visual">
					<div className="visual-noise" />
					<span className="vertical-label">RESEARCH · PROTOTYPE · IMPACT</span>
					<div className="quote-card">
						Functional prototypes. Industry validation. Potential patent-ready work.
					</div>
				</div>
				<div className="experience-copy">
					<p className="lead">
						Most hackathons stop at the demo. VMedition expects teams to understand the problem, research existing work, find the gap, and build something that could actually work.
					</p>
					<div className="feature-list">
						<div>
							<strong>01</strong>
							<div>
								<b>Research + development</b>
								<span>Not just pitching ideas — teams build and validate.</span>
							</div>
						</div>
						<div>
							<strong>02</strong>
							<div>
								<b>Real-world problem solving</b>
								<span>Problem statements are grounded in clinical and operational needs.</span>
							</div>
						</div>
						<div>
							<strong>03</strong>
							<div>
								<b>Industry interaction</b>
								<span>Experts review feasibility, architecture, and market fit.</span>
							</div>
						</div>
						<div>
							<strong>04</strong>
							<div>
								<b>Novel / patentable work</b>
								<span>Strong projects can be steered toward publication or IP.</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Journey() {
	return (
		<section className="journey-section" id="journey">
			<Anchor id="event-flow" />
			<div className="journey-intro" data-reveal>
				<span className="kicker light">THE EVENT JOURNEY</span>
				<h2>Research → Ideate → Learn → Build → Mentor → Refine → Demonstrate → Evaluate → Recognise</h2>
				<p>
					Nine stages take a team from first research to final recognition. Each stage has a clear output and checkpoint, so the 24-hour buildathon stays focused and measurable.
				</p>
			</div>
			<div className="timeline" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }} data-reveal>
				{journeyStages.map((s) => {
					const Icon = s.icon;
					return (
						<article key={s.title} data-reveal >
							<span className="timeline-number">{s.step}</span>
							<div className="timeline-line" />
							<span>{s.title.toUpperCase()}</span>
							<h3>{s.title}</h3>
							<div style={{ color: "var(--brand-green)", margin: "12px 0" }}>
								<Icon />
							</div>
							<p>{s.desc}</p>
						</article>
					);
				})}
			</div>
		</section>
	);
}

function TwoRoundFormat() {
	return (
		<section className="section" id="rounds">
			<Anchor id="rounds" />
			<SectionHeading kicker="FORMAT" title="Two rounds. From idea to working prototype.">
				Round 1 is research and ideation. Round 2 is a 24-hour buildathon for shortlisted teams.
			</SectionHeading>
			<div className="dash-two-col">
				<div className="panel" data-reveal>
					<div className="panel-title">
						<div>
							<span>ROUND 1</span>
							<h2>{roundOne.title}</h2>
						</div>
					</div>
					<p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 20 }}>{roundOne.description}</p>
					<ul className="check-list">
						{roundOne.items.map((item) => (
							<li key={item}><Check style={{ width: 16 }} /> {item}</li>
						))}
					</ul>
					<p style={{ marginTop: 20, fontSize: 11, color: "var(--ink-3)" }}>{roundOne.participants}</p>
				</div>
				<div className="panel" data-reveal data-reveal-delay="1">
					<div className="panel-title">
						<div>
							<span>ROUND 2</span>
							<h2>{roundTwo.title}</h2>
						</div>
					</div>
					<p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 20 }}>{roundTwo.description}</p>
					<ul className="check-list">
						{roundTwo.items.map((item) => (
							<li key={item}><Check style={{ width: 16 }} /> {item}</li>
						))}
					</ul>
					<div style={{ marginTop: 20 }}>
						<Link to="/dashboard" className="secondary-button">
							Submit your Round 1 idea
							<ArrowRight style={{ width: 14 }} />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

function ProblemStatements() {
	return (
		<section className="section" id="challenges">
			<Anchor id="challenges" />
			<SectionHeading kicker="PROBLEM STATEMENTS" title="Choose a challenge and make a real dent.">
				Cards below are sample problem statements for Round 1. Final domains, sponsors, and industry-provided statements will be confirmed before the event.
			</SectionHeading>
			<div className="ps-grid" data-reveal>
				{problemStatements.map((ps) => (
					<div key={ps.id} className="ps-card" data-reveal >
						<div className="ps-head">
							<span className="ps-domain">{ps.domain}</span>
							{ps.industry && <span className="ps-badge">Industry-provided</span>}
						</div>
						<h3>{ps.title}</h3>
						<p>{ps.description}</p>
						<div className="ps-outcome">
							<strong>Expected outcome</strong>
							<span>{ps.outcome}</span>
						</div>
						<div className="ps-resources">
							<ExternalLink style={{ width: 12 }} />
							<span>Supporting resources will be linked after release.</span>
						</div>
					</div>
				))}
			</div>
			<div className="note-banner" data-reveal>
				<AlertCircle style={{ width: 18 }} />
				<span>
					Problem statements and resource links are provisional. Final list, sponsor badges, and supporting documents will be released when confirmed.
				</span>
			</div>
		</section>
	);
}

function RoundOneCriteria() {
	return (
		<section className="section" id="criteria">
			<Anchor id="criteria" />
			<SectionHeading kicker="ROUND 1 EVALUATION" title="How Round 1 submissions are judged.">
				Reviewers score each submission against these six dimensions before shortlisting.
			</SectionHeading>
			<div className="criteria-grid" data-reveal>
				{roundOneCriteria.map((c, i) => (
					<div key={c.label} className="criterion-card" data-reveal >
						<div className="criterion-number">0{i + 1}</div>
						<h3>{c.label}</h3>
						<p>{c.note}</p>
					</div>
				))}
			</div>
		</section>
	);
}

function Shortlisting() {
	return (
		<section className="section" id="shortlist" style={{ background: "var(--bg-subtle)" }}>
			<Anchor id="shortlist" />
			<SectionHeading kicker="SHORTLISTING" title="Round 1 status and next steps.">
				Teams will be notified after Round 1 review. Shortlisted teams receive Round 2 instructions, deadlines, and reporting details.
			</SectionHeading>
			<div className="dash-two-col">
				<div className="panel" data-reveal>
					<div className="panel-title">
						<div>
							<span>YOUR STATUS</span>
							<h2>Shortlisting not yet started</h2>
						</div>
					</div>
					<p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>
						Submissions open after the problem statements are released. Once the review window closes, shortlisted teams will be shown here and notified through the dashboard.
					</p>
					<div className="status-pill" style={{ marginTop: 24 }}>
						<i />
						<span>Awaiting Round 1 deadlines</span>
					</div>
				</div>
				<div className="panel" data-reveal data-reveal-delay="1">
					<div className="panel-title">
						<div>
							<span>IF SHORTLISTED</span>
							<h2>Round 2 instructions</h2>
						</div>
					</div>
					<ul className="check-list">
						<li><Check style={{ width: 16 }} /> Confirm team attendance at VIT Chennai</li>
						<li><Check style={{ width: 16 }} /> Attend pre-buildathon workshops</li>
						<li><Check style={{ width: 16 }} /> Prepare dev environment and hardware</li>
						<li><Check style={{ width: 16 }} /> Review final schedule and reporting time</li>
						<li><Check style={{ width: 16 }} /> Join mentor allocation briefing</li>
					</ul>
				</div>
			</div>
		</section>
	);
}

function Schedule() {
	return (
		<section className="section" id="schedule" style={{ paddingTop: 140 }}>
			<Anchor id="schedule" />
			<SectionHeading kicker="SCHEDULE" title="Round 2 timeline. 24 hours, top to bottom.">
				The buildathon is split into three arcs: setup and planning, overnight build, and final refinement.
			</SectionHeading>
			<div className="schedule-grid" data-reveal>
				{schedule.map((block) => (
					<div key={block.block} className="schedule-card" data-reveal >
						<div className="schedule-time">{block.block}</div>
						<ul>
							{block.items.map((item) => (
								<li key={item}><Check style={{ width: 14 }} /> {item}</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<p className="note-text" data-reveal>
				Schedule timings and session names are indicative. Final agenda will be published after the event programme is confirmed.
			</p>
		</section>
	);
}

function Mentors() {
	return (
		<section className="section" id="mentors" style={{ background: "var(--brand-ink)", color: "#eef7f2" }}>
			<Anchor id="mentors" />
			<div className="section-heading" style={{ color: "#eef7f2" }} data-reveal>
				<div>
					<span className="kicker light">MENTORSHIP</span>
					<h2>Three support groups. One goal: a better build.</h2>
				</div>
				<p style={{ color: "#a9c4b8" }}>
					Mentors are assigned by track and need, so teams get feedback at the right level at the right time.
				</p>
			</div>
			<div className="mentor-grid" data-reveal>
				{mentorGroups.map((m) => {
					const Icon = m.icon;
					return (
						<div key={m.role} className="mentor-card" data-reveal >
							<div className="mentor-icon"><Icon style={{ width: 28, height: 28 }} /></div>
							<h3>{m.role}</h3>
							<small>{m.focus}</small>
							<p>{m.description}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function Speakers() {
	return (
		<section className="section" id="speakers">
			<Anchor id="speakers" />
			<SectionHeading kicker="SPEAKERS / JUDGES" title="Guests, speakers, and judges.">
				Names and sessions will be announced once the invitation plan is confirmed. No placeholder identities are invented.
			</SectionHeading>
			<div className="guest-grid" data-reveal>
				{["Speaker", "Judge", "Mentor", "Chief Guest"].map((role) => (
					<div key={role} className="guest-card tba" data-reveal >
						<div className="guest-photo" />
						<span className="guest-role">{role}</span>
						<h3>To be announced</h3>
						<p>Photo, name, organisation, position, and session details will be published after confirmation.</p>
					</div>
				))}
			</div>
		</section>
	);
}

function IndustryRefinement() {
	return (
		<section className="section" id="industry">
			<Anchor id="industry" />
			<SectionHeading kicker="INDUSTRY REFINEMENT" title="Expert review before the final demo.">
				Industry experts will sit with teams and pressure-test the prototype across these dimensions.
			</SectionHeading>
			<div className="refinement-grid" data-reveal>
				{industryRefinementAreas.map((area) => (
					<div key={area} className="refinement-card" data-reveal >
						<Check style={{ width: 18 }} />
						<span>{area}</span>
					</div>
				))}
			</div>
		</section>
	);
}

function Innovation() {
	return (
		<section className="section" id="innovation" style={{ background: "var(--bg-subtle)" }}>
			<Anchor id="innovation" />
			<SectionHeading kicker="INNOVATION" title="From novelty to patentable work.">
				Teams are encouraged to pursue ideas that could lead to novel, original, and potentially protectable outcomes.
			</SectionHeading>
			<div className="innovation-list" data-reveal>
				{innovationHighlights.map((item) => (
					<div key={item} className="innovation-card" data-reveal >
						<span className="innovation-number">01</span>
						<h3>{item}</h3>
					</div>
				))}
			</div>
		</section>
	);
}

function FinalJudging() {
	return (
		<section className="section" id="judging">
			<Anchor id="judging" />
			<SectionHeading kicker="FINAL JUDGING" title="What the final judging considers.">
				Round 2 demos are scored across research, craft, and impact.
			</SectionHeading>
			<div className="judge-criteria" data-reveal>
				{finalJudgingCriteria.map((c) => (
					<div key={c} className="judge-item" data-reveal >
						<span>"01"</span>
						<p>{c}</p>
					</div>
				))}
			</div>
		</section>
	);
}

function Sponsors() {
	return (
		<section className="section partners" id="sponsors">
			<Anchor id="sponsors" />
			<SectionHeading kicker="SPONSORS & PARTNERS" title="Powered by organisations that believe in student research.">
				Sponsor and partner names, tiers, and logos will be displayed here once the sponsorship plan is confirmed.
			</SectionHeading>
			<div className="sponsor-tiers" data-reveal>
				{["Title sponsor", "Technology partner", "Problem statement partner", "Prize partner"].map((tier) => (
					<div key={tier} className="sponsor-tier tba">
						<small>{tier}</small>
						<strong>To be announced</strong>
					</div>
				))}
			</div>
		</section>
	);
}

function BecomeSponsor() {
	return (
		<section className="section" id="sponsor-cta" style={{ background: "var(--brand-ink)", color: "#eef7f2" }}>
			<div className="closing" style={{ padding: 0, background: "transparent" }} data-reveal>
				<div>
					<span className="kicker light">BECOME A SPONSOR / PARTNER</span>
					<h2 style={{ color: "#fff" }}>Support the next generation of health-tech builders.</h2>
					<div style={{ marginTop: 30 }} className="sponsor-options">
						<div><Check style={{ width: 16 }} /> <span>Sponsor VMedition</span></div>
						<div><Check style={{ width: 16 }} /> <span>Provide a problem statement</span></div>
						<div><Check style={{ width: 16 }} /> <span>Provide mentors / judges</span></div>
						<div><Check style={{ width: 16 }} /> <span>Technical collaboration</span></div>
						<div><Check style={{ width: 16 }} /> <span>Prize-pool contribution</span></div>
					</div>
				</div>
				<div className="closing-actions">
					<a href={`mailto:${contact.email}?subject=Sponsorship / Partnership — VMedition 2026`} className="button light-button">
						Contact Team VMedition
						<ArrowRight style={{ width: 16 }} />
					</a>
					<p style={{ marginTop: 12 }}>We will respond with the sponsorship prospectus and next steps.</p>
				</div>
			</div>
		</section>
	);
}

function Venue() {
	return (
		<section className="section" id="venue">
			<Anchor id="venue" />
			<SectionHeading kicker="VENUE" title={`${venue.name}, ${venue.institution}`}>
				Location, reporting time, and participant instructions will be updated after final on-site planning.
			</SectionHeading>
			<div className="dash-two-col">
				<div className="panel" data-reveal>
					<div className="event-meta">
						<div><MapPin /><div><small>VENUE</small><span>{venue.name}, {venue.institution}</span></div></div>
						<div><Calendar /><div><small>DATE</small><span>{venue.date}</span></div></div>
						<div><Clock /><div><small>DURATION</small><span>{venue.duration}</span></div></div>
					</div>
					<div className="status-pill" style={{ marginTop: 24 }}>
						<i />
						<span>Reporting time: {venue.reporting}</span>
					</div>
				</div>
				<div className="panel" data-reveal data-reveal-delay="1">
					<h3 style={{ font: "700 22px Syne", marginBottom: 14 }}>Directions</h3>
					<p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>
						VIT Chennai is on the Chennai–Bengaluru highway. Detailed directions, ride-share notes, and public-transport options will be published once the venue plan is confirmed.
					</p>
					<p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
						Interactive map will be embedded after confirmation.
					</p>
				</div>
			</div>
		</section>
	);
}

function FAQ() {
	const [open, setOpen] = useState<number | null>(null);
	return (
		<section className="section" id="faq" style={{ background: "var(--bg-subtle)" }}>
			<Anchor id="faq" />
			<SectionHeading kicker="FAQ" title="Participant information.">
				Answers marked “pending confirmation” will be updated once the operational plan is finalised.
			</SectionHeading>
			<div className="faq-list" data-reveal>
				{faq.map((item, i) => (
					<div key={item.q} className={`faq-item ${open === i ? "open" : ""}`} data-reveal >
						<button
							type="button"
							className="faq-question"
							onClick={() => setOpen(open === i ? null : i)}
							aria-expanded={open === i}
						>
							<span>{item.q}</span>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								{!item.confirmed && <span className="pending-badge">Pending confirmation</span>}
								<ChevronIcon open={open === i} />
							</div>
						</button>
						{open === i && <p className="faq-answer">{item.a}</p>}
					</div>
				))}
			</div>
		</section>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s" }}
			aria-hidden="true"
		>
			<title>Chevron</title>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	);
}

function Results() {
	return (
		<section className="section" id="results" style={{ background: "var(--brand-ink)", color: "#eef7f2" }}>
			<Anchor id="results" />
			<div className="section-heading" style={{ color: "#eef7f2" }} data-reveal>
				<div>
					<span className="kicker light">WINNERS / RESULTS</span>
					<h2>Results will be announced after the buildathon.</h2>
				</div>
				<p style={{ color: "#a9c4b8" }}>
					Winner teams, prizes, problem statement/domain, project names, and special awards will be published here once the judging is complete.
				</p>
			</div>
			<div className="result-placeholder" data-reveal>
				<Award style={{ width: 44, color: "var(--brand-gold)" }} />
				<p>Result announcement pending Round 2 completion.</p>
			</div>
		</section>
	);
}

function Certificates() {
	const [id, setId] = useState("");
	const [checked, setChecked] = useState(false);
	return (
		<section className="section" id="certificates">
			<Anchor id="certificates" />
			<SectionHeading kicker="CERTIFICATES" title="Certificate access and verification.">
				Participant, winner, and organising-committee certificates will be issued after the event. Verification will be enabled when certificates are ready.
			</SectionHeading>
			<div className="verify-modal" style={{ margin: "0 auto", position: "relative" }} data-reveal>
				<div className="verify-icon"><FileText style={{ width: 26 }} /></div>
				<h2>Verify a certificate</h2>
				<p>Enter a certificate code to check status. Certificates will be available after the event.</p>
				<label>
					Certificate code
					<input
						value={id}
						onChange={(e) => { setId(e.target.value); setChecked(false); }}
						placeholder="e.g. VMED-2026-XXXX"
						className="full"
					/>
				</label>
				<button type="button" className="button primary full" onClick={() => setChecked(true)} style={{ marginTop: 8 }}>
					Verify
				</button>
				{checked && (
					<div className="demo-result" style={{ background: "var(--accent-soft)", color: "var(--ink)" }}>
						<AlertCircle style={{ width: 18 }} />
						<strong>No certificate found for “{id || "—"}”.<br />Certificates will be issued after the event.</strong>
					</div>
				)}
			</div>
		</section>
	);
}

function HomePage() {
	useReveal();
	const { hash } = useLocation();

	useEffect(() => {
		if (hash) {
			const id = hash.replace("#", "");
			const el = document.getElementById(id);
			if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 50);
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [hash]);

	return (
		<>
			<Hero />
			<About />
			<Journey />
			<TwoRoundFormat />
			<RoundOneCriteria />
			<ProblemStatements />
			<Shortlisting />
			<Schedule />
			<Mentors />
			<IndustryRefinement />
			<Innovation />
			<Speakers />
			<FinalJudging />
			<Sponsors />
			<BecomeSponsor />
			<Venue />
			<FAQ />
			<Certificates />
			<Results />
			<Footer />
		</>
	);
}

export function App() {
	return (
		<>
			<Nav />
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/dashboard" element={<ParticipantDashboard />} />
				<Route path="*" element={<HomePage />} />
			</Routes>
		</>
	);
}
