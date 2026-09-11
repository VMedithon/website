import { useEffect, useRef, useState } from "react";
import {
	ArrowRight,
	Menu,
	Code2,
	Wrench,
	FileText,
	Download,
	ExternalLink,
	Sun,
	Moon,
} from "lucide-react";
import { SignalScene } from "./SignalScene";
import logoOnDark from "./assets/logo.png";
import logoOnLight from "./assets/logo-dark.png";
import { useTheme } from "./hooks/useTheme";
import { useReveal } from "./hooks/useReveal";
import {
	navLinks,
	journeySteps,
	themes,
	resources,
	sponsors,
	faq,
	contact,
} from "./data";

function ScrollProgress() {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const handler = () => {
			if (!ref.current) return;
			const h = document.documentElement;
			const progress = h.scrollTop / (h.scrollHeight - h.clientHeight);
			ref.current.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
		};
		handler();
		window.addEventListener("scroll", handler, { passive: true });
		return () => window.removeEventListener("scroll", handler);
	}, []);
	return <div ref={ref} className="scroll-ecg" aria-hidden="true" />;
}

function Nav() {
	const { theme, toggle } = useTheme();
	const [open, setOpen] = useState(false);

	return (
		<nav className="nav-wrap" aria-label="Main">
			<a href="#hero" className="brand">
				<img src={theme === "dark" ? logoOnDark : logoOnLight} alt="VMEDITHON 3.0" className="nav-logo" />
			</a>
			<div id="main-links" className={`nav-links ${open ? "open" : ""}`}>
				{navLinks.map((l) => (
					<a
						key={l.id}
						href={l.path.replace(/^\//, "")}
						onClick={() => setOpen(false)}
					>
						{l.label}
					</a>
				))}
				<a href="/schedule">Schedule</a>
				<a href="/results">Results</a>
				<a href="/dashboard">Dashboard</a>
			</div>
			<a className="nav-register" href="https://devnovate.co/event/vmedithon-30" target="_blank" rel="noreferrer">Register <ArrowRight size={14} /></a>
			<button className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggle} type="button">
				<Sun className={theme === "light" ? "active" : ""} style={{ width: 14, height: 14 }} />
				<Moon className={theme === "dark" ? "active" : ""} style={{ width: 14, height: 14 }} />
			</button>
			<button className="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="main-links" onClick={() => setOpen((s) => !s)} type="button">
				<Menu />
			</button>
		</nav>
	);
}

function Hero() {
	return (
		<section className="hero" id="hero">
			<div className="hero-copy">
				<p className="eyebrow"><span className="status-dot" /> VMEDITHON 3.0 / SEPTEMBER 2026</p>
				<h1>Great minds.<br />Real builds.<br /><em>Human impact.</em></h1>
				<p className="hero-description">Where code meets care. A hackathon & buildathon for people ready to engineer a healthier tomorrow.</p>
				<a href="https://devnovate.co/event/vmedithon-30" target="_blank" rel="noreferrer" className="button primary">Build with us <ArrowRight size={18} /></a>
			</div>
			<SignalScene />
			<div className="hero-bottom"><span>15—16 SEP <i>/</i> VIT CHENNAI</span><span>24 HOURS. TWO TRACKS. YOUR NEXT BIG IDEA.</span><a href="#tracks">EXPLORE ↓</a></div>
		</section>
	);
}

function TrackSplit() {
	return (
		<section className="section" id="tracks">

			<div className="section-heading" data-reveal>
				<div>
					<p className="eyebrow">01 / CHOOSE YOUR MEDIUM</p><h2>Different tools.<br /><em>Same ambition.</em></h2>
				</div>
			</div>
			<div className="track-split" data-reveal>
				<div className="track-half hack">
					<div className="track-content">
						<div className="track-icon"><Code2 style={{ width: 32, height: 32 }} /></div>
						<h3>HACKATHON</h3>
						<p>Build software solutions, data pipelines, AI models, and digital health interfaces over 24 hours.</p>
					</div>
					<div className="track-keywords">
						<span>Software</span>
						<span>AI / ML</span>
						<span>Data</span>
						<span>UI / UX</span>
					</div>
				</div>
				<div className="track-half build">
					<div className="track-content">
						<div className="track-icon"><Wrench style={{ width: 32, height: 32 }} /></div>
						<h3>BUILDATHON</h3>
						<p>Engineer working prototypes, devices, and biomedical instrumentation. Design, fabricate, validate.</p>
					</div>
					<div className="track-keywords">
						<span>Hardware</span>
						<span>IoT</span>
						<span>Signal</span>
						<span>Prototyping</span>
					</div>
				</div>
			</div>
		</section>
	);
}

function NetworkSVG({ accent }: { accent: "green" | "blue" }) {
	const color = accent === "green" ? "var(--brand-green)" : "var(--brand-blue)";
	return (
		<svg className="theme-network" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Network nodes">
			<circle cx="80" cy="80" r="4" fill={color} opacity="0.6" />
			<circle cx="180" cy="120" r="5" fill={color} opacity="0.8" />
			<circle cx="300" cy="90" r="4" fill={color} opacity="0.6" />
			<circle cx="240" cy="220" r="6" fill={color} opacity="0.9" />
			<circle cx="120" cy="260" r="4" fill={color} opacity="0.6" />
			<circle cx="340" cy="280" r="5" fill={color} opacity="0.7" />
			<circle cx="70" cy="320" r="4" fill={color} opacity="0.5" />
			<line x1="80" y1="80" x2="180" y2="120" stroke={color} strokeWidth="1" opacity="0.3" />
			<line x1="180" y1="120" x2="300" y2="90" stroke={color} strokeWidth="1" opacity="0.3" />
			<line x1="180" y1="120" x2="240" y2="220" stroke={color} strokeWidth="1" opacity="0.4" />
			<line x1="240" y1="220" x2="120" y2="260" stroke={color} strokeWidth="1" opacity="0.3" />
			<line x1="240" y1="220" x2="340" y2="280" stroke={color} strokeWidth="1" opacity="0.3" />
			<line x1="120" y1="260" x2="70" y2="320" stroke={color} strokeWidth="1" opacity="0.3" />
		</svg>
	);
}

function BioSVG() {
	return (
		<svg className="theme-bio" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Biological and engineering motifs">
			<path
				d="M180,60 Q220,120 180,180 T180,300"
				stroke="var(--brand-blue)"
				strokeWidth="1.5"
				fill="none"
				opacity="0.3"
			/>
			<path
				d="M220,60 Q180,120 220,180 T220,300"
				stroke="var(--brand-blue)"
				strokeWidth="1.5"
				fill="none"
				opacity="0.3"
			/>
			<path
				d="M140,180 Q200,120 260,180 Q200,240 140,180"
				stroke="var(--brand-blue)"
				strokeWidth="1"
				fill="none"
				opacity="0.25"
			/>
			<rect x="100" y="100" width="200" height="200" stroke="var(--brand-blue)" strokeWidth="0.5" fill="none" opacity="0.15" />
			<line x1="100" y1="140" x2="300" y2="140" stroke="var(--brand-blue)" strokeWidth="0.5" opacity="0.15" />
			<line x1="100" y1="180" x2="300" y2="180" stroke="var(--brand-blue)" strokeWidth="0.5" opacity="0.15" />
			<line x1="100" y1="220" x2="300" y2="220" stroke="var(--brand-blue)" strokeWidth="0.5" opacity="0.15" />
			<line x1="100" y1="260" x2="300" y2="260" stroke="var(--brand-blue)" strokeWidth="0.5" opacity="0.15" />
		</svg>
	);
}

function ThemeCard({ theme }: { theme: typeof themes[number] }) {
	const Icon = theme.icon;
	const isGreen = theme.accent === "green";
	return (
		<div className={`theme-card ${isGreen ? "green" : "blue"}`} data-reveal>
			{isGreen ? <NetworkSVG accent="green" /> : <BioSVG />}
			<div className="theme-content">
				<div className="theme-icon">
					<Icon style={{ width: 28, height: 28 }} />
				</div>
				<h3>{theme.title}</h3>
				<p>{theme.description}</p>
				<div className="theme-keywords">
					{theme.keywords.map((k) => (
						<span key={k}>{k}</span>
					))}
				</div>
			</div>
		</div>
	);
}

function Themes() {
	return (
		<section className="section" id="themes">

			<div className="section-heading" data-reveal>
				<div>
					<p className="eyebrow">02 / FIND YOUR FRONTIER</p><h2>What will you<br /><em>make possible?</em></h2>
				</div>
			</div>
			<div className="themes-grid" data-reveal>
				{themes.map((t) => (
					<ThemeCard key={t.title} theme={t} />
				))}
			</div>
		</section>
	);
}

function JourneySpine() {
	return (
		<section className="journey-section" id="journey">
			<div className="journey-intro"><p className="eyebrow">03 / THE PROCESS</p><h2>Small spark.<br /><em>Real-world impact.</em></h2><p>Every big build starts with a question. Here’s how yours moves forward.</p><a className="text-link" href="#resources">Get the submission template <ArrowRight size={16} /></a></div>
			<ol className="journey-spine">
				{journeySteps.map((s) => <li key={s.step} className={`journey-step ${s.final ? "final" : ""}`}><span className="step-index">{s.step}</span><div className="journey-step-content"><h3>{s.title}</h3><p>{s.desc}</p></div></li>)}
			</ol>
		</section>
	);
}

function Rounds() {
	return (
		<section className="section" id="rounds">

			<div className="section-heading" data-reveal>
				<div>
					<p className="eyebrow">04 / FROM IDEA TO EXECUTION</p><h2>First, the pitch.<br /><em>Then, the build.</em></h2>
				</div>
			</div>
			<div className="rounds-grid" data-reveal>
				<div className="round-card one" data-reveal>
					<div className="round-number">01</div>
					<div>
						<div className="round-meta">ROUND ONE · PPT SUBMISSION</div>
						<h3>Online · Free · Devnovate</h3>
						<p>Submit your research, problem gap, proposed solution, and technical approach as a PPT through Devnovate.</p>
						<a
							href="https://devnovate.co/event/vmedithon-30"
							target="_blank"
							rel="noreferrer"
							className="round-button"
						>
							Submit on Devnovate
							<ExternalLink style={{ width: 14 }} />
						</a>
					</div>
				</div>
				<div className="round-card two" data-reveal>
					<div className="round-number">02</div>
					<div>
						<div className="round-meta">ROUND TWO · 24 HOURS</div>
						<h3>September 15–16</h3>
						<div className="round-timeline">
							<div className="round-timeline-fill" />
							<div className="round-timeline-item">
								<strong>8:00 AM</strong> · Buildathon track participants arrive at MG Auditorium, VIT Chennai
							</div>
							<div className="round-timeline-item">
								<strong>11:00 AM</strong> · Hackathon track participants start at MG Auditorium, VIT Chennai
							</div>
							<div className="round-timeline-item">
								<strong>24 hours</strong> · Build, validate, and refine
							</div>
							<div className="round-timeline-item">
								<strong>11:00 AM</strong> · Final submissions and judging for Hackathon track participants (next day)
							</div>
							<div className="round-timeline-item">
								<strong>3:30–4:00 PM</strong> · Event concludes for Buildathon track participants (next day)
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Prize() {
	return <section className="prize-section" id="prizes"><p className="eyebrow">BUILD SOMETHING THAT MATTERS</p><h2>Big ideas.<br />Bigger possibilities.</h2><div className="prize-amount"><span>UP TO</span> ₹75K+</div><p>PRIZE POOL</p><a className="button primary" href="https://devnovate.co/event/vmedithon-30" target="_blank" rel="noreferrer">Take your shot <ArrowRight size={18} /></a></section>;
}

function Resources() {
	return (
		<section className="section" id="resources">

			<div className="section-heading" data-reveal>
				<div>
					<p className="eyebrow">THE STARTER KIT</p><h2>Come prepared.</h2>
				</div>
			</div>
			<div className="resources-grid" data-reveal>
				{resources.map((r) => {
					const file = "file" in r ? r.file : undefined;
					const inner = (
						<>
							<FileText style={{ width: 26, color: "var(--brand-blue)" }} />
							<div className="resource-card-text">
								<strong>{r.title}</strong>
								<small>{r.desc}</small>
							</div>
							<span className="file-type">{r.type}</span>
							{file && (
								<div className="download-row">
									<span>Download</span>
									<Download style={{ width: 18 }} />
								</div>
							)}
						</>
					);
					return file ? (
						<a key={r.title} className="resource-card" href={file} download>
							{inner}
						</a>
					) : (
						<div key={r.title} className="resource-card">
							{inner}
						</div>
					);
				})}
			</div>
		</section>
	);
}

function Partners() {
	const { theme } = useTheme();

	return (
		<section className="partners-section" id="partners">

			<h2 style={{ font: "700 40px 'Space Grotesk', sans-serif", margin: "16px 0 0", letterSpacing: "-.02em" }}>Organisations behind VMEDITHON</h2>
			<div className="partner-marquee" data-reveal>
				<div className="partner-logos">
					{[0, 1].map((copy) => (
						<div key={copy} className="partner-set" aria-hidden={copy === 1}>
							{sponsors.map((s) => (
								<div key={s.name} className={`partner-logo${s.onDark && theme === "light" ? " on-dark" : ""}`} title={s.name}>
									<img src={theme === "light" && s.logoLight ? s.logoLight : s.logo} alt={s.name} />
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function FAQ() {
	const [open, setOpen] = useState<number | null>(null);
	return (
		<section className="section" id="faq" style={{ background: "color-mix(in srgb, var(--bg-subtle) 82%, transparent)" }}>

			<div className="section-heading" data-reveal>
				<div>
					<h2>Participant Information</h2>
				</div>
			</div>
			<div className="faq-list">
				{faq.map((item, i) => (
					<div key={item.q} data-reveal>
						<div className={`faq-item ${open === i ? "open" : ""}`}>
							<button
								type="button"
								className="faq-question"
								onClick={() => setOpen(open === i ? null : i)}
								aria-expanded={open === i}
							>
								<span>{item.q}</span>
								<div className="faq-meta">
									{!item.confirmed && <span className="pending-badge">Pending confirmation</span>}
									<FaqToggle />
								</div>
							</button>
							{open === i && <p className="faq-answer">{item.a}</p>}
							<div className="faq-progress" />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function FaqToggle() {
	return (
		<svg
			className="faq-toggle"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			aria-hidden="true"
		>
			<title>Toggle</title>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function Contact() {
	return (
		<section className="section" id="contact">

			<div className="section-heading" data-reveal>
				<div>
					<h2>Coordinators</h2>
				</div>
			</div>
			<div className="dash-two-col" data-reveal style={{ maxWidth: 900, margin: "0 auto" }}>
				<div className="panel">
					<h3 style={{ font: "700 22px 'Space Grotesk', sans-serif", margin: "0 0 18px" }}>General Enquiries</h3>
					<div style={{ display: "grid", gap: 14, fontSize: 14, color: "var(--ink-2)" }}>
						<div><strong style={{ color: "var(--ink)", display: "block" }}>Email</strong>{contact.email}</div>
						<div><strong style={{ color: "var(--ink)", display: "block" }}>Institution</strong>{contact.institution}</div>
						<div><strong style={{ color: "var(--ink)", display: "block" }}>Organiser</strong>{contact.team}</div>
					</div>
				</div>
				<div className="panel">
					<h3 style={{ font: "700 22px 'Space Grotesk', sans-serif", margin: "0 0 18px" }}>Sponsorship</h3>
					<p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
						Interested in supporting the next generation of health-tech builders? Contact us for the sponsorship prospectus.
					</p>
					<a
						href={`mailto:${contact.email}?subject=Sponsorship / Partnership · VMEDITHON 3.0`}
						className="round-button"
						style={{ marginTop: 22 }}
					>
						Contact Team VMEDITHON
						<ArrowRight style={{ width: 14 }} />
					</a>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer>
			<div>
				<strong className="brand" style={{ color: "#f5f7f8" }}>VMEDITHON 3.0</strong>
				<small style={{ display: "block", marginTop: 8, color: "#98a8b4" }}>
					A 24-hour hackathon and buildathon at VIT Chennai.
				</small>
			</div>
			<div>
				<strong style={{ color: "#f5f7f8" }}>Contact</strong>
				<a href={`mailto:${contact.email}`}>{contact.email}</a>
				<span>{contact.institution}</span>
				<span>{contact.team}</span>
			</div>
			<div>
				<strong style={{ color: "#f5f7f8" }}>Quick Links</strong>
				<a href="#journey">Journey</a>
				<a href="#themes">Themes</a>
			</div>
			<small>© 2026 Team VMEDITHON.</small>
		</footer>
	);
}

function HomePage() {
	useReveal();

	return (
		<>
			<Hero />
			<TrackSplit />
			<Themes />
			<JourneySpine />
			<Rounds />
			<Prize />
			<Resources />
			<Partners />
			<FAQ />
			<Contact />
		</>
	);
}

export function App() {
	return (
		<div className="site-shell">
			<a className="skip-link" href="#main">Skip to content</a>
			<ScrollProgress />
			<Nav />
			<main id="main"><HomePage /></main>
			<Footer />
		</div>
	);
}
