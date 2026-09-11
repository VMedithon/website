import { test, expect, type Page } from '@playwright/test';
import type {
  Announcement,
  Assignment,
  EventForm,
  FinanceEntry,
  Me,
  Permission,
  Person,
  Result,
  TimelineItem,
} from '../src/portal/types';

const grants: Permission[] = [
  'people',
  'announcements',
  'forms',
  'responses',
  'timeline',
  'finance',
  'judging',
  'results',
  'admins',
  'audit',
];
const sampleForm: EventForm = {
  id: 'form-one',
  title: 'Project details',
  description: 'Tell us what you are building.',
  track: 'hackathon',
  audience: 'lead',
  fields: [
    { id: 'project', label: 'Project name', type: 'text', required: true, options: [] },
    { id: 'link', label: 'Demo URL', type: 'url', required: false, options: [] },
  ],
  published: true,
  closesAt: '2099-09-15T18:00:00Z',
  revision: 1,
  responseCount: 0,
  submittedAt: null,
};
const announcement: Announcement = {
  id: 'announcement-one',
  title: 'Welcome to VMEDITHON',
  body: 'Opening ceremony starts at 9 AM.',
  track: 'hackathon',
  audience: 'all',
  published: true,
  pinned: true,
  createdAt: '2026-09-15T02:30:00Z',
};
const timeline: TimelineItem = {
  id: 'session-one',
  title: 'Opening ceremony',
  description: 'Meet the organizers.',
  location: 'Main auditorium',
  track: 'hackathon',
  startsAt: '2099-09-15T03:30:00Z',
  endsAt: null,
  published: true,
};
type Fixture = {
  me: Me;
  forms: EventForm[];
  responses: Record<string, unknown>;
  finance: FinanceEntry[];
  announcements: Announcement[];
  timeline: TimelineItem[];
  results: Result[];
  assignment: Assignment;
  requests: { path: string; method: string; body: string | null }[];
};
async function setup(
  page: Page,
  role: Person['role'] = 'lead',
  permissions = role === 'owner' ? grants : [],
) {
  const person: Person = {
    id: 'person-one',
    name: 'Aarav Kumar',
    email: 'participant@example.com',
    role,
    track: ['lead', 'member', 'judge'].includes(role) ? 'hackathon' : null,
    teamId: role === 'lead' || role === 'member' ? 'team-one' : null,
    permissions,
    active: true,
    expiresAt: role === 'judge' ? '2099-09-16T18:00:00Z' : null,
    accessSynced: true,
  };
  const fixture: Fixture = {
    me: {
      person,
      team: person.teamId
        ? {
            id: 'team-one',
            name: 'Pulse',
            track: 'hackathon',
            members: [
              { id: 'person-one', name: person.name, role },
              { id: 'person-two', name: 'Diya Shah', role: 'member' },
            ],
          }
        : null,
    },
    forms: [structuredClone(sampleForm)],
    responses: {},
    finance: [],
    announcements: [announcement],
    timeline: [timeline],
    results: [],
    assignment: {
      id: 'assignment-one',
      judgeId: person.id,
      judgeName: person.name,
      expiresAt: '2099-09-16T18:00:00Z',
      teamId: 'team-one',
      teamName: 'Pulse',
      track: 'hackathon',
      scores: null,
      notes: null,
      total: null,
      submittedAt: null,
    },
    requests: [],
  };
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname.replace('/api/v1', ''),
      method = request.method();
    fixture.requests.push({ path, method, body: request.postData() });
    const json = (value: unknown, status = 200) => route.fulfill({ status, json: value });
    if (path === '/me') return json(fixture.me);
    if (
      path === '/participant/announcements' ||
      (path === '/admin/announcements' && method === 'GET')
    )
      return json({ items: fixture.announcements });
    if (
      path === '/participant/timeline' ||
      path === '/public/timeline' ||
      (path === '/admin/timeline' && method === 'GET')
    )
      return json({ items: fixture.timeline });
    if (path === '/public/results') return json({ items: fixture.results });
    if (path === '/participant/forms' || (path === '/admin/forms' && method === 'GET'))
      return json({ items: fixture.forms });
    if (path === '/participant/forms/form-one')
      return json({
        form: fixture.forms[0],
        submission: Object.keys(fixture.responses).length
          ? { answers: fixture.responses, updatedAt: '2026-09-15T06:00:00Z' }
          : null,
      });
    if (path === '/participant/forms/form-one/submission') {
      fixture.responses = request.postDataJSON().answers;
      fixture.forms[0]!.submittedAt = '2026-09-15T06:00:00Z';
      return json({ submittedAt: fixture.forms[0]!.submittedAt });
    }
    if (path === '/admin/forms' && method === 'POST') {
      fixture.forms.unshift({
        ...request.postDataJSON(),
        id: 'new-form',
        revision: 1,
        responseCount: 0,
      });
      return json({ id: 'new-form' }, 201);
    }
    if (path === '/admin/overview')
      return json({
        metrics: fixture.me.person.permissions.includes('people')
          ? [
              { key: 'participants', label: 'Active participants', value: 48 },
              { key: 'teams', label: 'Teams', value: 12 },
            ]
          : [],
      });
    if (path === '/admin/people' && method === 'GET') return json({ items: [] });
    if (path === '/admin/people/import')
      return json(
        request.postDataJSON().preview
          ? { valid: true, newParticipants: 2, existingParticipants: 0, newTeams: 1 }
          : { imported: 2, existing: 0, teamsCreated: 1, syncRequired: true },
        request.postDataJSON().preview ? 200 : 201,
      );
    if (path === '/admin/access/sync') return json({ synced: 2, pending: 0, errors: [] });
    if (path === '/admin/finance' && method === 'GET')
      return json({
        items: fixture.finance,
        totals: { income: '1500.00', expenses: '0.00', balance: '1500.00', currency: 'INR' },
      });
    if (path === '/admin/finance' && method === 'POST') {
      fixture.finance.push({
        id: 'entry-one',
        kind: 'income',
        description: 'Sponsor contribution',
        category: 'Sponsorship',
        amount: '1500.00',
        currency: 'INR',
        occurredOn: '2026-09-15',
        receiptName: 'receipt.pdf',
        receiptSize: 100,
        createdAt: '2026-09-15T06:00:00Z',
        voidedAt: null,
        voidReason: null,
      });
      return json({ id: 'entry-one' }, 201);
    }
    if (path === '/admin/finance/export')
      return route.fulfill({
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="event-finances.csv"' },
        body: 'Description,Amount\r\nSponsor contribution,1500.00\r\n',
      });
    if (path === '/judge/assignments')
      return json({
        items: [fixture.assignment],
        rubric: { revision: 1, criteria: [{ id: 'impact', label: 'Impact', max: 10, weight: 1 }] },
        locked: false,
      });
    if (path === '/judge/assignments/assignment-one/score') {
      fixture.assignment.scores = request.postDataJSON().scores;
      fixture.assignment.submittedAt = '2026-09-15T06:00:00Z';
      return json({ total: 80, submittedAt: fixture.assignment.submittedAt });
    }
    if (path.startsWith('/admin/results/') && path.endsWith('/preview'))
      return json({
        track: 'hackathon',
        revision: 4,
        ready: true,
        incomplete: [],
        standings: [{ rank: 1, teamId: 'team-one', teamName: 'Pulse', score: 88.25, judges: 2 }],
        publishedAt: fixture.results[0]?.publishedAt || null,
      });
    if (path === '/admin/results/hackathon/publish') {
      fixture.results = [
        {
          track: 'hackathon',
          publishedAt: '2026-09-16T12:00:00Z',
          standings: [{ rank: 1, teamId: 'team-one', teamName: 'Pulse', score: 88.25, judges: 2 }],
        },
      ];
      return json({ track: 'hackathon', publishedAt: fixture.results[0]!.publishedAt });
    }
    return json({ error: { message: `Unhandled test request: ${method} ${path}` } }, 500);
  });
  return fixture;
}

