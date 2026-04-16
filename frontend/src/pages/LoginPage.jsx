import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Brain, Eye, EyeOff, HeartPulse, Lock, Mail, ShieldPlus, Sparkles } from 'lucide-react';

import { AUTH_API_URL } from '../lib/api';

const RECENT_LOGIN_ACCOUNTS_KEY = 'smartdoc_recent_login_accounts';
const MAX_RECENT_ACCOUNTS = 6;

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_LOGIN_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentAccounts(parsed.filter(Boolean));
      }
    } catch { /* ignore */ }
  }, []);

  const updateRecentAccounts = (email) => {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;
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
            name: response.data.user?.fullName || form.email,
          });
          await navigator.credentials.store(credential);
        } catch { /* browser may reject */ }
      }

      const role = response.data.user.role;
      if (role === 'patient') navigate('/dashboard/patient');
      else if (role === 'doctor') navigate('/dashboard/doctor');
      else if (role === 'admin') navigate('/dashboard/admin');
      else setFeedback(`Logged in as ${role}.`);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,82,255,0.06) 0%, transparent 70%)', top: -150, right: -150 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,122,122,0.07) 0%, transparent 70%)', bottom: -100, left: -100 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(15,42,68,0.025) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative w-full max-w-md" style={{ animation: 'fadeInUp 0.5s ease both' }}>
        {/* Icon */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 60%, #1F7A7A 100%)',
              boxShadow: '0 0 0 6px rgba(0,82,255,0.12), 0 12px 36px rgba(15,42,68,0.30)',
              animation: 'orbPulse 3s ease-in-out infinite',
            }}
          >
            <ShieldPlus size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              Welcome back
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              One portal for Patient, Doctor &amp; Admin
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="overflow-hidden rounded-3xl border border-white/60 shadow-2xl backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 20px 70px rgba(15,42,68,0.12)' }}
        >
          {/* Top gradient bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0F2A44, #0052FF, #1F7A7A)' }} />

          <div className="px-8 py-8">
            {/* Trust row */}
            <div className="mb-6 flex items-center justify-center gap-4">
              {[
                { icon: <HeartPulse size={11} />, label: 'HIPAA Ready' },
                { icon: <Brain size={11} />, label: 'AI Powered' },
                { icon: <Sparkles size={11} />, label: 'Secure Login' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <span className="text-blue-400">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4" autoComplete="on">
              {/* Email */}
              <PremiumField label="Email Address" icon={<Mail size={14} />}>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  list="recent-login-accounts"
                  placeholder="name@email.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pl-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                />
                <datalist id="recent-login-accounts">
                  {recentAccounts.map((email) => <option key={email} value={email} />)}
                </datalist>
              </PremiumField>

              {/* Password */}
              <PremiumField label="Password" icon={<Lock size={14} />}>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </PremiumField>

              {/* Error */}
              {feedback && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  style={{ animation: 'slideUpPop 0.25s ease' }}>
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {feedback}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #0F2A44 0%, #0052FF 55%, #4D7CFF 100%)',
                  boxShadow: '0 8px 28px rgba(0,82,255,0.35)',
                }}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <ShieldPlus size={15} />
                    Sign In to SmartDoc
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400">New to SmartDoc?</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Register links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register/patient"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              >
                <HeartPulse size={13} />
                Patient Sign Up
              </Link>
              <Link
                to="/register/doctor"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 py-2.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
              >
                <Brain size={13} />
                Doctor Sign Up
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function PremiumField({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-blue-400">{icon}</span>
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

export default LoginPage;
