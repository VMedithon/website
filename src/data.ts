import {
	Beaker,
	BriefcaseBusiness,
	Hammer,
	Code2,
	Wrench,
	type LucideIcon,
} from "lucide-react";

export type Track = {
	number: string;
	label: string;
	title: string;
	description: string;
	output: string;
	icon: LucideIcon;
	accent: string;
};

export const tracks: Track[] = [
	{
		number: "01",
		label: "RESEARCH",
		title: "From question to preprint.",
		description:
			"Work with faculty mentors to shape a rigorous idea, implement its core, and leave with a publication-ready research paper.",
		output: "Research paper",
		icon: Beaker,
		accent: "green",
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
];

export const navLinks = [
	{ id: "home", label: "Home", path: "/#hero" },
	{ id: "tracks", label: "Tracks", path: "/#tracks" },
	{ id: "themes", label: "Themes", path: "/#themes" },
	{ id: "journey", label: "Journey", path: "/#journey" },
	{ id: "rounds", label: "Rounds", path: "/#rounds" },
	{ id: "prizes", label: "Prizes", path: "/#prizes" },
	{ id: "faq", label: "FAQ", path: "/#faq" },
];

export type JourneyStep = { step: string; title: string; desc: string; final?: boolean };

export const journeySteps: JourneyStep[] = [
	{ step: "01", title: "Register", desc: "Create your team and confirm participation through Devnovate." },
	{ step: "02", title: "PPT Submission", desc: "Submit your problem understanding, research, and proposed solution." },
	{ step: "03", title: "Evaluation", desc: "Reviewers score submissions across research, innovation, and feasibility." },
	{ step: "04", title: "Interview / Selection", desc: "Shortlisted teams attend a brief alignment call before track assignment." },
	{ step: "05", title: "Track Assignment", desc: "Matched to Hackathon, Buildathon, or a blended track for Round 2." },
	{ step: "06", title: "Round 2 Build", desc: "24-hour onsite buildathon at VIT Chennai." },
	{ step: "07", title: "Final Deliverables", desc: "Demo, documentation, and submission for judging and awards.", final: true },
];

export const themes = [
	{
		title: "Open Innovation",
		description:
			"No boundaries. Bring your own problem, validate it with research, and build a software or hardware proof that could stand alone.",
		accent: "green" as const,
		icon: Code2,
		keywords: ["software", "hardware", "research", "social impact", "devices"],
	},
	{
		title: "Bio × Engineering",
		description:
			"Combine biomedical insight with engineering craft. Work on diagnostics, devices, health data, and human-centered systems.",
		accent: "blue" as const,
		icon: Wrench,
		keywords: ["diagnostics", "wearables", "health data", "biomechanics", "imaging"],
	},
];

export const roundOne = {
	title: "Round 1 — Research & Ideation",
	participants: "~1,200 participants expected",
	description:
		"Participants form teams, understand a problem, research existing approaches, identify gaps, propose a solution, and submit a proposal document or PPT.",
	items: [
		"Understand the problem statement",
		"Research existing approaches",
		"Find gaps and opportunity spaces",
		"Propose a clear solution",
		"Explain the technical approach",
		"Submit a proposal",
	],
};

export const roundTwo = {
	title: "Round 2 — 24-hour Buildathon",
	description:
		"Shortlisted teams move to the 24-hour on-campus buildathon. The round combines technical preparation, workshops, mentorship, development, prototyping, testing, industry refinement, final demos, and judging.",
	items: [
		"Technical preparation",
		"Workshops",
		"Mentorship",
		"Development",
		"Prototyping",
		"Testing",
		"Industry refinement",
		"Final demo",
		"Judging",
	],
};

export const problemStatements = [
	{
		id: "ps-1",
		domain: "Healthcare Delivery",
		title: "Decentralised diagnostic triage for primary care",
		description:
			"Design a protocol or system that helps frontline health workers identify, record, and escalate cases without relying on continuous specialist availability.",
		outcome: "A validated workflow and lightweight prototype.",
		industry: false,
	},
	{
		id: "ps-2",
		domain: "Medical Devices",
		title: "Low-cost wearable for continuous vitals monitoring",
		description:
			"Build a sensing approach that tracks core vitals with minimal power and cost, suitable for resource-limited settings.",
		outcome: "A proof-of-concept device and signal validation.",
		industry: true,
	},
	{
		id: "ps-3",
		domain: "Health Data & AI",
		title: "Explainable risk stratification for clinical records",
		description:
			"Create an interpretable model that surfaces actionable risk factors from structured clinical data.",
		outcome: "A documented model and an interactive explanation dashboard.",
		industry: false,
	},
	{
		id: "ps-4",
		domain: "Public Health",
		title: "Outbreak signal detection from community reports",
		description:
			"Prototype a system that aggregates non-clinical signals and raises early alerts without breaching privacy.",
		outcome: "A data pipeline and a simulated detection run.",
		industry: false,
	},
] as const;

export const resources = [
	{ title: "PPT Template", type: "PPTX", desc: "Round 1 submission format." },
	{ title: "Event Brochure", type: "PDF", desc: "Branding, schedule, and overview." },
	{ title: "Participant Guide", type: "PDF", desc: "Rules, judging, and venue details." },
];

export interface Sponsor {
	name: string;
	logo: string;
	/** Optional variant to use on the light theme. */
	logoLight?: string;
	/** White artwork — needs a dark chip to stay visible on light backgrounds. */
	onDark?: boolean;
}

export const sponsors: Sponsor[] = [
	{ name: "VIT Chennai", logo: "/vit-chennai-for-dark-mode.png", logoLight: "/vit-chennai-light-mode-full.png" },
	{ name: "CYSCOM", logo: "/cyscom-logo.png" },
	{ name: "Nexus", logo: "/nexus-logo.png" },
	{ name: "Yenepoya", logo: "/yenepoya-logo.png" },
	{ name: "Devnovate", logo: "/devonate-logo.png", onDark: true },
	{ name: "goRobo", logo: "/gorobo-logo.png", onDark: true },
	{ name: "Z", logo: "/Z-logo.png" },
];

export const faq = [
	{
		q: "Who can participate?",
		a: "Students from invited institutions can register in teams. Eligibility details will be published once confirmed.",
		confirmed: false,
	},
	{
		q: "How does Round 1 work?",
		a: "Teams submit a proposal PPT through Devnovate. Submissions are reviewed across problem understanding, innovation, feasibility, and impact.",
		confirmed: true,
	},
	{
		q: "What should we submit?",
		a: "Use the provided PPT template. Include research, problem gaps, proposed solution, technical approach, and expected impact.",
		confirmed: true,
	},
	{
		q: "What is the team size?",
		a: "Team size will be confirmed before registration opens. Updates will be posted here and in the participant portal.",
		confirmed: false,
	},
	{
		q: "Will food and power be available?",
		a: "Yes. On-site meals, power, and network infrastructure are being planned for the 24-hour event.",
		confirmed: true,
	},
	{
		q: "Will certificates be issued?",
		a: "Participant, mentor, and winner certificates will be issued after the event. Public verification will be enabled at that time.",
		confirmed: true,
	},
];

export const venue = {
	name: "MG Auditorium",
	institution: "VIT Chennai",
	date: "15–16 September 2026",
	duration: "24-hour buildathon",
	reporting: "To be announced",
};

export const contact = {
	team: "Team VMEDITHON",
	institution: "VIT Chennai",
	email: "team@vmedithon.co.in",
};

export type ParticipantData = {
	registered: boolean;
	teamName: string;
	teamMembers: string[];
	selectedProblem: string;
	submission: {
		problemUnderstanding: string;
		research: string;
		proposedSolution: string;
		technicalApproach: string;
		innovation: string;
		impact: string;
		pptUploaded: boolean;
	};
	shortlisted: "pending" | "yes" | "no";
	round2Eligible: boolean;
	announcements: { date: string; text: string }[];
};

export const emptyParticipant: ParticipantData = {
	registered: true,
	teamName: "",
	teamMembers: [],
	selectedProblem: "",
	submission: {
		problemUnderstanding: "",
		research: "",
		proposedSolution: "",
		technicalApproach: "",
		innovation: "",
		impact: "",
		pptUploaded: false,
	},
	shortlisted: "pending",
	round2Eligible: false,
	announcements: [
		{ date: "TBA", text: "Round 1 problem statements and guidelines will be released shortly." },
		{ date: "TBA", text: "Round 1 submission portal will open after problem statement release." },
	],
};
