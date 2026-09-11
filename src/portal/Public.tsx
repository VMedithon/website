import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getPublic } from '../lib/api';
import type { Page, Result, Standing, TimelineItem, Track } from './types';
import {
  dateTime,
  Empty,
  Loading,
  message,
  Notice,
  SectionHead,
  TrackTabs,
  trackLabel,
} from './shared';
import './portal.css';

export function Standings({ standings }: { standings: Standing[] }) {
  return (
    <div className="portal-table-wrap">
      <table>
        <caption className="sr-only">Team standings</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Team</th>
            <th scope="col">Score / 100</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.teamId}>
              <td>
                <span className={row.rank <= 3 ? 'portal-rank top' : 'portal-rank'}>
                  {row.rank === 1 && <Trophy size={14} />}
                  {row.rank}
                </span>
              </td>
              <th scope="row">{row.teamName}</th>
              <td>{row.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ResultsView() {
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void getPublic<Page<Result>>('/results', controller.signal)
      .then((data) => setResults(data.items))
      .catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
    return () => controller.abort();
  }, []);
  return (
    <section>
      <SectionHead
        title="Event results"
        description="Celebrate the teams building a healthier tomorrow."
      />
      <Notice error={error} />
      {!results && !error ? (
        <Loading />
      ) : !results?.length ? (
        <Empty title="The next chapter is still being written">
          Results will appear here when the organizers release them.
        </Empty>
      ) : (
        results.map((result) => (
          <div key={result.track} className="portal-results">
            <SectionHead
              title={trackLabel(result.track)}
              description={`Released ${dateTime(result.publishedAt)}`}
            />
            <Standings standings={result.standings} />
          </div>
        ))
      )}
    </section>
  );
}
function PublicSchedule() {
  const [track, setTrack] = useState<Track>('hackathon');
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError(null);
    void getPublic<Page<TimelineItem>>(`/timeline?track=${track}`, controller.signal)
      .then((data) => setItems(data.items))
      .catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
    return () => controller.abort();
  }, [track]);
  return (
    <section>
      <SectionHead
        title="Event schedule"
        description="Follow your track. All times are in Indian Standard Time."
        actions={<TrackTabs value={track} onChange={setTrack} />}
      />
      <Notice error={error} />
      {!items && !error ? (
        <Loading />
      ) : !items?.length ? (
        <Empty title="Schedule coming soon">
          The organizers will publish the event timeline here.
        </Empty>
      ) : (
        <ol className="portal-timeline">
          {items.map((item) => (
            <li key={item.id}>
              <div className="portal-timeline-time">
                {dateTime(item.startsAt)}
                {item.endsAt && <small>Until {dateTime(item.endsAt)}</small>}
              </div>
              <div>
                <h3>{item.title}</h3>
                <p className="preserve-lines">{item.description}</p>
                <span>{item.location}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
export default function PublicPage() {
  return (
    <div className="portal-public">
      <a className="portal-back-link" href="/">
        <ArrowLeft size={16} />
        Back to VMEDITHON
      </a>
      <p className="eyebrow">VMEDITHON 3.0 / SEPTEMBER 2026</p>
      {window.location.pathname.startsWith('/schedule') ? <PublicSchedule /> : <ResultsView />}
    </div>
  );
}
