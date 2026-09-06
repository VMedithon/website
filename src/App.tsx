import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useParams } from "react-router-dom";
import {
	ArrowRight,
	Check,
	ChevronDown,
	CircleArrowOutUpRight,
	Clock3,
	FileUp,
	Menu,
	Moon,
	QrCode,
	Search,
	Sparkles,
	Sun,
	X,
} from "lucide-react";
import logoDarkUrl from "./assets/logo-dark.png";
import logoUrl from "./assets/logo.png";
import { Dashboard } from "./Dashboard";
import { Participant } from "./Participant";
import { timeline, tracks } from "./data";
import { useTheme } from "./hooks/useTheme";

export function App() {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route path="/platform" element={<Platform />} />
			<Route path="/participant" element={<ParticipantPage />} />
			<Route path="/verify" element={<VerifyPage />} />
			<Route path="/verify/:certificate_id" element={<VerifyPage />} />
			<Route path="*" element={<Landing />} />
		</Routes>
	);
}

function Landing() {
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const { theme, toggle } = useTheme();
	const wordmark = theme === "dark" ? logoUrl : logoDarkUrl;

	return (
		<div className="site-shell">
			<header className="nav-wrap">
				<Link className="brand" to="/" aria-label="VMEDITHON home">
					<img className="nav-logo" src={wordmark} alt="VMEDITHON 2026" />
				</Link>
				<button type="button" className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
					{menuOpen ? <X /> : <Menu />}
				</button>
				<nav className={menuOpen ? "nav-links open" : "nav-links"}>
					<a href="#tracks">Tracks</a>
					<a href="#journey">Journey</a>
					<a href="#experience">Experience</a>
					<a href="#partners">Partners</a>
					<button type="button" className="text-button" onClick={() => navigate("/participant")}>Participant portal</button>
					<button type="button" className="text-button" onClick={() => navigate("/verify")}>Verify certificate</button>
				</nav>
				<button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle color theme">
					{theme === "dark" ? <Sun /> : <Moon />}
				</button>
				<button type="button" className="nav-cta" onClick={() => navigate("/platform")}>
					Open platform <ArrowRight size={16} />
				</button>
			</header>

			<main>
				<section className="hero" id="top">
					<div className="hero-orbit orbit-one" />
					<div className="hero-orbit orbit-two" />
					<div className="hero-grid" />
					<div className="hero-copy">
						<img className="hero-logo" src={wordmark} alt="VMEDITHON" />
						<div className="eyebrow"><span /> 36 HOURS. THREE PATHS. ONE DEFINING BUILD.</div>
						<h1>Ideas, engineered<br />for <em>impact.</em></h1>
						<p>
							Not another weekend hackathon. Build work worth publishing, patenting, and putting in front of industry.
						</p>
						<div className="hero-actions">
							<a className="button primary" href="#tracks">Explore the tracks <ArrowRight size={18} /></a>
							<button type="button" className="button ghost" onClick={() => navigate("/platform")}>View platform preview</button>
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
					<div className="section-heading" data-reveal>
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

				<section className="closing" data-reveal>
					<div>
						<span className="kicker light">READY WHEN YOU ARE</span>
						<h2>Your idea deserves<br />a stronger ending.</h2>
					</div>
					<div className="closing-actions">
						<button type="button" className="button light-button" onClick={() => navigate("/platform")}>Preview participant portal <CircleArrowOutUpRight /></button>
						<p>Round one is free. Submission dates will be announced soon.</p>
					</div>
				</section>
			</main>

			<footer>
				<Link className="brand footer-brand" to="/"><img className="footer-logo" src={wordmark} alt="VMEDITHON 2026" /></Link>
				<p>Research · Industry · Project<br />Vellore Institute of Technology</p>
				<div><a href="#tracks">Tracks</a><a href="#journey">Timeline</a><button type="button" onClick={() => navigate("/verify")}>Verify certificate</button></div>
				<small>© 2026 VMEDITHON. Built for what comes next.</small>
			</footer>
		</div>
	);
}

function Platform() {
	const navigate = useNavigate();
	return <Dashboard onClose={() => navigate("/")} />;
}

function ParticipantPage() {
	const navigate = useNavigate();
	return <Participant onClose={() => navigate("/")} />;
}

