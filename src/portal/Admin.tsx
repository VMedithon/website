import { useState } from 'react';
import type { Api } from '../lib/api';
import type { Me, Page } from './types';
import { AdminAnnouncements, AdminTimeline } from './AdminContent';
import { AdminForms } from './AdminForms';
import { AdminAccounts, AdminPeople, permissionLabels } from './AdminPeople';
import AdminFinance from './AdminFinance';
import { AdminJudges, AdminJudging, AdminResults } from './AdminJudging';
import {
  Button,
  dateTime,
  Empty,
  Loading,
  Notice,
  Pagination,
  SectionHead,
  useResource,
} from './shared';

function Overview({
  api,
  me,
  navigate,
}: {
  api: Api;
  me: Me;
  navigate: (section: string) => void;
}) {
  const resource = useResource<{ metrics: { key: string; label: string; value: number }[] }>(
    api,
    '/admin/overview',
  );
  return (
    <>
      <SectionHead
        title="Event overview"
        description={`Welcome back, ${me.person.name}. Here’s what’s happening at VMEDITHON.`}
      />
      <Notice error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="portal-stat-row">
          {resource.data?.metrics.map((metric) => (
            <div className="portal-stat" key={metric.key}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      )}
      <SectionHead title="Your workspace" description="The sections available to your account." />
      <div className="portal-card-grid">
        {me.person.permissions.map((permission) => (
          <div className="portal-card" key={permission}>
            <h3>{permissionLabels[permission]}</h3>
            <Button onClick={() => navigate(permission)}>
              Open {permissionLabels[permission].toLowerCase()}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
function Audit({ api }: { api: Api }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<
    Page<{ id: string; actor: string; action: string; resourceId: string; createdAt: string }>
  >(api, `/admin/audit?offset=${offset}`);
  return (
    <section>
      <SectionHead title="Activity log" description="A record of changes made across the event." />
      <Notice error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="No activity recorded yet" />
      ) : (
        <div className="portal-table-wrap">
          <table>
            <caption className="sr-only">Event activity</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Person</th>
                <th scope="col">Action</th>
                <th scope="col">Record</th>
              </tr>
            </thead>
            <tbody>
              {resource.data.items.map((row) => (
                <tr key={row.id}>
                  <td>{dateTime(row.createdAt)}</td>
                  <td>{row.actor}</td>
                  <td>{row.action.replaceAll('.', ' ')}</td>
                  <td className="portal-record-id">{row.resourceId}</td>
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
export default function AdminDashboard({
  api,
  me,
  section,
  navigate,
}: {
  api: Api;
  me: Me;
  section: string;
  navigate: (section: string) => void;
}) {
  switch (section) {
    case 'people':
      return <AdminPeople api={api} />;
    case 'announcements':
      return <AdminAnnouncements api={api} />;
    case 'timeline':
      return <AdminTimeline api={api} />;
    case 'forms':
      return <AdminForms api={api} person={me.person} />;
    case 'responses':
      return <AdminForms api={api} person={me.person} responsesOnly />;
    case 'finance':
      return <AdminFinance api={api} />;
    case 'admins':
      return <AdminAccounts api={api} actor={me.person} />;
    case 'judges':
      return <AdminJudges api={api} />;
    case 'judging':
      return <AdminJudging api={api} />;
    case 'results':
      return <AdminResults api={api} />;
    case 'audit':
      return <Audit api={api} />;
    default:
      return <Overview api={api} me={me} navigate={navigate} />;
  }
}
