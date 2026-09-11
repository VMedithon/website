import { useState } from 'react';
import { Pencil, Plus, Send, EyeOff } from 'lucide-react';
import type { Api } from '../lib/api';
import type { Announcement, Audience, Page, TimelineItem, Track } from './types';
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

function AnnouncementEditor({
  api,
  item,
  done,
  cancel,
}: {
  api: Api;
  item: Announcement | null;
  done: () => void;
  cancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title || '');
  const [body, setBody] = useState(item?.body || '');
  const [track, setTrack] = useState<Track | 'all'>(item?.track || 'all');
  const [audience, setAudience] = useState<Audience>(item?.audience || 'all');
  const [pinned, setPinned] = useState(!!item?.pinned);
  const [published, setPublished] = useState(!!item?.published);
  const action = useAction();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(
            item ? `/admin/announcements/${item.id}` : '/admin/announcements',
            item ? 'PUT' : 'POST',
            { title, body, track, audience, pinned, published },
          );
          done();
        });
      }}
    >
      <SectionHead title={item ? 'Edit announcement' : 'New announcement'} />
      <FieldLabel label="Title">
        {(id) => (
          <input
            id={id}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        )}
      </FieldLabel>
      <FieldLabel label="Message">
        {(id) => (
          <textarea
            id={id}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={10000}
            rows={6}
          />
        )}
      </FieldLabel>
      <TargetFields track={track} audience={audience} onTrack={setTrack} onAudience={setAudience} />
      <label className="portal-check">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Pin this announcement
      </label>
      <label className="portal-check">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Publish to participants now
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
    </form>
  );
}
export function AdminAnnouncements({ api }: { api: Api }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Page<Announcement>>(api, `/admin/announcements?offset=${offset}`);
  const [editor, setEditor] = useState<{ item: Announcement | null } | null>(null);
  const action = useAction();
  if (editor)
    return (
      <AnnouncementEditor
        api={api}
        item={editor.item}
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
        title="Announcements"
        description="Share updates with the right participants."
        actions={
          <Button className="primary" onClick={() => setEditor({ item: null })}>
            <Plus size={16} />
            New announcement
          </Button>
        }
      />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="Keep everyone in the loop">
          Create your first announcement and publish when you’re ready.
        </Empty>
      ) : (
        <div className="portal-feed">
          {resource.data.items.map((item) => (
            <article key={item.id} className="portal-card">
              <div className="portal-card-meta">
                <Badge tone={item.published ? 'accent' : ''}>
                  {item.published ? 'Published' : 'Draft'}
                </Badge>
                <Badge>{trackLabel(item.track)}</Badge>
                <span>
                  {item.audience === 'all'
                    ? 'All participants'
                    : item.audience === 'lead'
                      ? 'Team leads'
                      : 'Team members'}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="preserve-lines">{item.body}</p>
              <div className="portal-actions">
                <Button onClick={() => setEditor({ item })}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  busy={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      await api.mutate(`/admin/announcements/${item.id}/publication`, 'PATCH', {
                        published: !item.published,
                      });
                      resource.refresh();
                    })
                  }
                >
                  {item.published ? <EyeOff size={14} /> : <Send size={14} />}
                  {item.published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination offset={offset} count={resource.data?.items.length || 0} onChange={setOffset} />
    </section>
  );
}
function TimelineEditor({
  api,
  item,
  done,
  cancel,
}: {
  api: Api;
  item: TimelineItem | null;
  done: () => void;
  cancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title || ''),
    [description, setDescription] = useState(item?.description || ''),
    [location, setLocation] = useState(item?.location || '');
  const [starts, setStarts] = useState(localInput(item?.startsAt)),
    [ends, setEnds] = useState(localInput(item?.endsAt));
  const [track, setTrack] = useState<Track | 'all'>(item?.track || 'all'),
    [published, setPublished] = useState(!!item?.published);
  const action = useAction();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(
            item ? `/admin/timeline/${item.id}` : '/admin/timeline',
            item ? 'PUT' : 'POST',
            {
              title,
              description,
              location,
              startsAt: toISO(starts),
              endsAt: toISO(ends),
              track,
              published,
            },
          );
          done();
        });
      }}
    >
      <SectionHead title={item ? 'Edit schedule entry' : 'New schedule entry'} />
      <FieldLabel label="Title">
        {(id) => (
          <input
            id={id}
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </FieldLabel>
      <FieldLabel label="Description">
        {(id) => (
          <textarea
            id={id}
            maxLength={5000}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </FieldLabel>
      <FieldLabel label="Location">
        {(id) => (
          <input
            id={id}
            maxLength={300}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}
      </FieldLabel>
      <TargetFields track={track} onTrack={setTrack} />
      <p className="portal-hint">
        Enter times in your device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
        The schedule displays them in IST.
      </p>
      <div className="portal-form-row">
        <FieldLabel label="Starts">
          {(id) => (
            <input
              id={id}
              type="datetime-local"
              required
              value={starts}
              onChange={(e) => setStarts(e.target.value)}
            />
          )}
        </FieldLabel>
        <FieldLabel label="Ends (optional)">
          {(id) => (
            <input
              id={id}
              type="datetime-local"
              min={starts}
              value={ends}
              onChange={(e) => setEnds(e.target.value)}
            />
          )}
        </FieldLabel>
      </div>
      <label className="portal-check">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Publish on the event schedule
      </label>
      <Notice error={action.error} />
      <div className="portal-actions">
        <Button type="submit" className="primary" busy={action.busy}>
          {published ? 'Save and publish' : 'Save draft'}
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </div>
    </form>
  );
}
export function AdminTimeline({ api }: { api: Api }) {
  const resource = useResource<Page<TimelineItem>>(api, '/admin/timeline');
  const [editor, setEditor] = useState<{ item: TimelineItem | null } | null>(null);
  const action = useAction();
  if (editor)
    return (
      <TimelineEditor
        api={api}
        item={editor.item}
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
        title="Event timeline"
        description="Schedule both tracks, including shared sessions."
        actions={
          <Button className="primary" onClick={() => setEditor({ item: null })}>
            <Plus size={16} />
            Add session
          </Button>
        }
      />
      <Notice error={resource.error || action.error} />
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="Plan the event day">Add sessions, deadlines, and judging windows.</Empty>
      ) : (
        <div className="portal-feed">
          {resource.data.items.map((item) => (
            <article className="portal-card" key={item.id}>
              <div className="portal-card-meta">
                <Badge tone={item.published ? 'accent' : ''}>
                  {item.published ? 'Published' : 'Draft'}
                </Badge>
                <Badge>{trackLabel(item.track)}</Badge>
              </div>
              <h3>{item.title}</h3>
              <p>
                {dateTime(item.startsAt)}
                {item.endsAt ? ` to ${dateTime(item.endsAt)}` : ''}
              </p>
              {item.location && <p>{item.location}</p>}
              <div className="portal-actions">
                <Button onClick={() => setEditor({ item })}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  busy={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      await api.mutate(`/admin/timeline/${item.id}/publication`, 'PATCH', {
                        published: !item.published,
                      });
                      resource.refresh();
                    })
                  }
                >
                  {item.published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
