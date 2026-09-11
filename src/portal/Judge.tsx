import { useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import type { Api } from '../lib/api';
import type { Assignment, Me, Rubric } from './types';
import {
  Badge,
  Button,
  dateTime,
  Empty,
  FieldLabel,
  Loading,
  Notice,
  SectionHead,
  useAction,
  useResource,
} from './shared';

function ScoreForm({
  api,
  assignment,
  rubric,
  locked,
  back,
  onSaved,
}: {
  api: Api;
  assignment: Assignment;
  rubric: Rubric;
  locked: boolean;
  back: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(assignment.scores || {});
  const [notes, setNotes] = useState(assignment.notes || '');
  const action = useAction();
  return (
    <>
      <Button onClick={back}>
        <ArrowLeft size={15} />
        All assignments
      </Button>
      <div className="portal-spacer" />
      <form
        className="portal-card portal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            await api.mutate(`/judge/assignments/${assignment.id}/score`, 'PUT', {
              scores,
              notes,
              revision: rubric.revision,
            });
            onSaved();
          }, 'Scores submitted.');
        }}
      >
        <SectionHead
          title={assignment.teamName}
          description={
            locked
              ? 'Results have been published. Scoring is now closed.'
              : 'Score each criterion. You can revise your scores until results are published or your access expires.'
          }
        />
        {assignment.submittedAt && (
          <Notice success={`Last saved ${dateTime(assignment.submittedAt)}`} />
        )}
        <fieldset className="portal-plain-fieldset" disabled={locked || action.busy}>
          <legend className="sr-only">Judging criteria</legend>
          {rubric.criteria.map((criterion) => (
            <FieldLabel
              key={criterion.id}
              label={criterion.label}
              hint={`Maximum ${criterion.max} points · Weight ${criterion.weight}`}
            >
              {(id) => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  max={criterion.max}
                  step="any"
                  required
                  value={scores[criterion.id] ?? ''}
                  onChange={(e) =>
                    setScores((previous) => {
                      const next = { ...previous };
                      if (e.target.value === '') delete next[criterion.id];
                      else next[criterion.id] = Number(e.target.value);
                      return next;
                    })
                  }
                />
              )}
            </FieldLabel>
          ))}
          <FieldLabel label="Judging notes" hint="Visible to the organizing team.">
            {(id) => (
              <textarea
                id={id}
                rows={5}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </FieldLabel>
        </fieldset>
        <Notice error={action.error} success={action.success} />
        <Button type="submit" busy={action.busy} disabled={locked} className="primary">
          <CheckCircle2 size={16} />
          {assignment.submittedAt ? 'Update scores' : 'Submit scores'}
        </Button>
      </form>
    </>
  );
}
export default function JudgeDashboard({ api, me }: { api: Api; me: Me }) {
  const resource = useResource<{ items: Assignment[]; rubric: Rubric | null; locked: boolean }>(
    api,
    '/judge/assignments',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = resource.data?.items.find((item) => item.id === selectedId);
  if (selected && resource.data?.rubric)
    return (
      <ScoreForm
        key={selected.id}
        api={api}
        assignment={selected}
        rubric={resource.data.rubric}
        locked={resource.data.locked}
        back={() => setSelectedId(null)}
        onSaved={() => {
          setSelectedId(null);
          resource.refresh();
        }}
      />
    );
  const submitted = resource.data?.items.filter((item) => item.submittedAt).length || 0;
  return (
    <section>
      <SectionHead
        title="Your judging desk"
        description={`Thank you for sharing your expertise. Access expires ${dateTime(me.person.expiresAt)}.`}
      />
      <div className="portal-stat-row">
        <div className="portal-stat">
          <span>Assigned teams</span>
          <strong>{resource.data?.items.length ?? '...'}</strong>
        </div>
        <div className="portal-stat">
          <span>Scores submitted</span>
          <strong>{submitted}</strong>
        </div>
      </div>
      <Notice error={resource.error} />
      {resource.data?.locked && (
        <Notice success="Results have been published. Your scores are now locked." />
      )}
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="Your assignments are on their way">
          The organizers will assign teams for you to review.
        </Empty>
      ) : (
        <div className="portal-card-grid">
          {resource.data.items.map((item) => (
            <article key={item.id} className="portal-card">
              <div className="portal-card-meta">
                <ClipboardCheck size={20} />
                <Badge tone={item.submittedAt ? 'accent' : ''}>
                  {item.submittedAt ? 'Scored' : 'Awaiting review'}
                </Badge>
              </div>
              <h3>{item.teamName}</h3>
              <p>
                {item.submittedAt
                  ? `Last saved ${dateTime(item.submittedAt)}`
                  : 'Your perspective helps recognize the most promising ideas.'}
              </p>
              <Button disabled={!resource.data?.rubric} onClick={() => setSelectedId(item.id)}>
                {!resource.data?.rubric
                  ? 'Waiting for criteria'
                  : resource.data.locked
                    ? 'View scores'
                    : item.submittedAt
                      ? 'Review scores'
                      : 'Score this team'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
