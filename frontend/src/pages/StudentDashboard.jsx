// frontend/src/pages/StudentDashboard.jsx
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import GroupPanel from '../components/GroupPanel';
import AssignmentCard from '../components/AssignmentCard';
import { Alert, Card, ProgressBar, Spinner } from '../components/ui';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, a] = await Promise.all([api.get('/groups/me'), api.get('/assignments/mine')]);
      setGroup(g.data.group);
      setData(a.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hello, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is where your group stands on its assignments.
        </p>

        {error && (
          <div className="mt-6">
            <Alert>{error}</Alert>
          </div>
        )}

        {!data ? (
          !error && <Spinner />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Group progress</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {data.progress.percent}%
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {data.progress.submitted} of {data.progress.total} submitted
                  </p>
                </div>
                <ProgressBar percent={data.progress.percent} className="mt-4" />
              </Card>

              <div>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Assignments</h2>
                {data.assignments.length === 0 ? (
                  <Card>
                    <p className="text-sm text-slate-500">No assignments have been posted yet.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {data.assignments.map((a) => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        canConfirm={data.hasGroup}
                        onConfirmed={load}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <GroupPanel group={group} onChange={load} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}