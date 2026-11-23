// frontend/src/components/AssignmentCard.jsx
import { useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { Alert, Badge, Button } from './ui';

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AssignmentCard({ assignment, canConfirm, onConfirmed }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/assignments/${assignment.id}/confirm`);
      await onConfirmed();
    } catch (err) {
      setError(getErrorMessage(err));
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const badge = assignment.submitted ? (
    <Badge tone="green">Submitted</Badge>
  ) : assignment.overdue ? (
    <Badge tone="red">Overdue</Badge>
  ) : (
    <Badge tone="amber">Pending</Badge>
  );

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{assignment.title}</h3>
        {badge}
      </div>

      {assignment.description && (
        <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
      )}

      <p className="mt-3 text-xs font-medium text-slate-500">
        Due {formatDate(assignment.dueDate)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={assignment.onedriveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          Open OneDrive link
        </a>

        {!assignment.submitted && step === 1 && (
          <Button variant="success" disabled={!canConfirm} onClick={() => setStep(2)}>
            Yes, I have submitted
          </Button>
        )}
      </div>

      {!canConfirm && !assignment.submitted && (
        <p className="mt-3 text-xs text-slate-500">Create or join a group to confirm submissions.</p>
      )}

      {step === 2 && !assignment.submitted && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Are you sure?</p>
          <p className="mt-1 text-xs text-amber-800">
            This confirms the submission for your whole group and cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="success" loading={loading} onClick={confirm}>
              Confirm submission
            </Button>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {assignment.submitted && (
        <p className="mt-4 text-xs text-emerald-700">
          Confirmed by {assignment.confirmedBy} on {formatDate(assignment.confirmedAt)}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}