test('participant sees their workspace and can submit a published form', async ({
  page,
}, testInfo) => {
  const fixture = await setup(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome, Aarav.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pulse', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('participant-overview.png') });
  await expect(
    page.getByRole('navigation', { name: 'Dashboard' }).getByRole('button', { name: 'Finances' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Open forms', exact: true }).click();
  await page.getByRole('button', { name: 'Fill out form' }).click();
  await page.getByLabel('Project name *', { exact: true }).fill('Accessible care');
  await page.getByLabel('Demo URL', { exact: true }).fill('https://example.com/demo');
  await page.getByRole('button', { name: 'Submit response' }).click();
  await expect(page.getByRole('button', { name: 'Update response' })).toBeVisible();
  expect(fixture.responses).toEqual({
    project: 'Accessible care',
    link: 'https://example.com/demo',
  });
});
test('admin creates a targeted form with a choice question', async ({ page }, testInfo) => {
  const fixture = await setup(page, 'owner');
  await page.goto('/admin?section=forms');
  await page.getByRole('button', { name: 'Create form', exact: true }).click();
  await page.getByLabel('Form title', { exact: true }).fill('Travel plan');
  await page.getByLabel('Who should see this?').selectOption('member');
  await page.getByLabel('Track', { exact: true }).selectOption('buildathon');
  await page.getByLabel('Question', { exact: true }).fill('Arrival mode');
  await page.getByLabel('Answer type').selectOption('select');
  await page.getByLabel('Options', { exact: true }).fill('Bus\nTrain');
  await page.getByLabel('Publish this form to eligible participants').check();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('form-editor.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save and publish' }).click();
  await expect(page.getByRole('heading', { name: 'Travel plan' })).toBeVisible();
  expect(fixture.forms[0]).toMatchObject({
    title: 'Travel plan',
    audience: 'member',
    track: 'buildathon',
    published: true,
    fields: [{ type: 'select', options: ['Bus', 'Train'] }],
  });
});
test('admin previews a CSV import before saving and activating sign-ups', async ({ page }) => {
  const fixture = await setup(page, 'owner');
  await page.goto('/admin?section=people');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.getByLabel('Participant CSV').setInputFiles({
    name: 'participants.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'email,name,role,track,team\nlead@example.com,Lead,lead,hackathon,Pulse\nmember@example.com,Member,member,hackathon,Pulse',
    ),
  });
  await page.getByRole('button', { name: 'Check import' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to import' })).toBeVisible();
  expect(
    fixture.requests.filter((request) => request.path === '/admin/people/import'),
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'Import roster' }).click();
  await page.getByRole('button', { name: 'Activate sign-ups' }).click();
  await expect(page.getByText('Sign-up access is up to date.')).toBeVisible();
});
test('finance records a receipt and downloads a CSV export', async ({ page }) => {
  const fixture = await setup(page, 'owner');
  await page.goto('/admin?section=finance');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.getByLabel('Type', { exact: true }).selectOption('income');
  await page.getByLabel('Description', { exact: true }).fill('Sponsor contribution');
  await page.getByLabel('Amount (INR)').fill('1500.00');
  await page.getByLabel('Date', { exact: true }).fill('2026-09-15');
  await page.getByLabel('Category', { exact: true }).fill('Sponsorship');
  await page.getByLabel('Receipt (optional)').setInputFiles({
    name: 'receipt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nReceipt fixture'),
  });
  await page.getByRole('button', { name: 'Save transaction' }).click();
  await expect(page.getByRole('rowheader', { name: /Sponsor contribution/ })).toBeVisible();
  expect(
    fixture.requests.find(
      (request) => request.path === '/admin/finance' && request.method === 'POST',
    )?.body,
  ).toContain('receipt.pdf');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe('event-finances.csv');
});
test('judge submits marks only from the judging workspace', async ({ page }) => {
  const fixture = await setup(page, 'judge');
  await page.goto('/judge');
  await page.getByRole('button', { name: 'Score this team' }).click();
  await page.getByLabel('Impact', { exact: true }).fill('8');
  await page.getByLabel('Judging notes', { exact: true }).fill('Clear problem definition.');
  await page.getByRole('button', { name: 'Submit scores' }).click();
  await expect(page.getByText('Scored', { exact: true })).toBeVisible();
  expect(fixture.assignment.scores).toEqual({ impact: 8 });
  await expect(page.getByRole('button', { name: 'Finances', exact: true })).toHaveCount(0);
});
test('limited admin cannot navigate to restricted tools by changing the URL', async ({ page }) => {
  const fixture = await setup(page, 'admin', ['announcements']);
  await page.goto('/admin?section=finance');
  await expect(page.getByRole('heading', { name: 'Event overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finances', exact: true })).toHaveCount(0);
  expect(fixture.requests.some((request) => request.path.startsWith('/admin/finance'))).toBe(false);
});
test('results require explicit publication and then appear on the public page', async ({
  page,
}) => {
  const fixture = await setup(page, 'owner');
  await page.goto('/results');
  await expect(
    page.getByRole('heading', { name: 'The next chapter is still being written' }),
  ).toBeVisible();
  await page.goto('/admin?section=results');
  await page.getByRole('button', { name: 'Release results' }).click();
  expect(fixture.results).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirm publication' }).click();
  await expect(page.getByText('Results are public', { exact: true })).toBeVisible();
  await page.goto('/results');
  await expect(page.getByRole('rowheader', { name: 'Pulse' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '88.25' })).toBeVisible();
});
test('mobile dashboard menu works without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome, Aarav.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Open dashboard menu' }).click();
  await page
    .getByRole('navigation', { name: 'Dashboard' })
    .getByRole('button', { name: 'Timeline' })
    .click();
  await expect(page.getByRole('heading', { name: 'Your event timeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Opening ceremony' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('public navigation reaches the event pages at desktop and tablet sizes', async ({
  page,
}, testInfo) => {
  await setup(page);
  for (const width of [1440, 1024, 820]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const menu = page.getByRole('button', { name: 'Open menu', exact: true });
    if (await menu.isVisible()) await menu.click();
    const navigation = page.getByRole('navigation', { name: 'Main', exact: true });
    await expect(navigation.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const register = await navigation
      .getByRole('link', { name: 'Register', exact: true })
      .boundingBox();
    expect(register && register.x + register.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`navigation-${width}.png`) });
    await navigation.getByRole('link', { name: 'Schedule', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Opening ceremony' })).toBeVisible();
  }
});
