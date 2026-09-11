import { useState } from 'react';
import { Download, Plus, RefreshCw, Upload, Users } from 'lucide-react';
import type { Api } from '../lib/api';
import type { Page, Permission, Person, SyncResult } from './types';
import {
  Badge,
  Button,
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

export function AccessSync({ api, refresh }: { api: Api; refresh: () => void }) {
  const action = useAction();
  const [status, setStatus] = useState('');
  return (
    <div className="portal-access-sync">
      <Button
        busy={action.busy}
        onClick={() =>
          void action.run(async () => {
            let total = 0;
            for (let batch = 0; batch < 50; batch++) {
              const result = await api.mutate<SyncResult>('/admin/access/sync', 'POST');
              total += result.synced;
              setStatus(`${total} accounts synced. ${result.pending} remaining.`);
              if (result.errors.length)
                throw new Error(
                  result.errors.map((error) => `${error.email}: ${error.message}`).join('\n'),
                );
              if (!result.pending) {
                refresh();
                return;
              }
            }
            refresh();
          }, 'Sign-up access is up to date.')
        }
      >
        <RefreshCw size={15} />
        Activate sign-ups
      </Button>
      {status && (
        <span className="portal-hint" role="status">
          {status}
        </span>
      )}
      <Notice error={action.error} success={action.success} />
    </div>
  );
}
function ImportParticipants({
  api,
  done,
  cancel,
}: {
  api: Api;
  done: () => void;
  cancel: () => void;
}) {
  const [csv, setCsv] = useState(''),
    [filename, setFilename] = useState('');
  const [preview, setPreview] = useState<{
    newParticipants: number;
    existingParticipants: number;
    newTeams: number;
  } | null>(null);
  const action = useAction();
  return (
    <div className="portal-card portal-form">
      <SectionHead
        title="Import participants"
        description="Export your roster from Excel or Google Sheets as a CSV. Include email, name, role, track, and team."
      />
      <p>
        Each team needs one team lead. Use <code>lead</code> or <code>member</code> for the role,
        and <code>hackathon</code> or <code>buildathon</code> for the track.
      </p>
      <Button
        busy={action.busy}
        onClick={() =>
          void action.run(() => api.download('/admin/people/template', 'participant-template.csv'))
        }
      >
        <Download size={15} />
        Download template
      </Button>
      <FieldLabel label="Participant CSV" hint="Up to 500 participants and 1 MB per file.">
        {(id) => (
          <input
            id={id}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(null);
              setCsv('');
              setFilename('');
              if (file)
                void action.run(async () => {
                  if (file.size > 1000000) throw new Error('Choose a CSV smaller than 1 MB.');
                  setCsv(await file.text());
                  setFilename(file.name);
                });
            }}
          />
        )}
      </FieldLabel>
      {filename && <span className="portal-hint">Selected: {filename}</span>}
      <Notice error={action.error} />
      <Button
        busy={action.busy}
        disabled={!csv}
        onClick={() =>
          void action.run(async () => {
            setPreview(await api.mutate('/admin/people/import', 'POST', { csv, preview: true }));
          })
        }
      >
        Check import
      </Button>
      {preview && (
        <div className="portal-import-preview">
          <h3>Ready to import</h3>
          <p>
            {preview.newParticipants} new participants · {preview.newTeams} new teams ·{' '}
            {preview.existingParticipants} already registered
          </p>
          <Button
            className="primary"
            busy={action.busy}
            onClick={() =>
              void action.run(async () => {
                await api.mutate('/admin/people/import', 'POST', { csv });
                done();
              })
            }
          >
            <Upload size={15} />
            Import roster
          </Button>
        </div>
      )}
      <Button disabled={action.busy} onClick={cancel}>
        Cancel
      </Button>
    </div>
  );
}
export function AdminPeople({ api }: { api: Api }) {
  const [offset, setOffset] = useState(0),
    [search, setSearch] = useState(''),
    [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const resource = useResource<Page<Person>>(
    api,
    `/admin/people?offset=${offset}&search=${encodeURIComponent(query)}`,
  );
  const action = useAction();
  if (importing)
    return (
      <ImportParticipants
        api={api}
        done={() => {
          setImporting(false);
          resource.refresh();
        }}
        cancel={() => setImporting(false)}
      />
    );
  return (
    <section>
      <SectionHead
        title="Participants"
        description="Manage the event roster, team roles, and sign-up access."
        actions={
          <>
            <Button
              busy={action.busy}
              onClick={() =>
                void action.run(() => api.download('/admin/people/export', 'participants.csv'))
              }
            >
              <Download size={15} />
              Export CSV
            </Button>
            <Button className="primary" onClick={() => setImporting(true)}>
              <Upload size={15} />
              Import CSV
            </Button>
          </>
        }
      />
      <div className="portal-card">
        <AccessSync api={api} refresh={resource.refresh} />
        <p className="portal-hint">
          After importing the roster, activate sign-ups so registered participants can create their
          accounts.
        </p>
      </div>
      <form
        className="portal-search"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setQuery(search);
        }}
      >
        <FieldLabel label="Find a participant or team">
          {(id) => (
            <input
              id={id}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </FieldLabel>
        <Button type="submit">Search</Button>
      </form>
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title={query ? 'No matching participants' : 'Build your event roster'}>
          Import your participant CSV to get started.
        </Empty>
      ) : (
        <div className="portal-table-wrap">
          <table>
            <caption className="sr-only">Participant roster</caption>
            <thead>
              <tr>
                {['Participant', 'Team', 'Track', 'Role', 'Access', 'Actions'].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resource.data.items.map((person) => (
                <tr key={person.id}>
                  <th scope="row">
                    {person.name}
                    <small>{person.email}</small>
                  </th>
                  <td>{person.teamName}</td>
                  <td>{trackLabel(person.track || '')}</td>
                  <td>{roleLabel(person.role)}</td>
                  <td>
                    <Badge tone={person.active && person.accessSynced ? 'accent' : ''}>
                      {!person.active
                        ? 'Disabled'
                        : person.accessSynced
                          ? 'Ready to sign up'
                          : 'Needs activation'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      busy={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await api.mutate(`/admin/people/${person.id}/access`, 'PATCH', {
                            active: !person.active,
                          });
                          resource.refresh();
                        })
                      }
                    >
                      {person.active ? 'Disable access' : 'Restore access'}
                    </Button>
                  </td>
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
export const permissionLabels: Record<Permission, string> = {
  people: 'Participant roster',
  announcements: 'Announcements',
  forms: 'Form builder',
  responses: 'Response sheets and exports',
  timeline: 'Event timeline',
  finance: 'Finance and receipts',
  judging: 'Judges and scoring',
  results: 'Publish results',
  admins: 'Manage administrators',
  audit: 'Activity log',
};
function AdminEditor({
  api,
  actor,
  target,
  done,
  cancel,
}: {
  api: Api;
  actor: Person;
  target: Person | null;
  done: () => void;
  cancel: () => void;
}) {
  const [email, setEmail] = useState(''),
    [name, setName] = useState('');
  const [grants, setGrants] = useState<Permission[]>(target?.permissions || []);
  const action = useAction();
  const available =
    actor.role === 'owner'
      ? (Object.keys(permissionLabels) as Permission[])
      : actor.permissions.filter((p) => p !== 'admins');
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(
            target ? `/admin/admins/${target.id}/permissions` : '/admin/admins',
            target ? 'PUT' : 'POST',
            target ? { permissions: grants } : { email, name, permissions: grants },
          );
          done();
        });
      }}
    >
      <SectionHead
        title={target ? `Access for ${target.name}` : 'Add an administrator'}
        description="Choose the sections this person should be able to use."
      />
      {!target && (
        <>
          <FieldLabel label="Name">
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
        </>
      )}
      <fieldset className="portal-choice-field">
        <legend>Allowed sections</legend>
        {available.map((permission) => (
          <label className="portal-check" key={permission}>
            <input
              type="checkbox"
              checked={grants.includes(permission)}
              onChange={(e) =>
                setGrants((previous) =>
                  e.target.checked
                    ? [...previous, permission]
                    : previous.filter((p) => p !== permission),
                )
              }
            />
            {permissionLabels[permission]}
          </label>
        ))}
      </fieldset>
      <Notice error={action.error} />
      <div className="portal-actions">
        <Button type="submit" busy={action.busy} disabled={!grants.length} className="primary">
          Save administrator
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </div>
    </form>
  );
}
export function AdminAccounts({ api, actor }: { api: Api; actor: Person }) {
  const resource = useResource<Page<Person>>(api, '/admin/admins');
  const [editor, setEditor] = useState<{ target: Person | null } | null>(null);
  const action = useAction();
  if (editor)
    return (
      <AdminEditor
        api={api}
        actor={actor}
        target={editor.target}
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
        title="Administrator access"
        description="Give each organizer the tools they need."
        actions={
          <Button className="primary" onClick={() => setEditor({ target: null })}>
            <Plus size={15} />
            Add administrator
          </Button>
        }
      />
      <AccessSync api={api} refresh={resource.refresh} />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="portal-feed">
          {resource.data?.items.map((person) => {
            const canManage =
              person.role !== 'owner' &&
              person.id !== actor.id &&
              (actor.role === 'owner' ||
                (!person.permissions.includes('admins') &&
                  person.permissions.every((p) => actor.permissions.includes(p))));
            return (
              <article key={person.id} className="portal-card">
                <div className="portal-card-meta">
                  <Users size={18} />
                  <Badge>{roleLabel(person.role)}</Badge>
                  <Badge tone={person.active ? 'accent' : ''}>
                    {person.active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <h3>{person.name}</h3>
                <p>{person.email}</p>
                <div className="portal-tags">
                  {person.permissions.map((permission) => (
                    <Badge key={permission}>{permissionLabels[permission]}</Badge>
                  ))}
                </div>
                {canManage && (
                  <div className="portal-actions">
                    <Button onClick={() => setEditor({ target: person })}>Edit permissions</Button>
                    <Button
                      busy={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await api.mutate(`/admin/people/${person.id}/access`, 'PATCH', {
                            active: !person.active,
                          });
                          resource.refresh();
                        })
                      }
                    >
                      {person.active ? 'Disable access' : 'Restore access'}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
