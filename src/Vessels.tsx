import { useEffect, useRef } from "react";

const NS = "http://www.w3.org/2000/svg";
const CYCLE = 4.6; // seconds for one heartbeat wave top -> bottom
const ECHO = 0.09; // echo pulse trails the main pulse by this much of the path
const RGB = { left: "19,226,124", right: "46,156,255" }; // green / blue

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const gauss = (x: number, c: number, w: number) => Math.exp(-((x - c) * (x - c)) / (2 * w * w));

interface Node {
	card: HTMLElement;
	s: number; // junction position along the path, 0..1
}

interface Trunk {
	path: SVGPathElement;
	core: SVGCircleElement;
	glow: SVGCircleElement;
	echo: SVGCircleElement;
	echoGlow: SVGCircleElement;
	len: number;
	nodes: Node[];
	rgb: string;
}

export function Vessels() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const host = ref.current;
		const shell = host?.parentElement;
		if (!host || !shell) return;
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

		let trunks: Trunk[] = [];
		let lastKey = "";

		const build = () => {
			const sr = shell.getBoundingClientRect();
			const all = [
				...shell.querySelectorAll<HTMLElement>(".track-half,.theme-card,.round-card"),
			];
			if (all.length < 4 || sr.width < 10) return;

			// document order alternates left,right within each paired section
			const sides: { cards: HTMLElement[]; rgb: string; right: boolean }[] = [
				{ cards: all.filter((_, i) => i % 2 === 0), rgb: RGB.left, right: false },
				{ cards: all.filter((_, i) => i % 2 === 1), rgb: RGB.right, right: true },
			];

			const key =
				sr.width.toFixed(0) +
				all
					.map((c) => {
						const r = c.getBoundingClientRect();
						return `|${(r.left - sr.left).toFixed(0)},${(r.top - sr.top).toFixed(0)},${r.height.toFixed(0)}`;
					})
					.join("");
			if (key === lastKey) return;
			lastKey = key;

			svg.textContent = "";
			trunks = [];
			const H = sr.height;
			svg.setAttribute("viewBox", `0 0 ${sr.width} ${H}`);

			for (const side of sides) {
				const dir = side.right ? 1 : -1;
				const trunkX = side.right ? sr.width - 54 : 54;
				// junctions: the card edge point the vessel plugs into
				const js = side.cards.map((card) => {
					const r = card.getBoundingClientRect();
					return {
						card,
						jx: side.right ? r.right - sr.left + 2 : r.left - sr.left - 2,
						jy: r.top - sr.top + r.height / 2,
						inX: side.right ? r.right - sr.left - 58 : r.left - sr.left + 58,
					};
				});
				if (!js.length) continue;
				const top = js[0]!.jy - 160;
				const bot = js[js.length - 1]!.jy + 170;

				// the trunk weaves: margin -> bend to the card edge -> lobe dips
				// inside the card -> back out to the margin
				let d = `M ${trunkX} ${top}`;
				for (const j of js) {
					d +=
						` C ${trunkX} ${j.jy - 130}, ${j.jx + dir * 80} ${j.jy - 45}, ${j.jx} ${j.jy}` +
						` C ${j.inX} ${j.jy}, ${j.inX} ${j.jy + 34}, ${j.jx - dir * 12} ${j.jy + 48}` +
						` C ${j.jx + dir * 55} ${j.jy + 58}, ${trunkX} ${j.jy + 120}, ${trunkX} ${j.jy + 170}`;
				}
				d += ` C ${trunkX} ${bot - 60}, ${trunkX} ${bot - 20}, ${trunkX} ${bot}`;

				const path = mk("path", {
					d,
					fill: "none",
					stroke: `rgba(${side.rgb},0.16)`,
					"stroke-width": "7",
					"stroke-linecap": "round",
				});
				mk("path", {
					d,
					fill: "none",
					stroke: "rgba(255,255,255,0.05)",
					"stroke-width": "2",
					"stroke-linecap": "round",
				});

				const len = path.getTotalLength();
				const nodes: Node[] = [];
				for (const j of js) {
					// collar ring straddling the card edge — the "stuck on" joint
					mk("circle", {
						cx: String(j.jx),
						cy: String(j.jy),
						r: "10",
						fill: "none",
						stroke: `rgba(${side.rgb},0.6)`,
						"stroke-width": "2.5",
					});
					mk("circle", { cx: String(j.jx), cy: String(j.jy), r: "4", fill: `rgba(${side.rgb},0.85)` });
					// bump syncs to the lobe's deepest point inside the card
					const tx = j.inX - dir * 12;
					const ty = j.jy + 24;
					let lo = 0;
					let hi = len;
					for (let k = 0; k < 24; k++) {
						const m1 = lo + (hi - lo) / 3;
						const m2 = hi - (hi - lo) / 3;
						const p1 = path.getPointAtLength(m1);
						const p2 = path.getPointAtLength(m2);
						const d1 = (p1.x - tx) ** 2 + (p1.y - ty) ** 2;
						const d2 = (p2.x - tx) ** 2 + (p2.y - ty) ** 2;
						if (d1 < d2) hi = m2;
						else lo = m1;
					}
					nodes.push({ card: j.card, s: (lo + hi) / 2 / len });
				}

				const glow = mk("circle", { r: "13", fill: `rgba(${side.rgb},0.22)` });
				const core = mk("circle", { r: "4.2", fill: `rgba(${side.rgb},0.95)` });
				const echoGlow = mk("circle", { r: "9", fill: `rgba(${side.rgb},0.14)` });
				const echo = mk("circle", { r: "2.8", fill: `rgba(${side.rgb},0.6)` });
				trunks.push({ path, core, glow, echo, echoGlow, len, nodes, rgb: side.rgb });
			}
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
		const bumpCards = new Map<HTMLElement, number>();

		const tick = () => {
			raf = requestAnimationFrame(tick);
			if (++frame % 60 === 0) build(); // pick up layout drift (reveals, fonts)
			const now = (performance.now() - t0) / 1000;

			// wave travels the whole trunk in 80% of the cycle, then rests
			const ph = (now % CYCLE) / CYCLE;
			const sMain = clamp01(ph / 0.8);
			const sEcho = clamp01((ph - ECHO) / 0.8);
			const vis = smoothFade(ph);

			for (const t of trunks) {
				const p1 = t.path.getPointAtLength(sMain * t.len);
				t.glow.setAttribute("transform", `translate(${p1.x} ${p1.y})`);
				t.core.setAttribute("transform", `translate(${p1.x} ${p1.y})`);
				t.glow.setAttribute("opacity", String(vis));
				t.core.setAttribute("opacity", String(vis));

				const p2 = t.path.getPointAtLength(sEcho * t.len);
				t.echoGlow.setAttribute("transform", `translate(${p2.x} ${p2.y})`);
				t.echo.setAttribute("transform", `translate(${p2.x} ${p2.y})`);
				const ev = ph > ECHO ? vis * 0.7 : 0;
				t.echoGlow.setAttribute("opacity", String(ev));
				t.echo.setAttribute("opacity", String(ev));

				// each card thumps when a pulse crosses its junction — lub + dub
				for (const n of t.nodes) {
					const b =
						0.016 * gauss(sMain, n.s, 0.022) + 0.009 * gauss(sEcho, n.s, 0.022);
					const prev = bumpCards.get(n.card) ?? 0;
					if (b > 0.0007) {
						n.card.style.transition = "none";
						n.card.style.transform = `translateY(${(-b * 210).toFixed(2)}px) scale(${(1 + b).toFixed(4)})`;
						n.card.style.boxShadow = `0 0 ${(b * 1500).toFixed(0)}px rgba(${t.rgb},0.4), inset 0 0 ${(b * 800).toFixed(0)}px rgba(${t.rgb},0.16)`;
						n.card.style.borderColor = `rgba(${t.rgb},0.55)`;
						bumpCards.set(n.card, b);
					} else if (prev > 0) {
						n.card.style.transition = "";
						n.card.style.transform = "";
						n.card.style.boxShadow = "";
						n.card.style.borderColor = "";
						bumpCards.set(n.card, 0);
					}
				}
			}
		};

		// fade pulses in/out at the wave ends
		const smoothFade = (ph: number) => {
			const inn = clamp01(ph / 0.06);
			const out = 1 - clamp01((ph - 0.74) / 0.12);
			return inn * out;
		};

		tick();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			for (const card of bumpCards.keys()) {
				card.style.transition = "";
				card.style.transform = "";
				card.style.boxShadow = "";
				card.style.borderColor = "";
			}
			host.removeChild(svg);
		};
	}, []);

	return <div ref={ref} className="vessels" aria-hidden="true" />;
}
