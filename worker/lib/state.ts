export type FinanceStatus = "pending" | "review" | "approved" | "rejected" | "paid";

const financeTransitions: Record<FinanceStatus, FinanceStatus[]> = {
	pending: ["review", "approved", "rejected"],
	review: ["pending", "approved", "rejected"],
	approved: ["paid"],
	rejected: [],
	paid: [],
};

export function isValidFinanceTransition(from: FinanceStatus, to: FinanceStatus): boolean {
	return financeTransitions[from].includes(to);
}

export type SubmissionStatus = "received" | "in_review" | "scored" | "assigned";

const submissionTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
	received: ["in_review"],
	in_review: ["scored", "assigned"],
	scored: ["assigned"],
	assigned: [],
};

export function isValidSubmissionTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
	return submissionTransitions[from].includes(to);
}

export type TeamState = "registered" | "submitted" | "selected" | "waitlisted" | "rejected";

export const TRACKS = ["RESEARCH", "INDUSTRY", "PROJECT"] as const;
export type Track = (typeof TRACKS)[number];

export function isTrack(value: unknown): value is Track {
	return typeof value === "string" && (TRACKS as readonly string[]).includes(value);
}

export type StaffRole = "master_admin" | "faculty_coordinator" | "organizing_committee" | "judge" | "mentor";

export const staffRoles: StaffRole[] = ["master_admin", "faculty_coordinator", "organizing_committee", "judge", "mentor"];

export function isStaffRole(value: unknown): value is StaffRole {
	return typeof value === "string" && staffRoles.includes(value as StaffRole);
}
