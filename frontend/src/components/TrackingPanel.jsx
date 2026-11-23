// frontend/src/components/TrackingPanel.jsx
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { Alert, Badge, Card, ProgressBar, Spinner } from './ui';

export default function TrackingPanel({ assignmentId, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api
      .get(`/analytics/assignments/${assignmentId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [assignmentId, refreshKey]);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;

  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-900">{data.assignment.title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {data.summary.submittedGroups} of {data.summary.totalGroups} groups confirmed
      </p>
      <ProgressBar percent={data.summary.percent} className="mt-3" />

      <div className="mt-5 space-y-4">
        {data.groups.length === 0 && (
          <p className="text-sm text-slate-500">No groups are assigned to this yet.</p>
        )}
        {data.groups.map((g) => (
          <div key={g.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800">{g.name}</p>
              <Badge tone={g.submitted ? 'green' : 'amber'}>
                {g.submitted ? 'Submitted' : 'Pending'}
              </Badge>
            </div>
            {g.submitted && (
              <p className="mt-1 text-xs text-slate-500">
                Confirmed by {g.confirmedBy} on {new Date(g.confirmedAt).toLocaleString('en-IN')}
              </p>
            )}
            <ul className="mt-3 space-y-1.5">
              {g.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {m.name} <span className="text-xs text-slate-400">{m.email}</span>
                  </span>
                  <span className={m.submitted ? 'text-emerald-600' : 'text-slate-400'}>
                    {m.confirmedIt ? 'Confirmed it' : m.submitted ? 'Done' : 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}