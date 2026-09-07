import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import caduceusUrl from "./assets/Caduceus_V1_L1.123c90e1bfa0-7801-4864-851a-b3feb655204d/16985_Caduceus_V1_NEW.obj?url";

const GOLD = 0xd9a92f;
const EXTRACT_PX = 340; // scroll distance over which the model leaves the logo
const ROTATE_PER_PX = 0.0032; // radians of rotation per pixel scrolled
const REST_OPACITY = 0.32;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function CaduceusScene() {
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

		scene.add(new THREE.AmbientLight(0xffffff, 0.9));
		const key = new THREE.DirectionalLight(0xfff3d0, 2.4);
		key.position.set(2.5, 4, 3);
		scene.add(key);
		const rim = new THREE.PointLight(GOLD, 32, 20);
		rim.position.set(-3, -1, 2);
		scene.add(rim);

		const material = new THREE.MeshStandardMaterial({
			color: GOLD,
			metalness: 0.45,
			roughness: 0.35,
			emissive: GOLD,
			emissiveIntensity: 0,
			transparent: true,
			opacity: 0,
		});

		let model: THREE.Group | null = null;
		let modelH = 1;
		let start = { x: 0, y: 0, scale: 0.3 }; // logo-anchored starting pose
		let disposed = false;

		new OBJLoader().load(caduceusUrl, (obj) => {
			if (disposed) return;
			obj.traverse((c) => {
				if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = material;
			});
			// 3ds Max OBJs are Z-up: find the model's longest axis and stand it up on Y
			const raw = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
			if (raw.z >= raw.x && raw.z >= raw.y) obj.rotation.x = -Math.PI / 2;
			else if (raw.x >= raw.y && raw.x >= raw.z) obj.rotation.z = Math.PI / 2;
			obj.updateMatrixWorld(true);
			const box = new THREE.Box3().setFromObject(obj);
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());
			modelH = size.y;
			obj.position.sub(center);
			model = new THREE.Group().add(obj);
			scene.add(model);
			measureStart();
		});

		// Anchor the extraction point to the hero logo's caduceus area.
		const measureStart = () => {
			const logo = document.querySelector<HTMLElement>(".hero-logo");
			if (!logo) return;
			const r = logo.getBoundingClientRect();
			const ndcX = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
			const ndcY = -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1);
			const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
			const worldW = worldH * camera.aspect;
			start = {
				x: ndcX * (worldW / 2),
				y: ndcY * (worldH / 2),
				scale: ((r.height / window.innerHeight) * worldH) / modelH,
			};
		};

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			if (window.scrollY === 0) measureStart();
		};
		window.addEventListener("resize", onResize);

		let raf = 0;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			if (!model) return;

			const y = window.scrollY;
			const p = easeOutCubic(clamp01(y / EXTRACT_PX));

			// Extraction: logo pose -> centered, slightly forward, larger
			const worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
			const endScale = (worldH * 1.15) / modelH; // ~115% of viewport height
			const pop = Math.sin(clamp01(p / 0.4) * Math.PI); // brief overshoot glow+scale
			const scale = start.scale + (endScale - start.scale) * p + pop * start.scale * 0.3;

			model.position.set(start.x * (1 - p), start.y * (1 - p) + p * 0.1, p * 0.6);
			model.scale.setScalar(Math.max(scale, 0.001));

			// Rotation is scroll-linked: down rotates forward, up reverses, stop = still
			model.rotation.y = y * ROTATE_PER_PX;
			model.rotation.x = 0.08 + p * 0.15;

			material.emissiveIntensity = 2.25 + pop * 0.9;
			material.opacity =
				clamp01(p * 4) * (1 - (1 - REST_OPACITY) * clamp01((p - 0.45) / 0.55)) + 0.3 * p;

			renderer.render(scene, camera);
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

	return <div ref={hostRef} className="caduceus-scene" aria-hidden="true" />;
}
