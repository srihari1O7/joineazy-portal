// frontend/src/pages/AdminDashboard.jsx
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import Navbar from '../components/Navbar';
import AssignmentForm from '../components/AssignmentForm';
import TrackingPanel from '../components/TrackingPanel';
import { Alert, Badge, Button, Card, ProgressBar, Spinner } from '../components/ui';

function Stat({ label, value }) {
  return (
    <Card className="!p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [o, a] = await Promise.all([api.get('/analytics/overview'), api.get('/assignments')]);
      setOverview(o.data);
      setAssignments(a.data.assignments);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async () => {
    setEditing(null);
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this assignment and all its submissions?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const percentFor = (id) => overview?.assignments.find((a) => a.id === id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Professor dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create assignments and track every group's submissions.
        </p>

        {error && (
          <div className="mt-6">
            <Alert>{error}</Alert>
          </div>
        )}

        {!overview ? (
          !error && <Spinner />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Students" value={overview.totals.students} />
              <Stat label="Groups" value={overview.totals.groups} />
              <Stat label="Assignments" value={overview.totals.assignments} />
              <Stat label="Completion" value={`${overview.totals.completionPercent}%`} />
            </div>

            {overview.totals.ungrouped > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                {overview.totals.ungrouped} student(s) have not joined a group yet.
              </p>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-3">
                <Card>
                  <h2 className="text-lg font-bold text-slate-900">Submission completion</h2>
                  <div className="mt-4 space-y-4">
                    {overview.assignments.length === 0 && (
                      <p className="text-sm text-slate-500">No assignments yet.</p>
                    )}
                    {overview.assignments.map((a) => (
                      <div key={a.id}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{a.title}</span>
                          <span className="text-slate-500">
                            {a.submittedGroups}/{a.targetGroups} groups
                          </span>
                        </div>
                        <ProgressBar percent={a.percent} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-bold text-slate-900">Group performance</h2>
                  <div className="mt-4 space-y-4">
                    {overview.groups.length === 0 && (
                      <p className="text-sm text-slate-500">No groups yet.</p>
                    )}
                    {overview.groups.map((g) => (
                      <div key={g.id}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {g.name}{' '}
                            <span className="text-xs text-slate-400">({g.memberCount} members)</span>
                          </span>
                          <span className="text-slate-500">
                            {g.submitted}/{g.assigned} submitted
                          </span>
                        </div>
                        <ProgressBar percent={g.percent} />
                      </div>
                    ))}
                  </div>
                </Card>

                <div>
                  <h2 className="mb-3 text-lg font-bold text-slate-900">Assignments</h2>
                  <div className="space-y-3">
                    {assignments.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-2xl border bg-white p-4 shadow-sm ${
                          selectedId === a.id ? 'border-indigo-400' : 'border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{a.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Due {new Date(a.dueDate).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <Badge tone={a.targetsAll ? 'indigo' : 'slate'}>
                            {a.targetsAll ? 'All groups' : `${a.groupIds.length} group(s)`}
                          </Badge>
                        </div>
                        {percentFor(a.id) && (
                          <p className="mt-2 text-xs text-slate-500">
                            {percentFor(a.id).percent}% confirmed
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button variant="secondary" onClick={() => setSelectedId(a.id)}>
                            Track
                          </Button>
                          <Button variant="secondary" onClick={() => setEditing(a)}>
                            Edit
                          </Button>
                          <Button variant="danger" onClick={() => remove(a.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-2">
                <AssignmentForm
                  editing={editing}
                  groups={overview.groups}
                  onSaved={handleSaved}
                  onCancel={() => setEditing(null)}
                />
                {selectedId && <TrackingPanel assignmentId={selectedId} refreshKey={refreshKey} />}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}