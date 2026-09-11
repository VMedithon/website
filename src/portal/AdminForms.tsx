import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Api } from '../lib/api';
import type { Audience, EventForm, Field, Page, Person, ResponseRow, Track } from './types';
import {
  Badge,
  Button,
  dateTime,
  Empty,
  FieldLabel,
  Loading,
  localInput,
  Notice,
  Pagination,
  SectionHead,
  TargetFields,
  toISO,
  trackLabel,
  useAction,
  useResource,
} from './shared';

const newField = (): Field => ({
  id: `field_${crypto.randomUUID()}`,
  label: '',
  type: 'text',
  required: true,
  options: [],
});
const fieldTypes: { value: Field['type']; label: string }[] = [
  { value: 'text', label: 'Short answer' },
  { value: 'textarea', label: 'Long answer' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'Link' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single choice' },
  { value: 'multiselect', label: 'Multiple choice' },
];

function FormEditor({
  api,
  form,
  copy,
  done,
  cancel,
}: {
  api: Api;
  form: EventForm | null;
  copy: boolean;
  done: () => void;
  cancel: () => void;
}) {
  const [title, setTitle] = useState(form ? `${form.title}${copy ? ' (copy)' : ''}` : ''),
    [description, setDescription] = useState(form?.description || '');
  const [track, setTrack] = useState<Track | 'all'>(form?.track || 'all'),
    [audience, setAudience] = useState<Audience>(form?.audience || 'all');
  const [closes, setCloses] = useState(localInput(form?.closesAt)),
    [published, setPublished] = useState(copy ? false : !!form?.published);
  const [fields, setFields] = useState<Field[]>(form?.fields || [newField()]);
  const action = useAction();
  const locked = !copy && (form?.responseCount || 0) > 0;
  function update(index: number, changes: Partial<Field>) {
    setFields((previous) =>
      previous.map((field, i) => (i === index ? { ...field, ...changes } : field)),
    );
  }
  function move(index: number, by: number) {
    setFields((previous) => {
      const result = [...previous];
      const a = result[index],
        b = result[index + by];
      if (a && b) {
        result[index] = b;
        result[index + by] = a;
      }
      return result;
    });
  }
  return (
    <form
      className="portal-form portal-form-wide"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          const path = form && !copy ? `/admin/forms/${form.id}` : '/admin/forms';
          await api.mutate(path, form && !copy ? 'PUT' : 'POST', {
            title,
            description,
            track,
            audience,
            fields: fields.map((field) => ({
              ...field,
              options: field.options.map((value) => value.trim()).filter(Boolean),
            })),
            published,
            closesAt: toISO(closes),
          });
          done();
        });
      }}
    >
      <SectionHead
        title={copy ? 'Copy form' : form ? 'Edit form' : 'Create a form'}
        description="Build a form for your participants. Save a draft or publish it when ready."
      />
      <div className="portal-card">
        <FieldLabel label="Form title">
          {(id) => (
            <input
              id={id}
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final project submission"
            />
          )}
        </FieldLabel>
        <FieldLabel label="Description">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </FieldLabel>
        <fieldset className="portal-plain-fieldset" disabled={locked}>
          <legend className="sr-only">Form audience</legend>
          <TargetFields
            track={track}
            audience={audience}
            onTrack={setTrack}
            onAudience={setAudience}
          />
        </fieldset>
        <FieldLabel
          label="Response deadline (optional)"
          hint={`Enter the time in ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Leave blank to keep the form open.`}
        >
          {(id) => (
            <input
              id={id}
              type="datetime-local"
              value={closes}
              onChange={(e) => setCloses(e.target.value)}
            />
          )}
        </FieldLabel>
      </div>
      {locked && (
        <Notice success="This form already has responses. Its questions and audience are fixed. Copy the form to make a new version." />
      )}
      <fieldset className="portal-plain-fieldset" disabled={locked || action.busy}>
        <legend className="sr-only">Questions</legend>
        {fields.map((field, index) => (
          <div className="portal-card portal-question" key={field.id}>
            <div className="portal-section-head">
              <span className="eyebrow">QUESTION {String(index + 1).padStart(2, '0')}</span>
              <div className="portal-actions">
                <Button
                  disabled={index === 0}
                  aria-label={`Move question ${index + 1} up`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={15} />
                </Button>
                <Button
                  disabled={index === fields.length - 1}
                  aria-label={`Move question ${index + 1} down`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={15} />
                </Button>
                <Button
                  disabled={fields.length === 1}
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => setFields((previous) => previous.filter((_, i) => i !== index))}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
            <div className="portal-form-row">
              <FieldLabel label="Question">
                {(id) => (
                  <input
                    id={id}
                    required
                    maxLength={200}
                    value={field.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder="What would you like to ask?"
                  />
                )}
              </FieldLabel>
              <FieldLabel label="Answer type">
                {(id) => (
                  <select
                    id={id}
                    value={field.type}
                    onChange={(e) =>
                      update(index, { type: e.target.value as Field['type'], options: [] })
                    }
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              </FieldLabel>
            </div>
            {['select', 'multiselect'].includes(field.type) && (
              <FieldLabel
                label="Options"
                hint="One option per line, with at least two unique options."
              >
                {(id) => (
                  <textarea
                    id={id}
                    rows={4}
                    required
                    value={field.options.join('\n')}
                    onChange={(e) => update(index, { options: e.target.value.split('\n') })}
                  />
                )}
              </FieldLabel>
            )}
            <label className="portal-check">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => update(index, { required: e.target.checked })}
              />
              Required question
            </label>
          </div>
        ))}
        <Button
          disabled={fields.length >= 40}
          onClick={() => setFields((previous) => [...previous, newField()])}
        >
          <Plus size={15} />
          Add question
        </Button>
      </fieldset>
      <div className="portal-card">
        <label className="portal-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publish this form to eligible participants
        </label>
        <Notice error={action.error} />
        <div className="portal-actions">
          <Button type="submit" className="primary" busy={action.busy}>
            {published ? 'Save and publish' : 'Save draft'}
          </Button>
          <Button onClick={cancel} disabled={action.busy}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
function Responses({ api, form, back }: { api: Api; form: EventForm; back: () => void }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<ResponseRow>>(
    api,
    `/admin/forms/${form.id}/responses?offset=${offset}`,
  );
  const action = useAction();
  return (
    <section>
      <Button onClick={back}>
        <ArrowLeft size={15} />
        All forms
      </Button>
      <div className="portal-spacer" />
      <SectionHead
        title={form.title}
        description={`${form.responseCount || 0} responses`}
        actions={
          <Button
            busy={action.busy}
            onClick={() =>
              void action.run(() =>
                api.download(`/admin/forms/${form.id}/export`, 'form-responses.csv'),
              )
            }
          >
            <Download size={15} />
            Export CSV
          </Button>
        }
      />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="No responses yet">Submissions will appear in this table.</Empty>
      ) : (
        <div className="portal-table-wrap">
          <table>
            <caption className="sr-only">Responses to {form.title}</caption>
            <thead>
              <tr>
                {['Name', 'Email', 'Team', 'Track'].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
                {form.fields.map((field) => (
                  <th key={field.id} scope="col">
                    {field.label}
                  </th>
                ))}
                <th scope="col">Last saved</th>
              </tr>
            </thead>
            <tbody>
              {resource.data.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td>{row.email}</td>
                  <td>{row.team}</td>
                  <td>{trackLabel(row.track)}</td>
                  {form.fields.map((field) => (
                    <td key={field.id} className="portal-answer-cell">
                      {Array.isArray(row.answers[field.id])
                        ? (row.answers[field.id] as string[]).join(', ')
                        : String(row.answers[field.id] ?? '')}
                    </td>
                  ))}
                  <td>{dateTime(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination offset={offset} count={resource.data?.items.length || 0} onChange={setOffset} />
    </section>
  );
}
export function AdminForms({
  api,
  person,
  responsesOnly = false,
}: {
  api: Api;
  person: Person;
  responsesOnly?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<EventForm>>(api, `/admin/forms?offset=${offset}`);
  const [editor, setEditor] = useState<{ form: EventForm | null; copy: boolean } | null>(null);
  const [responseForm, setResponseForm] = useState<EventForm | null>(null);
  const action = useAction();
  const canEdit = !responsesOnly && person.permissions.includes('forms'),
    canRead = person.permissions.includes('responses');
  if (editor)
    return (
      <FormEditor
        api={api}
        form={editor.form}
        copy={editor.copy}
        done={() => {
          setEditor(null);
          resource.refresh();
        }}
        cancel={() => setEditor(null)}
      />
    );
  if (responseForm)
    return <Responses api={api} form={responseForm} back={() => setResponseForm(null)} />;
  return (
    <section>
      <SectionHead
        title={responsesOnly ? 'Response sheets' : 'Forms'}
        description={
          responsesOnly
            ? 'Review participant submissions and export them to your spreadsheet.'
            : 'Collect exactly what your team needs, from the right participants.'
        }
        actions={
          canEdit && (
            <Button className="primary" onClick={() => setEditor({ form: null, copy: false })}>
              <Plus size={15} />
              Create form
            </Button>
          )
        }
      />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="No forms yet">Published forms and their responses will appear here.</Empty>
      ) : (
        <div className="portal-feed">
          {resource.data.items.map((form) => (
            <article key={form.id} className="portal-card">
              <div className="portal-card-meta">
                <Badge tone={form.published ? 'accent' : ''}>
                  {form.published ? 'Published' : 'Draft'}
                </Badge>
                <Badge>{trackLabel(form.track)}</Badge>
                <span>
                  {form.audience === 'all'
                    ? 'All participants'
                    : form.audience === 'lead'
                      ? 'Team leads'
                      : 'Team members'}
                </span>
              </div>
              <h3>{form.title}</h3>
              <p>{form.description}</p>
              <div className="portal-form-info">
                <span>{form.responseCount || 0} responses</span>
                <span>Deadline: {dateTime(form.closesAt)}</span>
              </div>
              <div className="portal-actions">
                {canEdit && (
                  <>
                    <Button onClick={() => setEditor({ form, copy: false })}>
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button onClick={() => setEditor({ form, copy: true })}>
                      <Copy size={14} />
                      Copy
                    </Button>
                    <Button
                      busy={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await api.mutate(`/admin/forms/${form.id}/publication`, 'PATCH', {
                            published: !form.published,
                          });
                          resource.refresh();
                        })
                      }
                    >
                      {form.published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </>
                )}
                {canRead && (
                  <>
                    <Button onClick={() => setResponseForm(form)}>View responses</Button>
                    <Button
                      busy={action.busy}
                      onClick={() =>
                        void action.run(() =>
                          api.download(`/admin/forms/${form.id}/export`, 'form-responses.csv'),
                        )
                      }
                    >
                      <Download size={14} />
                      Export CSV
                    </Button>
                  </>
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
