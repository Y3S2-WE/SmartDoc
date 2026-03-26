import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { AUTH_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const RECENT_LOGIN_ACCOUNTS_KEY = 'smartdoc_recent_login_accounts';
const MAX_RECENT_ACCOUNTS = 6;

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_LOGIN_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentAccounts(parsed.filter(Boolean));
        }
      }
    } catch {
      // Ignore malformed local storage values.
    }
  }, []);

  const updateRecentAccounts = (email) => {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const next = [normalized, ...recentAccounts.filter((item) => item !== normalized)].slice(0, MAX_RECENT_ACCOUNTS);
    setRecentAccounts(next);
    localStorage.setItem(RECENT_LOGIN_ACCOUNTS_KEY, JSON.stringify(next));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, form);
      onLogin(response.data);
      updateRecentAccounts(form.email);

      if (window.PasswordCredential && navigator.credentials?.store) {
        try {
          const credential = new window.PasswordCredential({
            id: form.email,
            password: form.password,
            name: response.data.user?.fullName || form.email
          });
          await navigator.credentials.store(credential);
        } catch {
          // Browser can reject storage depending on user settings.
        }
      }

      if (response.data.user.role === 'patient') {
        navigate('/dashboard/patient');
      } else if (response.data.user.role === 'doctor') {
        navigate('/dashboard/doctor');
      } else if (response.data.user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        setFeedback(`Logged in as ${response.data.user.role}.`);
      }
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unified Login</CardTitle>
          <CardDescription>One portal for Patient, Doctor, and Admin access.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" autoComplete="on">
            <Field label="Email">
              <Input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                list="recent-login-accounts"
                required
              />
              <datalist id="recent-login-accounts">
                {recentAccounts.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </Field>
            <Field label="Password">
              <Input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="current-password"
                required
              />
            </Field>
            {feedback ? <p className="rounded-lg bg-ember/15 px-3 py-2 text-sm text-ember">{feedback}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink/80">
      {label}
      {children}
    </label>
  );
}

export default LoginPage;
