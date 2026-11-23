// frontend/src/components/AssignmentForm.jsx
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { Alert, Button, Card, Input } from './ui';

const toLocalInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const empty = { title: '', description: '', dueDate: '', onedriveLink: '' };

export default function AssignmentForm({ editing, groups, onSaved, onCancel }) {
  const [form, setForm] = useState(empty);
  const [targetAll, setTargetAll] = useState(true);
  const [groupIds, setGroupIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || '',
        dueDate: toLocalInput(editing.dueDate),
        onedriveLink: editing.onedriveLink,
      });
      setTargetAll(editing.targetsAll);
      setGroupIds(editing.groupIds);
    } else {
      setForm(empty);
      setTargetAll(true);
      setGroupIds([]);
    }
    setError('');
  }, [editing]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleGroup = (id) =>
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!targetAll && groupIds.length === 0) {
      setError('Select at least one group, or choose "All groups".');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        dueDate: new Date(form.dueDate).toISOString(),
        groupIds: targetAll ? [] : groupIds,
      };
      if (editing) {
        await api.put(`/assignments/${editing.id}`, payload);
      } else {
        await api.post('/assignments', payload);
      }
      await onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-900">
        {editing ? 'Edit assignment' : 'New assignment'}
      </h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Title" name="title" value={form.title} onChange={update} required />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
        <Input
          label="Due date"
          name="dueDate"
          type="datetime-local"
          value={form.dueDate}
          onChange={update}
          required
        />
        <Input
          label="OneDrive submission link"
          name="onedriveLink"
          type="url"
          value={form.onedriveLink}
          onChange={update}
          placeholder="https://onedrive.live.com/..."
          required
        />

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Assign to</span>
          <div className="flex gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input type="radio" checked={targetAll} onChange={() => setTargetAll(true)} />
              All groups
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={!targetAll} onChange={() => setTargetAll(false)} />
              Specific groups
            </label>
          </div>
          {!targetAll && (
            <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
              {groups.length === 0 && (
                <p className="text-xs text-slate-500">No groups exist yet.</p>
              )}
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={groupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                  />
                  {g.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={loading} className="flex-1">
            {editing ? 'Save changes' : 'Create assignment'}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}