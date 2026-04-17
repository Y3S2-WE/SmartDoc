import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BadgeCheck, BadgeX, BarChart3, Brain, ChevronDown, ChevronUp,
  DollarSign, FileText, Loader2, RefreshCw, Search, ShieldCheck,
  Stethoscope, Trash2, Upload, UserCog, UsersRound, X,
  CheckCircle2, XCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';

import { AUTH_API_URL, AI_API_URL } from '../lib/api';

// ─── Tab Enum ────────────────────────────────────────────────────────────────
const TABS = { DOCTORS: 'doctors', DOCUMENTS: 'documents', FINANCIAL: 'financial' };

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminDashboard({ session }) {
  const [activeTab, setActiveTab] = useState(TABS.DOCTORS);
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [financialTransactions, setFinancialTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedDoctorIds, setExpandedDoctorIds] = useState({});
  const [feedback, setFeedback] = useState({ msg: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const setMsg = (msg, type = 'success') => setFeedback({ msg, type });
  const clearMsg = () => setFeedback({ msg: '', type: 'info' });

  const loadAdminData = async () => {
    setLoading(true);
    clearMsg();
    try {
      const [usersRes, overviewRes, financialRes] = await Promise.all([
        axios.get(`${AUTH_API_URL}/admin/users`, { headers: authHeader }),
        axios.get(`${AUTH_API_URL}/admin/overview`, { headers: authHeader }),
        axios.get(`${AUTH_API_URL}/admin/financial-transactions`, { headers: authHeader }),
      ]);
      setUsers(usersRes.data.users || []);
      setOverview(overviewRes.data.overview || null);
      const fin = financialRes.data || null;
      setFinancialData(fin);
      const txns = fin?.transactions || fin?.items || [];
      setFinancialTransactions(Array.isArray(txns) ? txns : []);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to load admin dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const updateDoctorVerification = async (doctorId, approved) => {
    setActionLoadingKey(`verify-${doctorId}`);
    clearMsg();
    try {
      const res = await axios.patch(`${AUTH_API_URL}/admin/doctors/${doctorId}/verify`, { approved }, { headers: authHeader });
      setMsg(res.data.message || (approved ? 'Doctor approved.' : 'Doctor rejected.'));
      await loadAdminData();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Verification action failed.', 'error');
    } finally { setActionLoadingKey(''); }
  };

  const updateUserStatus = async (userId, isActive) => {
    setActionLoadingKey(`status-${userId}`);
    clearMsg();
    try {
      const res = await axios.patch(`${AUTH_API_URL}/admin/users/${userId}/status`, { isActive }, { headers: authHeader });
      setMsg(res.data.message || 'User status updated.');
      await loadAdminData();
    } catch (error) {
      setMsg(error.response?.data?.message || 'User status update failed.', 'error');
    } finally { setActionLoadingKey(''); }
  };

  const updateUserRole = async (userId, role) => {
    setActionLoadingKey(`role-${userId}`);
    clearMsg();
    try {
      const res = await axios.patch(`${AUTH_API_URL}/admin/users/${userId}/role`, { role }, { headers: authHeader });
      setMsg(res.data.message || 'User role updated.');
      await loadAdminData();
    } catch (error) {
      setMsg(error.response?.data?.message || 'User role update failed.', 'error');
    } finally { setActionLoadingKey(''); }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete account for ${user.fullName || user.email}? This cannot be undone.`)) return;
    setActionLoadingKey(`delete-${user._id}`);
    clearMsg();
    try {
      const res = await axios.delete(`${AUTH_API_URL}/admin/users/${user._id}`, { headers: authHeader });
      setMsg(res.data.message || 'User removed.');
      await loadAdminData();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to remove user account.', 'error');
    } finally { setActionLoadingKey(''); }
  };

  const toggleExpand = (doctorId) =>
    setExpandedDoctorIds((prev) => ({ ...prev, [doctorId]: !prev[doctorId] }));

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        (user.fullName || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        (user.phoneNumber || '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const doctors = useMemo(() => users.filter((u) => u.role === 'doctor'), [users]);
  const roles = ['patient', 'doctor', 'admin'];

  const STAT_CARDS = overview ? [
    { label: 'Total Users', value: overview.users?.total ?? 0, icon: UsersRound, color: '#0052FF', bg: 'rgba(0,82,255,0.08)', border: 'rgba(0,82,255,0.15)' },
    { label: 'Active Users', value: overview.users?.active ?? 0, icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.15)' },
    { label: 'Patients', value: overview.users?.byRole?.patient ?? 0, icon: Activity, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.15)' },
    { label: 'Doctors', value: overview.users?.byRole?.doctor ?? 0, icon: Stethoscope, color: '#0F766E', bg: 'rgba(15,118,110,0.08)', border: 'rgba(15,118,110,0.15)' },
    { label: 'Pending Approval', value: overview.doctorVerification?.pending ?? 0, icon: Loader2, color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.15)' },
    { label: 'Approved Doctors', value: overview.doctorVerification?.approved ?? 0, icon: BadgeCheck, color: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.15)' },
    { label: 'Rejected Doctors', value: overview.doctorVerification?.rejected ?? 0, icon: BadgeX, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.15)' },
    { label: 'Admins', value: overview.users?.byRole?.admin ?? 0, icon: ShieldCheck, color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)' },
    { label: 'Inactive Users', value: overview.users?.inactive ?? 0, icon: TrendingUp, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
  ] : [];

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)' }}
    >
      {/* BG */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,82,255,0.05), transparent 70%)', top: -150, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,122,122,0.06), transparent 70%)', bottom: '10%', left: -100 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(15,42,68,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-8" style={{ zIndex: 1 }}>

        {/* ── Hero header ── */}
        <div
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 55%, #1F7A7A 100%)',
            boxShadow: '0 20px 60px rgba(15,42,68,0.25)',
            animation: 'fadeInUp 0.5s ease both',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 50%, rgba(77,124,255,0.20) 0%, transparent 55%)' }} />
          <div className="relative flex flex-col gap-4 px-8 py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                <ShieldCheck size={11} className="text-emerald-400" />
                Admin Control Panel
              </div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Platform Operations
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Manage users, doctors, AI documents, and financial transactions
              </p>
            </div>
            <button
              type="button"
              onClick={loadAdminData}
              disabled={loading || !!actionLoadingKey}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/12 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing…' : 'Refresh Dashboard'}
            </button>
          </div>
        </div>

        {/* Feedback toast */}
        {feedback.msg && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-xl ${feedback.type === 'error'
                ? 'border-rose-200/60 bg-rose-50/90 text-rose-800'
                : 'border-emerald-200/60 bg-emerald-50/90 text-emerald-800'
              }`}
            style={{ animation: 'slideUpPop 0.25s ease' }}
          >
            {feedback.type === 'error'
              ? <XCircle size={15} className="flex-shrink-0 text-rose-500" />
              : <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-500" />}
            <span className="flex-1">{feedback.msg}</span>
            <button type="button" onClick={clearMsg} className="opacity-50 hover:opacity-100"><X size={13} /></button>
          </div>
        )}

        {/* ── Stats Grid ── */}
        {STAT_CARDS.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ animation: 'fadeInUp 0.4s ease both 0.1s' }}>
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: card.bg, borderColor: card.border, backdropFilter: 'blur(12px)' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color, opacity: 0.7 }}>
                    {card.label}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: card.bg, border: `1.5px solid ${card.border}` }}>
                    <card.icon size={13} style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-2xl font-black" style={{ color: card.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                  {card.value}
                </p>
              </div>
            ))}
            {!overview && (
              <div className="col-span-full flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                {loading ? <><Loader2 size={14} className="animate-spin" />Loading overview…</> : 'Overview unavailable.'}
              </div>
            )}
          </div>
        )}

        {/* ── User Account Management ── */}
        <div
          className="mb-6 overflow-hidden rounded-3xl border border-white/60 shadow-lg backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 8px 40px rgba(15,42,68,0.08)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #0F2A44, #0052FF, #1F7A7A)' }} />
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="flex items-center gap-2 text-base font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <UserCog size={16} className="text-blue-500" />
              User Account Management
            </p>
          </div>
          <div className="p-5">
            {/* Filters */}
            <div className="mb-4 grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_auto]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search by name, email, or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={adminSelectClass}>
                <option value="all">All Roles</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminSelectClass}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-slate-300"
              >
                Clear
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <div className="min-w-[1060px]">
                {/* Header */}
                <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1.2fr_260px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <p>Name</p><p>Email</p><p>Phone</p><p>Status</p><p>Role</p><p>Actions</p>
                </div>
                {loading && filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" />Loading users…
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No users match your filters.</p>
                ) : (
                  filteredUsers.map((user) => {
                    const isBusy = !!actionLoadingKey;
                    return (
                      <div key={user._id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1.2fr_260px] gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50/50 transition">
                        <p className="font-semibold text-slate-700 truncate">{user.fullName}</p>
                        <p className="truncate text-slate-500">{user.email}</p>
                        <p className="text-slate-500">{user.phoneNumber || '—'}</p>
                        <StatusPill status={user.isActive ? 'active' : 'inactive'} />
                        <select
                          value={user.role}
                          disabled={isBusy}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                        >
                          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateUserStatus(user._id, !user.isActive)}
                            disabled={isBusy}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${user.isActive ? 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUser(user)}
                            disabled={isBusy || user._id === session.user.id}
                            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
                          >
                            <Trash2 size={11} />Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!loading && <p className="mt-2 text-right text-[11px] text-slate-400">{filteredUsers.length} of {users.length} users shown</p>}
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: TABS.DOCTORS, label: 'Doctor Approvals', icon: Stethoscope, color: '#0F766E' },
            { id: TABS.DOCUMENTS, label: 'AI Health Documents', icon: Brain, color: '#6366F1' },
            { id: TABS.FINANCIAL, label: 'Financial', icon: DollarSign, color: '#D97706' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id ? 'text-white shadow-lg' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              style={activeTab === tab.id ? {
                background: tab.id === TABS.DOCTORS ? 'linear-gradient(135deg, #0F766E, #14B8A6)'
                  : tab.id === TABS.DOCUMENTS ? 'linear-gradient(135deg, #4F46E5, #6366F1)'
                    : 'linear-gradient(135deg, #D97706, #F59E0B)',
                boxShadow: `0 4px 16px ${tab.color}30`,
              } : {}}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Doctor Approvals Tab ── */}
        {activeTab === TABS.DOCTORS && (
          <AdminCard title="Doctor Approval Dashboard" icon={<ShieldCheck size={15} className="text-teal-500" />} topBarColor="linear-gradient(90deg, #0F766E, #14B8A6)">
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <p>Doctor Name</p><p>Email</p><p>Phone</p><p>Status</p><p>Action</p><p>Details</p>
                </div>
                {loading && doctors.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" />Loading doctors…
                  </div>
                ) : doctors.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No doctors registered yet.</p>
                ) : (
                  doctors.map((doctor) => {
                    const profile = doctor.doctorProfile || {};
                    const status = profile.verificationStatus || (profile.isVerified ? 'approved' : 'pending');
                    const isExpanded = !!expandedDoctorIds[doctor._id];
                    const isBusy = !!actionLoadingKey;
                    return (
                      <div key={doctor._id} className="border-b border-slate-100 last:border-b-0">
                        <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 px-4 py-3 text-sm hover:bg-slate-50/50 transition">
                          <p className="font-semibold text-slate-700 truncate">{doctor.fullName}</p>
                          <p className="truncate text-slate-500">{doctor.email}</p>
                          <p className="text-slate-500">{doctor.phoneNumber || '—'}</p>
                          <StatusPill status={status} />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateDoctorVerification(doctor._id, true)}
                              disabled={loading || isBusy || status === 'approved'}
                              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
                            >
                              <BadgeCheck size={11} />Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDoctorVerification(doctor._id, false)}
                              disabled={loading || isBusy || status === 'rejected'}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-40"
                            >
                              <BadgeX size={11} />Reject
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpand(doctor._id)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-slate-300"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="grid gap-3 bg-slate-50 px-4 pb-4 pt-2 md:grid-cols-2" style={{ animation: 'slideUpPop 0.2s ease' }}>
                            <PhotoDetail label="Profile Photo" value={profile.profilePhoto} doctorName={doctor.fullName} />
                            {[
                              ['Medical License', profile.medicalLicenseNumber],
                              ['Specialization', profile.specialization],
                              ['Experience', profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : null],
                              ['Qualifications', Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : profile.qualifications],
                              ['Hospital / Clinic', profile.hospitalOrClinicName],
                              ['Consultation Fee', profile.consultationFee != null ? `LKR ${profile.consultationFee}` : null],
                              ['Clinic Address', profile.clinicAddress],
                              ['City', profile.city],
                              ['District', profile.district],
                            ].map(([label, value]) => (
                              <Detail key={label} label={label} value={value || 'Not provided'} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Stethoscope size={11} />Approving a doctor updates their verification status immediately.
            </p>
          </AdminCard>
        )}

        {/* ── AI Health Documents Tab ── */}
        {activeTab === TABS.DOCUMENTS && <HealthDocumentsTab session={session} />}

        {/* ── Financial Tab ── */}
        {activeTab === TABS.FINANCIAL && (
          <AdminCard title="Financial Transactions" icon={<DollarSign size={15} className="text-amber-500" />} topBarColor="linear-gradient(90deg, #D97706, #F59E0B)">
            {!financialData ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Loading…</span> : 'No financial data available.'}
              </p>
            ) : financialData.available === false ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle size={16} className="flex-shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">{financialData.message || 'Financial transaction endpoint is not available.'}</p>
                  {financialData.source && <p className="mt-0.5 text-xs text-amber-600">Source: {financialData.source}</p>}
                </div>
              </div>
            ) : financialTransactions.length === 0 ? (
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-400">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <p>Order ID</p><p>Capture ID</p><p>Status</p><p>Amount</p><p>Updated</p>
                  </div>
                  {financialTransactions.slice(0, 30).map((txn, i) => (
                    <div key={txn.id || txn.orderId || i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50/50 transition">
                      <p className="truncate text-slate-600">{txn.orderId || txn.id || '—'}</p>
                      <p className="truncate text-slate-600">{txn.captureId || '—'}</p>
                      <StatusPill status={txn.status || 'unknown'} />
                      <p className="font-semibold text-slate-700">{txn.amount || txn.total || '—'}</p>
                      <p className="text-slate-400">{formatDateTime(txn.updatedAt || txn.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AdminCard>
        )}
      </div>
    </div>
  );
}

// ─── Health Documents Tab ─────────────────────────────────────────────────────
function HealthDocumentsTab({ session }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${AI_API_URL}/documents`, { headers: authHeader });
      setDocuments(res.data.documents || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to load documents.' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleUpload = async () => {
    if (!selectedFile) { setFeedback({ type: 'error', message: 'Please choose a PDF or DOCX file.' }); return; }
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) { setFeedback({ type: 'error', message: 'Only PDF and DOCX files are supported.' }); return; }
    const formData = new FormData();
    formData.append('document', selectedFile);
    setUploading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await axios.post(`${AI_API_URL}/documents`, formData, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: `${res.data.originalName} uploaded. Embedding in progress — status will update to "ready" shortly.` });
      setSelectedFile(null);
      setTimeout(loadDocuments, 5000);
      setTimeout(loadDocuments, 15000);
      setTimeout(loadDocuments, 30000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Upload failed.' });
    } finally { setUploading(false); }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}" and all its embeddings?`)) return;
    try {
      await axios.delete(`${AI_API_URL}/documents/${docId}`, { headers: authHeader });
      setFeedback({ type: 'success', message: `"${docName}" deleted.` });
      await loadDocuments();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  return (
    <div className="space-y-5">
      {feedback.message && (
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          style={{ animation: 'slideUpPop 0.25s ease' }}>
          {feedback.type === 'error' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          {feedback.message}
        </div>
      )}

      <AdminCard title="Upload Health Guidance Document" icon={<Brain size={15} className="text-violet-500" />} topBarColor="linear-gradient(90deg, #4F46E5, #6366F1)">
        <p className="mb-5 text-sm text-slate-500">
          Upload PDF or DOCX health guidance documents. They will be automatically parsed, chunked, and embedded into MongoDB Atlas Vector Search to power the AI Symptom Checker.
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-10 transition-all hover:border-violet-300 hover:bg-violet-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Upload size={24} style={{ color: '#6366F1' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-violet-700">
              {selectedFile ? selectedFile.name : 'Click to choose a document'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Supports PDF and DOCX — Max 30 MB</p>
          </div>
          <input type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" />Uploading & Embedding…</> : <><Upload size={14} />Upload Document</>}
          </button>
          {selectedFile && (
            <button type="button" onClick={() => setSelectedFile(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-300">
              Clear
            </button>
          )}
        </div>

        {uploading && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-700">
            <p className="font-bold">⏳ Embedding in progress…</p>
            <p className="mt-1">The document is being parsed, chunked, and embedded via HuggingFace. This takes 15–60 seconds. Status will update to <strong>ready</strong> automatically.</p>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Uploaded Documents"
        icon={<FileText size={15} className="text-violet-500" />}
        topBarColor="linear-gradient(90deg, #4F46E5, #6366F1)"
        action={
          <button type="button" onClick={loadDocuments} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
        }
      >
        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <Brain size={32} className="text-slate-200" />
            <p className="text-sm text-slate-400">{loading ? 'Loading documents…' : 'No documents uploaded yet.'}</p>
            <p className="text-xs text-slate-300">Upload health guidance PDFs above to power the AI Symptom Checker.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1fr_80px_80px_90px_80px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <p>Document Name</p><p>Type</p><p>Chunks</p><p>Status</p><p>Actions</p>
              </div>
              {documents.map((doc) => (
                <div key={doc._id} className="grid grid-cols-[1fr_80px_80px_90px_80px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50 transition">
                  <div>
                    <p className="break-all font-semibold text-slate-700">{doc.originalName}</p>
                    <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-lg border border-violet-100 bg-violet-50 px-2 py-1 text-center text-[10px] font-bold uppercase text-violet-700">{doc.fileType}</span>
                  <p className="text-center text-sm font-bold text-slate-600">{doc.chunkCount || 0}</p>
                  <DocStatusPill status={doc.status} />
                  <button
                    type="button"
                    onClick={() => handleDelete(doc._id, doc.originalName)}
                    className="flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Documents with status <strong className="text-slate-600">ready</strong> are actively used by the AI Symptom Checker via MongoDB Atlas Vector Search.
        </p>
      </AdminCard>

      {/* Atlas setup guide */}

    </div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────
function AdminCard({ title, icon, topBarColor, action, children }) {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/60 shadow-lg backdrop-blur-xl"
      style={{ background: 'rgba(255,255,255,0.87)', boxShadow: '0 8px 40px rgba(15,42,68,0.08)', animation: 'fadeInUp 0.4s ease both' }}
    >
      <div style={{ height: 3, background: topBarColor }} />
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-base font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {icon}
            {title}
          </p>
          {action}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DocStatusPill({ status }) {
  const styles = {
    ready: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
    processing: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
    failed: { bg: '#FFF1F2', border: '#FECDD3', color: '#9F1239' },
  };
  const s = styles[status] || styles.processing;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      {status === 'processing' && <Loader2 size={9} className="animate-spin" />}
      {status}
    </span>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const styles = {
    approved: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
    active: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
    rejected: { bg: '#FFF1F2', border: '#FECDD3', color: '#9F1239' },
    inactive: { bg: '#F8FAFC', border: '#E2E8F0', color: '#64748B' },
    pending: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
    unknown: { bg: '#F8FAFC', border: '#E2E8F0', color: '#94A3B8' },
  };
  const s = styles[normalized] || styles.unknown;
  return (
    <span className="inline-flex w-fit items-center rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      {normalized}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-700">{String(value)}</p>
    </div>
  );
}

function PhotoDetail({ label, value, doctorName }) {
  const [failed, setFailed] = useState(false);
  const src = normalizePhotoSrc(value);
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {!src || failed ? (
        <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-xs">No photo</div>
      ) : (
        <img src={src} alt={`${doctorName || 'Doctor'} profile`} className="mt-2 h-20 w-20 rounded-xl object-cover ring-2 ring-slate-200" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function normalizePhotoSrc(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('data:image') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.length > 100) return `data:image/jpeg;base64,${raw}`;
  return '';
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

const adminSelectClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

export default AdminDashboard;
