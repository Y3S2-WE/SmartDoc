import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardPlus,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  UserPen,
  Video,
  X,
  XCircle
} from 'lucide-react';

import { APPOINTMENT_API_URL, DOCTOR_API_URL, PATIENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const TABS = [
  { id: 'appointments', label: 'Appointments', icon: CalendarCheck2 },
  { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardPlus },
  { id: 'reports', label: 'Patient Reports', icon: Eye },
  { id: 'availability', label: 'Availability', icon: CalendarDays }
];

const initialProfile = {
  fullName: '', email: '', phoneNumber: '', profilePhoto: '',
  medicalLicenseNumber: '', specialization: '', yearsOfExperience: '',
  qualifications: '', hospitalOrClinicName: '', consultationFee: '',
  clinicAddress: '', city: '', district: '', bio: '',
  availabilityNotes: '', availabilitySchedule: []
};

const initialPrescription = {
  patientAuthUserId: '', doctorName: '', diagnosis: '', medications: '',
  dosageInstructions: '', testsRecommended: '', followUpDate: '',
  templateName: '', notes: ''
};

const prescriptionTemplates = [
  {
    id: 'general-fever', label: 'General Fever Care',
    diagnosis: 'Viral fever', medications: 'Paracetamol 500mg',
    dosageInstructions: '1 tablet every 8 hours after meals for 3 days',
    testsRecommended: 'CBC',
    notes: 'Hydrate well and rest. Return if fever persists above 3 days.'
  },
  {
    id: 'upper-respiratory', label: 'Upper Respiratory Infection',
    diagnosis: 'Upper respiratory tract infection',
    medications: 'Cetirizine 10mg, Cough syrup',
    dosageInstructions: 'Cetirizine: 1 tablet at night for 5 days; Cough syrup: 10ml twice daily',
    testsRecommended: 'CRP',
    notes: 'Warm fluids advised. Seek urgent care for breathing difficulty.'
  },
  {
    id: 'gastritis', label: 'Acute Gastritis',
    diagnosis: 'Acute gastritis',
    medications: 'Pantoprazole 40mg, Antacid suspension',
    dosageInstructions: 'Pantoprazole: once daily before breakfast for 14 days; Antacid as needed',
    testsRecommended: 'H. pylori stool antigen',
    notes: 'Avoid spicy and acidic food. Follow up if symptoms persist.'
  }
];

const STATUS_CONFIG = {
  booked: { label: 'Booked', chip: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', chip: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500', bar: 'bg-teal-500' },
  completed: { label: 'Completed', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', chip: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400', bar: 'bg-red-400' },
};

function DoctorDashboard({ session }) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');

  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescription);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [reportPatientFilter, setReportPatientFilter] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [patientReports, setPatientReports] = useState([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [avForm, setAvForm] = useState({ date: '', start: '', end: '', interval: 30 });

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const parseQualifications = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const loadDoctorDashboard = async () => {
    try {
      const [profileRes, appointmentRes] = await Promise.all([
        axios.get(`${DOCTOR_API_URL}/me/profile`, { headers: authHeader }),
        axios.get(`${APPOINTMENT_API_URL}/me/doctor`, { headers: authHeader })
      ]);

      const p = profileRes.data.profile || {};
      setProfile({
        fullName: p.fullName || session.user.fullName || '',
        email: p.email || session.user.email || '',
        phoneNumber: p.phoneNumber || session.user.phoneNumber || '',
        profilePhoto: p.profilePhoto || session.user.doctorProfile?.profilePhoto || '',
        medicalLicenseNumber: p.medicalLicenseNumber || session.user.doctorProfile?.medicalLicenseNumber || '',
        specialization: p.specialization || session.user.doctorProfile?.specialization || '',
        yearsOfExperience: p.yearsOfExperience || session.user.doctorProfile?.yearsOfExperience || '',
        qualifications: parseQualifications(p.qualifications || session.user.doctorProfile?.qualifications),
        hospitalOrClinicName: p.hospitalOrClinicName || session.user.doctorProfile?.hospitalOrClinicName || '',
        consultationFee: p.consultationFee || session.user.doctorProfile?.consultationFee || '',
        clinicAddress: p.clinicAddress || '',
        city: p.city || '',
        district: p.district || '',
        bio: p.bio || '',
        availabilityNotes: p.availabilityNotes || '',
        availabilitySchedule: Array.isArray(p.availabilitySchedule)
          ? p.availabilitySchedule.map((item) => ({ date: item.date || '', timeSlots: Array.isArray(item.timeSlots) ? item.timeSlots : [] }))
          : []
      });

      setPrescriptionForm((prev) => ({
        ...prev,
        doctorName: p.fullName || session.user.fullName || ''
      }));

      setBookedAppointments(appointmentRes.data.appointments || []);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to load doctor dashboard.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load all reports the first time the Reports tab is opened
  useEffect(() => {
    if (activeTab === 'reports' && !reportsLoaded) {
      fetchPatientReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const saveProfile = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.put(`${DOCTOR_API_URL}/me/profile`, profile, { headers: authHeader });
      setFeedback(response.data.message || 'Profile updated successfully.');
      setEditing(false);
      await loadDoctorDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const submitPrescription = async () => {
    if (!prescriptionForm.patientAuthUserId) {
      setFeedback('Please select a patient first.');
      return;
    }
    if (!prescriptionForm.diagnosis.trim()) {
      setFeedback('Diagnosis is required.');
      return;
    }
    if (!prescriptionForm.medications.trim()) {
      setFeedback('Please add at least one medication.');
      return;
    }
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.post(`${DOCTOR_API_URL}/me/prescriptions`, prescriptionForm, { headers: authHeader });
      setFeedback(response.data.message || 'Prescription uploaded successfully.');
      setSelectedTemplateId('');
      setPrescriptionForm({ ...initialPrescription, doctorName: profile.fullName || session.user.fullName || '' });
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to upload prescription.');
    } finally {
      setLoading(false);
    }
  };

  const deletePatientReport = async (reportId) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    setLoading(true);
    setFeedback('');
    try {
      await axios.delete(`${PATIENT_API_URL}/reports/${reportId}`, { headers: authHeader });
      setFeedback('Report deleted successfully.');
      setPatientReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to delete report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReports = async (patientAuthUserId = '') => {
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.get(`${DOCTOR_API_URL}/patient-reports`, {
        headers: authHeader,
        params: patientAuthUserId ? { patientAuthUserId } : {}
      });
      setPatientReports(response.data.reports || []);
      setReportsLoaded(true);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to load patient reports.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const t = prescriptionTemplates.find((item) => item.id === templateId);
    if (!t) { setPrescriptionForm((prev) => ({ ...prev, templateName: '' })); return; }
    setPrescriptionForm((prev) => ({
      ...prev,
      diagnosis: t.diagnosis,
      medications: t.medications,
      dosageInstructions: t.dosageInstructions,
      testsRecommended: t.testsRecommended,
      templateName: t.label,
      notes: t.notes
    }));
  };

  const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const fmt12 = (totalMins) => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const buildSlots = (start, end, interval) => {
    const s = toMins(start);
    const e = toMins(end);
    if (e <= s) return [];
    const out = [];
    for (let t = s; t + interval <= e; t += interval) {
      out.push(`${fmt12(t)} - ${fmt12(t + interval)}`);
    }
    return out;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const addAvailabilitySlots = () => {
    const { date, start, end, interval } = avForm;
    if (!date) { setFeedback('Select a date.'); return; }
    if (!start || !end) { setFeedback('Set both start and end time.'); return; }
    if (toMins(end) <= toMins(start)) { setFeedback('End time must be after start time.'); return; }
    const generated = buildSlots(start, end, interval);
    if (generated.length === 0) { setFeedback('No slots fit in the selected range.'); return; }
    setProfile((prev) => {
      const exists = prev.availabilitySchedule.some((item) => item.date === date);
      if (exists) {
        return {
          ...prev,
          availabilitySchedule: prev.availabilitySchedule.map((item) => {
            if (item.date !== date) return item;
            const existingSet = new Set(item.timeSlots);
            return { ...item, timeSlots: [...item.timeSlots, ...generated.filter((s) => !existingSet.has(s))] };
          })
        };
      }
      return { ...prev, availabilitySchedule: [...prev.availabilitySchedule, { date, timeSlots: generated }] };
    });
    setAvForm((prev) => ({ ...prev, date: '', start: '', end: '' }));
    setFeedback('');
  };

  const removeAvailabilityDate = (date) => {
    setProfile((prev) => ({ ...prev, availabilitySchedule: prev.availabilitySchedule.filter((item) => item.date !== date) }));
  };

  const removeAvailabilitySlot = (date, slot) => {
    setProfile((prev) => ({
      ...prev,
      availabilitySchedule: prev.availabilitySchedule.map((item) =>
        item.date !== date ? item : { ...item, timeSlots: item.timeSlots.filter((s) => s !== slot) }
      )
    }));
  };

  const saveAvailability = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.put(
        `${DOCTOR_API_URL}/me/availability`,
        { availabilitySchedule: profile.availabilitySchedule },
        { headers: authHeader }
      );
      setFeedback(response.data.message || 'Availability saved.');
      await loadDoctorDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to save availability.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.patch(
        `${APPOINTMENT_API_URL}/me/doctor/${appointmentId}/status`,
        { status },
        { headers: authHeader }
      );
      setFeedback(response.data.message || `Appointment ${status}.`);
      await loadDoctorDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to update appointment.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = bookedAppointments.filter((a) => {
    const dateMatch = !dateFilter || a.appointmentDate === dateFilter;
    const statusMatch = statusFilter === 'all' || a.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const statusCounts = bookedAppointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const totalSlots = profile.availabilitySchedule.reduce((sum, item) => sum + item.timeSlots.length, 0);

  const initials = (profile.fullName || session.user.fullName || 'D')
    .split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-lake/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">

      {/* Feedback */}
      {feedback ? (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-lake/20 bg-white/70 px-4 py-3 text-sm font-medium text-lake shadow-sm backdrop-blur">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="ml-3 rounded-lg p-1 hover:bg-lake/10">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* ── Hero Profile Card ── */}
      <div className="portal-shell mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-lake via-lake to-teal-700 shadow-panel">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-5">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt="Doctor"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-4 ring-white/20">
                {initials}
              </div>
            )}
            <div className="text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Doctor Dashboard</p>
              <h2 className="mt-0.5 text-2xl font-bold">Dr. {profile.fullName || 'Your Name'}</h2>
              <p className="mt-1 text-sm text-white/80">{profile.specialization || 'Specialization not set'}</p>
              <p className="text-sm text-white/70">{profile.hospitalOrClinicName || 'Hospital / Clinic not set'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:flex-col md:items-end">
            <div className="flex gap-3">
              <StatPill label="Appointments" value={bookedAppointments.length} />
              <StatPill label="Dates Available" value={profile.availabilitySchedule.length} />
              <StatPill label="Total Slots" value={totalSlots} />
            </div>
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setEditing(true)}
            >
              <UserPen size={15} /> Edit Profile
            </Button>
          </div>
        </div>

        {/* Quick info strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-white/15 bg-white/5 px-8 py-3 text-xs text-white/70">
          {profile.medicalLicenseNumber ? <span>License: {profile.medicalLicenseNumber}</span> : null}
          {profile.yearsOfExperience ? <span>{profile.yearsOfExperience} yrs experience</span> : null}
          {profile.consultationFee ? <span>Fee: LKR {profile.consultationFee}</span> : null}
          {profile.city ? <span>{profile.city}{profile.district ? `, ${profile.district}` : ''}</span> : null}
          {profile.email ? <span>{profile.email}</span> : null}
          {profile.phoneNumber ? <span>{profile.phoneNumber}</span> : null}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/40 bg-white/50 p-1.5 backdrop-blur">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${activeTab === tab.id
                ? 'bg-lake text-white shadow-sm'
                : 'text-ink/60 hover:bg-white/70 hover:text-lake'
                }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Appointments ── */}
      {activeTab === 'appointments' && (
        <div className="space-y-5">

          {/* ── Status summary strip ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'booked', label: 'Booked', icon: Circle },
              { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
              { key: 'completed', label: 'Completed', icon: CheckCircle2 },
              { key: 'cancelled', label: 'Cancelled', icon: XCircle },
            ].map(({ key, label, icon: Icon }) => {
              const cfg = STATUS_CONFIG[key];
              const count = statusCounts[key] || 0;
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(active ? 'all' : key)}
                  className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:shadow-md ${active ? `${cfg.chip} border-current shadow-sm` : 'border-white/60 bg-white hover:border-lake/20'
                    }`}
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${active ? 'bg-current/10' : 'bg-ink/5'}`}>
                    <Icon size={16} className={active ? 'opacity-80' : 'text-ink/40'} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold leading-tight ${active ? '' : 'text-ink'}`}>{count}</p>
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${active ? 'opacity-70' : 'text-ink/50'}`}>{label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Filter bar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-ink">
                {statusFilter === 'all' ? 'All Appointments' : STATUS_CONFIG[statusFilter]?.label}
                <span className="ml-2 rounded-lg bg-lake/10 px-2 py-0.5 text-xs font-bold text-lake">{filteredAppointments.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/80 outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/10"
              />
              {(dateFilter || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setDateFilter(''); setStatusFilter('all'); }}
                  className="flex items-center gap-1.5 rounded-xl border border-lake/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-lake/40 hover:text-lake"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* ── Cards ── */}
          {filteredAppointments.length === 0 ? (
            <EmptyState icon={CalendarCheck2} message="No appointments match the current filters." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAppointments
                .slice()
                .sort((a, b) => {
                  const d = a.appointmentDate.localeCompare(b.appointmentDate);
                  return d !== 0 ? d : (a.appointmentTimeSlot || '').localeCompare(b.appointmentTimeSlot || '');
                })
                .map((apt) => {
                  const cfg = STATUS_CONFIG[apt.status] || { label: apt.status, chip: 'bg-ink/10 text-ink/60 border-ink/20', bar: 'bg-ink/20', dot: 'bg-ink/40' };
                  const initials = (apt.patientName || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                  const isVideo = apt.appointmentType === 'video';
                  const fmtDate = apt.appointmentDate
                    ? new Date(apt.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';

                  return (
                    <div key={apt._id} className="group flex flex-col overflow-hidden rounded-2xl border border-lake/10 bg-white shadow-sm transition hover:shadow-lg">

                      {/* Status bar */}
                      <div className={`h-1 w-full ${cfg.bar}`} />

                      <div className="flex flex-1 flex-col p-5">
                        {/* Header: avatar + name + badge */}
                        <div className="mb-4 flex items-start gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lake/10 text-sm font-bold text-lake">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/35">
                              #{apt.appointmentNumber || '—'}
                            </p>
                            <p className="truncate text-base font-bold text-ink">{apt.patientName}</p>
                          </div>
                          <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cfg.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Date / time / type row */}
                        <div className="mb-4 rounded-xl border border-lake/8 bg-lake/3 px-3 py-2.5 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-ink/75">
                            <CalendarCheck2 size={13} className="text-lake flex-shrink-0" />
                            {fmtDate}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-ink/75">
                            <Clock size={13} className="text-lake flex-shrink-0" />
                            {apt.appointmentTimeSlot || '—'}
                          </div>
                          <div className="flex items-center gap-2">
                            {isVideo ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-lake/10 px-2 py-0.5 text-[11px] font-bold text-lake">
                                <Video size={11} /> Video
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-ink/8 px-2 py-0.5 text-[11px] font-bold text-ink/60">
                                <Stethoscope size={11} /> Physical
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="mt-auto space-y-1.5 text-xs text-ink/55">
                          {apt.patientEmail && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail size={11} className="flex-shrink-0" />
                              <span className="truncate">{apt.patientEmail}</span>
                            </div>
                          )}
                          {apt.patientPhoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone size={11} className="flex-shrink-0" />
                              {apt.patientPhoneNumber}
                            </div>
                          )}
                        </div>

                        {/* Video CTA */}
                        {isVideo && apt.videoRoomLink && apt.status !== 'cancelled' && (
                          <Button asChild size="sm" className="mt-4 w-full gap-2">
                            <a href={apt.videoRoomLink} target="_blank" rel="noreferrer">
                              <Video size={13} /> Join Video Call
                            </a>
                          </Button>
                        )}

                        {/* Doctor actions */}
                        {(apt.status === 'booked' || apt.status === 'confirmed') && (
                          <div className="mt-4 flex gap-2 border-t border-lake/8 pt-4">
                            {apt.status === 'booked' && (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => updateAppointmentStatus(apt._id, 'confirmed')}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} /> Confirm
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => updateAppointmentStatus(apt._id, 'completed')}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} /> Complete
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => updateAppointmentStatus(apt._id, 'cancelled')}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Prescriptions ── */}
      {activeTab === 'prescriptions' && (
        <div className="portal-shell">
          <Card className="border-0 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lake">
                <ClipboardPlus size={18} /> Upload Digital Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Template selector */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink/70">Quick Template</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate('')}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${!selectedTemplateId ? 'border-lake bg-lake text-white' : 'border-lake/20 bg-white text-ink/70 hover:border-lake/40'}`}
                  >
                    Custom
                  </button>
                  {prescriptionTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${selectedTemplateId === t.id ? 'border-lake bg-lake text-white' : 'border-lake/20 bg-white text-ink/70 hover:border-lake/40'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient selector */}
              <FormField label="Select Patient">
                <select
                  value={prescriptionForm.patientAuthUserId}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientAuthUserId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
                >
                  <option value="">— Select a booked patient —</option>
                  {bookedAppointments
                    .filter((a) => a.status !== 'cancelled')
                    .map((a) => (
                      <option key={a._id} value={a.patientAuthUserId}>
                        {a.patientName} · {a.appointmentDate} {a.appointmentTimeSlot} ({a.appointmentType})
                      </option>
                    ))}
                </select>
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Doctor Name">
                  <Input value={prescriptionForm.doctorName} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctorName: e.target.value })} />
                </FormField>
                <FormField label="Diagnosis">
                  <Input value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })} />
                </FormField>
                <FormField label="Medications (comma-separated)">
                  <Input value={prescriptionForm.medications} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medications: e.target.value })} />
                </FormField>
                <FormField label="Dosage Instructions">
                  <Input value={prescriptionForm.dosageInstructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosageInstructions: e.target.value })} />
                </FormField>
                <FormField label="Recommended Tests">
                  <Input value={prescriptionForm.testsRecommended} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, testsRecommended: e.target.value })} />
                </FormField>
                <FormField label="Follow-Up Date">
                  <Input type="date" value={prescriptionForm.followUpDate} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpDate: e.target.value })} />
                </FormField>
              </div>

              <FormField label="Notes">
                <Input value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} />
              </FormField>

              <Button onClick={submitPrescription} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                {loading ? 'Submitting…' : 'Upload Prescription'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Patient Reports ── */}
      {activeTab === 'reports' && (
        <div className="space-y-5">

          {/* ── Header + search + patient filter ── */}
          <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white shadow-sm">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-lake/10 bg-gradient-to-r from-lake/5 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10">
                  <Eye size={17} className="text-lake" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Patient Reports</p>
                  <p className="text-xs text-ink/50">
                    {patientReports.length} report{patientReports.length !== 1 ? 's' : ''}
                    {reportPatientFilter ? ' for selected patient' : ' total'}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fetchPatientReports(reportPatientFilter)} disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Refresh
              </Button>
            </div>

            {/* Search bar */}
            <div className="border-b border-lake/10 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-lake/20 bg-lake/3 px-3 py-2 transition focus-within:border-lake focus-within:ring-2 focus-within:ring-lake/10">
                <Search size={15} className="flex-shrink-0 text-ink/35" />
                <input
                  type="text"
                  placeholder="Search by patient name or report title…"
                  value={reportSearch}
                  onChange={(e) => {
                    setReportSearch(e.target.value);
                    setReportPatientFilter('');
                  }}
                  className="w-full bg-transparent text-sm text-ink/80 placeholder:text-ink/35 outline-none"
                />
                {reportSearch && (
                  <button
                    type="button"
                    onClick={() => setReportSearch('')}
                    className="flex-shrink-0 rounded p-0.5 text-ink/35 transition hover:text-ink/70"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Patient pills */}
            <div className="flex flex-wrap gap-2 p-4">
              <button
                type="button"
                onClick={() => { setReportPatientFilter(''); setReportSearch(''); fetchPatientReports(''); }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${!reportPatientFilter && !reportSearch ? 'border-lake bg-lake text-white shadow-sm' : 'border-lake/20 bg-white text-ink/60 hover:border-lake/40 hover:text-lake'
                  }`}
              >
                All Patients
              </button>
              {[...new Map(
                bookedAppointments
                  .filter((a) => a.status !== 'cancelled')
                  .map((a) => [a.patientAuthUserId, a])
              ).values()]
                .filter((a) => !reportSearch || a.patientName.toLowerCase().includes(reportSearch.toLowerCase()))
                .map((a) => (
                  <button
                    key={a.patientAuthUserId}
                    type="button"
                    onClick={() => { setReportPatientFilter(a.patientAuthUserId); setReportSearch(''); fetchPatientReports(a.patientAuthUserId); }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${reportPatientFilter === a.patientAuthUserId ? 'border-lake bg-lake text-white shadow-sm' : 'border-lake/20 bg-white text-ink/60 hover:border-lake/40 hover:text-lake'
                      }`}
                  >
                    {a.patientName}
                  </button>
                ))}
            </div>
          </div>

          {/* ── Report cards ── */}
          {loading && !reportsLoaded ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-lake/40" />
            </div>
          ) : patientReports.length === 0 ? (
            <EmptyState icon={Eye} message="No patient reports found." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {patientReports
                .filter((report) => {
                  if (!reportSearch) return true;
                  const q = reportSearch.toLowerCase();
                  const owner = bookedAppointments.find((a) => a.patientAuthUserId === report.patientAuthUserId);
                  return (
                    report.title?.toLowerCase().includes(q) ||
                    owner?.patientName?.toLowerCase().includes(q)
                  );
                })
                .map((report) => {
                  const owner = bookedAppointments.find((a) => a.patientAuthUserId === report.patientAuthUserId);
                  const isPdf = report.mimeType?.includes('pdf');
                  const isImage = report.mimeType?.startsWith('image/');
                  const fileLabel = isPdf ? 'PDF' : isImage ? 'Image' : 'File';
                  const fileSizeKB = report.fileSize ? (report.fileSize / 1024).toFixed(1) : null;

                  return (
                    <div key={report._id} className="flex flex-col overflow-hidden rounded-2xl border border-lake/10 bg-white shadow-sm transition hover:shadow-md">
                      <div className={`h-1 w-full ${isPdf ? 'bg-red-400' : isImage ? 'bg-blue-400' : 'bg-lake'}`} />

                      <div className="flex flex-1 flex-col p-5">
                        {/* File type badge + delete */}
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${isPdf ? 'bg-red-50 text-red-600' : isImage ? 'bg-blue-50 text-blue-600' : 'bg-lake/10 text-lake'
                            }`}>
                            <FileText size={11} /> {fileLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => deletePatientReport(report._id)}
                            disabled={loading}
                            className="rounded-lg p-1.5 text-ink/30 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                            title="Delete report"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Title */}
                        <p className="mb-1 font-bold text-ink line-clamp-2">{report.title}</p>

                        {/* Patient */}
                        {owner && (
                          <p className="mb-2 text-xs font-semibold text-lake">{owner.patientName}</p>
                        )}

                        {/* Description */}
                        {report.description && (
                          <p className="mb-3 text-xs text-ink/55 line-clamp-2">{report.description}</p>
                        )}

                        {/* Meta */}
                        <div className="mt-auto space-y-0.5 text-[11px] text-ink/40">
                          {fileSizeKB && <p>{report.fileName} · {fileSizeKB} KB</p>}
                          <p>{new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>

                        {/* View button */}
                        <a
                          href={`http://localhost:3002${report.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-lake/20 bg-lake/5 py-2 text-xs font-bold text-lake transition hover:bg-lake hover:text-white"
                        >
                          <ExternalLink size={12} /> View Report
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Availability ── */}
      {activeTab === 'availability' && (
        <div className="space-y-6">

          {/* ── Add form ── */}
          <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white shadow-sm">
            <div className="border-b border-lake/10 bg-gradient-to-r from-lake/5 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake/10">
                  <CalendarDays size={17} className="text-lake" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Add Availability</p>
                  <p className="text-xs text-ink/50">Pick a date, time range and slot interval</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Date</label>
                  <input
                    type="date"
                    value={avForm.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setAvForm({ ...avForm, date: e.target.value })}
                    className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Start Time</label>
                  <input
                    type="time"
                    value={avForm.start}
                    onChange={(e) => setAvForm({ ...avForm, start: e.target.value })}
                    className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">End Time</label>
                  <input
                    type="time"
                    value={avForm.end}
                    onChange={(e) => setAvForm({ ...avForm, end: e.target.value })}
                    className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Interval</span>
                  <div className="flex gap-1.5">
                    {[15, 30, 45, 60].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setAvForm({ ...avForm, interval: min })}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${avForm.interval === min
                          ? 'border-lake bg-lake text-white shadow-sm'
                          : 'border-lake/20 bg-white text-ink/55 hover:border-lake/50 hover:text-lake'
                          }`}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={addAvailabilitySlots} disabled={loading} className="gap-2 px-6">
                  <Plus size={15} /> Add Slots
                </Button>
              </div>

              {/* Preview */}
              {avForm.date && avForm.start && avForm.end && toMins(avForm.end) > toMins(avForm.start) && (
                <div className="rounded-xl border border-lake/10 bg-lake/3 px-4 py-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">
                    Preview — {buildSlots(avForm.start, avForm.end, avForm.interval).length} slot(s) for {formatDate(avForm.date)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {buildSlots(avForm.start, avForm.end, avForm.interval).map((s) => (
                      <span key={s} className="rounded-lg border border-lake/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-lake">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Schedule cards ── */}
          {profile.availabilitySchedule.length === 0 ? (
            <EmptyState icon={CalendarDays} message="No availability added yet. Fill the form above to get started." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profile.availabilitySchedule
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((entry) => (
                  <div key={entry.date} className="flex flex-col overflow-hidden rounded-2xl border border-lake/10 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-gradient-to-r from-lake to-teal-600 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Schedule</p>
                        <p className="text-sm font-bold text-white">{formatDate(entry.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                          {entry.timeSlots.length} slot{entry.timeSlots.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAvailabilityDate(entry.date)}
                          className="rounded-lg p-1 text-white/60 transition hover:bg-white/20 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      {entry.timeSlots.length === 0 ? (
                        <p className="text-xs text-ink/40 italic">No slots yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.timeSlots.map((slot) => (
                            <span
                              key={`${entry.date}-${slot}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-lake/20 bg-lake/5 px-2.5 py-1 text-[11px] font-semibold text-lake transition hover:bg-lake/10"
                            >
                              {slot}
                              <button
                                type="button"
                                onClick={() => removeAvailabilitySlot(entry.date, slot)}
                                className="ml-0.5 rounded p-0.5 text-lake/40 transition hover:bg-lake/20 hover:text-ember"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── Save button ── */}
          {profile.availabilitySchedule.length > 0 && (
            <div className="flex justify-end border-t border-lake/10 pt-4">
              <Button onClick={saveAvailability} disabled={loading} className="gap-2 px-8">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {loading ? 'Saving…' : 'Save Availability'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border-0 bg-white shadow-panel">
            <CardHeader className="sticky top-0 z-10 flex-row items-center justify-between border-b border-lake/10 bg-white pb-4">
              <CardTitle className="flex items-center gap-2 text-lake">
                <UserPen size={18} /> Edit Doctor Profile
              </CardTitle>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl p-1.5 text-ink/50 transition hover:bg-lake/10 hover:text-lake"
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <FormField label="Full Name"><Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></FormField>
              <FormField label="Email"><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></FormField>
              <FormField label="Phone Number"><Input value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} /></FormField>
              <FormField label="Profile Photo URL"><Input value={profile.profilePhoto} onChange={(e) => setProfile({ ...profile, profilePhoto: e.target.value })} /></FormField>
              <FormField label="Medical License Number"><Input value={profile.medicalLicenseNumber} onChange={(e) => setProfile({ ...profile, medicalLicenseNumber: e.target.value })} /></FormField>
              <FormField label="Specialization"><Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} /></FormField>
              <FormField label="Years of Experience"><Input type="number" value={profile.yearsOfExperience} onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })} /></FormField>
              <FormField label="Qualifications (comma-separated)"><Input value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} /></FormField>
              <FormField label="Hospital / Clinic Name"><Input value={profile.hospitalOrClinicName} onChange={(e) => setProfile({ ...profile, hospitalOrClinicName: e.target.value })} /></FormField>
              <FormField label="Consultation Fee (LKR)"><Input type="number" value={profile.consultationFee} onChange={(e) => setProfile({ ...profile, consultationFee: e.target.value })} /></FormField>
              <FormField label="Clinic Address"><Input value={profile.clinicAddress} onChange={(e) => setProfile({ ...profile, clinicAddress: e.target.value })} /></FormField>
              <FormField label="City"><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></FormField>
              <FormField label="District"><Input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} /></FormField>
              <FormField label="Bio"><Input value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></FormField>
              <FormField label="Availability Notes" className="col-span-full md:col-span-1">
                <Input value={profile.availabilityNotes} onChange={(e) => setProfile({ ...profile, availabilityNotes: e.target.value })} />
              </FormField>

              <div className="col-span-full mt-2 flex justify-end gap-3 border-t border-lake/10 pt-4">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={saveProfile} disabled={loading}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {loading ? 'Saving…' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 text-center text-white">
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}

function FormField({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold text-ink/70 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-lake/20 bg-white/50 py-14 text-center">
      <Icon size={32} className="mb-3 text-lake/30" />
      <p className="text-sm text-ink/50">{message}</p>
    </div>
  );
}

export default DoctorDashboard;
