import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

function currentTheme(): Theme {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(currentTheme);

	useEffect(() => {
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute("content", theme === "dark" ? "#0a1410" : "#f5f6f4");
	}, [theme]);

	const toggle = useCallback(() => {
		setTheme((t) => {
			const next: Theme = t === "dark" ? "light" : "dark";
			document.documentElement.dataset.theme = next;
			localStorage.setItem("theme", next);
			return next;
		});
	}, []);

	return { theme, toggle };
}
