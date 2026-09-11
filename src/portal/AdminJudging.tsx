import { useEffect, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import type { Api } from '../lib/api';
import type {
  Assignment,
  Criterion,
  Page,
  Person,
  ResultsPreview,
  Rubric,
  Team,
  Track,
} from './types';
import { AccessSync } from './AdminPeople';
import { Standings } from './Public';
import {
  Badge,
  Button,
  dateTime,
  Empty,
  FieldLabel,
  Loading,
  localInput,
  message,
  Notice,
  Pagination,
  SectionHead,
  toISO,
  TrackTabs,
  trackLabel,
  useAction,
  useResource,
} from './shared';

function useOptions<T>(api: Api, path: string) {
  const [items, setItems] = useState<T[]>([]),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setError(null);
    void (async () => {
      const all: T[] = [];
      for (let offset = 0; ; offset += 200) {
        const page = await api.get<Page<T>>(
          `${path}?limit=200&offset=${offset}`,
          controller.signal,
        );
        all.push(...page.items);
        if (page.items.length < 200) break;
      }
      if (!controller.signal.aborted) setItems(all);
    })().catch((error) => {
      if (!controller.signal.aborted) setError(message(error));
    });
    return () => controller.abort();
  }, [api, path]);
  return { items, error };
}
function RubricEditor({
  api,
  track,
  rubric,
  locked,
  done,
}: {
  api: Api;
  track: Track;
  rubric: Rubric | null;
  locked: boolean;
  done: () => void;
}) {
  const [criteria, setCriteria] = useState<Criterion[]>(
    rubric?.criteria || [{ id: `criterion_${crypto.randomUUID()}`, label: '', max: 10, weight: 1 }],
  );
  const action = useAction();
  return (
    <form
      className="portal-card portal-form-wide"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(`/admin/judging/${track}/rubric`, 'PUT', { criteria });
          done();
        }, 'Scoring criteria saved.');
      }}
    >
      <SectionHead
        title="Scoring criteria"
        description={
          locked
            ? 'Criteria are fixed because scoring has started.'
            : 'Choose the criteria, maximum marks, and relative weight for this track.'
        }
      />
      <fieldset className="portal-plain-fieldset" disabled={locked || action.busy}>
        <legend className="sr-only">Criteria</legend>
        {criteria.map((criterion, index) => (
          <div key={criterion.id} className="portal-criterion">
            <FieldLabel label={`Criterion ${index + 1}`}>
              {(id) => (
                <input
                  id={id}
                  required
                  maxLength={200}
                  value={criterion.label}
                  onChange={(e) =>
                    setCriteria((previous) =>
                      previous.map((value, i) =>
                        i === index ? { ...value, label: e.target.value } : value,
                      ),
                    )
                  }
                />
              )}
            </FieldLabel>
            <FieldLabel label="Max marks">
              {(id) => (
                <input
                  id={id}
                  required
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={criterion.max}
                  onChange={(e) =>
                    setCriteria((previous) =>
                      previous.map((value, i) =>
                        i === index ? { ...value, max: Number(e.target.value) } : value,
                      ),
                    )
                  }
                />
              )}
            </FieldLabel>
            <FieldLabel label="Weight">
              {(id) => (
                <input
                  id={id}
                  required
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={criterion.weight}
                  onChange={(e) =>
                    setCriteria((previous) =>
                      previous.map((value, i) =>
                        i === index ? { ...value, weight: Number(e.target.value) } : value,
                      ),
                    )
                  }
                />
              )}
            </FieldLabel>
            <Button
              disabled={criteria.length === 1}
              aria-label={`Remove criterion ${index + 1}`}
              onClick={() => setCriteria((previous) => previous.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
        <Button
          disabled={criteria.length >= 20}
          onClick={() =>
            setCriteria((previous) => [
              ...previous,
              { id: `criterion_${crypto.randomUUID()}`, label: '', max: 10, weight: 1 },
            ])
          }
        >
          <Plus size={15} />
          Add criterion
        </Button>
      </fieldset>
      <p className="portal-hint">
        Each criterion is normalized by its maximum, then weighted. Each judge’s total is out of
        100. Team results use the mean of submitted judge totals.
      </p>
      <Notice error={action.error} success={action.success} />
      <Button type="submit" className="primary" busy={action.busy} disabled={locked}>
        Save criteria
      </Button>
    </form>
  );
}
function AssignTeam({
  api,
  track,
  done,
  cancel,
}: {
  api: Api;
  track: Track;
  done: () => void;
  cancel: () => void;
}) {
  const teams = useOptions<Team>(api, '/admin/teams'),
    judges = useOptions<Person>(api, '/admin/judges');
  const [judgeId, setJudgeId] = useState(''),
    [teamId, setTeamId] = useState('');
  const action = useAction();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate('/admin/judging/assignments', 'POST', { judgeId, teamId });
          done();
        });
      }}
    >
      <SectionHead title="Assign a team" description={trackLabel(track)} />
      <FieldLabel label="Judge">
        {(id) => (
          <select id={id} required value={judgeId} onChange={(e) => setJudgeId(e.target.value)}>
            <option value="">Choose an active judge</option>
            {judges.items
              .filter(
                (person) =>
                  person.track === track &&
                  person.active &&
                  person.expiresAt &&
                  new Date(person.expiresAt).getTime() > Date.now(),
              )
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.email})
                </option>
              ))}
          </select>
        )}
      </FieldLabel>
      <FieldLabel label="Team">
        {(id) => (
          <select id={id} required value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Choose a team</option>
            {teams.items
              .filter((team) => team.track === track && team.members > 0)
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
        )}
      </FieldLabel>
      <Notice error={action.error || teams.error || judges.error} />
      <div className="portal-actions">
        <Button className="primary" type="submit" busy={action.busy}>
          Save assignment
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </div>
    </form>
  );
}
function JudgingTrack({ api, track }: { api: Api; track: Track }) {
  const resource = useResource<{
    rubric: Rubric | null;
    assignments: Assignment[];
    locked: boolean;
  }>(api, `/admin/judging/${track}`);
  const [assigning, setAssigning] = useState(false);
  const action = useAction();
  if (assigning)
    return (
      <AssignTeam
        api={api}
        track={track}
        done={() => {
          setAssigning(false);
          resource.refresh();
        }}
        cancel={() => setAssigning(false)}
      />
    );
  return (
    <>
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        resource.data && (
          <>
            <RubricEditor
              key={`${track}-${resource.data.rubric?.revision || 0}`}
              api={api}
              track={track}
              rubric={resource.data.rubric}
              locked={
                resource.data.locked || resource.data.assignments.some((item) => !!item.submittedAt)
              }
              done={resource.refresh}
            />
            <SectionHead
              title="Team assignments"
              actions={
                <>
                  <Button
                    busy={action.busy}
                    onClick={() =>
                      void action.run(() =>
                        api.download(`/admin/judging/${track}/export`, `${track}-scores.csv`),
                      )
                    }
                  >
                    <Download size={15} />
                    Export scores
                  </Button>
                  <Button
                    className="primary"
                    disabled={resource.data.locked}
                    onClick={() => setAssigning(true)}
                  >
                    <Plus size={15} />
                    Assign team
                  </Button>
                </>
              }
            />
            {!resource.data.assignments.length ? (
              <Empty title="No teams assigned yet">
                Create judge accounts, then assign teams in their track.
              </Empty>
            ) : (
              <div className="portal-table-wrap">
                <table>
                  <caption className="sr-only">Judge assignments</caption>
                  <thead>
                    <tr>
                      <th scope="col">Team</th>
                      <th scope="col">Judge</th>
                      <th scope="col">Status</th>
                      <th scope="col">Score / 100</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <th scope="row">{assignment.teamName}</th>
                        <td>
                          {assignment.judgeName}
                          <small>Access until {dateTime(assignment.expiresAt)}</small>
                        </td>
                        <td>
                          <Badge tone={assignment.submittedAt ? 'accent' : ''}>
                            {assignment.submittedAt ? 'Submitted' : 'Awaiting score'}
                          </Badge>
                        </td>
                        <td>
                          {assignment.total?.toFixed(2) ?? 'Pending'}
                          {assignment.notes && (
                            <details>
                              <summary>Judge notes</summary>
                              <p className="preserve-lines">{assignment.notes}</p>
                            </details>
                          )}
                        </td>
                        <td>
                          {!assignment.submittedAt && !resource.data?.locked && (
                            <Button
                              busy={action.busy}
                              onClick={() =>
                                void action.run(async () => {
                                  await api.mutate(
                                    `/admin/judging/assignments/${assignment.id}`,
                                    'DELETE',
                                  );
                                  resource.refresh();
                                })
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}
    </>
  );
}
export function AdminJudging({ api }: { api: Api }) {
  const [track, setTrack] = useState<Track>('hackathon');
  return (
    <section>
      <SectionHead
        title="Judging"
        description="Configure each track and coordinate team reviews."
        actions={<TrackTabs value={track} onChange={setTrack} />}
      />
      <JudgingTrack key={track} api={api} track={track} />
    </section>
  );
}
function JudgeEditor({
  api,
  person,
  done,
  cancel,
}: {
  api: Api;
  person: Person | null;
  done: () => void;
  cancel: () => void;
}) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [track, setTrack] = useState<Track>('hackathon');
  const [expires, setExpires] = useState(localInput(new Date(Date.now() + 86400000).toISOString()));
  const action = useAction();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(
            person ? `/admin/people/${person.id}/access` : '/admin/judges',
            person ? 'PATCH' : 'POST',
            person
              ? { active: true, expiresAt: toISO(expires) }
              : { name, email, track, expiresAt: toISO(expires) },
          );
          done();
        });
      }}
    >
      <SectionHead
        title={person ? `Extend access for ${person.name}` : 'Create temporary judge access'}
        description="Judges use their email to sign in. Their event access ends automatically at the selected time."
      />
      {!person && (
        <>
          <FieldLabel label="Judge name">
            {(id) => (
              <input
                id={id}
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FieldLabel>
          <FieldLabel label="Email">
            {(id) => (
              <input
                id={id}
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </FieldLabel>
          <FieldLabel label="Track">
            {(id) => (
              <select id={id} value={track} onChange={(e) => setTrack(e.target.value as Track)}>
                <option value="hackathon">Hackathon</option>
                <option value="buildathon">Buildathon</option>
              </select>
            )}
          </FieldLabel>
        </>
      )}
      <FieldLabel
        label="Access expires"
        hint={`Choose a time within the next 30 days, in ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`}
      >
        {(id) => (
          <input
            id={id}
            required
            type="datetime-local"
            min={localInput(new Date().toISOString())}
            max={localInput(new Date(Date.now() + 30 * 86400000).toISOString())}
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        )}
      </FieldLabel>
      <Notice error={action.error} />
      <div className="portal-actions">
        <Button className="primary" type="submit" busy={action.busy}>
          Save judge access
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </div>
    </form>
  );
}
export function AdminJudges({ api }: { api: Api }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<Person>>(api, `/admin/judges?offset=${offset}`);
  const [editor, setEditor] = useState<{ person: Person | null } | null>(null);
  const action = useAction();
  if (editor)
    return (
      <JudgeEditor
        api={api}
        person={editor.person}
        done={() => {
          setEditor(null);
          resource.refresh();
        }}
        cancel={() => setEditor(null)}
      />
    );
  return (
    <section>
      <SectionHead
        title="Judge access"
        description="Create accounts with a track and an expiry time."
        actions={
          <Button className="primary" onClick={() => setEditor({ person: null })}>
            <Plus size={15} />
            Add judge
          </Button>
        }
      />
      <AccessSync api={api} refresh={resource.refresh} />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="Bring your judges on board">
          Add each judge’s email, assign their track, and set an expiry time.
        </Empty>
      ) : (
        <div className="portal-feed">
          {resource.data.items.map((person) => (
            <article className="portal-card" key={person.id}>
              <div className="portal-card-meta">
                <Badge>{trackLabel(person.track || '')}</Badge>
                <Badge
                  tone={
                    person.active &&
                    person.expiresAt &&
                    new Date(person.expiresAt).getTime() > Date.now()
                      ? 'accent'
                      : ''
                  }
                >
                  {!person.active
                    ? 'Disabled'
                    : person.expiresAt && new Date(person.expiresAt).getTime() <= Date.now()
                      ? 'Expired'
                      : person.accessSynced
                        ? 'Active'
                        : 'Needs activation'}
                </Badge>
              </div>
              <h3>{person.name}</h3>
              <p>
                {person.email}
                <br />
                Access until {dateTime(person.expiresAt)}
              </p>
              <div className="portal-actions">
                <Button onClick={() => setEditor({ person })}>Extend or restore access</Button>
                {person.active && (
                  <Button
                    busy={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await api.mutate(`/admin/people/${person.id}/access`, 'PATCH', {
                          active: false,
                        });
                        resource.refresh();
                      })
                    }
                  >
                    Disable access
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination offset={offset} count={resource.data?.items.length || 0} onChange={setOffset} />
    </section>
  );
}
function ResultTrack({ api, track }: { api: Api; track: Track }) {
  const resource = useResource<ResultsPreview>(api, `/admin/results/${track}/preview`);
  const [confirming, setConfirming] = useState(false);
  const action = useAction();
  return (
    <>
      <Notice error={resource.error || action.error} success={action.success} />
      {resource.loading ? (
        <Loading />
      ) : (
        resource.data && (
          <>
            <div className="portal-card">
              <Badge tone={resource.data.publishedAt ? 'accent' : ''}>
                {resource.data.publishedAt ? 'Results are public' : 'Results are private'}
              </Badge>
              <h3>
                {resource.data.publishedAt
                  ? `Published ${dateTime(resource.data.publishedAt)}`
                  : resource.data.ready
                    ? 'Ready for review'
                    : 'Scoring is incomplete'}
              </h3>
              <p>
                Every active team needs at least one judge and all assigned scores before
                publication. Tied scores share the same rank.
              </p>
              {!resource.data.ready && !resource.data.incomplete.length && (
                <p>Add teams and complete judging to prepare results.</p>
              )}
              {resource.data.incomplete.length > 0 && (
                <ul>
                  {resource.data.incomplete.map((team) => (
                    <li key={team.teamId}>
                      {team.teamName}: {team.scored} of {team.assigned} assigned reviews complete
                      {!team.assigned ? ' (no judges assigned)' : ''}
                    </li>
                  ))}
                </ul>
              )}
              <div className="portal-actions">
                <Button onClick={resource.refresh}>Refresh preview</Button>
                {resource.data.publishedAt ? (
                  <Button
                    busy={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await api.mutate(`/admin/results/${track}/unpublish`, 'POST');
                        resource.refresh();
                      }, 'Results are private again. Scoring is reopened.')
                    }
                  >
                    Unpublish results
                  </Button>
                ) : (
                  <Button
                    className="primary"
                    disabled={!resource.data.ready}
                    onClick={() => setConfirming(true)}
                  >
                    Release results
                  </Button>
                )}
              </div>
              {confirming && (
                <div className="portal-confirm">
                  <p>
                    Publish these {trackLabel(track)} results on the event website? This will also
                    close scoring for this track.
                  </p>
                  <div className="portal-actions">
                    <Button
                      className="primary"
                      busy={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await api.mutate(`/admin/results/${track}/publish`, 'POST', {
                            revision: resource.data?.revision,
                          });
                          setConfirming(false);
                          resource.refresh();
                        }, 'Results published on the event website.')
                      }
                    >
                      Confirm publication
                    </Button>
                    <Button onClick={() => setConfirming(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
            {resource.data.standings.length > 0 && (
              <Standings standings={resource.data.standings} />
            )}
          </>
        )
      )}
    </>
  );
}
export function AdminResults({ api }: { api: Api }) {
  const [track, setTrack] = useState<Track>('hackathon');
  return (
    <section>
      <SectionHead
        title="Review and release results"
        description="Check the standings before making them public."
        actions={<TrackTabs value={track} onChange={setTrack} />}
      />
      <ResultTrack key={track} api={api} track={track} />
    </section>
  );
}
