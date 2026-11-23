// frontend/src/pages/AuthPage.jsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Alert, Button, Input } from '../components/ui';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [isProfessor, setIsProfessor] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        const payload = { name: form.name, email: form.email, password: form.password };
        if (isProfessor) payload.adminCode = form.adminCode;
        await register(payload);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-indigo-600">
            J
          </span>
          <span className="text-xl font-bold tracking-tight">Joineazy Portal</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Group assignments,
            <br />
            without the chaos.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Form your group, track every assignment, and confirm submissions in two clicks.
            Professors see real-time progress across all groups.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-center">
            {[
              ['Groups', 'Form your team'],
              ['Confirm', 'Two-step check'],
              ['Track', 'Live progress'],
            ].map(([title, sub]) => (
              <div key={title} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-xs text-indigo-100">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-indigo-200">Student, group & assignment management</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Log in to manage your assignments.'
              : 'Register as a student, or as a professor with an access code.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert>{error}</Alert>}

            {mode === 'register' && (
              <Input
                label="Full name"
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Your name"
                required
              />
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              placeholder="you@college.edu"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              placeholder="At least 6 characters"
              required
            />

            {mode === 'register' && (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isProfessor}
                    onChange={(e) => setIsProfessor(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  I am a professor
                </label>
                {isProfessor && (
                  <Input
                    label="Professor access code"
                    name="adminCode"
                    type="password"
                    value={form.adminCode}
                    onChange={update}
                    placeholder="Provided by your institution"
                    required
                  />
                )}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={switchMode} className="font-semibold text-indigo-600 hover:underline">
              {mode === 'login' ? 'Register' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}