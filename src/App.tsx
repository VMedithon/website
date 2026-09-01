import { useState } from "react";
import {
	ArrowRight,
	Check,
	ChevronDown,
	CircleArrowOutUpRight,
	Clock3,
	FileUp,
	Menu,
	QrCode,
	Search,
	Sparkles,
	X,
} from "lucide-react";
import { Dashboard } from "./Dashboard";
import { timeline, tracks } from "./data";

export function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [dashboardOpen, setDashboardOpen] = useState(false);
	const [verifyOpen, setVerifyOpen] = useState(false);

	return (
		<div className="site-shell">
			<header className="nav-wrap">
				<a className="brand" href="#top" aria-label="VMEDITHON home">
					<span className="brand-mark"><span>V</span></span>
					<span>VMEDITHON<small>2026</small></span>
				</a>
				<button type="button" className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
					{menuOpen ? <X /> : <Menu />}
				</button>
				<nav className={menuOpen ? "nav-links open" : "nav-links"}>
					<a href="#tracks">Tracks</a>
					<a href="#journey">Journey</a>
					<a href="#experience">Experience</a>
					<a href="#partners">Partners</a>
					<button type="button" className="text-button" onClick={() => setVerifyOpen(true)}>Verify certificate</button>
				</nav>
				<button type="button" className="nav-cta" onClick={() => setDashboardOpen(true)}>
					Open platform <ArrowRight size={16} />
				</button>
			</header>

			<main>
				<section className="hero" id="top">
					<div className="hero-orbit orbit-one" />
					<div className="hero-orbit orbit-two" />
					<div className="hero-grid" />
					<div className="hero-copy">
						<div className="eyebrow"><span /> 36 HOURS. THREE PATHS. ONE DEFINING BUILD.</div>
						<h1>Ideas, engineered<br />for <em>impact.</em></h1>
						<p>
							Not another weekend hackathon. Build work worth publishing, patenting, and putting in front of industry.
						</p>
						<div className="hero-actions">
							<a className="button primary" href="#tracks">Explore the tracks <ArrowRight size={18} /></a>
							<button type="button" className="button ghost" onClick={() => setDashboardOpen(true)}>View platform preview</button>
						</div>
					</div>
					<div className="hero-card">
						<div className="hero-card-top">
							<span>VELLORE · INDIA</span>
							<span className="live-dot">REGISTRATIONS SOON</span>
						</div>
						<div className="date-block">
							<strong>21—22</strong>
							<span>SEPTEMBER<br />2026</span>
						</div>
						<div className="event-meta">
							<div><Clock3 /><span><small>FORMAT</small>Overnight, on campus</span></div>
							<div><Sparkles /><span><small>OUTCOMES</small>Papers, patents, prototypes</span></div>
						</div>
					</div>
					<div className="hero-footnote">SCROLL TO DISCOVER <ChevronDown /></div>
				</section>

				<section className="proof-strip">
					<span>ONE COMMON PITCH</span><i />
					<span>MENTOR-LED DEVELOPMENT</span><i />
					<span>REAL-WORLD OUTPUTS</span><i />
					<span>INDUSTRY SHOWCASE</span>
				</section>

				<section className="section tracks-section" id="tracks">
					<div className="section-heading">
						<div><span className="kicker">CHOOSE YOUR OUTCOME</span><h2>Three tracks.<br />No throwaway builds.</h2></div>
						<p>Every team begins with one idea. Our reviewers help place it on the path that gives it the strongest future.</p>
					</div>
					<div className="track-grid">
						{tracks.map((track) => {
							const Icon = track.icon;
							return (
								<article className={`track-card ${track.accent}`} key={track.label}>
									<div className="track-head"><span>{track.number}</span><Icon /></div>
									<div>
										<small>{track.label} TRACK</small>
										<h3>{track.title}</h3>
										<p>{track.description}</p>
									</div>
									<div className="output"><span>EXPECTED OUTPUT</span><strong><Check /> {track.output}</strong></div>
								</article>
							);
						})}
					</div>
				</section>

				<section className="journey-section" id="journey">
					<div className="journey-intro">
						<span className="kicker light">THE JOURNEY</span>
						<h2>Start with a slide.<br />Leave with a signal.</h2>
						<p>Structure is what turns a promising idea into serious work. We have built the checkpoints in.</p>
					</div>
					<div className="timeline">
						{timeline.map((item) => (
							<article key={item.step}>
								<div className="timeline-number">{item.step}</div>
								<div className="timeline-line" />
								<span>{item.meta}</span>
								<h3>{item.title}</h3>
								<p>{item.description}</p>
							</article>
						))}
					</div>
				</section>

				<section className="section experience-section" id="experience">
					<div className="experience-visual">
						<div className="visual-noise" />
						<span className="vertical-label">BUILD THROUGH THE NIGHT</span>
						<div className="quote-card">“The goal is not a demo that dies on Sunday.”</div>
					</div>
					<div className="experience-copy">
						<span className="kicker">MORE THAN A COMPETITION</span>
						<h2>A serious room for serious firsts.</h2>
						<p className="lead">The first paper. The first patent direction. The first time an industry expert treats your idea like it could become real.</p>
						<div className="feature-list">
							<div><strong>01</strong><span><b>Human mentorship</b>Faculty and industry experts embedded throughout the process.</span></div>
							<div><strong>02</strong><span><b>Full overnight support</b>Dinner, breakfast, workspaces, and technical checkpoints included.</span></div>
							<div><strong>03</strong><span><b>A credible finish line</b>Quality review, final showcase, and documentation that travels beyond the event.</span></div>
						</div>
					</div>
				</section>

				<section className="section partners" id="partners">
					<span className="kicker">BUILT WITH SUPPORT FROM</span>
					<div className="partner-row">
						<strong>Devnovate</strong><strong>Cloudflare</strong><strong>Clerk</strong><strong>VIT Vellore</strong>
					</div>
				</section>

				<section className="closing">
					<div>
						<span className="kicker light">READY WHEN YOU ARE</span>
						<h2>Your idea deserves<br />a stronger ending.</h2>
					</div>
					<div className="closing-actions">
						<button type="button" className="button light-button" onClick={() => setDashboardOpen(true)}>Preview participant portal <CircleArrowOutUpRight /></button>
						<p>Round one is free. Submission dates will be announced soon.</p>
					</div>
				</section>
			</main>

			<footer>
				<a className="brand footer-brand" href="#top"><span className="brand-mark"><span>V</span></span><span>VMEDITHON<small>2026</small></span></a>
				<p>Research · Industry · Project<br />Vellore Institute of Technology</p>
				<div><a href="#tracks">Tracks</a><a href="#journey">Timeline</a><button type="button" onClick={() => setVerifyOpen(true)}>Verify certificate</button></div>
				<small>© 2026 VMEDITHON. Built for what comes next.</small>
			</footer>

			{dashboardOpen && <Dashboard onClose={() => setDashboardOpen(false)} />}
			{verifyOpen && <VerifyModal onClose={() => setVerifyOpen(false)} />}
		</div>
	);
}

function VerifyModal({ onClose }: { readonly onClose: () => void }) {
	const [code, setCode] = useState("");
	const [searched, setSearched] = useState(false);
	return (
		<div className="modal-backdrop" role="presentation">
			<div className="verify-modal" role="dialog" aria-modal="true" aria-label="Verify certificate">
				<button type="button" className="icon-button close-modal" onClick={onClose}><X /></button>
				<div className="verify-icon"><QrCode /></div>
				<span className="kicker">PUBLIC VERIFICATION</span>
				<h2>Verify a certificate</h2>
				<p>Enter the unique ID printed in the lower corner of any VMEDITHON certificate.</p>
				<label>Certificate ID<input value={code} onChange={(event) => { setCode(event.target.value); setSearched(false); }} placeholder="e.g. VMT26-P-0184" /></label>
				<button type="button" className="button primary full" onClick={() => setSearched(true)}><Search /> Verify certificate</button>
				{searched && <div className="demo-result"><FileUp /><span><strong>Demo preview</strong>Certificate lookup will become active when event records are connected.</span></div>}
			</div>
		</div>
	);
}