function VerifyPage() {
	const navigate = useNavigate();
	const { certificate_id } = useParams<{ certificate_id?: string }>();
	const [code, setCode] = useState(certificate_id ?? "");
	const [result, setResult] = useState<null | { status: string; recipient_name: string; track: string | null; event_name: string; issued_at: string | null }>(null);
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [fileType, setFileType] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: auto-verify only when the route certificate_id is present
	useEffect(() => {
		if (certificate_id) {
			setCode(certificate_id);
			void verify();
		}
	}, [certificate_id]);

	async function verify() {
		setLoading(true);
		setError(null);
		setResult(null);
		setFileUrl(null);
		setFileType(null);
		const id = certificate_id ?? code;
		try {
			const response = await fetch(`/api/public/certificates/${encodeURIComponent(id)}`);
			const data = (await response.json()) as { status?: string; recipient_name?: string; track?: string | null; event_name?: string; issued_at?: string | null; error?: { message?: string } };
			if (!response.ok) {
				setError(data.error?.message ?? "Certificate not found");
			} else {
				setResult({
					status: data.status ?? "unknown",
					recipient_name: data.recipient_name ?? "",
					track: data.track ?? null,
					event_name: data.event_name ?? "VMEDITHON 2026",
					issued_at: data.issued_at ?? null,
				});
			}
		} catch {
			setError("Could not verify certificate. Please try again.");
		}
		setLoading(false);
	}

	useEffect(() => {
		if (result?.status !== "issued") { setFileUrl(null); return; }
		const id = certificate_id ?? code;
		let objectUrl = "";
		fetch(`/api/public/certificates/${encodeURIComponent(id)}/file`)
			.then(async (response) => {
				if (!response.ok) return;
				const blob = await response.blob();
				objectUrl = URL.createObjectURL(blob);
				setFileUrl(objectUrl);
				setFileType(blob.type);
			})
			.catch(() => { /* ignore */ });
		return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
	}, [result, code, certificate_id]);

	function download() {
		if (!fileUrl) return;
		const link = document.createElement("a");
		link.href = fileUrl;
		link.download = `${code}.${fileType?.includes("svg") ? "svg" : "png"}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function downloadPng() {
		if (!fileUrl) return;
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = fileUrl;
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error("Could not load certificate image"));
		});
		const canvas = document.createElement("canvas");
		canvas.width = 800;
		canvas.height = 600;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(img, 0, 0, 800, 600);
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${code}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	return (
		<div className="modal-backdrop" role="presentation" style={{ position: "fixed", inset: 0 }}>
			<div className="verify-modal" role="dialog" aria-modal="true" aria-label="Verify certificate">
				<button type="button" className="icon-button close-modal" onClick={() => navigate("/")}><X /></button>
				<div className="modal-brand"><img src={logoUrl} alt="VMEDITHON 2026" /></div>
				<div className="verify-icon"><QrCode /></div>
				<span className="kicker">PUBLIC VERIFICATION</span>
				<h2>Verify a certificate</h2>
				<p>Enter the unique ID printed in the lower corner of any VMEDITHON certificate.</p>
				<label>
					Certificate ID
					<input value={code} onChange={(event) => { setCode(event.target.value); setError(null); setResult(null); setFileUrl(null); }} placeholder="e.g. VMT26-P-0184" />
				</label>
				<button type="button" className="button primary full" onClick={verify} disabled={loading}><Search /> {loading ? "Verifying..." : "Verify certificate"}</button>
				{error && <div className="demo-result" style={{ background: "#fff0f0" }}><FileUp /><span><strong>Not found</strong>{error}</span></div>}
				{result && (
					<div className="demo-result">
						<FileUp />
						<span>
							<strong>{result.status === "issued" ? "Verified" : result.status}</strong>
							{result.recipient_name} — {result.event_name}
							{result.track && <span><br />Track: {result.track}</span>}
							{result.issued_at && <span><br />Issued: {new Date(result.issued_at).toLocaleDateString()}</span>}
						</span>
					</div>
				)}
				{fileUrl && (
					<div style={{ marginTop: 16, textAlign: "center" }}>
						<img src={fileUrl} alt="Certificate" style={{ maxWidth: "100%", border: "1px solid #eee", borderRadius: 8 }} />
						<div style={{ display: "flex", gap: 8, marginTop: 12 }}>
							<button type="button" className="button primary full" onClick={download}><FileUp /> SVG</button>
							<button type="button" className="button primary full" onClick={downloadPng}><FileUp /> PNG</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
