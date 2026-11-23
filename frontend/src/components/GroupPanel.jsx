// frontend/src/components/GroupPanel.jsx
import { useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, Input } from './ui';

export default function GroupPanel({ group, onChange }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (request) => {
    setError('');
    setLoading(true);
    try {
      await request();
      await onChange();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createGroup = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/groups', { name });
      setName('');
    });
  };

  const addMember = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/groups/members', { email });
      setEmail('');
    });
  };

  const removeMember = (id) => run(() => api.delete(`/groups/members/${id}`));

  if (!group) {
    return (
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Create your group</h2>
        <p className="mt-1 text-sm text-slate-500">
          You need a group before you can confirm submissions.
        </p>
        <form onSubmit={createGroup} className="mt-5 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Input
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Alpha"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Create group
          </Button>
        </form>
      </Card>
    );
  }

  const isCreator = group.created_by === user.id;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
        <span className="text-xs font-medium text-slate-500">
          {group.members.length} member{group.members.length !== 1 && 's'}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {group.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {m.name}
                  {m.id === group.created_by && (
                    <span className="ml-2 text-xs font-medium text-indigo-600">Creator</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{m.email}</p>
              </div>
            </div>
            {isCreator && m.id !== user.id && (
              <button
                onClick={() => removeMember(m.id)}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {isCreator && (
        <form onSubmit={addMember} className="mt-5 space-y-3">
          {error && <Alert>{error}</Alert>}
          <Input
            label="Add a member by email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="classmate@college.edu"
            required
          />
          <Button type="submit" variant="secondary" loading={loading} className="w-full">
            Add member
          </Button>
        </form>
      )}
      {!isCreator && error && <div className="mt-4"><Alert>{error}</Alert></div>}
    </Card>
  );
}