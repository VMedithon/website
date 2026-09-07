import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import dnaUrl from "./assets/dna.glb?url";

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// VMEDITHON palette: cycles green -> blue -> gold over time
const CYCLE = [new THREE.Color(0x13e27c), new THREE.Color(0x2e9cff), new THREE.Color(0xf8c000)];
const scratch = new THREE.Color();
const DIM_DARK = new THREE.Color(0x33506b); // muted steel-blue, visible on the dark bg
const DIM_LIGHT = new THREE.Color(0x54687e); // darker slate so it reads on light bg

export function DnaScene() {
	const hostRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setClearColor(0x000000, 0);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(window.innerWidth, window.innerHeight);
		host.appendChild(renderer.domElement);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
		camera.position.set(0, 0, 5);

		scene.add(new THREE.AmbientLight(0xffffff, 0.85));
		const key = new THREE.DirectionalLight(0xffffff, 1.8);
		key.position.set(2, 3, 4);
		scene.add(key);
		const rim = new THREE.PointLight(0x2e9cff, 8, 20);
		rim.position.set(-2.5, 0, 2);
		scene.add(rim);

		const uniforms = {
			uProgress: { value: 0 },
			uGlow: { value: 0 },
			uMinY: { value: -1 },
			uMaxY: { value: 1 },
			uDim: { value: DIM_DARK.clone() },
			uTop: { value: CYCLE[0]!.clone().multiplyScalar(1.5) },
			uMid: { value: CYCLE[0]!.clone() },
			uBot: { value: CYCLE[0]!.clone().multiplyScalar(0.45) },
		};

		const material = new THREE.MeshStandardMaterial({
			metalness: 0.2,
			roughness: 0.55,
			transparent: true,
			opacity: 0.95,
		});
		material.onBeforeCompile = (shader) => {
			Object.assign(shader.uniforms, uniforms);
			shader.vertexShader = shader.vertexShader
				.replace(
					"#include <common>",
					"#include <common>\nuniform float uMinY;\nuniform float uMaxY;\nvarying float vNy;",
				)
				.replace(
					"#include <begin_vertex>",
					"#include <begin_vertex>\nvNy = (position.y - uMinY) / max(uMaxY - uMinY, 1e-4);",
				);
			shader.fragmentShader = shader.fragmentShader
				.replace(
					"#include <common>",
					"#include <common>\nuniform float uProgress;\nuniform float uGlow;\nuniform vec3 uDim;\nuniform vec3 uTop;\nuniform vec3 uMid;\nuniform vec3 uBot;\nvarying float vNy;",
				)
				.replace(
					"#include <color_fragment>",
					`#include <color_fragment>
	float dnaT = clamp(vNy, 0.0, 1.0);
	// 3-stop vertical gradient: deep -> current hue -> light
	vec3 dnaBrand = dnaT < 0.5 ? mix(uBot, uMid, dnaT * 2.0) : mix(uMid, uTop, (dnaT - 0.5) * 2.0);
	// bright band where colour is actively filling
	dnaBrand += uTop * 0.45 * smoothstep(0.10, 0.0, abs(dnaT - (1.0 - uProgress)));
	float dnaLit = smoothstep(1.0 - uProgress - 0.06, 1.0 - uProgress + 0.02, dnaT);
	diffuseColor.rgb = mix(uDim, dnaBrand, dnaLit);`,
				)
				.replace(
					"#include <emissivemap_fragment>",
					`#include <emissivemap_fragment>
	totalEmissiveRadiance += dnaBrand * dnaLit * uGlow;`,
				);
		};

		let model: THREE.Group | null = null;
		let disposed = false;

		new GLTFLoader().load(dnaUrl, (gltf) => {
			if (disposed) return;
			const obj = gltf.scene;
			obj.traverse((c) => {
				if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = material;
			});
			// stand the model on Y regardless of export axes — bake it into the
			// geometry so the shader's position.y is the true vertical axis
			const raw = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
			obj.traverse((c) => {
				const mesh = c as THREE.Mesh;
				if (!mesh.isMesh) return;
				if (raw.z >= raw.x && raw.z >= raw.y) mesh.geometry.rotateX(-Math.PI / 2);
				else if (raw.x >= raw.y && raw.x >= raw.z) mesh.geometry.rotateZ(Math.PI / 2);
			});
			obj.updateMatrixWorld(true);
			const box = new THREE.Box3().setFromObject(obj);
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());
			obj.position.sub(center);
			// normalized model height drives the shader's top->bottom colouring
			uniforms.uMinY.value = -size.y / 2;
			uniforms.uMaxY.value = size.y / 2;
			model = new THREE.Group().add(obj);
			model.userData.height = size.y;
			scene.add(model);
		});

		const spine = () => document.querySelector<HTMLElement>(".journey-spine");
		const section = () => document.querySelector<HTMLElement>(".journey-section");

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener("resize", onResize);

		let raf = 0;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			const sec = section();
			const sp = spine();
			if (!model || !sec || !sp) return;

			const sr = sec.getBoundingClientRect();
			const pr = sp.getBoundingClientRect();
			const vh = window.innerHeight;

			// visibility: fade in as the section enters, out as it leaves
			const vis = clamp01((vh - sr.top) / (vh * 0.2)) * clamp01(sr.bottom / (vh * 0.3));
			host.style.opacity = String(vis);
			if (vis <= 0) return;

			// confine drawing to the section's on-screen rect — the DNA never
			// renders outside the journey section's bounds
			const clipTop = Math.max(0, sr.top);
			const clipBottom = Math.min(vh, sr.bottom);
			renderer.setScissorTest(true);
			renderer.setScissor(0, vh - clipBottom, window.innerWidth, clipBottom - clipTop);

			// progress: 0 when the spine's top reaches 70% viewport, 1 when its bottom hits 40%
			const p = clamp01((vh * 0.7 - pr.top) / Math.max(1, pr.height - vh * 0.3));

			const time = performance.now() / 1000;
			// colour cycles green -> blue -> gold -> green every ~9s
			const cyc = ((time % 9) / 9) * CYCLE.length;
			const ci = Math.floor(cyc);
			const cur = scratch
				.copy(CYCLE[ci % CYCLE.length]!)
				.lerp(CYCLE[(ci + 1) % CYCLE.length]!, cyc - ci);
			uniforms.uMid.value.copy(cur);
			uniforms.uTop.value.copy(cur).multiplyScalar(1.5); // brightened hue, no white
			uniforms.uBot.value.copy(cur).multiplyScalar(0.45);
			rim.color.copy(cur);

			uniforms.uProgress.value = p;
			uniforms.uGlow.value = 0.3 + p * 1.5; // lit region always glows, more as you scroll
			rim.intensity = 8 + p * 24;
			uniforms.uDim.value.copy(
				document.documentElement.dataset.theme === "light" ? DIM_LIGHT : DIM_DARK,
			);

			// centred on the spine, ~92% of viewport height
			const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
			const scale = (worldH * 0.92) / model.userData.height;
			model.scale.setScalar(scale);

			const ndcX = ((pr.left + pr.width / 2) / window.innerWidth) * 2 - 1;
			model.position.set(ndcX * ((worldH * camera.aspect) / 2), 0, 0);

			// continuous spin plus a scroll-linked twist — never stops
			model.rotation.y = time * 1.2 + p * Math.PI * 4;
			model.rotation.x = 0.1;

			renderer.render(scene, camera);
			renderer.setScissorTest(false);
		};
		tick();

		return () => {
			disposed = true;
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			material.dispose();
			model?.traverse((c) => {
				if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).geometry.dispose();
			});
			renderer.dispose();
			host.removeChild(renderer.domElement);
		};
	}, []);

	return <div ref={hostRef} className="dna-canvas" aria-hidden="true" />;
}
