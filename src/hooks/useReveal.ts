import { useEffect } from "react";

export function useReveal() {
	useEffect(() => {
		const nodes = document.querySelectorAll("[data-reveal]");
		if (nodes.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("reveal-visible");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
		);

		for (const node of nodes) {
			observer.observe(node);
		}

		return () => observer.disconnect();
	}, []);
}
