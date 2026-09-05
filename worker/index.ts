import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./types";
import { authMiddleware } from "./lib/auth";
import publicApp from "./routes/public";
import participantApp from "./routes/participant";
import staffApp from "./routes/staff";
import webhookApp from "./routes/webhook";
import { queueHandler } from "./queue";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware());

app.route("/api", publicApp);
app.route("/api", participantApp);
app.route("/api/staff", staffApp);
app.route("/api/webhooks", webhookApp);

app.notFound(async (c) => {
	if (c.req.method === "GET" && !c.req.path.startsWith("/api")) {
		const assets = c.env.ASSETS as { fetch: (request: Request) => Promise<Response> } | undefined;
		if (assets) {
			const url = new URL(c.req.url);
			url.pathname = "/";
			return assets.fetch(new Request(url, c.req.raw));
		}
	}
	return c.json({ error: { code: "not_found", message: "Not found" } }, 404);
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ error: { code: "http", message: err.message } }, err.status);
	}
	console.error(err);
	return c.json({ error: { code: "internal", message: "Internal server error" } }, 500);
});

export default {
	fetch: app.fetch,
	queue: queueHandler,
};
