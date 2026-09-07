import { useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowRight,
	Menu,
	Code2,
	Wrench,
	FileText,
	Download,
	ExternalLink,
	Activity,
	Sun,
	Moon,
} from "lucide-react";
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

function Anchor({ id }: { id: string }) {
	return <span id={id} className="anchor" />;
}

function BioCircuitBackground() {
	const nodes = useMemo(
		() =>
			Array.from({ length: 24 }).map((_, i) => ({
				id: i,
				x: `${Math.random() * 100}%`,
				y: `${Math.random() * 100}%`,
				delay: `${Math.random() * 4}s`,
				blue: Math.random() > 0.5,
			})),
		[],
	);
	return (
		<div className="bio-bg" aria-hidden="true">
			<div className="bio-grid" />
			<div className="bio-ecg">
				<svg viewBox="0 0 1440 900" preserveAspectRatio="none" role="img" aria-label="ECG circuit trace">
					<path
						d="M0,450 L200,450 L240,350 L280,550 L320,450 L480,450 L520,200 L560,700 L600,450 L800,450 L840,380 L880,520 L920,450 L1100,450 L1140,300 L1180,600 L1220,450 L1440,450"
						strokeDasharray="2000"
						strokeDashoffset="0"
					>
						<animate attributeName="stroke-dashoffset" from="2000" to="0" dur="12s" repeatCount="indefinite" />
					</path>
					<path
						d="M0,300 L1440,300"
						strokeOpacity="0.4"
					/>
				</svg>
			</div>
			<div className="bio-nodes">
				{nodes.map((n) => (
					<div
						key={n.id}
						className="bio-node"
						style={{
							left: n.x,
							top: n.y,
							animationDelay: n.delay,
							background: n.blue ? "var(--brand-blue)" : "var(--brand-green)",
						}}
					/>
				))}
			</div>
		</div>
	);
}

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
			<a href="#hero" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
				<img src={theme === "dark" ? logoOnDark : logoOnLight} alt="VMEDITHON 3.0" className="nav-logo" />
			</a>
			<div className={`nav-links ${open ? "open" : ""}`}>
				{navLinks.map((l) => (
					<a
						key={l.id}
						href={l.path.replace(/^\//, "")}
						onClick={() => setOpen(false)}
					>
						{l.label}
					</a>
				))}
			</div>
			<button className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggle} type="button">
				<Sun className={theme === "light" ? "active" : ""} style={{ width: 14, height: 14 }} />
				<Moon className={theme === "dark" ? "active" : ""} style={{ width: 14, height: 14 }} />
			</button>
			<button className="mobile-menu" aria-label="Open menu" onClick={() => setOpen((s) => !s)} type="button">
				<Menu />
			</button>
		</nav>
	);
}

function Hero() {
	const { theme } = useTheme();

	return (
		<section className="hero" id="hero">
			<div className="hero-orbit orbit-one" />
			<div className="hero-orbit orbit-two" />
			<div className="hero-center">
				<div className="hero-tagline">Technology for a Healthier Tomorrow</div>
				<img src={theme === "dark" ? logoOnDark : logoOnLight} alt="VMEDITHON 3.0" className="hero-logo" />
				<div className="hero-split">
					<div className="hero-track hack">
						<Code2 style={{ width: 22 }} />
						HACKATHON
					</div>
					<div className="hero-caduceus">
						<Activity style={{ width: 36 }} />
					</div>
					<div className="hero-track build">
						<Wrench style={{ width: 22 }} />
						BUILDATHON
					</div>
				</div>
				<p className="hero-meta">SEP 15 — 16 · 24 HOURS · VIT CHENNAI</p>
				<div className="hero-actions">
					<a href="https://devnovate.co/event/vmedithon-30" target="_blank" rel="noreferrer" className="button primary">
						Register on Devnovate
						<ArrowRight style={{ width: 16, height: 16 }} />
					</a>
				</div>
			</div>
		</section>
	);
}

