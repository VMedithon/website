import {
	BadgeIndianRupee,
	Beaker,
	BriefcaseBusiness,
	FileCheck2,
	FileText,
	Hammer,
	LayoutDashboard,
	MailPlus,
	Settings2,
	ShieldCheck,
	Users,
} from "lucide-react";

export const tracks = [
	{
		number: "01",
		label: "RESEARCH",
		title: "From question to preprint.",
		description:
			"Work with faculty mentors to shape a rigorous idea, implement its core, and leave with a publication-ready research paper.",
		output: "Research paper",
		icon: Beaker,
		accent: "mint",
	},
	{
		number: "02",
		label: "INDUSTRY",
		title: "Solve what matters now.",
		description:
			"Tackle real industry problem statements with practitioners, validate your direction, and build a working technical proof.",
		output: "Working prototype",
		icon: BriefcaseBusiness,
		accent: "gold",
	},
	{
		number: "03",
		label: "PROJECT",
		title: "Build toward ownership.",
		description:
			"Transform a product idea through guided design, building, and industry feedback—with a patent-ready outcome in sight.",
		output: "Patent-ready design",
		icon: Hammer,
		accent: "blue",
	},
] as const;

export const timeline = [
	{
		step: "01",
		title: "Pitch",
		meta: "Online · Free",
		description: "Submit one clear PPT. We align your team to the track where the idea can create the most value.",
	},
	{
		step: "02",
		title: "Mentor",
		meta: "Faculty review",
		description: "Meet your mentor, defend the idea, and turn feedback into a credible research or product direction.",
	},
	{
		step: "03",
		title: "Make",
		meta: "36 hours · On campus",
		description: "Research, prototype, and build through the night with meals, technical support, and expert checkpoints.",
	},
	{
		step: "04",
		title: "Publish",
		meta: "Showcase",
		description: "Submit the paper or patent file, demonstrate the core build, and connect with the people who can take it further.",
	},
] as const;

export const dashboardNav = [
	{ id: "overview", label: "Overview", icon: LayoutDashboard },
	{ id: "forms", label: "Form studio", icon: FileText },
	{ id: "submissions", label: "Submissions", icon: FileCheck2 },
	{ id: "finance", label: "Finance", icon: BadgeIndianRupee },
	{ id: "certificates", label: "Certificates", icon: ShieldCheck },
	{ id: "people", label: "People & access", icon: Users },
	{ id: "invitations", label: "Invitations", icon: MailPlus },
	{ id: "settings", label: "Event settings", icon: Settings2 },
] as const;

export type DashboardView = (typeof dashboardNav)[number]["id"];
