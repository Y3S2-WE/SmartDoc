import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  Brain,
  CalendarCheck2,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  FileUp,
  HeartPulse,
  MapPin,
  Phone,
  Pill,
  Save,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Upload,
  UserRound,
  UserRoundPen,
  Video,
  X,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Shield
} from 'lucide-react';

import { PATIENT_API_URL } from '../lib/api';
import { APPOINTMENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & INITIAL STATE
───────────────────────────────────────────────────────────────────────────── */
const initialDashboardProfile = {
  fullName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '',
  nationalId: '', profilePhoto: '', bloodGroup: '', knownAllergies: '',
  medicalConditions: '', currentMedications: '', emergencyContactName: '',
  emergencyContactPhone: '', addressLine: '', city: '', district: '', postalCode: ''
};

const AI_INSIGHTS = [
  "Based on your appointment history, consider scheduling a routine cardiac check-up with a Cardiologist.",
  "Your recent reports suggest maintaining regular hydration and a balanced diet.",
  "It's been a while since your last general check-up — consider booking a consultation.",
  "Your medication schedule looks well-managed. Keep up the great health routine!",
  "Based on your profile, preventive dental care is recommended every 6 months.",
];

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────────────────────────────────────── */
const normalizeArrayField = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

const parseAppointmentDate = (dateValue) => {
  if (!dateValue) return null;
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate;
};

const normalizeAppointmentStatus = (status) => String(status || 'pending').toLowerCase();

const formatAppointmentDate = (dateValue) => {
  const parsedDate = parseAppointmentDate(dateValue);
  if (!parsedDate) return 'Date pending';
  return parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getAppointmentStatusMeta = (status) => {
  const normalizedStatus = normalizeAppointmentStatus(status);
  const map = {
    completed: { label: 'Completed', color: 'emerald', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'rose', icon: XCircle },
    confirmed: { label: 'Confirmed', color: 'blue', icon: CheckCircle2 },
    pending: { label: 'Pending', color: 'amber', icon: AlertTriangle },
  };
  return { status: normalizedStatus, ...(map[normalizedStatus] || { label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1), color: 'slate', icon: Clock }) };
};

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER HOOK
───────────────────────────────────────────────────────────────────────────── */
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function PatientDashboard({ session }) {
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const [dashboardProfile, setDashboardProfile] = useState(initialDashboardProfile);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [appointmentView, setAppointmentView] = useState('upcoming');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [visibleAppointmentCount, setVisibleAppointmentCount] = useState(4);
  const [aiInsightIndex] = useState(() => Math.floor(Math.random() * AI_INSIGHTS.length));
  const [mounted, setMounted] = useState(false);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  useEffect(() => { setMounted(true); }, []);

  /* ── Appointment logic ─────────────────────────────────────────────── */
  const isUpcomingAppointment = (item) => {
    const status = normalizeAppointmentStatus(item.status);
    if (status === 'cancelled' || status === 'completed') return false;
    const date = parseAppointmentDate(item.appointmentDate);
    if (!date) return true;
    date.setHours(23, 59, 59, 999);
    return date >= new Date();
  };

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = parseAppointmentDate(a.appointmentDate);
      const dateB = parseAppointmentDate(b.appointmentDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  }, [appointments]);

  const appointmentCollections = useMemo(() => {
    const upcoming = [], completed = [], cancelled = [];
    sortedAppointments.forEach((item) => {
      const status = normalizeAppointmentStatus(item.status);
      if (status === 'cancelled') { cancelled.push(item); return; }
      if (status === 'completed') { completed.push(item); return; }
      if (isUpcomingAppointment(item)) { upcoming.push(item); return; }
      completed.push(item);
    });
    const dateSortDesc = (a, b) => {
      const dA = parseAppointmentDate(a.appointmentDate);
      const dB = parseAppointmentDate(b.appointmentDate);
      if (!dA && !dB) return 0;
      if (!dA) return 1;
      if (!dB) return -1;
      return dB - dA;
    };
    return { upcoming, completed: [...completed].sort(dateSortDesc), cancelled: [...cancelled].sort(dateSortDesc), all: sortedAppointments };
  }, [sortedAppointments]);

  const appointmentTabs = useMemo(() => [
    { key: 'upcoming', label: 'Upcoming', count: appointmentCollections.upcoming.length, color: 'blue' },
    { key: 'completed', label: 'Completed', count: appointmentCollections.completed.length, color: 'emerald' },
    { key: 'cancelled', label: 'Cancelled', count: appointmentCollections.cancelled.length, color: 'rose' },
    { key: 'all', label: 'All', count: appointmentCollections.all.length, color: 'slate' },
  ], [appointmentCollections]);

  const visibleAppointments = useMemo(() => {
    const activeAppointments = appointmentCollections[appointmentView] || [];
    return activeAppointments.slice(0, visibleAppointmentCount);
  }, [appointmentCollections, appointmentView, visibleAppointmentCount]);

  useEffect(() => { setVisibleAppointmentCount(4); setExpandedAppointmentId(null); }, [appointmentView]);

  /* ── Data loading ──────────────────────────────────────────────────── */
  const loadPatientDashboard = async () => {
    try {
      const [profileRes, reportsRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        axios.get(`${PATIENT_API_URL}/me/profile`, { headers: authHeader }),
        axios.get(`${PATIENT_API_URL}/me/reports`, { headers: authHeader }),
        axios.get(`${PATIENT_API_URL}/me/prescriptions`, { headers: authHeader }),
        axios.get(`${APPOINTMENT_API_URL}/me/patient`, { headers: authHeader })
      ]);

      const profile = profileRes.data.profile || {};
      const registrationProfile = session.user.patientProfile || {};
      const resolveDateValue = (value) => (value ? String(value).slice(0, 10) : '');

      setDashboardProfile({
        fullName: profile.fullName || session.user.fullName || '',
        email: profile.email || session.user.email || '',
        phoneNumber: profile.phoneNumber || session.user.phoneNumber || '',
        dateOfBirth: resolveDateValue(profile.dateOfBirth) || resolveDateValue(registrationProfile.dateOfBirth),
        gender: profile.gender || registrationProfile.gender || '',
        nationalId: profile.nationalId || registrationProfile.nationalId || '',
        profilePhoto: profile.profilePhoto || registrationProfile.profilePhoto || '',
        bloodGroup: profile.bloodGroup || registrationProfile.bloodGroup || '',
        knownAllergies: normalizeArrayField(profile.knownAllergies || registrationProfile.knownAllergies),
        medicalConditions: normalizeArrayField(profile.medicalConditions || registrationProfile.medicalConditions),
        currentMedications: normalizeArrayField(profile.currentMedications || registrationProfile.currentMedications),
        emergencyContactName: profile.emergencyContactName || registrationProfile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || registrationProfile.emergencyContactPhone || '',
        addressLine: profile.addressLine || registrationProfile.addressLine || '',
        city: profile.city || registrationProfile.city || '',
        district: profile.district || registrationProfile.district || '',
        postalCode: profile.postalCode || registrationProfile.postalCode || ''
      });

      setReports(reportsRes.data.reports || []);
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (error) {
      setFeedback({ message: error.response?.data?.message || 'Unable to load patient dashboard.', type: 'error' });
    }
  };

  useEffect(() => { loadPatientDashboard(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  /* ── Actions ───────────────────────────────────────────────────────── */
  const savePatientProfile = async () => {
    setLoading(true); setFeedback({ message: '', type: 'info' });
    try {
      const response = await axios.put(`${PATIENT_API_URL}/me/profile`, dashboardProfile, { headers: authHeader });
      setIsProfileEditing(false);
      setFeedback({ message: response.data.message || 'Profile saved successfully.', type: 'success' });
      await loadPatientDashboard();
    } catch (error) {
      setFeedback({ message: error.response?.data?.message || 'Profile update failed.', type: 'error' });
    } finally { setLoading(false); }
  };

  const uploadReport = async () => {
    if (!reportFile) { setFeedback({ message: 'Please choose a file to upload.', type: 'error' }); return; }
    const formData = new FormData();
    formData.append('file', reportFile);
    formData.append('title', reportTitle);
    formData.append('description', reportDescription);
    setLoading(true); setFeedback({ message: '', type: 'info' });
    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => { prog += Math.random() * 20; setUploadProgress(Math.min(prog, 90)); }, 200);
    try {
      const response = await axios.post(`${PATIENT_API_URL}/me/reports`, formData, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(interval); setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1500);
      setFeedback({ message: response.data.message || 'Report uploaded successfully.', type: 'success' });
      setReportFile(null); setReportTitle(''); setReportDescription('');
      await loadPatientDashboard();
    } catch (error) {
      clearInterval(interval); setUploadProgress(0);
      setFeedback({ message: error.response?.data?.message || 'Upload failed.', type: 'error' });
    } finally { setLoading(false); }
  };

  const cancelAppointment = async (appointmentId) => {
    const shouldCancel = window.confirm('Are you sure you want to cancel this appointment?');
    if (!shouldCancel) return;
    setLoading(true); setFeedback({ message: '', type: 'info' });
    try {
      const response = await axios.patch(`${APPOINTMENT_API_URL}/me/patient/${appointmentId}/cancel`, {}, { headers: authHeader });
      setFeedback({ message: response.data.message || 'Appointment cancelled successfully.', type: 'success' });
      await loadPatientDashboard();
    } catch (error) {
      setFeedback({ message: error.response?.data?.message || 'Failed to cancel appointment.', type: 'error' });
    } finally { setLoading(false); }
  };

  /* ── Drag & Drop ───────────────────────────────────────────────────── */
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setReportFile(file);
  };

  /* ── Derived values ────────────────────────────────────────────────── */
  const patientName = dashboardProfile.fullName || session.user.fullName || 'Patient';
  const initials = patientName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F8FAFC 40%, #EEF7F7 100%)',
        animation: mounted ? 'fadeInUp 0.6s ease both' : 'none'
      }}
    >
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,82,255,0.06) 0%, transparent 70%)',
          top: -150, left: -150, animation: 'blobFloat 14s ease-in-out infinite alternate'
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,122,122,0.08) 0%, transparent 70%)',
          top: '30%', right: -100, animation: 'blobFloat 10s ease-in-out infinite alternate-reverse'
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,124,255,0.05) 0%, transparent 70%)',
          bottom: '5%', left: '35%'
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(15,42,68,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,42,68,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8" style={{ zIndex: 1 }}>

        {/* ── FEEDBACK TOAST ─────────────────────────────────────────── */}
        {feedback.message ? (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-xl transition-all ${
              feedback.type === 'success'
                ? 'border-emerald-200/60 bg-emerald-50/80 text-emerald-800'
                : feedback.type === 'error'
                ? 'border-rose-200/60 bg-rose-50/80 text-rose-800'
                : 'border-blue-200/60 bg-blue-50/80 text-blue-800'
            }`}
            style={{ animation: 'slideUpPop 0.3s ease' }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" /> :
             feedback.type === 'error' ? <AlertCircle size={16} className="text-rose-600 flex-shrink-0" /> :
             <AlertTriangle size={16} className="text-blue-600 flex-shrink-0" />}
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback({ message: '', type: 'info' })}
              className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {/* ════════════════════════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════════════════════════ */}
        <div
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 55%, #1F7A7A 100%)',
            boxShadow: '0 24px 80px rgba(15,42,68,0.28), 0 8px 32px rgba(0,82,255,0.12)',
            animation: 'fadeInUp 0.7s ease both'
          }}
        >
          {/* Radial glows */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 20% 60%, rgba(77,124,255,0.22) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(31,122,122,0.28) 0%, transparent 50%)'
          }} />
          {/* Dot grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
            {/* Left: Greeting */}
            <div style={{ animation: 'fadeInLeft 0.8s ease both 0.1s', animationFillMode: 'both' }}>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                <HeartPulse size={12} className="text-emerald-400" />
                SmartDoc Patient Portal
              </div>
              <h1 className="mb-2 font-bold text-white" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', lineHeight: 1.2 }}>
                {greeting()}, {patientName.split(' ')[0]} 👋
              </h1>
              <p className="max-w-md text-sm text-white/70 leading-relaxed">
                Manage your appointments, medical reports, and health insights — all in one beautifully unified place.
              </p>

              {/* Health badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <HeroBadge icon={<CalendarCheck2 size={12} />} label={`${appointmentCollections.upcoming.length} Upcoming`} />
                <HeroBadge icon={<FileText size={12} />} label={`${reports.length} Reports`} />
                <HeroBadge icon={<Pill size={12} />} label={`${prescriptions.length} Prescriptions`} />
                {dashboardProfile.bloodGroup ? (
                  <HeroBadge icon={<HeartPulse size={12} />} label={dashboardProfile.bloodGroup} accent />
                ) : null}
              </div>
            </div>

            {/* Right: CTA buttons */}
            <div
              className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row"
              style={{ animation: 'fadeInRight 0.8s ease both 0.2s', animationFillMode: 'both' }}
            >
              <button
                type="button"
                onClick={() => navigate('/appointments/book')}
                className="group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                  boxShadow: '0 4px 20px rgba(0,82,255,0.45)'
                }}
              >
                <CalendarPlus size={16} />
                Book Appointment
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-assist')}
                className="group flex items-center gap-2 rounded-2xl border border-white/25 bg-white/12 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/20"
              >
                <Brain size={16} className="text-violet-300" />
                AI Health Check
                <Sparkles size={12} className="text-violet-300 transition-transform group-hover:rotate-12" />
              </button>
            </div>
          </div>

          {/* Floating decorative icons */}
          <div className="pointer-events-none absolute right-8 top-5 opacity-10 md:opacity-20" style={{ animation: 'floatY 6s ease-in-out infinite' }}>
            <HeartPulse size={80} className="text-white" />
          </div>
          <div className="pointer-events-none absolute right-28 bottom-4 opacity-10 md:opacity-15" style={{ animation: 'floatY 8s ease-in-out infinite 2s' }}>
            <Stethoscope size={50} className="text-emerald-300" />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            METRIC CARDS ROW
        ════════════════════════════════════════════════════════════ */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard icon={<CalendarCheck2 size={20} />} label="Appointments" value={appointments.length} trend="+12%" trendUp color="blue" delay="0.15s" />
          <MetricCard icon={<FileText size={20} />} label="Reports Uploaded" value={reports.length} trend="Total" trendUp color="teal" delay="0.25s" />
          <MetricCard icon={<Pill size={20} />} label="Prescriptions" value={prescriptions.length} trend="Active" trendUp color="violet" delay="0.35s" />
          <MetricCard icon={<Activity size={20} />} label="Upcoming Visits" value={appointmentCollections.upcoming.length} trendUp trend="Scheduled" color="emerald" delay="0.45s" />
        </div>

        {/* ════════════════════════════════════════════════════════════
            MAIN GRID: SIDEBAR + CONTENT
        ════════════════════════════════════════════════════════════ */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

          {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Profile Card */}
            <div
              className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
              style={{ boxShadow: '0 8px 32px rgba(15,42,68,0.10), 0 2px 8px rgba(0,82,255,0.06)', animation: 'fadeInUp 0.6s ease both 0.2s' }}
            >
              {/* Top gradient bar */}
              <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #0F2A44, #134E5E, #1F7A7A)' }} />

              {/* Avatar */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {dashboardProfile.profilePhoto ? (
                    <img src={dashboardProfile.profilePhoto} alt={patientName} className="h-16 w-16 rounded-2xl object-cover" style={{ boxShadow: '0 4px 16px rgba(15,42,68,0.2)' }} />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #0F2A44, #1F7A7A)', boxShadow: '0 4px 16px rgba(15,42,68,0.3)' }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Online status pulse */}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {dashboardProfile.fullName || 'Patient Profile'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{dashboardProfile.email || session.user.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 border border-blue-100">
                    <Shield size={9} /> Verified Patient
                  </div>
                </div>
              </div>

              {/* Info chips */}
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                {dashboardProfile.bloodGroup ? (
                  <InfoChip icon={<HeartPulse size={13} className="text-rose-500" />} label={`Blood Group: ${dashboardProfile.bloodGroup}`} accent="rose" />
                ) : null}
                {dashboardProfile.city ? (
                  <InfoChip icon={<MapPin size={13} className="text-blue-500" />} label={dashboardProfile.city + (dashboardProfile.district ? `, ${dashboardProfile.district}` : '')} />
                ) : null}
                {dashboardProfile.phoneNumber ? (
                  <InfoChip icon={<Phone size={13} className="text-teal-600" />} label={dashboardProfile.phoneNumber} />
                ) : null}
                {dashboardProfile.gender ? (
                  <InfoChip icon={<UserRound size={13} className="text-violet-500" />} label={dashboardProfile.gender} />
                ) : null}
              </div>

              {/* Medical tags */}
              {(dashboardProfile.knownAllergies || dashboardProfile.medicalConditions) ? (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                  {dashboardProfile.knownAllergies ? (
                    <p className="text-xs text-amber-800"><span className="font-semibold">Allergies:</span> {dashboardProfile.knownAllergies}</p>
                  ) : null}
                  {dashboardProfile.medicalConditions ? (
                    <p className="mt-1 text-xs text-amber-800"><span className="font-semibold">Conditions:</span> {dashboardProfile.medicalConditions}</p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setIsProfileEditing(true)}
                className="group/btn mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0F2A44, #134E5E)', boxShadow: '0 4px 16px rgba(15,42,68,0.25)' }}
              >
                <UserRoundPen size={14} /> Edit Profile
                <ChevronRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>

            {/* AI Feature Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-5 text-white"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.30)',
                animation: 'fadeInUp 0.6s ease both 0.35s'
              }}
            >
              {/* Glow rings */}
              <div className="pointer-events-none absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.25) 0%, transparent 60%)'
              }} />

              <div className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      boxShadow: '0 0 24px rgba(124,58,237,0.50), 0 0 48px rgba(124,58,237,0.20)',
                      animation: 'orbPulse 3s ease-in-out infinite'
                    }}
                  >
                    <Brain size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">AI Health Insight</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] text-white/60">Powered by SmartDoc AI</p>
                    </div>
                  </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-white/80">
                  "{AI_INSIGHTS[aiInsightIndex]}"
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/ai-assist')}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/20 py-2.5 text-xs font-bold text-violet-200 backdrop-blur transition-all hover:bg-violet-500/30"
                >
                  <Zap size={13} />
                  Open AI Symptom Checker
                  <ArrowUpRight size={12} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Mini */}
            <div
              className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-md backdrop-blur-xl"
              style={{ animation: 'fadeInUp 0.6s ease both 0.45s' }}
            >
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <TrendingUp size={12} /> Health Overview
              </p>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Total Appts" value={appointments.length} />
                <MiniStat label="Done" value={appointmentCollections.completed.length} color="emerald" />
                <MiniStat label="Pending" value={appointmentCollections.upcoming.length} color="blue" />
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ──────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* ── MEDICAL HUB ───────────────────────────────────── */}
            <Section>
              <SectionHeader icon={<FileUp size={18} />} title="Medical Hub" subtitle="Upload & manage your health documents" />

              {/* Upload Dropzone */}
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mb-5 overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                  isDragging ? 'border-blue-400 bg-blue-50/80 scale-[1.01]' : 'border-slate-200 bg-white/60 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <div className="p-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Upload Medical Report</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="Report Title">
                      <input
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. Blood Test Results"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </FormField>
                    <FormField label="Description">
                      <input
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </FormField>
                  </div>

                  {/* File Drop Target */}
                  <label className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl py-8 transition-all ${
                    reportFile ? 'border border-emerald-200 bg-emerald-50' : 'border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-teal-50/40 hover:from-blue-100/60 hover:to-teal-100/40'
                  }`}>
                    {reportFile ? (
                      <>
                        <CheckCircle2 size={28} className="text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-700">{reportFile.name}</p>
                        <p className="text-xs text-emerald-500">{(reportFile.size / 1024).toFixed(1)} KB — ready to upload</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.12), rgba(31,122,122,0.10))' }}>
                          <Upload size={22} className="text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">Drag & drop your file here</p>
                        <p className="text-xs text-slate-400">or <span className="text-blue-500 font-semibold">browse</span> — PDF, JPG, PNG supported</p>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
                  </label>

                  {/* Progress bar */}
                  {uploadProgress > 0 ? (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Uploading...</span><span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #0052FF, #1F7A7A)' }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={uploadReport}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 4px 16px rgba(0,82,255,0.30)' }}
                    >
                      <FileUp size={15} />
                      {loading ? 'Uploading...' : 'Upload Report'}
                    </button>
                    {reportFile ? (
                      <button
                        type="button"
                        onClick={() => setReportFile(null)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
                      >
                        <X size={13} /> Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Recent Reports & Prescriptions side by side */}
              <div className="grid gap-4 md:grid-cols-2">

                {/* Recent Reports */}
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #0F2A44, #134E5E)' }}>
                      <FileText size={12} className="text-white" />
                    </div>
                    Recent Reports
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{reports.length}</span>
                  </p>
                  <div className="space-y-2">
                    {reports.slice(0, 4).map((report, i) => (
                      <a
                        key={report._id}
                        href={`http://localhost:3002${report.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                          <FileText size={14} className="text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-700 text-xs">{report.title}</p>
                          <p className="text-[10px] text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                        <ArrowUpRight size={13} className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-400" />
                      </a>
                    ))}
                    {reports.length === 0 ? <EmptyState icon={<FileText size={18} />} text="No reports uploaded yet." /> : null}
                  </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
                      <Pill size={12} className="text-white" />
                    </div>
                    Recent Prescriptions
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{prescriptions.length}</span>
                  </p>
                  <div className="space-y-2">
                    {prescriptions.slice(0, 4).map((item, i) => (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() => setSelectedPrescription(item)}
                        className="group w-full flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50">
                          <Stethoscope size={14} className="text-violet-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-700">Dr. {item.doctorName}</p>
                          <p className="truncate text-[10px] text-slate-400">{item.diagnosis || 'Diagnosis not specified'}</p>
                        </div>
                        <ChevronRight size={13} className="flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
                      </button>
                    ))}
                    {prescriptions.length === 0 ? <EmptyState icon={<Pill size={18} />} text="No prescriptions found." /> : null}
                  </div>
                </div>
              </div>
            </Section>

            {/* ── APPOINTMENTS ─────────────────────────────────── */}
            <Section>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #134E5E, #1F7A7A)' }}>
                      <CalendarCheck2 size={14} className="text-white" />
                    </div>
                    Booked Appointments
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">Your appointment timeline & visit history</p>
                </div>

                {/* Tabs */}
                <div className="ml-auto flex flex-wrap gap-2">
                  {appointmentTabs.map((tab) => {
                    const isActive = appointmentView === tab.key;
                    const colorMap = { blue: '#3B82F6', emerald: '#10B981', rose: '#F43F5E', slate: '#64748B' };
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAppointmentView(tab.key)}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={isActive ? {
                          background: colorMap[tab.color],
                          borderColor: colorMap[tab.color],
                          color: '#fff',
                          boxShadow: `0 4px 12px ${colorMap[tab.color]}40`
                        } : {
                          background: 'white',
                          borderColor: `${colorMap[tab.color]}30`,
                          color: colorMap[tab.color]
                        }}
                      >
                        {tab.label}
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? 'bg-white/25' : 'bg-current opacity-20'}`} style={isActive ? { color: '#fff' } : {}}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appointment Cards */}
              <div className="space-y-3">
                {visibleAppointments.map((item, index) => {
                  const statusMeta = getAppointmentStatusMeta(item.status);
                  const isExpanded = expandedAppointmentId === item._id;
                  const canCancel = statusMeta.status !== 'cancelled' && statusMeta.status !== 'completed';

                  const statusColors = {
                    completed: { bg: 'bg-emerald-50', border: 'border-emerald-200/70', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
                    cancelled: { bg: 'bg-rose-50', border: 'border-rose-200/70', badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
                    confirmed: { bg: 'bg-blue-50', border: 'border-blue-200/70', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
                    pending: { bg: 'bg-amber-50', border: 'border-amber-200/70', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
                  };
                  const sc = statusColors[statusMeta.status] || statusColors.pending;

                  return (
                    <div
                      key={item._id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg ${sc.border}`}
                      style={{ animation: `slideUpPop 0.35s ease both ${index * 0.06}s` }}
                    >
                      <div className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          {/* Doctor info */}
                          <div className="flex items-start gap-3">
                            {/* Doctor avatar placeholder */}
                            <div
                              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, #0F2A44, #1F7A7A)', boxShadow: '0 4px 12px rgba(15,42,68,0.25)' }}
                            >
                              {(item.doctorName || 'D').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                #{item.appointmentNumber || 'N/A'} · {item.specialization || 'General'}
                              </p>
                              <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                Dr. {item.doctorName || 'Doctor'}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <Clock size={11} />
                                <span>{formatAppointmentDate(item.appointmentDate)}</span>
                                {item.appointmentTimeSlot ? <><span className="text-slate-300">·</span><span>{item.appointmentTimeSlot}</span></> : null}
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="flex flex-col items-end gap-2">
                            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${sc.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${statusMeta.status === 'pending' || statusMeta.status === 'confirmed' ? 'animate-pulse' : ''}`} />
                              {statusMeta.label}
                            </span>
                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${item.appointmentType === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                              {item.appointmentType === 'video' ? '📹 Video' : '🏥 In-Person'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedAppointmentId(isExpanded ? null : item._id)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>

                          {item.appointmentType === 'video' && item.videoRoomLink && statusMeta.status !== 'cancelled' ? (
                            <a
                              href={item.videoRoomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                              style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 4px 12px rgba(0,82,255,0.30)' }}
                            >
                              <Video size={12} /> Join Call
                            </a>
                          ) : null}

                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => cancelAppointment(item._id)}
                              disabled={loading}
                              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          ) : null}
                        </div>

                        {/* Expanded details */}
                        {isExpanded ? (
                          <div
                            className="mt-3 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs md:grid-cols-2"
                            style={{ animation: 'slideUpPop 0.25s ease both' }}
                          >
                            <DetailPill label="Specialization" value={item.specialization || 'General'} />
                            <DetailPill label="Clinic / Hospital" value={item.hospitalOrClinicName || 'Not provided'} />
                            <DetailPill label="Date" value={formatAppointmentDate(item.appointmentDate)} />
                            <DetailPill label="Time Slot" value={item.appointmentTimeSlot || 'Time pending'} />
                            {item.notes ? <DetailPill label="Notes" value={item.notes} /> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Load More */}
                {(appointmentCollections[appointmentView] || []).length > visibleAppointmentCount ? (
                  <button
                    type="button"
                    onClick={() => setVisibleAppointmentCount((p) => p + 4)}
                    className="w-full rounded-2xl border border-dashed border-slate-200 bg-white/50 py-3 text-sm font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600"
                  >
                    Show More Appointments ↓
                  </button>
                ) : null}

                {appointments.length === 0 ? (
                  <EmptyState icon={<CalendarCheck2 size={24} />} text="No appointments booked yet." subtext="Book your first appointment using the button above." />
                ) : null}
                {appointments.length > 0 && visibleAppointments.length === 0 ? (
                  <EmptyState icon={<CalendarCheck2 size={24} />} text={`No ${appointmentView} appointments.`} />
                ) : null}
              </div>
            </Section>

          </div>{/* /main content */}
        </div>{/* /grid */}
      </div>{/* /container */}

      {/* ════════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
      ════════════════════════════════════════════════════════════ */}
      {isProfileEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl"
            style={{ animation: 'slideUpPop 0.3s ease' }}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #0F2A44, #134E5E)' }}>
                  <UserRoundPen size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Edit Patient Profile</h3>
                  <p className="text-xs text-slate-400">Update your personal & medical information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileEditing(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {/* Section: Personal Info */}
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Personal Information</p>
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <ModalField label="Full Name"><Input value={dashboardProfile.fullName} onChange={(e) => setDashboardProfile({ ...dashboardProfile, fullName: e.target.value })} /></ModalField>
                <ModalField label="Email"><Input value={dashboardProfile.email} onChange={(e) => setDashboardProfile({ ...dashboardProfile, email: e.target.value })} /></ModalField>
                <ModalField label="Phone Number"><Input value={dashboardProfile.phoneNumber} onChange={(e) => setDashboardProfile({ ...dashboardProfile, phoneNumber: e.target.value })} /></ModalField>
                <ModalField label="Date of Birth"><Input type="date" value={dashboardProfile.dateOfBirth} onChange={(e) => setDashboardProfile({ ...dashboardProfile, dateOfBirth: e.target.value })} /></ModalField>
                <ModalField label="Gender"><Input value={dashboardProfile.gender} onChange={(e) => setDashboardProfile({ ...dashboardProfile, gender: e.target.value })} /></ModalField>
                <ModalField label="National ID / NIC"><Input value={dashboardProfile.nationalId} onChange={(e) => setDashboardProfile({ ...dashboardProfile, nationalId: e.target.value })} /></ModalField>
                <ModalField label="Profile Photo URL"><Input value={dashboardProfile.profilePhoto} onChange={(e) => setDashboardProfile({ ...dashboardProfile, profilePhoto: e.target.value })} /></ModalField>
                <ModalField label="Blood Group"><Input value={dashboardProfile.bloodGroup} onChange={(e) => setDashboardProfile({ ...dashboardProfile, bloodGroup: e.target.value })} /></ModalField>
              </div>

              {/* Section: Medical Info */}
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Medical Information</p>
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <ModalField label="Known Allergies"><Input value={dashboardProfile.knownAllergies} onChange={(e) => setDashboardProfile({ ...dashboardProfile, knownAllergies: e.target.value })} /></ModalField>
                <ModalField label="Medical Conditions"><Input value={dashboardProfile.medicalConditions} onChange={(e) => setDashboardProfile({ ...dashboardProfile, medicalConditions: e.target.value })} /></ModalField>
                <ModalField label="Current Medications"><Input value={dashboardProfile.currentMedications} onChange={(e) => setDashboardProfile({ ...dashboardProfile, currentMedications: e.target.value })} /></ModalField>
              </div>

              {/* Section: Emergency Contact */}
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Emergency Contact</p>
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <ModalField label="Emergency Contact Name"><Input value={dashboardProfile.emergencyContactName} onChange={(e) => setDashboardProfile({ ...dashboardProfile, emergencyContactName: e.target.value })} /></ModalField>
                <ModalField label="Emergency Contact Phone"><Input value={dashboardProfile.emergencyContactPhone} onChange={(e) => setDashboardProfile({ ...dashboardProfile, emergencyContactPhone: e.target.value })} /></ModalField>
              </div>

              {/* Section: Address */}
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Address</p>
              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <ModalField label="Address Line"><Input value={dashboardProfile.addressLine} onChange={(e) => setDashboardProfile({ ...dashboardProfile, addressLine: e.target.value })} /></ModalField>
                <ModalField label="City"><Input value={dashboardProfile.city} onChange={(e) => setDashboardProfile({ ...dashboardProfile, city: e.target.value })} /></ModalField>
                <ModalField label="District"><Input value={dashboardProfile.district} onChange={(e) => setDashboardProfile({ ...dashboardProfile, district: e.target.value })} /></ModalField>
                <ModalField label="Postal Code"><Input value={dashboardProfile.postalCode} onChange={(e) => setDashboardProfile({ ...dashboardProfile, postalCode: e.target.value })} /></ModalField>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileEditing(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePatientProfile}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0F2A44, #134E5E)', boxShadow: '0 4px 16px rgba(15,42,68,0.25)' }}
                >
                  <Save size={14} />
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════════════════════
          PRESCRIPTION DETAIL MODAL
      ════════════════════════════════════════════════════════════ */}
      {selectedPrescription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl"
            style={{ animation: 'slideUpPop 0.3s ease' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between rounded-t-3xl border-b border-slate-100 px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #0F2A44, #1F7A7A)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <Pill size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Prescription Details</h3>
                  <p className="text-xs text-white/60">Dr. {selectedPrescription.doctorName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="rounded-xl bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 p-6">
              <PrescriptionDetailRow label="Doctor" value={selectedPrescription.doctorName || 'Doctor'} icon={<Stethoscope size={14} />} />
              <PrescriptionDetailRow label="Diagnosis" value={selectedPrescription.diagnosis || 'Not specified'} icon={<Activity size={14} />} highlight />
              <PrescriptionDetailRow label="Medications" value={Array.isArray(selectedPrescription.medications) ? selectedPrescription.medications.join(', ') : selectedPrescription.medications || 'Not specified'} icon={<Pill size={14} />} />
              <PrescriptionDetailRow label="Dosage Instructions" value={selectedPrescription.dosageInstructions || 'Not specified'} icon={<FileText size={14} />} />
              <PrescriptionDetailRow label="Recommended Tests" value={Array.isArray(selectedPrescription.testsRecommended) ? selectedPrescription.testsRecommended.join(', ') || 'Not specified' : selectedPrescription.testsRecommended || 'Not specified'} icon={<Activity size={14} />} />
              <PrescriptionDetailRow label="Follow-Up Date" value={selectedPrescription.followUpDate ? new Date(selectedPrescription.followUpDate).toLocaleDateString() : 'Not specified'} icon={<CalendarCheck2 size={14} />} />
              <PrescriptionDetailRow label="Notes" value={selectedPrescription.notes || 'No notes added'} icon={<FileText size={14} />} />
              <PrescriptionDetailRow label="Issued On" value={selectedPrescription.issuedAt || selectedPrescription.createdAt ? new Date(selectedPrescription.issuedAt || selectedPrescription.createdAt).toLocaleString() : 'Not available'} icon={<Clock size={14} />} />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function HeroBadge({ icon, label, accent }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
      accent ? 'border-rose-300/40 bg-rose-400/20 text-rose-100' : 'border-white/20 bg-white/12 text-white/85'
    }`}>
      {icon} {label}
    </div>
  );
}

function MetricCard({ icon, label, value, trend, trendUp, color, delay = '0s' }) {
  const count = useCountUp(value, 900);
  const colorMap = {
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    teal: { bg: 'from-teal-500 to-teal-600', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' },
    violet: { bg: 'from-violet-500 to-violet-600', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    emerald: { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl ${c.border}`}
      style={{ animation: `slideUpPop 0.4s ease both ${delay}` }}
    >
      {/* Gradient Top Accent */}
      <div className={`absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${c.bg}`} />

      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.light}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{count}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      {trend ? (
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.light} ${c.text}`}>
          {trendUp ? <TrendingUp size={9} /> : null} {trend}
        </div>
      ) : null}
    </div>
  );
}

function InfoChip({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      {icon} <span className="truncate">{label}</span>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  const colorMap = { emerald: 'text-emerald-600 bg-emerald-50', blue: 'text-blue-600 bg-blue-50' };
  return (
    <div className={`rounded-xl p-2.5 text-center ${colorMap[color] || 'text-slate-700 bg-slate-50'}`}>
      <p className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

function Section({ children }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-xl" style={{ boxShadow: '0 4px 24px rgba(15,42,68,0.07)' }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #0F2A44, #134E5E)' }}>
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h2 className="font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>{title}</h2>
        {subtitle ? <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ModalField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ icon, text, subtext }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{text}</p>
      {subtext ? <p className="text-xs text-slate-300">{subtext}</p> : null}
    </div>
  );
}

function DetailPill({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-2 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-700 leading-relaxed">{value}</p>
    </div>
  );
}

function PrescriptionDetailRow({ label, value, icon, highlight }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 ${highlight ? 'border border-blue-100 bg-blue-50/50' : 'border border-slate-100 bg-slate-50/50'}`}>
      <div className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-blue-500' : 'text-slate-400'}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-medium leading-relaxed ${highlight ? 'text-blue-800' : 'text-slate-700'}`}>{value}</p>
      </div>
    </div>
  );
}

export default PatientDashboard;
