import { useEffect, useRef } from "react";

const NS = "http://www.w3.org/2000/svg";
const CYCLE = 2.4; // heartbeat period in seconds
const STAGGER = 0.18; // left/right beat offset
const RGB = ["19,226,124", "46,156,255"]; // left=green, right=blue

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => {
	const x = clamp01(t);
	return x * x * (3 - 2 * x);
};
const gauss = (x: number, c: number, w: number) => Math.exp(-((x - c) * (x - c)) / (2 * w * w));

// blood position along the vessel: pump -> dub -> drift -> rest
const pulsePos = (ph: number) =>
	ph < 0.38
		? smooth(ph / 0.38) * 0.55
		: ph < 0.58
			? 0.55 + smooth((ph - 0.38) / 0.2) * 0.17
			: ph < 0.8
				? 0.72 + smooth((ph - 0.58) / 0.22) * 0.28
				: 1;

interface Vessel {
	path: SVGPathElement;
	core: SVGCircleElement;
	glow: SVGCircleElement;
	card: HTMLElement;
	len: number;
	rgb: string;
}

export function Vessels() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const host = ref.current;
		const section = host?.parentElement;
		if (!host || !section) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("class", "vessels-svg");
		svg.setAttribute("aria-hidden", "true");
		host.appendChild(svg);

		const mk = <K extends keyof SVGElementTagNameMap>(
			tag: K,
			attrs: Record<string, string>,
		): SVGElementTagNameMap[K] => {
			const el = document.createElementNS(NS, tag);
			for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
			svg.appendChild(el);
			return el;
		};

		let vessels: Vessel[] = [];
		let lastKey = "";

		const build = () => {
			const sr = section.getBoundingClientRect();
			if (sr.width < 10) return;
			const cards = [
				...section.querySelectorAll<HTMLElement>(".track-half,.theme-card,.round-card"),
			].slice(0, 2);
			if (cards.length < 2) return;

			// rebuild only when layout actually changed (reveal transforms settle)
			const key = cards
				.map((c) => {
					const r = c.getBoundingClientRect();
					return `${(r.left - sr.left).toFixed(0)},${(r.top - sr.top).toFixed(0)},${r.width.toFixed(0)},${r.height.toFixed(0)}`;
				})
				.join("|");
			const fullKey = `${sr.width.toFixed(0)}x${key}`;
			if (fullKey === lastKey) return;
			lastKey = fullKey;

			svg.textContent = "";
			vessels = [];
			svg.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height + 160}`);
			svg.style.height = `${sr.height + 160}px`;

			cards.forEach((card, i) => {
				const r = card.getBoundingClientRect();
				const l = r.left - sr.left;
				const t = r.top - sr.top;
				const w = r.width;
				const h = r.height;
				const rgb = RGB[i] ?? "19,226,124";
				const out = i === 0 ? -1 : 1; // left card swings left, right swings right
				const x0 = i === 0 ? l - 6 : l + w + 6; // outer edge attach
				const x1 = i === 0 ? l + w + 6 : l - 6; // inner edge attach
				const y0 = t + h * 0.28;
				const y1 = t + h * 0.72;
				const edge = i === 0 ? Math.max(28, l * 0.35) : Math.min(sr.width - 28, l + w + (sr.width - l - w) * 0.65);
				const belly = t + h + 95;
				// vessel: leaves the outer edge, sweeps out and down, arcs back
				// under the card into the inner edge — the card sits inside the loop
				const d =
					`M ${x0} ${y0}` +
					` C ${x0 + out * 90} ${y0 - 12}, ${edge + out * 70} ${belly - 70}, ${edge} ${belly}` +
					` C ${edge - out * 30} ${belly + 45}, ${x1 - out * 120} ${y1 + h * 0.9}, ${x1} ${y1}`;

				const path = mk("path", {
					d,
					fill: "none",
					stroke: `rgba(${rgb},0.14)`,
					"stroke-width": "6",
					"stroke-linecap": "round",
				});
				mk("path", {
					d,
					fill: "none",
					stroke: "rgba(255,255,255,0.05)",
					"stroke-width": "1.5",
					"stroke-linecap": "round",
				});
				// connection ports where the vessel meets the card
				mk("circle", { cx: String(x0), cy: String(y0), r: "4", fill: `rgba(${rgb},0.5)` });
				mk("circle", { cx: String(x1), cy: String(y1), r: "4", fill: `rgba(${rgb},0.5)` });
				// travelling blood pulse: soft glow + bright core
				const glow = mk("circle", { r: "11", fill: `rgba(${rgb},0.22)` });
				const core = mk("circle", { r: "3.6", fill: `rgba(${rgb},0.95)` });
				vessels.push({ path, core, glow, card, len: path.getTotalLength(), rgb });
			});
		};

		build();
		const onResize = () => {
			lastKey = "";
			build();
		};
		window.addEventListener("resize", onResize);

		const t0 = performance.now();
		let raf = 0;
		let frame = 0;
		const active = new Set<Vessel>();
		const tick = () => {
			raf = requestAnimationFrame(tick);
			const sr = section.getBoundingClientRect();
			if (sr.bottom < -160 || sr.top > window.innerHeight + 160) return; // off-screen
			if (++frame % 50 === 0) build(); // pick up layout drift (reveals, resize)
			const now = (performance.now() - t0) / 1000;

			vessels.forEach((v, i) => {
				const ph = ((now + STAGGER * i) % CYCLE) / CYCLE;
				const s = pulsePos(ph);
				const pt = v.path.getPointAtLength(s * v.len);
				const a = smooth(ph / 0.05) * (1 - smooth((ph - 0.78) / 0.14));
				v.glow.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
				v.core.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
				v.glow.setAttribute("opacity", String(a));
				v.core.setAttribute("opacity", String(a));

				// heartbeat: lub at pulse entry, dub mid-travel under the card
				const b = 0.016 * gauss(ph, 0.04, 0.055) + 0.009 * gauss(ph, 0.47, 0.05);
				if (b > 0.0007) {
					v.card.style.transition = "none";
					v.card.style.transform = `translateY(${(-b * 210).toFixed(2)}px) scale(${(1 + b).toFixed(4)})`;
					v.card.style.boxShadow = `0 0 ${(b * 1500).toFixed(0)}px rgba(${v.rgb},0.4), inset 0 0 ${(b * 800).toFixed(0)}px rgba(${v.rgb},0.16)`;
					v.card.style.borderColor = `rgba(${v.rgb},0.55)`;
					active.add(v);
				} else if (active.has(v)) {
					v.card.style.transition = "";
					v.card.style.transform = "";
					v.card.style.boxShadow = "";
					v.card.style.borderColor = "";
					active.delete(v);
				}
			});
		};
		tick();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			for (const v of vessels) {
				v.card.style.transition = "";
				v.card.style.transform = "";
				v.card.style.boxShadow = "";
				v.card.style.borderColor = "";
			}
			host.removeChild(svg);
		};
	}, []);

	return <div ref={ref} className="vessels" aria-hidden="true" />;
}
