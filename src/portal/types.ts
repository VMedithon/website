export type Track = 'hackathon' | 'buildathon';
export type Audience = 'all' | 'lead' | 'member';
export type Role = 'owner' | 'admin' | 'judge' | 'lead' | 'member';
export type Permission =
  | 'people'
  | 'announcements'
  | 'forms'
  | 'responses'
  | 'timeline'
  | 'finance'
  | 'judging'
  | 'results'
  | 'admins'
  | 'audit';
export interface Person {
  id: string;
  name: string;
  email: string;
  role: Role;
  track: Track | null;
  teamId: string | null;
  permissions: Permission[];
  active: boolean;
  expiresAt: string | null;
  accessSynced: boolean;
  teamName?: string;
}
export interface Team {
  id: string;
  name: string;
  track: Track;
  members: number;
}
export interface Me {
  person: Person;
  team: {
    id: string;
    name: string;
    track: Track;
    members: { id: string; name: string; role: string }[];
  } | null;
}
export interface Page<T> {
  items: T[];
  limit?: number;
  offset?: number;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  track: Track | 'all';
  audience: Audience;
  published: boolean | number;
  pinned: boolean | number;
  createdAt: string;
}
export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  location: string;
  track: Track | 'all';
  startsAt: string;
  endsAt: string | null;
  published: boolean | number;
}
export interface Field {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options: string[];
}
export type Answer = string | number | string[];
export interface EventForm {
  id: string;
  title: string;
  description: string;
  track: Track | 'all';
  audience: Audience;
  fields: Field[];
  published: boolean;
  closesAt: string | null;
  revision: number;
  responseCount?: number;
  submittedAt?: string | null;
}
export interface Submission {
  answers: Record<string, Answer>;
  updatedAt: string;
}
export interface ResponseRow {
  id: string;
  name: string;
  email: string;
  team: string;
  role: string;
  track: Track;
  answers: Record<string, Answer>;
  submittedAt: string;
  updatedAt: string;
}
export interface FinanceEntry {
  id: string;
  kind: 'income' | 'expense';
  description: string;
  category: string;
  amount: string;
  currency: string;
  occurredOn: string;
  receiptName: string | null;
  receiptSize: number | null;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
}
export interface FinancePage extends Page<FinanceEntry> {
  totals: { income: string; expenses: string; balance: string; currency: string };
}
export interface Criterion {
  id: string;
  label: string;
  max: number;
  weight: number;
}
export interface Rubric {
  criteria: Criterion[];
  revision: number;
}
export interface Assignment {
  id: string;
  judgeId: string;
  judgeName: string;
  expiresAt: string;
  teamId: string;
  teamName: string;
  track: Track;
  scores: Record<string, number> | null;
  notes: string | null;
  total: number | null;
  submittedAt: string | null;
}
export interface Standing {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  judges: number;
}
export interface Result {
  track: Track;
  publishedAt: string;
  standings: Standing[];
}
export interface ResultsPreview {
  track: Track;
  revision: number;
  ready: boolean;
  incomplete: { teamId: string; teamName: string; assigned: number; scored: number }[];
  standings: Standing[];
  publishedAt: string | null;
}
export interface SyncResult {
  synced: number;
  pending: number;
  errors: { email: string; message: string }[];
}
