import { useState } from 'react';
import { Download, Paperclip, Plus, Receipt } from 'lucide-react';
import type { Api } from '../lib/api';
import type { FinanceEntry, FinancePage } from './types';
import {
  Badge,
  Button,
  Empty,
  FieldLabel,
  Loading,
  money,
  Notice,
  Pagination,
  SectionHead,
  useAction,
  useResource,
} from './shared';

function FinanceEditor({ api, done, cancel }: { api: Api; done: () => void; cancel: () => void }) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState(''),
    [category, setCategory] = useState(''),
    [amount, setAmount] = useState('');
  const [occurredOn, setOccurredOn] = useState(new Date().toLocaleDateString('en-CA')),
    [file, setFile] = useState<File | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const action = useAction();
  const changed = () => setRequestId(crypto.randomUUID());
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          if (file && file.size > 5 * 1024 * 1024)
            throw new Error('Choose a receipt smaller than 5 MB.');
          const data = new FormData();
          data.set(
            'entry',
            JSON.stringify({ kind, description, category, amount, occurredOn, requestId }),
          );
          if (file) data.set('receipt', file);
          await api.upload('/admin/finance', data);
          done();
        });
      }}
    >
      <SectionHead
        title="Record a transaction"
        description="Keep event income, expenses, and receipts together."
      />
      <FieldLabel label="Type">
        {(id) => (
          <select
            id={id}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as 'income' | 'expense');
              changed();
            }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        )}
      </FieldLabel>
      <FieldLabel label="Description">
        {(id) => (
          <textarea
            id={id}
            rows={3}
            required
            maxLength={1000}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              changed();
            }}
            placeholder={
              kind === 'income' ? 'e.g. Sponsorship received' : 'e.g. Lunch for participants'
            }
          />
        )}
      </FieldLabel>
      <div className="portal-form-row">
        <FieldLabel label="Amount (INR)">
          {(id) => (
            <input
              id={id}
              type="number"
              required
              min="0.01"
              max="100000000"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                changed();
              }}
            />
          )}
        </FieldLabel>
        <FieldLabel label="Date">
          {(id) => (
            <input
              id={id}
              type="date"
              required
              value={occurredOn}
              onChange={(e) => {
                setOccurredOn(e.target.value);
                changed();
              }}
            />
          )}
        </FieldLabel>
      </div>
      <FieldLabel label="Category">
        {(id) => (
          <input
            id={id}
            required
            maxLength={100}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              changed();
            }}
            placeholder={
              kind === 'income'
                ? 'Sponsorship, registration, grant...'
                : 'Food, travel, equipment...'
            }
          />
        )}
      </FieldLabel>
      <FieldLabel label="Receipt (optional)" hint="PDF, PNG, JPEG, or WebP, up to 5 MB.">
        {(id) => (
          <input
            id={id}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              changed();
            }}
          />
        )}
      </FieldLabel>
      <Notice error={action.error} />
      <div className="portal-actions">
        <Button className="primary" type="submit" busy={action.busy}>
          <Receipt size={16} />
          Save transaction
        </Button>
        <Button onClick={cancel} disabled={action.busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
function VoidEntry({
  api,
  entry,
  done,
  cancel,
}: {
  api: Api;
  entry: FinanceEntry;
  done: () => void;
  cancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const action = useAction();
  return (
    <form
      className="portal-card portal-form"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(async () => {
          await api.mutate(`/admin/finance/${entry.id}/void`, 'POST', { reason });
          done();
        });
      }}
    >
      <SectionHead
        title="Void transaction"
        description={`${entry.description} · ${money(entry.amount)}`}
      />
      <p>
        This will exclude the transaction from totals. The original record and receipt stay in the
        ledger.
      </p>
      <FieldLabel label="Reason">
        {(id) => (
          <textarea
            id={id}
            rows={3}
            required
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </FieldLabel>
      <Notice error={action.error} />
      <div className="portal-actions">
        <Button className="danger" type="submit" busy={action.busy}>
          Confirm void
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </div>
    </form>
  );
}
export default function AdminFinance({ api }: { api: Api }) {
  const [offset, setOffset] = useState(0),
    [creating, setCreating] = useState(false),
    [voiding, setVoiding] = useState<FinanceEntry | null>(null);
  const resource = useResource<FinancePage>(api, `/admin/finance?offset=${offset}`);
  const action = useAction();
  if (creating)
    return (
      <FinanceEditor
        api={api}
        done={() => {
          setCreating(false);
          resource.refresh();
        }}
        cancel={() => setCreating(false)}
      />
    );
  if (voiding)
    return (
      <VoidEntry
        api={api}
        entry={voiding}
        done={() => {
          setVoiding(null);
          resource.refresh();
        }}
        cancel={() => setVoiding(null)}
      />
    );
  return (
    <section>
      <SectionHead
        title="Event finances"
        description="A clear view of money in, money out, and every receipt."
        actions={
          <>
            <Button
              busy={action.busy}
              onClick={() =>
                void action.run(() => api.download('/admin/finance/export', 'event-finances.csv'))
              }
            >
              <Download size={15} />
              Export CSV
            </Button>
            <Button className="primary" onClick={() => setCreating(true)}>
              <Plus size={15} />
              Add transaction
            </Button>
          </>
        }
      />
      <Notice error={resource.error || action.error} />
      {resource.data && (
        <div className="portal-stat-row">
          {[
            { label: 'Total income', value: resource.data.totals.income },
            { label: 'Total expenses', value: resource.data.totals.expenses },
            { label: 'Balance', value: resource.data.totals.balance },
          ].map((stat) => (
            <div key={stat.label} className="portal-stat">
              <span>{stat.label}</span>
              <strong>{money(stat.value)}</strong>
            </div>
          ))}
        </div>
      )}
      {resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <Empty title="Start your event ledger">
          Record income or upload a receipt with an expense.
        </Empty>
      ) : (
        <div className="portal-table-wrap">
          <table>
            <caption className="sr-only">Finance ledger, amounts in INR</caption>
            <thead>
              <tr>
                {['Date', 'Description', 'Type', 'Amount', 'Receipt', 'Status'].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resource.data.items.map((entry) => (
                <tr key={entry.id} className={entry.voidedAt ? 'portal-void-row' : ''}>
                  <td>{entry.occurredOn}</td>
                  <th scope="row">
                    {entry.description}
                    <small>{entry.category}</small>
                  </th>
                  <td>
                    <Badge tone={entry.kind === 'income' ? 'accent' : ''}>
                      {entry.kind === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                  </td>
                  <td className="portal-number">{money(entry.amount)}</td>
                  <td>
                    {entry.receiptName ? (
                      <Button
                        busy={action.busy}
                        onClick={() =>
                          void action.run(() =>
                            api.download(
                              `/admin/finance/${entry.id}/receipt`,
                              entry.receiptName || 'receipt',
                            ),
                          )
                        }
                      >
                        <Paperclip size={14} />
                        Download
                      </Button>
                    ) : (
                      'No receipt'
                    )}
                  </td>
                  <td>
                    {entry.voidedAt ? (
                      <span title={entry.voidReason || ''}>Voided: {entry.voidReason}</span>
                    ) : (
                      <Button onClick={() => setVoiding(entry)}>Void entry</Button>
                    )}
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
