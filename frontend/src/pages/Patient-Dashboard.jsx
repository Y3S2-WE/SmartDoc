import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  FileUp,
  HeartPulse,
  MapPin,
  Pill,
  Save,
  Stethoscope,
  Upload,
  UserRound,
  UserRoundPen,
  Video,
  X
} from 'lucide-react';

import { PATIENT_API_URL } from '../lib/api';
import { APPOINTMENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const initialDashboardProfile = {
  fullName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  nationalId: '',
  profilePhoto: '',
  bloodGroup: '',
  knownAllergies: '',
  medicalConditions: '',
  currentMedications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  addressLine: '',
  city: '',
  district: '',
  postalCode: ''
};

function PatientDashboard({ session }) {
  const [dashboardProfile, setDashboardProfile] = useState(initialDashboardProfile);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [appointmentView, setAppointmentView] = useState('upcoming');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [visibleAppointmentCount, setVisibleAppointmentCount] = useState(4);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const normalizeArrayField = (value) => {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  };

  const parseAppointmentDate = (dateValue) => {
    if (!dateValue) {
      return null;
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  const normalizeAppointmentStatus = (status) => String(status || 'pending').toLowerCase();

  const parsePrescriptionDate = (dateValue) => {
    if (!dateValue) {
      return null;
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  const formatPrescriptionDate = (dateValue, fallback = 'Date not available') => {
    const parsedDate = parsePrescriptionDate(dateValue);

    if (!parsedDate) {
      return fallback;
    }

    return parsedDate.toLocaleDateString();
  };

  const normalizeListField = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ');
    }

    if (!value) {
      return '';
    }

    return String(value);
  };

  const isUpcomingAppointment = (item) => {
    const status = normalizeAppointmentStatus(item.status);

    if (status === 'cancelled' || status === 'completed') {
      return false;
    }

    const date = parseAppointmentDate(item.appointmentDate);

    if (!date) {
      return true;
    }

    date.setHours(23, 59, 59, 999);
    return date >= new Date();
  };

  const formatAppointmentDate = (dateValue) => {
    const parsedDate = parseAppointmentDate(dateValue);

    if (!parsedDate) {
      return 'Date pending';
    }

    return parsedDate.toLocaleDateString();
  };

  const getAppointmentStatusMeta = (status) => {
    const normalizedStatus = normalizeAppointmentStatus(status);

    if (normalizedStatus === 'completed') {
      return {
        status: normalizedStatus,
        label: 'Completed',
        className: 'border border-emerald-200 bg-emerald-100 text-emerald-700'
      };
    }

    if (normalizedStatus === 'cancelled') {
      return {
        status: normalizedStatus,
        label: 'Cancelled',
        className: 'border border-rose-200 bg-rose-100 text-rose-700'
      };
    }

    if (normalizedStatus === 'confirmed') {
      return {
        status: normalizedStatus,
        label: 'Confirmed',
        className: 'border border-blue-200 bg-blue-100 text-blue-700'
      };
    }

    if (normalizedStatus === 'pending') {
      return {
        status: normalizedStatus,
        label: 'Pending',
        className: 'border border-amber-200 bg-amber-100 text-amber-700'
      };
    }

    return {
      status: normalizedStatus,
      label: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1),
      className: 'border border-slate-200 bg-slate-100 text-slate-700'
    };
  };

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = parseAppointmentDate(a.appointmentDate);
      const dateB = parseAppointmentDate(b.appointmentDate);

      if (!dateA && !dateB) {
        return 0;
      }

      if (!dateA) {
        return 1;
      }

      if (!dateB) {
        return -1;
      }

      return dateA - dateB;
    });
  }, [appointments]);

  const appointmentCollections = useMemo(() => {
    const upcoming = [];
    const completed = [];
    const cancelled = [];

    sortedAppointments.forEach((item) => {
      const status = normalizeAppointmentStatus(item.status);

      if (status === 'cancelled') {
        cancelled.push(item);
        return;
      }

      if (status === 'completed') {
        completed.push(item);
        return;
      }

      if (isUpcomingAppointment(item)) {
        upcoming.push(item);
        return;
      }

      completed.push(item);
    });

    return {
      upcoming,
      completed: [...completed].sort((a, b) => {
        const dateA = parseAppointmentDate(a.appointmentDate);
        const dateB = parseAppointmentDate(b.appointmentDate);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return dateB - dateA;
      }),
      cancelled: [...cancelled].sort((a, b) => {
        const dateA = parseAppointmentDate(a.appointmentDate);
        const dateB = parseAppointmentDate(b.appointmentDate);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return dateB - dateA;
      }),
      all: sortedAppointments
    };
  }, [sortedAppointments]);

  const appointmentTabs = useMemo(
    () => [
      { key: 'upcoming', label: 'Upcoming', count: appointmentCollections.upcoming.length },
      { key: 'completed', label: 'Completed', count: appointmentCollections.completed.length },
      { key: 'cancelled', label: 'Cancelled', count: appointmentCollections.cancelled.length },
      { key: 'all', label: 'All', count: appointmentCollections.all.length }
    ],
    [appointmentCollections]
  );

  const visibleAppointments = useMemo(() => {
    const activeAppointments = appointmentCollections[appointmentView] || [];
    return activeAppointments.slice(0, visibleAppointmentCount);
  }, [appointmentCollections, appointmentView, visibleAppointmentCount]);

  const visiblePrescriptions = useMemo(() => {
    return [...prescriptions].sort((a, b) => {
      const dateA = parsePrescriptionDate(a.issuedAt || a.createdAt);
      const dateB = parsePrescriptionDate(b.issuedAt || b.createdAt);

      if (!dateA && !dateB) {
        return 0;
      }

      if (!dateA) {
        return 1;
      }

      if (!dateB) {
        return -1;
      }

      return dateB - dateA;
    });
  }, [prescriptions]);

  useEffect(() => {
    setVisibleAppointmentCount(4);
    setExpandedAppointmentId(null);
  }, [appointmentView]);

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
      setFeedback(error.response?.data?.message || 'Unable to load patient dashboard.');
    }
  };

  useEffect(() => {
    loadPatientDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePatientProfile = async () => {
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.put(`${PATIENT_API_URL}/me/profile`, dashboardProfile, { headers: authHeader });
      setIsProfileEditing(false);
      setFeedback(response.data.message || 'Profile saved.');
      await loadPatientDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  const uploadReport = async () => {
    if (!reportFile) {
      setFeedback('Please choose a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', reportFile);
    formData.append('title', reportTitle);
    formData.append('description', reportDescription);

    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.post(`${PATIENT_API_URL}/me/reports`, formData, {
        headers: {
          ...authHeader,
          'Content-Type': 'multipart/form-data'
        }
      });

      setFeedback(response.data.message || 'Report uploaded.');
      setReportFile(null);
      setReportTitle('');
      setReportDescription('');
      await loadPatientDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    const shouldCancel = window.confirm('Are you sure you want to cancel this appointment?');
    if (!shouldCancel) {
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.patch(`${APPOINTMENT_API_URL}/me/patient/${appointmentId}/cancel`, {}, { headers: authHeader });
      setFeedback(response.data.message || 'Appointment cancelled successfully.');
      await loadPatientDashboard();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (dashboardProfile.fullName || session.user.fullName || 'P')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {feedback ? (
        <p className="mb-4 rounded-xl border border-white/30 bg-white/55 px-4 py-3 text-sm font-medium text-lake backdrop-blur">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="bg-white/50">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lake text-base font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="text-base font-bold text-lake">{dashboardProfile.fullName || 'Patient Profile'}</p>
                <p className="text-xs text-ink/70">{dashboardProfile.email || session.user.email}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/40 bg-white/55 p-3 text-sm">
              <p className="flex items-center gap-2 text-ink/80">
                <HeartPulse size={15} className="text-ember" /> Blood Group: {dashboardProfile.bloodGroup || 'Not set'}
              </p>
              <p className="flex items-center gap-2 text-ink/80">
                <MapPin size={15} className="text-lake" /> {dashboardProfile.city || 'City not set'}
              </p>
              <p className="flex items-center gap-2 text-ink/80">
                <UserRound size={15} className="text-lake" /> {dashboardProfile.phoneNumber || 'Phone not set'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <StatTag label="Reports" value={String(reports.length)} />
              <StatTag label="Prescriptions" value={String(prescriptions.length)} />
              <StatTag label="Appointments" value={String(appointments.length)} />
            </div>

            <Button className="mt-4 w-full" onClick={() => setIsProfileEditing(true)}>
              <UserRoundPen size={15} /> Edit Full Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/52">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp size={18} /> Medical Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-white/45 bg-white/60 p-4">
              <p className="mb-3 text-sm font-semibold text-lake">Upload Medical Report</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Report Title">
                  <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                </Field>
                <Field label="Description">
                  <Input value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} />
                </Field>
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-lake/40 bg-white p-3 text-sm text-ink/80">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Upload size={16} /> Choose document
                </span>
                <input type="file" className="hidden" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
              </label>
              <Button className="mt-3" onClick={uploadReport} disabled={loading}>
                <FileUp size={16} /> {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/45 bg-white/60 p-4">
                <p className="mb-2 text-sm font-semibold text-lake">Recent Reports</p>
                <div className="space-y-2">
                  {reports.slice(0, 4).map((report) => (
                    <a
                      key={report._id}
                      href={`http://localhost:3002${report.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-lake/10 bg-white p-2 text-sm transition hover:border-lake/30"
                    >
                      <p className="font-semibold text-lake">{report.title}</p>
                      <p className="text-xs text-ink/65">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </a>
                  ))}
                  {reports.length === 0 ? <p className="text-sm text-ink/65">No reports uploaded yet.</p> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/45 bg-white/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-lake">
                    <Pill size={15} /> Prescriptions
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {visiblePrescriptions.slice(0, 6).map((item) => {
                    const medicationsCount = Array.isArray(item.medications)
                      ? item.medications.filter(Boolean).length
                      : normalizeListField(item.medications)
                          .split(',')
                          .map((entry) => entry.trim())
                          .filter(Boolean).length;

                    return (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() => setSelectedPrescription(item)}
                        className="w-full rounded-xl border border-lake/10 bg-white p-3 text-left text-sm transition hover:border-lake/35 hover:shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="flex items-center gap-2 font-semibold text-lake">
                              <Stethoscope size={14} /> Dr. {item.doctorName || 'Doctor'}
                            </p>
                            <p className="text-[11px] text-ink/60">
                              Issued {formatPrescriptionDate(item.issuedAt || item.createdAt)}
                            </p>
                          </div>
                          <span className="rounded-full border border-lake/20 bg-lake/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lake/80">
                            {item.templateName || 'Custom'}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-ink/75">{item.diagnosis || 'Diagnosis not specified'}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/70">
                            {medicationsCount} medication{medicationsCount === 1 ? '' : 's'}
                          </span>
                          {item.followUpDate ? (
                            <span className="rounded-full bg-lake/10 px-2 py-0.5 text-[10px] font-semibold text-lake/80">
                              Follow-up {formatPrescriptionDate(item.followUpDate)}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-[11px] font-semibold text-lake/75">View full details</p>
                      </button>
                    );
                  })}

                  {prescriptions.length === 0 ? <p className="text-sm text-ink/65">No prescriptions found.</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/45 bg-white/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-lake">
                  <CalendarCheck2 size={15} /> Booked Appointments
                </p>
                <div className="flex flex-wrap gap-2">
                  {appointmentTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAppointmentView(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        appointmentView === tab.key
                          ? 'border-lake bg-lake text-white'
                          : 'border-lake/25 bg-white text-lake hover:border-lake/45'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          appointmentView === tab.key ? 'bg-white/25 text-white' : 'bg-lake/10 text-lake'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <StatTag label="Upcoming" value={String(appointmentCollections.upcoming.length)} />
                <StatTag label="Completed" value={String(appointmentCollections.completed.length)} />
                <StatTag label="Cancelled" value={String(appointmentCollections.cancelled.length)} />
                <StatTag label="Total" value={String(appointmentCollections.all.length)} />
              </div>

              <div className="space-y-3">
                {visibleAppointments.map((item) => {
                  const statusMeta = getAppointmentStatusMeta(item.status);
                  const isExpanded = expandedAppointmentId === item._id;
                  const canCancel = statusMeta.status !== 'cancelled' && statusMeta.status !== 'completed';

                  return (
                    <div key={item._id} className="rounded-xl border border-lake/15 bg-white p-3 text-sm shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                            Appointment #{item.appointmentNumber || '-'}
                          </p>
                          <p className="font-semibold text-lake">Dr. {item.doctorName || 'Doctor'}</p>
                          <p className="text-xs text-ink/70">{formatAppointmentDate(item.appointmentDate)} at {item.appointmentTimeSlot || 'Time pending'}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-ink/70">{item.appointmentType === 'video' ? 'Video Consultation' : 'In-person Consultation'}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedAppointmentId(isExpanded ? null : item._id)}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                          {item.appointmentType === 'video' && item.videoRoomLink && statusMeta.status !== 'cancelled' ? (
                            <Button asChild type="button" size="sm" variant="secondary">
                              <a href={item.videoRoomLink} target="_blank" rel="noreferrer">
                                <Video size={14} /> Join Call
                              </a>
                            </Button>
                          ) : null}
                          {canCancel ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => cancelAppointment(item._id)}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="mt-3 grid gap-2 rounded-lg border border-lake/10 bg-lake/5 p-3 text-xs text-ink/75 md:grid-cols-2">
                          <p>
                            <span className="font-semibold text-ink/80">Specialization:</span> {item.specialization || 'General'}
                          </p>
                          <p>
                            <span className="font-semibold text-ink/80">Clinic:</span> {item.hospitalOrClinicName || 'Hospital / Clinic not provided'}
                          </p>
                          <p>
                            <span className="font-semibold text-ink/80">Appointment Date:</span> {formatAppointmentDate(item.appointmentDate)}
                          </p>
                          <p>
                            <span className="font-semibold text-ink/80">Time Slot:</span> {item.appointmentTimeSlot || 'Time pending'}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {(appointmentCollections[appointmentView] || []).length > visibleAppointmentCount ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setVisibleAppointmentCount((previous) => previous + 4)}
                  >
                    Show More Appointments
                  </Button>
                ) : null}

                {appointments.length === 0 ? <p className="text-sm text-ink/65">No appointments booked yet.</p> : null}
                {appointments.length > 0 && visibleAppointments.length === 0 ? (
                  <p className="text-sm text-ink/65">No appointments in this category.</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isProfileEditing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-white/90">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserRoundPen size={18} /> Edit Patient Profile
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileEditing(false)}>
                <X size={16} /> Close
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Field label="Full Name"><Input value={dashboardProfile.fullName} onChange={(e) => setDashboardProfile({ ...dashboardProfile, fullName: e.target.value })} /></Field>
              <Field label="Email"><Input value={dashboardProfile.email} onChange={(e) => setDashboardProfile({ ...dashboardProfile, email: e.target.value })} /></Field>
              <Field label="Phone Number"><Input value={dashboardProfile.phoneNumber} onChange={(e) => setDashboardProfile({ ...dashboardProfile, phoneNumber: e.target.value })} /></Field>
              <Field label="Date of Birth"><Input type="date" value={dashboardProfile.dateOfBirth} onChange={(e) => setDashboardProfile({ ...dashboardProfile, dateOfBirth: e.target.value })} /></Field>
              <Field label="Gender"><Input value={dashboardProfile.gender} onChange={(e) => setDashboardProfile({ ...dashboardProfile, gender: e.target.value })} /></Field>
              <Field label="National ID / NIC"><Input value={dashboardProfile.nationalId} onChange={(e) => setDashboardProfile({ ...dashboardProfile, nationalId: e.target.value })} /></Field>
              <Field label="Profile Photo URL"><Input value={dashboardProfile.profilePhoto} onChange={(e) => setDashboardProfile({ ...dashboardProfile, profilePhoto: e.target.value })} /></Field>
              <Field label="Blood Group"><Input value={dashboardProfile.bloodGroup} onChange={(e) => setDashboardProfile({ ...dashboardProfile, bloodGroup: e.target.value })} /></Field>
              <Field label="Known Allergies"><Input value={dashboardProfile.knownAllergies} onChange={(e) => setDashboardProfile({ ...dashboardProfile, knownAllergies: e.target.value })} /></Field>
              <Field label="Medical Conditions"><Input value={dashboardProfile.medicalConditions} onChange={(e) => setDashboardProfile({ ...dashboardProfile, medicalConditions: e.target.value })} /></Field>
              <Field label="Current Medications"><Input value={dashboardProfile.currentMedications} onChange={(e) => setDashboardProfile({ ...dashboardProfile, currentMedications: e.target.value })} /></Field>
              <Field label="Emergency Contact Name"><Input value={dashboardProfile.emergencyContactName} onChange={(e) => setDashboardProfile({ ...dashboardProfile, emergencyContactName: e.target.value })} /></Field>
              <Field label="Emergency Contact Phone"><Input value={dashboardProfile.emergencyContactPhone} onChange={(e) => setDashboardProfile({ ...dashboardProfile, emergencyContactPhone: e.target.value })} /></Field>
              <Field label="Address Line"><Input value={dashboardProfile.addressLine} onChange={(e) => setDashboardProfile({ ...dashboardProfile, addressLine: e.target.value })} /></Field>
              <Field label="City"><Input value={dashboardProfile.city} onChange={(e) => setDashboardProfile({ ...dashboardProfile, city: e.target.value })} /></Field>
              <Field label="District"><Input value={dashboardProfile.district} onChange={(e) => setDashboardProfile({ ...dashboardProfile, district: e.target.value })} /></Field>
              <Field label="Postal Code"><Input value={dashboardProfile.postalCode} onChange={(e) => setDashboardProfile({ ...dashboardProfile, postalCode: e.target.value })} /></Field>

              <div className="col-span-full mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsProfileEditing(false)}>Cancel</Button>
                <Button onClick={savePatientProfile} disabled={loading}>
                  <Save size={15} /> {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedPrescription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white/95">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill size={18} /> Prescription Details
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPrescription(null)}>
                <X size={16} /> Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-2xl border border-lake/15 bg-lake/5 p-3 md:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">Doctor</p>
                  <p className="mt-1 text-sm font-semibold text-lake">Dr. {selectedPrescription.doctorName || 'Doctor'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">Issued On</p>
                  <p className="mt-1 text-sm font-medium text-ink/80">
                    {formatPrescriptionDate(selectedPrescription.issuedAt || selectedPrescription.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">Template</p>
                  <p className="mt-1 text-sm font-medium text-ink/80">{selectedPrescription.templateName || 'Custom prescription'}</p>
                </div>
              </div>

              <DetailRow label="Diagnosis" value={selectedPrescription.diagnosis || 'Not specified'} />
              <DetailRow label="Dosage Instructions" value={selectedPrescription.dosageInstructions || 'Not specified'} />
              <DetailRow label="Notes" value={selectedPrescription.notes || 'No notes added'} />

              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow
                  label="Medications"
                  value={normalizeListField(selectedPrescription.medications) || 'Not specified'}
                />
                <DetailRow
                  label="Recommended Tests"
                  value={normalizeListField(selectedPrescription.testsRecommended) || 'Not specified'}
                />
              </div>

              <DetailRow
                label="Follow-Up Date"
                value={
                  selectedPrescription.followUpDate
                    ? formatPrescriptionDate(selectedPrescription.followUpDate)
                    : 'Not specified'
                }
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
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

function StatTag({ label, value }) {
  return (
    <div className="rounded-xl border border-white/45 bg-white/70 px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/60">{label}</p>
      <p className="text-sm font-bold text-lake">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-lake/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink/85">{value}</p>
    </div>
  );
}

export default PatientDashboard;
