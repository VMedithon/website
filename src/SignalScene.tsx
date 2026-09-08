import { useEffect, useRef, useState } from "react";

/** A procedural signal surface. No models, textures, or animation dependencies. */
export function SignalScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [paused, setPaused] = useState(false);
	const [form, setForm] = useState(0);
	const formRef = useRef(0);
	const phaseRef = useRef(0);
	const pointerRef = useRef(0);
	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");
		if (!canvas || !context) return;
		const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
		let frame = 0;
		let phase = phaseRef.current;
		let previous = 0;
		let visible = false;
		let width = 0;
		let height = 0;
		let pointer = pointerRef.current;
		let shape = formRef.current;
		let scroll = 0;
		const draw = () => {
			context.clearRect(0, 0, width, height);
			const radius = Math.min(width, height) * 0.35;
			const light = document.documentElement.dataset.theme === "light";
			for (let row = 0; row < 68; row++) {
				const latitude = (row / 67) * Math.PI;
				const ring = Math.sin(latitude);
				context.beginPath();
				for (let column = 0; column <= 100; column++) {
					const angle = (column / 100) * Math.PI * 2;
					const ripple = 1 + 0.15 * Math.sin(angle * 3 + latitude * 5 + phase);
					const sphere = [ring * Math.cos(angle) * ripple, Math.cos(latitude) * 1.18, ring * Math.sin(angle) * ripple];
					const helix = [Math.cos(latitude * 4 + phase * .3) * .55 + Math.cos(angle) * .23, (row / 67 - .5) * 2.3, Math.sin(latitude * 4 + phase * .3) * .55 + Math.sin(angle) * .23];
					const torus = [(0.72 + .3 * Math.cos(latitude * 2)) * Math.cos(angle), .3 * Math.sin(latitude * 2), (0.72 + .3 * Math.cos(latitude * 2)) * Math.sin(angle)];
					const from = shape <= 1 ? sphere : helix;
					const to = shape <= 1 ? helix : torus;
					const mix = shape <= 1 ? shape : shape - 1;
					const x = (from[0] ?? 0) * (1 - mix) + (to[0] ?? 0) * mix;
					const y = (from[1] ?? 0) * (1 - mix) + (to[1] ?? 0) * mix;
					const z = (from[2] ?? 0) * (1 - mix) + (to[2] ?? 0) * mix;
					const rotation = phase * 0.16 + pointer + scroll * 1.4;
					const rx = x * Math.cos(rotation) - z * Math.sin(rotation);
					const rz = x * Math.sin(rotation) + z * Math.cos(rotation);
					const px = width / 2 + (rx * 0.91 + y * 0.4) * radius;
					const py = height / 2 + (y * 0.85 - rx * 0.35 + rz * 0.32) * radius;
					if (column === 0) context.moveTo(px, py);
					else context.lineTo(px, py);
				}
				context.strokeStyle = row < 34 ? (light ? "#526329" : "#d4efa0") : (light ? "#a64d36" : "#f0ac91");
				context.globalAlpha = 0.48 + Math.sin(latitude) * 0.4;
				context.lineWidth = 0.85;
				context.stroke();
			}
			context.globalAlpha = 1;
		};
		const tick = (time: number) => {
			phase += previous ? Math.min(time - previous, 50) * 0.00045 : 0;
			previous = time;
			phaseRef.current = phase;
			shape += (form - shape) * .055;
			formRef.current = shape;
			draw();
			frame = requestAnimationFrame(tick);
		};
		const sync = () => {
			cancelAnimationFrame(frame);
			previous = 0;
			if (paused || motion.matches) { shape = form; formRef.current = form; }
			draw();
			if (visible && !document.hidden && !motion.matches && !paused) frame = requestAnimationFrame(tick);
		};
		const resize = new ResizeObserver(() => {
			width = canvas.clientWidth;
			height = canvas.clientHeight;
			const ratio = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = width * ratio;
			canvas.height = height * ratio;
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
			sync();
		});
		resize.observe(canvas);
		const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); sync(); });
		observer.observe(canvas);
		const themeObserver = new MutationObserver(draw);
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
		const move = (event: PointerEvent) => {
			if (motion.matches || paused || event.pointerType === "touch") return;
			pointer = (event.offsetX / Math.max(1, width) - 0.5) * 0.6;
			pointerRef.current = pointer;
		};
		const onScroll = () => {
			if (!visible || motion.matches || paused) return;
			scroll = Math.max(0, Math.min(1, -canvas.getBoundingClientRect().top / Math.max(1, height)));
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		canvas.addEventListener("pointermove", move);
		motion.addEventListener("change", sync);
		document.addEventListener("visibilitychange", sync);
		return () => {
			cancelAnimationFrame(frame);
			resize.disconnect(); observer.disconnect(); themeObserver.disconnect();
			window.removeEventListener("scroll", onScroll);
			canvas.removeEventListener("pointermove", move);
			motion.removeEventListener("change", sync);
			document.removeEventListener("visibilitychange", sync);
		};
	}, [paused, form]);
	return (
		<div className="signal-scene">
			<div className="signal-label"><span>FIG. 0{form + 1}</span><span>THE SHAPE OF POSSIBILITY</span></div>
			<div className="signal-stage"><div className="signal-guides" aria-hidden="true"><span>+</span><span>+</span><span>+</span><span>+</span></div><canvas ref={canvasRef} role="img" aria-label={`${["Cell", "Helix", "Orbit"][form]}: an interactive line sculpture connecting biological and digital forms`} /></div>
			<fieldset className="form-selector" aria-label="Sculpture form">
				{["Cell", "Helix", "Orbit"].map((label, index) => <button type="button" key={label} onClick={() => setForm(index)} aria-pressed={form === index}><span>0{index + 1}</span>{label}<span aria-hidden="true">{form === index ? "●" : "○"}</span></button>)}
			</fieldset>
			<div className="signal-controls"><span><span className="status-dot" /> EXPLORE THE POSSIBILITIES</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Resume motion ↗" : "Pause motion Ⅱ"}</button></div>
		</div>
	);
}
