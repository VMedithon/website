import {
	Beaker,
	BriefcaseBusiness,
	Hammer,
	Users,
	GraduationCap,
	Building2,
	Microscope,
	Lightbulb,
	BookOpen,
	Wrench,
	MessageSquare,
	RefreshCw,
	MonitorPlay,
	Scale,
	Award,
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
];

export const journeyStages = [
	{ step: "01", title: "Research", icon: Microscope, desc: "Map the problem landscape and identify gaps." },
	{ step: "02", title: "Ideate", icon: Lightbulb, desc: "Frame a focused, original solution direction." },
	{ step: "03", title: "Learn", icon: BookOpen, desc: "Use workshops and resources to upskill fast." },
	{ step: "04", title: "Build", icon: Wrench, desc: "Develop a working prototype overnight." },
	{ step: "05", title: "Mentor", icon: MessageSquare, desc: "Get feedback from faculty, students, and industry." },
	{ step: "06", title: "Refine", icon: RefreshCw, desc: "Iterate architecture, UX, and feasibility." },
	{ step: "07", title: "Demonstrate", icon: MonitorPlay, desc: "Present the live prototype and research defense." },
	{ step: "08", title: "Evaluate", icon: Scale, desc: "Judging against research, impact, and craft." },
	{ step: "09", title: "Recognise", icon: Award, desc: "Awards, publication, and industry pathways." },
] as const;

export const roundOne = {
	title: "Round 1 — Research & Ideation",
	participants: "~1,200 participants expected",
	description:
		"Participants form teams, understand a problem statement, research existing approaches, identify gaps, propose a solution, explain the technical approach, and submit a proposal document or PPT.",
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

export const roundOneCriteria = [
	{ label: "Research strength / problem understanding", note: "Depth of background review and gap analysis." },
	{ label: "Innovation and originality", note: "Novel angle or non-obvious combination of ideas." },
	{ label: "Technical feasibility", note: "Can be built with the time and tools available." },
	{ label: "Real-world relevance", note: "Addresses an identifiable clinical or operational need." },
	{ label: "Potential impact", note: "Magnitude of benefit if the solution succeeds." },
	{ label: "Development / implementation potential", note: "Clear pathway from proposal to working prototype." },
];

export const schedule = [
	{
		block: "11 AM → 11 PM",
		items: [
			"Inauguration & briefing",
			"Workshops",
			"Domain sessions",
			"Mentoring",
			"Problem clarification",
			"Architecture planning",
			"Implementation planning",
		],
	},
	{
		block: "11 PM → 11 AM",
		items: [
			"Development",
			"Prototyping",
			"Integration",
			"Testing",
			"Debugging",
			"Iteration",
		],
	},
	{
		block: "11 AM onwards",
		items: [
			"Industry refinement",
			"Final demo",
			"Judging",
			"Deliberation",
			"Winners",
		],
	},
];

export const mentorGroups = [
	{
		role: "Student Mentors",
		icon: Users,
		focus: "Technical and execution support.",
		description:
			"Peer mentors help teams navigate tools, debug code, set up environments, and keep projects moving through the night.",
	},
	{
		role: "Faculty Mentors",
		icon: GraduationCap,
		focus: "Research, domain, and technical validation.",
		description:
			"Faculty mentors challenge assumptions, validate research framing, and guide domain-specific decisions.",
	},
	{
		role: "Industry Experts",
		icon: Building2,
		focus: "Product, feasibility, and industry refinement.",
		description:
			"Industry experts review how the prototype maps to real users, workflows, and go-to-market constraints.",
	},
];

export const industryRefinementAreas = [
	"Technical feasibility",
	"Architecture",
	"Product relevance",
	"Usability gaps",
	"Scalability",
	"Deployment",
	"Differentiation",
	"Potential impact",
];

export const innovationHighlights = [
	"Novel approaches",
	"Unique system architectures",
	"New applications of existing technology",
	"Technical improvements",
	"Original implementations",
];

export const finalJudgingCriteria = [
	"Research & problem understanding",
	"Innovation & originality",
	"Technical implementation",
	"Functionality",
	"Real-world impact",
	"Scalability",
	"Industry applicability",
	"Patentability / novelty",
	"Presentation & demonstration",
];

export const faq = [
	{
		q: "Who can participate?",
		a: "Eligibility details will be published once confirmed. The event is student-driven and open to teams from invited institutions.",
		confirmed: false,
	},
	{
		q: "What is the team size?",
		a: "Team size is not finalised. Updates will be posted here and in the participant dashboard.",
		confirmed: false,
	},
	{
		q: "What should I bring?",
		a: "Laptop, charger, and any personal peripherals. A detailed packing list will be shared before the event.",
		confirmed: false,
	},
	{
		q: "Will Wi-Fi and power be available?",
		a: "Yes. On-site power and network infrastructure are being planned.",
		confirmed: false,
	},
	{
		q: "What about food and overnight arrangements?",
		a: "Meals and rest-area plans are being finalised and will be announced through official channels.",
		confirmed: false,
	},
	{
		q: "Do external participants need OD?",
		a: "On-duty arrangements for external participants will be communicated after the participation policy is confirmed.",
		confirmed: false,
	},
	{
		q: "Will certificates be issued?",
		a: "Participant and winner certificates are planned. Distribution and verification details will be shared after the event.",
		confirmed: false,
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
	team: "Team VMedition",
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

export const navLinks = [
	{ id: "home", label: "Home", path: "/#hero" },
	{ id: "about", label: "About", path: "/#about" },
	{ id: "challenges", label: "Challenges", path: "/#challenges" },
	{ id: "event-flow", label: "Event Flow", path: "/#event-flow" },
	{ id: "schedule", label: "Schedule", path: "/#schedule" },
	{ id: "mentors", label: "Mentors", path: "/#mentors" },
	{ id: "speakers", label: "Speakers / Judges", path: "/#speakers" },
	{ id: "sponsors", label: "Sponsors", path: "/#sponsors" },
	{ id: "faq", label: "FAQ", path: "/#faq" },
	{ id: "dashboard", label: "Dashboard", path: "/dashboard" },
];
