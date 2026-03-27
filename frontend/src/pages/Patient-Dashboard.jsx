import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarCheck2,
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

  const loadPatientDashboard = async () => {
    try {
      const [profileRes, reportsRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        axios.get(`${PATIENT_API_URL}/me/profile`, { headers: authHeader }),
        axios.get(`${PATIENT_API_URL}/me/reports`, { headers: authHeader }),
        axios.get(`${PATIENT_API_URL}/me/prescriptions`, { headers: authHeader }),
        axios.get(`${APPOINTMENT_API_URL}/me/patient`, { headers: authHeader })
      ]);

      const profile = profileRes.data.profile || {};
      setDashboardProfile({
        fullName: profile.fullName || session.user.fullName || '',
        email: profile.email || session.user.email || '',
        phoneNumber: profile.phoneNumber || session.user.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
        gender: profile.gender || '',
        nationalId: profile.nationalId || '',
        profilePhoto: profile.profilePhoto || '',
        bloodGroup: profile.bloodGroup || '',
        knownAllergies: normalizeArrayField(profile.knownAllergies),
        medicalConditions: normalizeArrayField(profile.medicalConditions),
        currentMedications: normalizeArrayField(profile.currentMedications),
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        addressLine: profile.addressLine || '',
        city: profile.city || '',
        district: profile.district || '',
        postalCode: profile.postalCode || ''
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
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-lake">
                  <Pill size={15} /> Recent Prescriptions
                </p>
                <div className="space-y-2">
                  {prescriptions.slice(0, 4).map((item) => (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => setSelectedPrescription(item)}
                      className="w-full rounded-lg border border-lake/10 bg-white p-2 text-left text-sm transition hover:border-lake/30"
                    >
                      <p className="flex items-center gap-2 font-semibold text-lake">
                        <Stethoscope size={14} /> {item.doctorName}
                      </p>
                      <p className="text-xs text-ink/70">{item.diagnosis || 'Diagnosis not specified'}</p>
                      <p className="mt-1 text-[11px] font-semibold text-lake/70">Click to view full details</p>
                    </button>
                  ))}
                  {prescriptions.length === 0 ? <p className="text-sm text-ink/65">No prescriptions found.</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/45 bg-white/60 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-lake">
                <CalendarCheck2 size={15} /> Booked Appointments
              </p>
              <div className="space-y-2">
                {appointments.slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-lg border border-lake/10 bg-white p-2 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                      Appointment #{item.appointmentNumber || '-'}
                    </p>
                    <p className="font-semibold text-lake">Dr. {item.doctorName}</p>
                    <p className="text-xs text-ink/70">{item.specialization || 'General'}</p>
                    <p className="text-xs text-ink/70">{item.hospitalOrClinicName || 'Hospital / Clinic not provided'}</p>
                    <p className="text-xs text-ink/70">
                      {item.appointmentDate} at {item.appointmentTimeSlot} ({item.appointmentType})
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">Status: {item.status}</p>
                      <div className="flex items-center gap-2">
                        {item.appointmentType === 'video' && item.videoRoomLink && item.status !== 'cancelled' ? (
                          <Button asChild type="button" size="sm" variant="secondary">
                            <a href={item.videoRoomLink} target="_blank" rel="noreferrer">
                              <Video size={14} /> Join Call
                            </a>
                          </Button>
                        ) : null}
                        {item.status !== 'cancelled' ? (
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
                  </div>
                ))}
                {appointments.length === 0 ? <p className="text-sm text-ink/65">No appointments booked yet.</p> : null}
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
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Doctor" value={selectedPrescription.doctorName || 'Doctor'} />
              <DetailRow label="Diagnosis" value={selectedPrescription.diagnosis || 'Not specified'} />
              <DetailRow
                label="Medications"
                value={Array.isArray(selectedPrescription.medications) ? selectedPrescription.medications.join(', ') : selectedPrescription.medications || 'Not specified'}
              />
              <DetailRow label="Dosage Instructions" value={selectedPrescription.dosageInstructions || 'Not specified'} />
              <DetailRow
                label="Recommended Tests"
                value={
                  Array.isArray(selectedPrescription.testsRecommended)
                    ? selectedPrescription.testsRecommended.join(', ') || 'Not specified'
                    : selectedPrescription.testsRecommended || 'Not specified'
                }
              />
              <DetailRow
                label="Follow-Up Date"
                value={
                  selectedPrescription.followUpDate
                    ? new Date(selectedPrescription.followUpDate).toLocaleDateString()
                    : 'Not specified'
                }
              />
              <DetailRow label="Template" value={selectedPrescription.templateName || 'Custom prescription'} />
              <DetailRow label="Notes" value={selectedPrescription.notes || 'No notes added'} />
              <DetailRow
                label="Issued On"
                value={
                  selectedPrescription.issuedAt || selectedPrescription.createdAt
                    ? new Date(selectedPrescription.issuedAt || selectedPrescription.createdAt).toLocaleString()
                    : 'Not available'
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
