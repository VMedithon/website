import { ClerkProvider } from "@clerk/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

if (root) {
	createRoot(root).render(
		<StrictMode>
			{publishableKey ? (
				<BrowserRouter>
					<ClerkProvider publishableKey={publishableKey} signInUrl="/sign-in">
						<App />
					</ClerkProvider>
				</BrowserRouter>
			) : (
				<div style={{ padding: 40, textAlign: "center" }}>
					<h1>VMEDITHON 2026</h1>
					<p>Clerk publishable key is not configured.</p>
					<p>Set VITE_CLERK_PUBLISHABLE_KEY in your environment to run the platform.</p>
				</div>
			)}
		</StrictMode>,
	);
}