function TrackSplit() {
	return (
		<section className="section" id="tracks">
			<Anchor id="tracks" />
			<div className="section-heading" data-reveal>
				<div>
					<h2>Hackathon × Buildathon</h2>
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
			<Anchor id="themes" />
			<div className="section-heading" data-reveal>
				<div>
					<h2>Open Innovation · Bio × Engineering</h2>
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
	const containerRef = useRef<HTMLDivElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = () => {
			if (!containerRef.current || !fillRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const viewportH = window.innerHeight;
			const visibleTop = Math.max(0, viewportH - rect.top);
			const total = rect.height + viewportH * 0.6;
			const progress = Math.max(0, Math.min(1, visibleTop / total));
			fillRef.current.style.height = `${progress * 100}%`;
		};
		handler();
		window.addEventListener("scroll", handler, { passive: true });
		return () => window.removeEventListener("scroll", handler);
	}, []);

	return (
		<section className="journey-section" id="journey">
			<Anchor id="journey" />
			<div className="journey-intro" data-reveal>
				<h2>From registration to final deliverable.</h2>
			</div>
			<div className="journey-spine" ref={containerRef} data-reveal>
				<div className="journey-line" />
				<div className="journey-line-fill" ref={fillRef} />
				{journeySteps.map((s) => (
					<div key={s.step} className={`journey-step ${s.final ? "final" : ""}`} data-reveal>
						<div className="journey-step-content">
							<h4>{s.title}</h4>
							<p>{s.desc}</p>
						</div>
						<div className="journey-dot" />
					</div>
				))}
			</div>
		</section>
	);
}

function Rounds() {
	return (
		<section className="section" id="rounds">
			<Anchor id="rounds" />
			<div className="section-heading" data-reveal>
				<div>
					<h2>Round 1 & Round 2</h2>
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
						<h3>September 15 — 16</h3>
						<div className="round-timeline">
							<div className="round-timeline-fill" />
							<div className="round-timeline-item">
								<strong>11:00 AM</strong> — Start at MG Auditorium, VIT Chennai
							</div>
							<div className="round-timeline-item">
								<strong>24 hours</strong> — Build, validate, and refine
							</div>
							<div className="round-timeline-item">
								<strong>11:00 AM</strong> — Final submissions and judging
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Prize() {
	const ref = useRef<HTMLDivElement>(null);
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (!ref.current) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					let start: number | null = null;
					const duration = 1400;
					const step = (ts: number) => {
						if (!start) start = ts;
						const p = Math.min((ts - start) / duration, 1);
						setValue(Math.floor(p * 75));
						if (p < 1) requestAnimationFrame(step);
					};
					requestAnimationFrame(step);
					observer.disconnect();
				}
			},
			{ threshold: 0.5 },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	return (
		<section className="prize-section" id="prizes" ref={ref}>
			<Anchor id="prizes" />
			<h2>PRIZE POOL</h2>
			<div className="prize-amount">UPTO ₹{value}K+</div>
		</section>
	);
}

function Resources() {
	return (
		<section className="section" id="resources">
			<Anchor id="resources" />
			<div className="section-heading" data-reveal>
				<div>
					<h2>Resource</h2>
				</div>
			</div>
			<div className="resources-grid" data-reveal>
				{resources.map((r) => (
					<div key={r.title} className="resource-card">
						<FileText style={{ width: 26, color: "var(--brand-blue)" }} />
						<div className="resource-card-text">
							<strong>{r.title}</strong>
							<small>{r.desc}</small>
						</div>
						<span className="file-type">{r.type}</span>
						<div className="download-row">
							<span>Download</span>
							<Download style={{ width: 18 }} />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function Partners() {
	const { theme } = useTheme();

	return (
		<section className="partners-section" id="partners">
			<Anchor id="partners" />
			<h2 style={{ font: "700 40px 'Space Grotesk', sans-serif", margin: "16px 0 0", letterSpacing: "-.02em" }}>Organisations behind VMEDITHON</h2>
			<div className="partner-logos" data-reveal>
				{sponsors.map((s) => (
					<div key={s.name} className={`partner-logo${s.onDark && theme === "light" ? " on-dark" : ""}`} title={s.name}>
						<img src={theme === "light" && s.logoLight ? s.logoLight : s.logo} alt={s.name} />
					</div>
				))}
			</div>
		</section>
	);
}

function FAQ() {
	const [open, setOpen] = useState<number | null>(null);
	return (
		<section className="section" id="faq" style={{ background: "var(--bg-subtle)" }}>
			<Anchor id="faq" />
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
			<Anchor id="contact" />
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
						href={`mailto:${contact.email}?subject=Sponsorship / Partnership — VMEDITHON 3.0`}
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
			<small>© 2026 Team VMEDITHON. Operational details subject to confirmation.</small>
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
			<Footer />
		</>
	);
}

export function App() {
	return (
		<div className="site-shell">
			<BioCircuitBackground />
			<ScrollProgress />
			<Nav />
			<HomePage />
		</div>
	);
}
