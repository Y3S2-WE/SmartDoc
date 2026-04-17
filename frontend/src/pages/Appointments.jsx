import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  HeartPulse,
  MapPin,
  Phone,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  User,
  Video,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

import { AUTH_API_URL, DOCTOR_API_URL, PATIENT_API_URL } from '../lib/api';
import { Input } from '../components/ui/input';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const initialForm = {
  appointmentType: 'physical',
  patientName: '',
  patientEmail: '',
  patientPhoneNumber: '',
  patientAddress: '',
  appointmentDate: '',
  appointmentTimeSlot: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(0\d{9}|\+94\d{9})$/;

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────────────────── */
function DoctorSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex gap-4">
        <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-4 w-40 rounded-full bg-slate-200" />
          <div className="h-3 w-24 rounded-full bg-slate-100" />
          <div className="h-3 w-32 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function AppointmentsPage({ session }) {
  const navigate = useNavigate();
  const bookingPanelRef = useRef(null);

  const minSelectableDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  }, []);

  /* ── State ───────────────────────────────────────────────────────── */
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [doctorProfiles, setDoctorProfiles] = useState({});
  const [searchName, setSearchName] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    ...initialForm,
    patientName: session.user.fullName || '',
    patientEmail: session.user.email || '',
    patientPhoneNumber: session.user.phoneNumber || '',
    patientAddress:
      session.user.addressLine ||
      session.user.address ||
      session.user.patientProfile?.addressLine ||
      '',
  });

  /* ── Data loading ────────────────────────────────────────────────── */
  useEffect(() => {
    const loadApprovedDoctors = async () => {
      setLoading(true);
      setFeedback({ message: '', type: 'info' });
      try {
        const response = await axios.get(`${AUTH_API_URL}/doctors/approved`);
        const doctors = response.data.doctors || [];
        setApprovedDoctors(doctors);

        const profileEntries = await Promise.all(
          doctors.map(async (doctor) => {
            try {
              const profileResponse = await axios.get(
                `${DOCTOR_API_URL}/public/${doctor._id}/profile`
              );
              return [doctor._id, profileResponse.data.profile || {}];
            } catch {
              return [doctor._id, {}];
            }
          })
        );
        setDoctorProfiles(Object.fromEntries(profileEntries));
      } catch (error) {
        setFeedback({
          message: error.response?.data?.message || 'Unable to load approved doctors.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    loadApprovedDoctors();
  }, []);

  useEffect(() => {
    const loadPatientAddress = async () => {
      try {
        const response = await axios.get(`${PATIENT_API_URL}/me/profile`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const profile = response.data.profile || {};
        const address = profile.addressLine || '';
        if (address) setForm((prev) => ({ ...prev, patientAddress: address }));
      } catch {
        // fallback to session address
      }
    };
    loadPatientAddress();
  }, [session.token]);

  /* ── Derived data ────────────────────────────────────────────────── */
  const specializationOptions = useMemo(() => {
    const values = approvedDoctors
      .map(
        (doctor) =>
          doctor.doctorProfile?.specialization ||
          doctorProfiles[doctor._id]?.specialization ||
          ''
      )
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [approvedDoctors, doctorProfiles]);

  const filteredDoctors = useMemo(() => {
    return approvedDoctors.filter((doctor) => {
      const profile = doctorProfiles[doctor._id] || {};
      const name = doctor.fullName || '';
      const specialization =
        doctor.doctorProfile?.specialization || profile.specialization || '';
      const hospital =
        doctor.doctorProfile?.hospitalOrClinicName ||
        profile.hospitalOrClinicName ||
        '';
      const nameMatches = name.toLowerCase().includes(searchName.trim().toLowerCase());
      const specializationMatches =
        specializationFilter === 'all' || specialization === specializationFilter;
      const hospitalMatches = hospital
        .toLowerCase()
        .includes(hospitalFilter.trim().toLowerCase());
      return nameMatches && specializationMatches && hospitalMatches;
    });
  }, [approvedDoctors, doctorProfiles, searchName, specializationFilter, hospitalFilter]);

  const selectedDoctor =
    approvedDoctors.find((doctor) => doctor._id === selectedDoctorId) || null;
  const selectedDoctorProfile = selectedDoctor
    ? doctorProfiles[selectedDoctor._id] || {}
    : null;

  const selectedAvailability = (
    selectedDoctorProfile?.availabilitySchedule || []
  ).filter((item) => item?.date && item.date >= minSelectableDate);

  const selectedDateAvailability = selectedAvailability.find(
    (item) => item.date === form.appointmentDate
  );
  const availableSlots = selectedDateAvailability?.timeSlots || [];

  useEffect(() => {
    if (!form.appointmentDate) return;
    const isAvailableDate = selectedAvailability.some(
      (item) => item.date === form.appointmentDate
    );
    if (!isAvailableDate) {
      setForm((prev) => ({ ...prev, appointmentDate: '', appointmentTimeSlot: '' }));
    }
  }, [form.appointmentDate, selectedAvailability]);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const handleBookNow = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setForm((prev) => ({ ...prev, appointmentDate: '', appointmentTimeSlot: '' }));
    setFeedback({ message: '', type: 'info' });
    setTimeout(() => {
      bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSearchNameChange = (event) => {
    const value = event.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) setSearchName(value);
  };

  const proceedToCheckout = (event) => {
    event.preventDefault();
    const normalizedEmail = form.patientEmail.trim();
    const normalizedPhone = form.patientPhoneNumber.trim();

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      setFeedback({
        message: 'Please enter a valid email address (example: name@email.com).',
        type: 'error',
      });
      return;
    }
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
      setFeedback({
        message:
          'Please enter a valid phone number: 10 digits starting with 0 or +94 followed by 9 digits.',
        type: 'error',
      });
      return;
    }
    if (!selectedDoctor || !selectedDoctorProfile) {
      setFeedback({ message: 'Please select a doctor first.', type: 'error' });
      return;
    }
    if (!form.appointmentDate || !form.appointmentTimeSlot) {
      setFeedback({ message: 'Please pick an available date and time slot.', type: 'error' });
      return;
    }
    if (form.appointmentDate < minSelectableDate) {
      setFeedback({ message: 'Past dates are not available for booking.', type: 'error' });
      return;
    }

    const checkoutDraft = {
      doctorAuthUserId: selectedDoctor._id,
      doctorName: selectedDoctor.fullName,
      doctorEmail: selectedDoctor.email || '',
      doctorPhoneNumber: selectedDoctor.phoneNumber || '',
      specialization:
        selectedDoctor.doctorProfile?.specialization ||
        selectedDoctorProfile.specialization ||
        '',
      hospitalOrClinicName:
        selectedDoctor.doctorProfile?.hospitalOrClinicName ||
        selectedDoctorProfile.hospitalOrClinicName ||
        '',
      doctorProfilePhoto:
        selectedDoctor.doctorProfile?.profilePhoto ||
        selectedDoctorProfile.profilePhoto ||
        '',
      channellingFee: Number(
        selectedDoctor.doctorProfile?.consultationFee ||
          selectedDoctorProfile.consultationFee ||
          0
      ),
      appointmentType: form.appointmentType,
      appointmentDate: form.appointmentDate,
      appointmentTimeSlot: form.appointmentTimeSlot,
      patientName: form.patientName,
      patientEmail: normalizedEmail,
      patientPhoneNumber: normalizedPhone,
      patientAddress: form.patientAddress,
    };

    localStorage.setItem('smartdoc_pending_checkout', JSON.stringify(checkoutDraft));
    navigate('/checkout', { state: { checkoutDraft, sessionToken: session.token } });
  };

  const consultationFee =
    selectedDoctor?.doctorProfile?.consultationFee ||
    selectedDoctorProfile?.consultationFee ||
    0;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)',
      }}
    >
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,82,255,0.05) 0%, transparent 70%)',
            top: -200, left: -200,
            animation: 'blobFloat 14s ease-in-out infinite alternate',
          }}
        />
        <div
          style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(31,122,122,0.07) 0%, transparent 70%)',
            top: '40%', right: -150,
            animation: 'blobFloat 10s ease-in-out infinite alternate-reverse',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(15,42,68,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(15,42,68,0.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-8" style={{ zIndex: 1 }}>

        {/* ════════════════════════════════════════════════════════════
            HERO HEADER
        ════════════════════════════════════════════════════════════ */}
        <div
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 55%, #1F7A7A 100%)',
            boxShadow: '0 20px 70px rgba(15,42,68,0.25), 0 8px 28px rgba(0,82,255,0.10)',
            animation: 'fadeInUp 0.6s ease both',
          }}
        >
          {/* Glows */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 15% 60%, rgba(77,124,255,0.20) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(31,122,122,0.25) 0%, transparent 50%)',
          }} />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }} />

          <div className="relative flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
            <div style={{ animation: 'fadeInLeft 0.7s ease both 0.1s', animationFillMode: 'both' }}>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
                <HeartPulse size={12} className="text-emerald-400" />
                SmartDoc — Instant Booking
              </div>
              <h1
                className="mb-2 font-black text-white"
                style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', lineHeight: 1.15 }}
              >
                Find & Book Your Doctor
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-white/70">
                Browse verified specialists, choose your preferred consultation mode, and confirm your slot in minutes — all from one place.
              </p>

              {/* Trust badges */}
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { icon: <Shield size={12} />, label: 'Board-Certified Doctors' },
                  { icon: <Zap size={12} />, label: 'Instant Confirmation' },
                  { icon: <Video size={12} />, label: 'Video & In-Person' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur"
                  >
                    <span className="text-emerald-400">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats right side */}
            <div
              className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row"
              style={{ animation: 'fadeInRight 0.7s ease both 0.2s', animationFillMode: 'both' }}
            >
              {[
                { label: 'Verified Doctors', value: approvedDoctors.length || '—' },
                { label: 'Specializations', value: specializationOptions.length || '—' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-7 py-5 backdrop-blur"
                >
                  <span className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {stat.value}
                  </span>
                  <span className="mt-0.5 text-xs text-white/60">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating decorative icons */}
          <div className="pointer-events-none absolute right-6 top-4 opacity-10 md:opacity-15" style={{ animation: 'floatY 7s ease-in-out infinite' }}>
            <Stethoscope size={90} className="text-white" />
          </div>
          <div className="pointer-events-none absolute right-32 bottom-3 hidden opacity-10 md:block" style={{ animation: 'floatY 9s ease-in-out infinite 2s' }}>
            <CalendarCheck2 size={50} className="text-teal-300" />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            GLOBAL FEEDBACK TOAST
        ════════════════════════════════════════════════════════════ */}
        {feedback.message ? (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-xl ${
              feedback.type === 'success'
                ? 'border-emerald-200/60 bg-emerald-50/90 text-emerald-800'
                : feedback.type === 'error'
                ? 'border-rose-200/60 bg-rose-50/90 text-rose-800'
                : 'border-blue-200/60 bg-blue-50/90 text-blue-800'
            }`}
            style={{ animation: 'slideUpPop 0.3s ease' }}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500" />
            ) : feedback.type === 'error' ? (
              <XCircle size={16} className="flex-shrink-0 text-rose-500" />
            ) : (
              <AlertCircle size={16} className="flex-shrink-0 text-blue-500" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback({ message: '', type: 'info' })}
              className="opacity-50 transition hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {/* ════════════════════════════════════════════════════════════
            MAIN 2-COLUMN GRID
        ════════════════════════════════════════════════════════════ */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">

          {/* ── LEFT: DOCTOR DIRECTORY ────────────────────────────── */}
          <div>
            {/* Sticky search + filter bar */}
            <div
              className="mb-4 overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-md backdrop-blur-xl lg:sticky lg:top-4"
              style={{ zIndex: 20, boxShadow: '0 4px 24px rgba(15,42,68,0.08)' }}
            >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <Search size={15} className="text-blue-500" />
                    Find a Doctor
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      showFilters
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Filter size={12} />
                    Filters
                    {(specializationFilter !== 'all' || hospitalFilter) ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
                        {(specializationFilter !== 'all' ? 1 : 0) + (hospitalFilter ? 1 : 0)}
                      </span>
                    ) : null}
                  </button>
                </div>

                {/* Primary search */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search by doctor name..."
                    value={searchName}
                    onChange={handleSearchNameChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                  />
                  {searchName ? (
                    <button
                      type="button"
                      onClick={() => setSearchName('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>

                {/* Expandable filters */}
                {showFilters ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2" style={{ animation: 'slideUpPop 0.2s ease' }}>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Specialization</p>
                      <select
                        value={specializationFilter}
                        onChange={(e) => setSpecializationFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="all">All Specializations</option>
                        {specializationOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Hospital / Clinic</p>
                      <div className="relative">
                        <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          placeholder="Filter by clinic name..."
                          value={hospitalFilter}
                          onChange={(e) => setHospitalFilter(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    {(specializationFilter !== 'all' || hospitalFilter) ? (
                      <button
                        type="button"
                        onClick={() => { setSpecializationFilter('all'); setHospitalFilter(''); }}
                        className="col-span-full text-left text-xs text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        ✕ Clear all filters
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {/* Result count */}
                {!loading && approvedDoctors.length > 0 ? (
                  <p className="mt-3 text-[11px] text-slate-400 font-medium">
                    Showing <span className="font-bold text-slate-600">{filteredDoctors.length}</span> of {approvedDoctors.length} doctors
                  </p>
                ) : null}
              </div>
            </div>

            {/* Doctor list */}
            <div className="space-y-3">
              {loading ? (
                <>
                  <DoctorSkeleton /><DoctorSkeleton /><DoctorSkeleton />
                </>
              ) : filteredDoctors.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 py-14 text-center backdrop-blur">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Search size={22} className="text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-500">No doctors match your filters</p>
                  <p className="text-sm text-slate-400">Try adjusting your search or clearing filters</p>
                </div>
              ) : (
                filteredDoctors.map((doctor, index) => {
                  const profile = doctorProfiles[doctor._id] || {};
                  const photo = doctor.doctorProfile?.profilePhoto || profile.profilePhoto || '';
                  const specialization =
                    doctor.doctorProfile?.specialization || profile.specialization || '';
                  const hospital =
                    doctor.doctorProfile?.hospitalOrClinicName || profile.hospitalOrClinicName || '';
                  const fee =
                    doctor.doctorProfile?.consultationFee || profile.consultationFee || 0;
                  const experience =
                    doctor.doctorProfile?.yearsOfExperience || profile.yearsOfExperience || '';
                  const isSelected = doctor._id === selectedDoctorId;
                  const doctorInitials = (doctor.fullName || 'D')
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={doctor._id}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-teal-50 shadow-lg'
                          : 'border-white/70 bg-white/80 shadow-sm hover:border-blue-200 hover:shadow-md'
                      }`}
                      style={{
                        animation: `slideUpPop 0.35s ease both ${index * 0.05}s`,
                        backdropFilter: 'blur(12px)',
                        ...(isSelected
                          ? { boxShadow: '0 8px 32px rgba(0,82,255,0.15)' }
                          : {}),
                      }}
                    >
                      {/* Selected indicator bar */}
                      {isSelected ? (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{ background: 'linear-gradient(180deg, #0052FF, #1F7A7A)' }}
                        />
                      ) : null}

                      <div className="p-4 pl-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {photo ? (
                              <img
                                src={photo}
                                alt={doctor.fullName}
                                className="h-18 w-18 rounded-2xl object-cover"
                                style={{
                                  width: 72, height: 72,
                                  boxShadow: isSelected
                                    ? '0 4px 18px rgba(0,82,255,0.25)'
                                    : '0 2px 8px rgba(15,42,68,0.15)',
                                  border: isSelected ? '2px solid rgba(0,82,255,0.4)' : '2px solid rgba(255,255,255,0.8)',
                                }}
                              />
                            ) : (
                              <div
                                className="flex items-center justify-center rounded-2xl text-base font-bold text-white"
                                style={{
                                  width: 72, height: 72,
                                  background: isSelected
                                    ? 'linear-gradient(135deg, #0052FF, #1F7A7A)'
                                    : 'linear-gradient(135deg, #0F2A44, #134E5E)',
                                  boxShadow: '0 4px 16px rgba(15,42,68,0.25)',
                                }}
                              >
                                {doctorInitials}
                              </div>
                            )}
                            {/* Online dot */}
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                  Dr. {doctor.fullName}
                                </p>
                                {isSelected ? (
                                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    <CheckCircle2 size={9} /> Selected
                                  </span>
                                ) : null}
                              </div>

                              <div className="text-right">
                                <p className="text-base font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                  LKR {Number(fee).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400">Consultation Fee</p>
                              </div>
                            </div>

                            {/* Specialization chip */}
                            {specialization ? (
                              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: 'rgba(0,82,255,0.08)', borderColor: 'rgba(0,82,255,0.18)', color: '#2563EB' }}>
                                <Stethoscope size={10} />
                                {specialization}
                              </div>
                            ) : null}

                            {/* Hospital & Experience */}
                            <div className="space-y-1 text-xs text-slate-500">
                              {hospital ? (
                                <p className="flex items-center gap-1.5">
                                  <Building2 size={11} className="flex-shrink-0 text-teal-500" />
                                  {hospital}
                                </p>
                              ) : null}
                              {experience ? (
                                <p className="flex items-center gap-1.5">
                                  <Star size={11} className="flex-shrink-0 text-amber-500" />
                                  {experience} years of experience
                                </p>
                              ) : null}
                            </div>

                            {/* Availability chips */}
                            {doctorProfiles[doctor._id]?.availabilitySchedule?.length > 0 ? (
                              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CalendarDays size={11} />
                                {doctorProfiles[doctor._id].availabilitySchedule.filter(s => s.date >= minSelectableDate).length} available date(s)
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="mt-4 flex items-center gap-2 pl-0">
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => { setSelectedDoctorId(''); }}
                              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                            >
                              <X size={12} /> Deselect
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleBookNow(doctor._id)}
                            className={`group/btn flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 ${
                              isSelected ? 'opacity-70' : ''
                            }`}
                            style={{
                              background: isSelected
                                ? 'linear-gradient(135deg, #1F7A7A, #134E5E)'
                                : 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                              boxShadow: isSelected
                                ? '0 4px 16px rgba(31,122,122,0.30)'
                                : '0 4px 16px rgba(0,82,255,0.30)',
                            }}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 size={14} />
                                Edit Booking
                              </>
                            ) : (
                              <>
                                <CalendarCheck2 size={14} />
                                Book Now
                                <ChevronRight size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: BOOKING PANEL ──────────────────────────────── */}
          <div ref={bookingPanelRef} className="lg:sticky lg:top-4">
            {!selectedDoctor ? (
              /* Empty state */
              <div
                className="overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-lg backdrop-blur-xl"
                style={{ boxShadow: '0 8px 40px rgba(15,42,68,0.08)' }}
              >
                <div className="flex flex-col items-center gap-5 px-8 py-16 text-center">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-3xl"
                    style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.10), rgba(31,122,122,0.10))' }}
                  >
                    <CalendarCheck2 size={36} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="mb-2 text-lg font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Choose a Doctor
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Select a doctor from the directory on the left to begin your booking journey.
                    </p>
                  </div>
                  {/* Step indicators */}
                  <div className="mt-2 w-full space-y-2">
                    {[
                      { step: 1, label: 'Browse & select a doctor', done: false },
                      { step: 2, label: 'Choose consultation type', done: false },
                      { step: 3, label: 'Pick date & time slot', done: false },
                      { step: 4, label: 'Review & checkout', done: false },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-500">
                          {s.step}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Booking form */
              <div
                className="overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-xl backdrop-blur-xl"
                style={{ boxShadow: '0 12px 60px rgba(15,42,68,0.10)', animation: 'slideUpPop 0.35s ease' }}
              >
                {/* Header bar */}
                <div
                  className="px-6 pt-6 pb-5"
                  style={{
                    background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 60%, #1F7A7A 100%)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
                        Booking with
                      </p>
                      <p className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Dr. {selectedDoctor.fullName}
                      </p>
                      <p className="text-sm text-white/70 mt-0.5">
                        {selectedDoctor.doctorProfile?.specialization ||
                          selectedDoctorProfile?.specialization ||
                          'Specialist'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDoctorId('')}
                      className="rounded-xl bg-white/12 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Selected doctor mini card */}
                  <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                    {selectedDoctor.doctorProfile?.profilePhoto ||
                    selectedDoctorProfile?.profilePhoto ? (
                      <img
                        src={
                          selectedDoctor.doctorProfile?.profilePhoto ||
                          selectedDoctorProfile?.profilePhoto
                        }
                        alt="Selected doctor"
                        className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                        style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        {(selectedDoctor.fullName || 'D')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">
                        {selectedDoctor.doctorProfile?.hospitalOrClinicName ||
                          selectedDoctorProfile?.hospitalOrClinicName ||
                          'Hospital not set'}
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        Fee: LKR {Number(consultationFee).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1">
                      <p className="text-[10px] font-bold text-emerald-300">VERIFIED</p>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <form onSubmit={proceedToCheckout} className="p-6 space-y-5">

                  {/* Step 1: Patient Info */}
                  <FormSection step={1} title="Your Information">
                    <div className="grid gap-3 md:grid-cols-2">
                      <PremiumField label="Full Name" icon={<User size={13} />}>
                        <input
                          value={form.patientName}
                          onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                          placeholder="Your full name"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </PremiumField>
                      <PremiumField label="Email Address" icon={<Sparkles size={13} />}>
                        <input
                          type="email"
                          value={form.patientEmail}
                          onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                          placeholder="name@email.com"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </PremiumField>
                      <PremiumField label="Phone Number" icon={<Phone size={13} />}>
                        <input
                          type="tel"
                          placeholder="07XXXXXXXX or +947XXXXXXXX"
                          value={form.patientPhoneNumber}
                          onChange={(e) =>
                            setForm({ ...form, patientPhoneNumber: e.target.value })
                          }
                          pattern="^(0[0-9]{9}|\+94[0-9]{9})$"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </PremiumField>
                      <PremiumField label="Address" icon={<MapPin size={13} />}>
                        <input
                          value={form.patientAddress}
                          onChange={(e) =>
                            setForm({ ...form, patientAddress: e.target.value })
                          }
                          placeholder="Your home address"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </PremiumField>
                    </div>
                  </FormSection>

                  {/* Step 2: Consultation Type */}
                  <FormSection step={2} title="Consultation Type">
                    <div className="grid grid-cols-2 gap-3">
                      <ConsultTypeButton
                        label="Physical"
                        sublabel="Visit the clinic"
                        icon={<Stethoscope size={18} />}
                        active={form.appointmentType === 'physical'}
                        onClick={() => setForm({ ...form, appointmentType: 'physical' })}
                      />
                      <ConsultTypeButton
                        label="Video Call"
                        sublabel="Join online session"
                        icon={<Video size={18} />}
                        active={form.appointmentType === 'video'}
                        onClick={() => setForm({ ...form, appointmentType: 'video' })}
                      />
                    </div>
                  </FormSection>

                  {/* Step 3: Date & Time Slot */}
                  <FormSection step={3} title="Date & Time Slot">
                    {selectedAvailability.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
                        <p className="text-sm text-amber-700">
                          No upcoming availability slots for this doctor.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Date selector */}
                        <div className="mb-3">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Select Date
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAvailability.slice(0, 8).map((item) => {
                              const d = new Date(item.date + 'T00:00:00');
                              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                              const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
                              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                              const isActive = form.appointmentDate === item.date;
                              return (
                                <button
                                  key={item.date}
                                  type="button"
                                  onClick={() =>
                                    setForm({
                                      ...form,
                                      appointmentDate: item.date,
                                      appointmentTimeSlot: '',
                                    })
                                  }
                                  className={`flex flex-col items-center rounded-xl border px-3 py-2.5 text-center transition-all hover:-translate-y-0.5 ${
                                    isActive
                                      ? 'border-blue-400 text-white shadow-md'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                                  }`}
                                  style={isActive ? {
                                    background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                                    boxShadow: '0 4px 16px rgba(0,82,255,0.30)'
                                  } : {}}
                                >
                                  <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{dayName}</span>
                                  <span className={`text-lg font-black leading-tight ${isActive ? 'text-white' : 'text-slate-700'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{dayNum}</span>
                                  <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{monthName}</span>
                                </button>
                              );
                            })}
                          </div>
                          {selectedAvailability.length > 8 ? (
                            <div className="mt-2">
                              <select
                                value={form.appointmentDate}
                                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value, appointmentTimeSlot: '' })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">More dates...</option>
                                {selectedAvailability.slice(8).map((item) => (
                                  <option key={item.date} value={item.date}>{item.date}</option>
                                ))}
                              </select>
                            </div>
                          ) : null}
                        </div>

                        {/* Time slot pills */}
                        {form.appointmentDate && (
                          <div style={{ animation: 'slideUpPop 0.25s ease' }}>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Available Time Slots
                            </p>
                            {availableSlots.length === 0 ? (
                              <p className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-400">
                                No time slots available for this date.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availableSlots.map((slot) => {
                                  const isActive = form.appointmentTimeSlot === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() =>
                                        setForm({ ...form, appointmentTimeSlot: slot })
                                      }
                                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                                        isActive
                                          ? 'border-blue-400 text-white shadow-md'
                                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                                      }`}
                                      style={isActive ? {
                                        background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                                        boxShadow: '0 4px 12px rgba(0,82,255,0.28)'
                                      } : {}}
                                    >
                                      <Clock size={12} className={isActive ? 'text-blue-200' : 'text-slate-400'} />
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </FormSection>

                  {/* Step 4: Booking Summary */}
                  {form.appointmentDate && form.appointmentTimeSlot ? (
                    <FormSection step={4} title="Booking Summary">
                      <div
                        className="space-y-2 rounded-2xl border p-4"
                        style={{ background: 'linear-gradient(135deg, #F8FAFF, #F0F9F9)', borderColor: 'rgba(0,82,255,0.12)' }}
                      >
                        <SummaryRow icon={<User size={13} />} label="Doctor" value={`Dr. ${selectedDoctor.fullName}`} />
                        <SummaryRow icon={<Stethoscope size={13} />} label="Type" value={form.appointmentType === 'video' ? '📹 Video Consultation' : '🏥 In-Person Visit'} />
                        <SummaryRow icon={<CalendarDays size={13} />} label="Date" value={form.appointmentDate} />
                        <SummaryRow icon={<Clock size={13} />} label="Time" value={form.appointmentTimeSlot} />
                        <div className="my-2 border-t border-blue-100" />
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <DollarSign size={14} className="text-blue-500" />
                            Total Fee
                          </span>
                          <span className="text-base font-black text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            LKR {Number(consultationFee).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </FormSection>
                  ) : null}

                  {/* Checkout CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #0F2A44 0%, #0052FF 60%, #4D7CFF 100%)',
                      boxShadow: '0 8px 32px rgba(0,82,255,0.38)',
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CalendarCheck2 size={18} />
                        Proceed to Checkout
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                    <Shield size={11} className="text-emerald-500" />
                    Secure booking · No payment until confirmed
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function FormSection({ step, title, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
          style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)' }}
        >
          {step}
        </div>
        <p className="text-sm font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function PremiumField({ label, icon, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-blue-400">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function ConsultTypeButton({ label, sublabel, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border py-4 px-3 text-center transition-all hover:-translate-y-0.5 ${
        active
          ? 'border-blue-400 text-white shadow-lg'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
        boxShadow: '0 6px 20px rgba(0,82,255,0.30)'
      } : {}}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
        <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
      </div>
      <div>
        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-700'}`}>{label}</p>
        <p className={`text-[10px] font-medium ${active ? 'text-blue-100' : 'text-slate-400'}`}>{sublabel}</p>
      </div>
      {active ? <CheckCircle2 size={14} className="text-white/80" /> : null}
    </button>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
        <span className="text-blue-400">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

export default AppointmentsPage;
