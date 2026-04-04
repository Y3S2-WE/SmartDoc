import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BadgeCheck,
  BadgeX,
  BarChart3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCog,
  UsersRound
} from 'lucide-react';

import { AUTH_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

function AdminDashboard({ session }) {
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [financialTransactions, setFinancialTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedDoctorIds, setExpandedDoctorIds] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const loadAdminData = async () => {
    setLoading(true);
    setFeedback('');

    try {
      const [usersResponse, overviewResponse, financialResponse] = await Promise.all([
        axios.get(`${AUTH_API_URL}/admin/users`, { headers: authHeader }),
        axios.get(`${AUTH_API_URL}/admin/overview`, { headers: authHeader }),
        axios.get(`${AUTH_API_URL}/admin/financial-transactions`, { headers: authHeader })
      ]);

      const loadedUsers = usersResponse.data.users || [];
      const loadedOverview = overviewResponse.data.overview || null;
      const loadedFinancial = financialResponse.data || null;
      const loadedTransactions = loadedFinancial?.transactions || loadedFinancial?.items || [];

      setUsers(loadedUsers);
      setOverview(loadedOverview);
      setFinancialData(loadedFinancial);
      setFinancialTransactions(Array.isArray(loadedTransactions) ? loadedTransactions : []);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDoctorVerification = async (doctorId, approved) => {
    setActionLoadingKey(`verify-${doctorId}`);
    setFeedback('');

    try {
      const response = await axios.patch(
        `${AUTH_API_URL}/admin/doctors/${doctorId}/verify`,
        { approved },
        { headers: authHeader }
      );

      setFeedback(response.data.message || (approved ? 'Doctor approved.' : 'Doctor rejected.'));
      await loadAdminData();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Verification action failed.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    setActionLoadingKey(`status-${userId}`);
    setFeedback('');

    try {
      const response = await axios.patch(
        `${AUTH_API_URL}/admin/users/${userId}/status`,
        { isActive },
        { headers: authHeader }
      );

      setFeedback(response.data.message || 'User status updated.');
      await loadAdminData();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'User status update failed.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const updateUserRole = async (userId, role) => {
    setActionLoadingKey(`role-${userId}`);
    setFeedback('');

    try {
      const response = await axios.patch(
        `${AUTH_API_URL}/admin/users/${userId}/role`,
        { role },
        { headers: authHeader }
      );

      setFeedback(response.data.message || 'User role updated.');
      await loadAdminData();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'User role update failed.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const removeUser = async (user) => {
    const shouldDelete = window.confirm(`Delete account for ${user.fullName || user.email}? This action cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    setActionLoadingKey(`delete-${user._id}`);
    setFeedback('');

    try {
      const response = await axios.delete(`${AUTH_API_URL}/admin/users/${user._id}`, { headers: authHeader });

      setFeedback(response.data.message || 'User removed.');
      await loadAdminData();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to remove user account.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const toggleExpand = (doctorId) => {
    setExpandedDoctorIds((prev) => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search.trim() ||
        (user.fullName || '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (user.email || '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (user.phoneNumber || '').toLowerCase().includes(search.trim().toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const doctors = useMemo(() => users.filter((user) => user.role === 'doctor'), [users]);

  const roles = ['patient', 'doctor', 'admin'];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {feedback ? (
        <p className="mb-4 rounded-xl border border-white/30 bg-white/55 px-4 py-3 text-sm font-medium text-lake backdrop-blur">
          {feedback}
        </p>
      ) : null}

      <Card className="mb-5 bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <BarChart3 size={18} /> Platform Operations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview ? (
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard label="Total Users" value={overview.users?.total ?? 0} icon={<UsersRound size={15} />} />
              <StatCard label="Active Users" value={overview.users?.active ?? 0} icon={<BadgeCheck size={15} />} />
              <StatCard label="Inactive Users" value={overview.users?.inactive ?? 0} icon={<BadgeX size={15} />} />
              <StatCard label="Patients" value={overview.users?.byRole?.patient ?? 0} icon={<UserCog size={15} />} />
              <StatCard label="Doctors" value={overview.users?.byRole?.doctor ?? 0} icon={<Stethoscope size={15} />} />
              <StatCard label="Admins" value={overview.users?.byRole?.admin ?? 0} icon={<ShieldCheck size={15} />} />
              <StatCard label="Doctor Pending" value={overview.doctorVerification?.pending ?? 0} icon={<ChevronDown size={15} />} />
              <StatCard label="Doctor Approved" value={overview.doctorVerification?.approved ?? 0} icon={<BadgeCheck size={15} />} />
              <StatCard label="Doctor Rejected" value={overview.doctorVerification?.rejected ?? 0} icon={<BadgeX size={15} />} />
            </div>
          ) : (
            <p className="text-sm text-ink/65">{loading ? 'Loading overview...' : 'Overview data unavailable.'}</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={loadAdminData} disabled={loading || !!actionLoadingKey}>
              <RefreshCw size={14} /> Refresh Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5 bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <UserCog size={18} /> User Account Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_120px]">
            <Input
              placeholder="Search by name, email, or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-lake/15 bg-white/70">
            <div className="min-w-[1060px]">
              <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1.2fr_260px] gap-2 border-b border-lake/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/65">
                <p>Name</p>
                <p>Email</p>
                <p>Phone</p>
                <p>Status</p>
                <p>Role</p>
                <p>Actions</p>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="px-3 py-4 text-sm text-ink/65">{loading ? 'Loading users...' : 'No users found for selected filters.'}</p>
              ) : (
                filteredUsers.map((user) => {
                  const isBusy = !!actionLoadingKey;
                  return (
                    <div key={user._id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1.2fr_260px] gap-2 border-b border-lake/10 px-3 py-3 text-sm last:border-b-0">
                      <p className="font-semibold text-lake">{user.fullName}</p>
                      <p className="truncate text-ink/80">{user.email}</p>
                      <p className="text-ink/80">{user.phoneNumber || '-'}</p>
                      <StatusPill status={user.isActive ? 'active' : 'inactive'} />
                      <select
                        value={user.role}
                        disabled={isBusy}
                        onChange={(event) => updateUserRole(user._id, event.target.value)}
                        className="h-9 rounded-lg border border-lake/20 bg-white px-2 text-xs font-semibold text-lake outline-none transition focus:border-lake"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={user.isActive ? 'outline' : 'default'}
                          onClick={() => updateUserStatus(user._id, !user.isActive)}
                          disabled={isBusy}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeUser(user)}
                          disabled={isBusy || user._id === session.user.id}
                        >
                          <Trash2 size={13} /> Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <ShieldCheck size={18} /> Admin Doctor Approval Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white/70">
            <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 border-b border-lake/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/65">
              <p>Doctor Name</p>
              <p>Email</p>
              <p>Tel Number</p>
              <p>Status</p>
              <p>Action</p>
              <p>Details</p>
            </div>

            {doctors.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink/65">{loading ? 'Loading doctors...' : 'No doctors found.'}</p>
            ) : (
              doctors.map((doctor) => {
                const profile = doctor.doctorProfile || {};
                const status = profile.verificationStatus || (profile.isVerified ? 'approved' : 'pending');
                const isExpanded = !!expandedDoctorIds[doctor._id];
                const isBusy = !!actionLoadingKey;

                return (
                  <div key={doctor._id} className="border-b border-lake/10 last:border-b-0">
                    <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 px-3 py-3 text-sm">
                      <p className="font-semibold text-lake">{doctor.fullName}</p>
                      <p className="truncate text-ink/80">{doctor.email}</p>
                      <p className="text-ink/80">{doctor.phoneNumber}</p>
                      <StatusPill status={status} />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateDoctorVerification(doctor._id, true)}
                          disabled={loading || isBusy || status === 'approved'}
                        >
                          <BadgeCheck size={14} /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDoctorVerification(doctor._id, false)}
                          disabled={loading || isBusy || status === 'rejected'}
                        >
                          <BadgeX size={14} /> Reject
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => toggleExpand(doctor._id)}>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />} More
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="grid gap-2 bg-white/60 px-3 pb-3 text-sm md:grid-cols-2">
                        <PhotoDetail label="Profile Photo" value={profile.profilePhoto} doctorName={doctor.fullName} />
                        <Detail label="Medical License Number" value={profile.medicalLicenseNumber || 'Not provided'} />
                        <Detail label="Specialization" value={profile.specialization || 'Not provided'} />
                        <Detail label="Years Of Experience" value={profile.yearsOfExperience ?? 'Not provided'} />
                        <Detail
                          label="Qualifications"
                          value={Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') || 'Not provided' : 'Not provided'}
                        />
                        <Detail label="Hospital / Clinic" value={profile.hospitalOrClinicName || 'Not provided'} />
                        <Detail label="Consultation Fee" value={profile.consultationFee ?? 'Not provided'} />
                        <Detail label="Clinic Address" value={profile.clinicAddress || 'Not provided'} />
                        <Detail label="City" value={profile.city || 'Not provided'} />
                        <Detail label="District" value={profile.district || 'Not provided'} />
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-3 flex items-center gap-2 text-xs text-ink/60">
            <Stethoscope size={13} /> Approving a doctor updates status to approved immediately.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-5 bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <DollarSign size={18} /> Financial Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!financialData ? (
            <p className="text-sm text-ink/65">{loading ? 'Loading financial data...' : 'No financial data available.'}</p>
          ) : financialData.available === false ? (
            <div className="rounded-xl border border-amber-300/60 bg-amber-100/50 px-3 py-2 text-sm text-amber-700">
              <p className="font-semibold">{financialData.message || 'Financial transaction endpoint is not available.'}</p>
              {financialData.source ? <p className="text-xs">Source: {financialData.source}</p> : null}
            </div>
          ) : (
            <>
              {financialTransactions.length === 0 ? (
                <p className="rounded-xl border border-lake/10 bg-white px-3 py-2 text-sm text-ink/65">
                  No transactions returned by payment service.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white/70">
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-2 border-b border-lake/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/65">
                    <p>Order ID</p>
                    <p>Capture ID</p>
                    <p>Status</p>
                    <p>Amount</p>
                    <p>Updated</p>
                  </div>
                  {financialTransactions.slice(0, 30).map((transaction, index) => (
                    <div key={transaction.id || transaction.orderId || index} className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-2 border-b border-lake/10 px-3 py-3 text-sm last:border-b-0">
                      <p className="truncate text-ink/85">{transaction.orderId || transaction.id || '-'}</p>
                      <p className="truncate text-ink/85">{transaction.captureId || '-'}</p>
                      <StatusPill status={transaction.status || 'unknown'} />
                      <p className="text-ink/85">{transaction.amount || transaction.total || '-'}</p>
                      <p className="text-ink/75">{formatDateTime(transaction.updatedAt || transaction.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-lake/10 bg-white px-3 py-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink/60">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-lake">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  const classes =
    normalized === 'approved'
      ? 'bg-green-100 text-green-700 border-green-200'
      : normalized === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200'
        : normalized === 'active'
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : normalized === 'inactive'
            ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex w-fit rounded-lg border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${classes}`}>
      {normalized}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-lake/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-sm text-ink/85 break-words">{String(value)}</p>
    </div>
  );
}

function PhotoDetail({ label, value, doctorName }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = normalizePhotoSrc(value);

  return (
    <div className="rounded-xl border border-lake/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      {!src || imageFailed ? (
        <p className="mt-1 text-sm text-ink/70">Photo not provided</p>
      ) : (
        <img
          src={src}
          alt={`${doctorName || 'Doctor'} profile`}
          className="mt-2 h-24 w-24 rounded-xl object-cover ring-1 ring-lake/20"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

function normalizePhotoSrc(value) {
  if (!value) {
    return '';
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('data:image') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  if (raw.length > 100) {
    return `data:image/jpeg;base64,${raw}`;
  }

  return '';
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default AdminDashboard;
