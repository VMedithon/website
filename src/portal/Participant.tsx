import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Pin,
} from 'lucide-react';
import type { Api } from '../lib/api';
import type {
  Announcement,
  Answer,
  EventForm,
  Field,
  Me,
  Page,
  Submission,
  TimelineItem,
} from './types';
import {
  Badge,
  Button,
  dateTime,
  Empty,
  FieldLabel,
  Loading,
  Notice,
  Pagination,
  roleLabel,
  SectionHead,
  trackLabel,
  useAction,
  useResource,
} from './shared';
import { ResultsView } from './Public';

export function Announcements({ api, compact = false }: { api: Api; compact?: boolean }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<Announcement>>(
    api,
    `/participant/announcements?limit=${compact ? 3 : 50}&offset=${offset}`,
  );
  return (
    <section>
      <SectionHead
        title={compact ? 'Latest announcements' : 'Announcements'}
        description={
          compact ? undefined : 'Updates from the organizing team, for your track and role.'
        }
      />
      <Notice error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="You’re all caught up">New announcements will appear here.</Empty>
      ) : (
        <div className="portal-feed">
          {resource.data.items.map((item) => (
            <article key={item.id} className="portal-card">
              <div className="portal-card-meta">
                <Badge>{trackLabel(item.track)}</Badge>
                {!!item.pinned && (
                  <Badge tone="accent">
                    <Pin size={12} />
                    Pinned
                  </Badge>
                )}
                <time>{dateTime(item.createdAt)}</time>
              </div>
              <h3>{item.title}</h3>
              <p className="preserve-lines">{item.body}</p>
            </article>
          ))}
        </div>
      )}
      {!compact && (
        <Pagination count={resource.data?.items.length || 0} offset={offset} onChange={setOffset} />
      )}
    </section>
  );
}
export function Timeline({ items, compact = false }: { items: TimelineItem[]; compact?: boolean }) {
  const visible = compact
    ? items
        .filter((item) => new Date(item.endsAt || item.startsAt).getTime() >= Date.now())
        .slice(0, 4)
    : items;
  if (!visible.length)
    return (
      <Empty title={compact ? 'No upcoming sessions' : 'Schedule coming soon'}>
        The organizers will share the event timeline here.
      </Empty>
    );
  return (
    <ol className="portal-timeline">
      {visible.map((item) => (
        <li key={item.id}>
          <div className="portal-timeline-time">
            <span>{dateTime(item.startsAt)}</span>
            {item.endsAt && <small>Until {dateTime(item.endsAt)}</small>}
          </div>
          <div>
            <Badge>{trackLabel(item.track)}</Badge>
            <h3>{item.title}</h3>
            {item.description && <p className="preserve-lines">{item.description}</p>}
            {item.location && <span className="portal-location">{item.location}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
export function ParticipantTimeline({ api }: { api: Api }) {
  const resource = useResource<Page<TimelineItem>>(api, '/participant/timeline');
  return (
    <section>
      <SectionHead
        title="Your event timeline"
        description="All event times are shown in Indian Standard Time."
      />
      <Notice error={resource.error} />
      {resource.loading ? <Loading /> : <Timeline items={resource.data?.items || []} />}
    </section>
  );
}
function AnswerField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: Field;
  value: Answer | undefined;
  onChange: (value: Answer) => void;
  disabled: boolean;
}) {
  if (field.type === 'multiselect')
    return (
      <fieldset className="portal-choice-field" disabled={disabled}>
        <legend>
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        {field.options.map((option) => (
          <label key={option} className="portal-check">
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(option)}
              onChange={(e) => {
                const previous = Array.isArray(value) ? value : [];
                onChange(
                  e.target.checked ? [...previous, option] : previous.filter((v) => v !== option),
                );
              }}
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  return (
    <FieldLabel label={`${field.label}${field.required ? ' *' : ''}`}>
      {(id) => {
        const common = {
          id,
          required: field.required,
          disabled,
          value: typeof value === 'string' || typeof value === 'number' ? value : '',
        };
        if (field.type === 'textarea')
          return (
            <textarea
              {...common}
              rows={5}
              maxLength={10000}
              onChange={(e) => onChange(e.target.value)}
            />
          );
        if (field.type === 'select')
          return (
            <select {...common} onChange={(e) => onChange(e.target.value)}>
              <option value="">Choose an option</option>
              {field.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          );
        return (
          <input
            {...common}
            type={field.type}
            maxLength={1000}
            step={field.type === 'number' ? 'any' : undefined}
            onChange={(e) =>
              onChange(
                field.type === 'number' && e.target.value !== ''
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
          />
        );
      }}
    </FieldLabel>
  );
}
function FormAnswers({
  api,
  form,
  submission,
  refresh,
}: {
  api: Api;
  form: EventForm;
  submission: Submission | null;
  refresh: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(submission?.answers || {});
  const action = useAction();
  const closed = !!form.closesAt && new Date(form.closesAt).getTime() <= Date.now();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(`/participant/forms/${form.id}/submission`, 'PUT', {
            answers,
            revision: form.revision,
          });
          refresh();
        }, 'Your response has been saved.');
      }}
    >
      <div className="portal-card-meta">
        <Badge>{trackLabel(form.track)}</Badge>
        <Badge tone={closed ? '' : 'accent'}>{closed ? 'Closed' : 'Open'}</Badge>
      </div>
      <h2>{form.title}</h2>
      {form.description && <p className="preserve-lines">{form.description}</p>}
      <div className="portal-form-info">
        <span>Deadline: {dateTime(form.closesAt)}</span>
        {submission && (
          <span>
            <CheckCircle2 size={15} />
            Response saved {dateTime(submission.updatedAt)}
          </span>
        )}
      </div>
      <p className="portal-hint">
        Fields marked * are required. You can update your response while this form is open.
      </p>
      {form.fields.map((field) => (
        <AnswerField
          key={field.id}
          field={field}
          value={answers[field.id]}
          disabled={closed || action.busy}
          onChange={(value) => setAnswers((previous) => ({ ...previous, [field.id]: value }))}
        />
      ))}
      <Notice error={action.error} success={action.success} />
      <Button type="submit" className="primary" busy={action.busy} disabled={closed}>
        {submission ? 'Update response' : 'Submit response'}
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
function ParticipantForm({ api, formId, back }: { api: Api; formId: string; back: () => void }) {
  const resource = useResource<{ form: EventForm; submission: Submission | null }>(
    api,
    `/participant/forms/${formId}`,
  );
  return (
    <section>
      <Button onClick={back}>
        <ArrowLeft size={15} />
        All forms
      </Button>
      <div className="portal-spacer" />
      <Notice error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        resource.data && (
          <FormAnswers
            api={api}
            form={resource.data.form}
            submission={resource.data.submission}
            refresh={resource.refresh}
          />
        )
      )}
    </section>
  );
}
export function ParticipantForms({ api }: { api: Api }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<EventForm>>(api, `/participant/forms?offset=${offset}`);
  if (selected)
    return (
      <ParticipantForm
        api={api}
        formId={selected}
        back={() => {
          setSelected(null);
          resource.refresh();
        }}
      />
    );
  return (
    <section>
      <SectionHead
        title="Your forms"
        description="Forms published for your track and role. Your saved responses are available here too."
      />
      <Notice error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="No forms to fill out yet">
          Check back when the organizers publish a form.
        </Empty>
      ) : (
        <div className="portal-card-grid">
          {resource.data.items.map((form) => {
            const closed = !!form.closesAt && new Date(form.closesAt).getTime() <= Date.now();
            return (
              <article key={form.id} className="portal-card">
                <div className="portal-card-meta">
                  <ClipboardList size={18} />
                  <Badge tone={form.submittedAt ? 'accent' : ''}>
                    {form.submittedAt ? 'Submitted' : closed ? 'Closed' : 'Needs a response'}
                  </Badge>
                </div>
                <h3>{form.title}</h3>
                <p>{form.description}</p>
                <span className="portal-hint">Deadline: {dateTime(form.closesAt)}</span>
                <Button onClick={() => setSelected(form.id)}>
                  {closed
                    ? 'View form'
                    : form.submittedAt
                      ? 'View or update response'
                      : 'Fill out form'}
                  <ArrowRight size={15} />
                </Button>
              </article>
            );
          })}
        </div>
      )}
      <Pagination offset={offset} count={resource.data?.items.length || 0} onChange={setOffset} />
    </section>
  );
}
export function ParticipantHome({
  api,
  me,
  navigate,
}: {
  api: Api;
  me: Me;
  navigate: (section: string) => void;
}) {
  const forms = useResource<Page<EventForm>>(api, '/participant/forms?limit=200');
  const timeline = useResource<Page<TimelineItem>>(api, '/participant/timeline');
  const pending =
    forms.data?.items.filter(
      (form) =>
        !form.submittedAt && (!form.closesAt || new Date(form.closesAt).getTime() > Date.now()),
    ).length || 0;
  return (
    <>
      <div className="portal-welcome">
        <div>
          <p className="eyebrow">YOUR NEXT BIG IDEA STARTS HERE</p>
          <h2>Welcome, {me.person.name.split(' ')[0]}.</h2>
          <p>Everything you need for your VMEDITHON experience.</p>
          <div className="portal-actions">
            <Badge tone="accent">{trackLabel(me.person.track || '')}</Badge>
            <Badge>{roleLabel(me.person.role)}</Badge>
          </div>
        </div>
        <div className="portal-welcome-stat">
          <strong>{String(pending).padStart(2, '0')}</strong>
          <span>forms awaiting your response</span>
          <Button onClick={() => navigate('forms')}>
            Open forms
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>
      <Notice error={forms.error} />
      <div className="portal-two-columns">
        <div>
          <Announcements api={api} compact />
        </div>
        <div>
          <SectionHead title="Your team" />
          <div className="portal-card">
            <h3>{me.team?.name || 'Your team'}</h3>
            <ul className="portal-member-list">
              {me.team?.members.map((member) => (
                <li key={member.id}>
                  <span>{member.name}</span>
                  <Badge>{roleLabel(member.role)}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <SectionHead
            title="Up next"
            actions={
              <Button onClick={() => navigate('timeline')}>
                <CalendarDays size={15} />
                Full schedule
              </Button>
            }
          />
          <Notice error={timeline.error} />
          {timeline.loading ? <Loading /> : <Timeline items={timeline.data?.items || []} compact />}
        </div>
      </div>
    </>
  );
}
export function ParticipantSection({
  section,
  api,
  me,
  navigate,
}: {
  section: string;
  api: Api;
  me: Me;
  navigate: (section: string) => void;
}) {
  if (section === 'announcements') return <Announcements api={api} />;
  if (section === 'forms') return <ParticipantForms api={api} />;
  if (section === 'timeline') return <ParticipantTimeline api={api} />;
  if (section === 'results') return <ResultsView />;
  return <ParticipantHome api={api} me={me} navigate={navigate} />;
}
