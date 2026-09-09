import { useEffect, useRef, useState } from "react";

/** A procedural signal surface. No models, textures, or animation dependencies. */
export function SignalScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [paused, setPaused] = useState(false);
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
					const x = ring * Math.cos(angle) * ripple;
					const z = ring * Math.sin(angle) * ripple;
					const y = Math.cos(latitude) * 1.18;
					const rotation = phase * 0.16 + pointer;
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
			draw();
			frame = requestAnimationFrame(tick);
		};
		const sync = () => {
			cancelAnimationFrame(frame);
			previous = 0;
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
		canvas.addEventListener("pointermove", move);
		motion.addEventListener("change", sync);
		document.addEventListener("visibilitychange", sync);
		return () => {
			cancelAnimationFrame(frame);
			resize.disconnect(); observer.disconnect(); themeObserver.disconnect();
			canvas.removeEventListener("pointermove", move);
			motion.removeEventListener("change", sync);
			document.removeEventListener("visibilitychange", sync);
		};
	}, [paused]);
	return <div className="signal-scene"><div className="signal-label"><span>FIG. 01</span><span>THE SHAPE OF POSSIBILITY</span></div><canvas ref={canvasRef} role="img" aria-label="Animated line sculpture connecting biological and digital forms" /><div className="signal-controls"><span><span className="status-dot" /> BIOLOGY × TECHNOLOGY</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Resume motion ↗" : "Pause motion Ⅱ"}</button></div></div>;
}
