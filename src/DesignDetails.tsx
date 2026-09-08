const waveRows = Array.from({ length: 15 }, (_, row) => row);
const sealAngles = Array.from({ length: 24 }, (_, i) => i * 7.5);

/** Original vector illustrations shared by the two build disciplines. */
export function TrackDiagram({ hardware = false }: { hardware?: boolean }) {
	return (
		<div className={`track-diagram ${hardware ? "hardware" : "software"}`} aria-hidden="true">
			<div className="diagram-caption"><span>{hardware ? "02 / PHYSICAL SYSTEMS" : "01 / DIGITAL SYSTEMS"}</span><span>VM—26 ↗</span></div>
			<svg viewBox="0 0 480 260" fill="none">
				<title>{hardware ? "Exploded device architecture" : "A field of connected signals"}</title>
				{hardware ? <>
					{[0, 1, 2, 3].map((layer) => <g key={layer} className={`device-layer layer-${layer}`}>
						<path d={`M240 ${28 + layer * 40} L388 ${83 + layer * 40} L240 ${138 + layer * 40} L92 ${83 + layer * 40} Z`} fill="currentColor" fillOpacity={0.025 + layer * 0.025} stroke="currentColor" />
						<path d={`M240 ${43 + layer * 40} L345 ${83 + layer * 40} L240 ${123 + layer * 40} L135 ${83 + layer * 40} Z`} stroke="currentColor" strokeOpacity=".3" />
					</g>)}
					<path d="M92 83V203M388 83V203M240 28V148" stroke="currentColor" strokeOpacity=".4" strokeDasharray="3 6" />
				</> : <>
					{waveRows.map((row) => <path key={`wave-${row}`} className="signal-wave" d={`M40 ${45 + row * 12} C125 ${45 + row * 12}, 130 ${160 - row * 7}, 240 ${130 + Math.sin(row * .5) * 38} S355 ${45 + row * 12}, 440 ${45 + row * 12}`} stroke="currentColor" strokeOpacity={.3 + row * .04} />)}
					{[70, 155, 240, 325, 410].map((x) => <g key={x}><path d={`M${x} 25V235`} stroke="currentColor" strokeOpacity=".15" strokeDasharray="2 5" /><circle cx={x} cy="130" r="4" fill="currentColor" /></g>)}
				</>}
			</svg>
			<div className="diagram-caption"><span>{hardware ? "DESIGN → FABRICATE → VALIDATE" : "IDEATE → COMPILE → CREATE"}</span><span>{hardware ? "[ DEVICE ]" : "[ SIGNAL ]"}</span></div>
		</div>
	);
}

export function Manifesto() {
	return (
		<section className="manifesto" aria-labelledby="manifesto-title">
			<div className="manifesto-top"><span>THE VMEDITHON MINDSET</span><span>IDEAS ARE ONLY THE BEGINNING.</span></div>
			<h2 id="manifesto-title">Less <span className="outline-word">what if.</span><br />More <span className="make-word">made it.<svg viewBox="0 0 600 36" fill="none" aria-hidden="true"><path d="M4 25 Q290 0 593 15 M75 32 Q340 12 550 27" /></svg></span></h2>
			<div className="manifesto-bottom"><span className="cross-mark" aria-hidden="true">✳</span><p>Bring the question you can’t stop thinking about.<br />Leave with something the world can use.</p><a href="#themes">FIND YOUR FRONTIER <span>↘</span></a></div>
		</section>
	);
}

export function OrbitSeal() {
	return <svg className="orbit-seal" viewBox="0 0 400 400" fill="none" aria-hidden="true"><title>Geometric award rosette</title>{sealAngles.map((angle) => <ellipse key={angle} cx="200" cy="200" rx="175" ry="58" transform={`rotate(${angle} 200 200)`} stroke="currentColor" strokeWidth=".7" />)}<circle cx="200" cy="200" r="42" fill="currentColor" /><path d="M180 200H220M200 180V220" stroke="var(--brand-green)" strokeWidth="2" /></svg>;
}
