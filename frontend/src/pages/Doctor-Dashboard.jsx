import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  CalendarCheck2,
  ClipboardPlus,
  Eye,
  FileText,
  Plus,
  Trash2,
  Save,
  Search,
  Stethoscope,
  UserPen,
  Video,
  X
} from 'lucide-react';

import { APPOINTMENT_API_URL, DOCTOR_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const initialProfile = {
  fullName: '',
  email: '',
  phoneNumber: '',
  profilePhoto: '',
  medicalLicenseNumber: '',
  specialization: '',
  yearsOfExperience: '',
  qualifications: '',
  hospitalOrClinicName: '',
  consultationFee: '',
  clinicAddress: '',
  city: '',
  district: '',
  bio: '',
  availabilityNotes: '',
  availabilitySchedule: []
};

const initialPrescription = {
  patientAuthUserId: '',
  doctorName: '',
  diagnosis: '',
  medications: '',
  dosageInstructions: '',
  testsRecommended: '',
  followUpDate: '',
  templateName: '',
  notes: ''
};

const prescriptionTemplates = [
  {
    id: 'general-fever',
    label: 'General Fever Care',
    diagnosis: 'Viral fever',
    medications: 'Paracetamol 500mg',
    dosageInstructions: '1 tablet every 8 hours after meals for 3 days',
    testsRecommended: 'CBC',
    notes: 'Hydrate well and rest. Return if fever persists above 3 days.'
  },
  {
    id: 'upper-respiratory',
    label: 'Upper Respiratory Infection',
    diagnosis: 'Upper respiratory tract infection',
    medications: 'Cetirizine 10mg, Cough syrup',
    dosageInstructions: 'Cetirizine: 1 tablet at night for 5 days; Cough syrup: 10ml twice daily',
    testsRecommended: 'CRP',
    notes: 'Warm fluids advised. Seek urgent care for breathing difficulty.'
  },
  {
    id: 'gastritis',
    label: 'Acute Gastritis',
    diagnosis: 'Acute gastritis',
    medications: 'Pantoprazole 40mg, Antacid suspension',
    dosageInstructions: 'Pantoprazole: once daily before breakfast for 14 days; Antacid as needed',
    testsRecommended: 'H. pylori stool antigen',
    notes: 'Avoid spicy and acidic food. Follow up if symptoms persist.'
  }
];

function DoctorDashboard({ session }) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescription);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [patientSearchId, setPatientSearchId] = useState('');
  const [patientReports, setPatientReports] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [bookedAppointmentDateFilter, setBookedAppointmentDateFilter] = useState('');
  const [newAvailabilityDate, setNewAvailabilityDate] = useState('');
  const [newAvailabilityStartTime, setNewAvailabilityStartTime] = useState('');
  const [newAvailabilityEndTime, setNewAvailabilityEndTime] = useState('');

  const minSelectableDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  }, []);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const parseQualifications = (value) => {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  };

  const loadDoctorDashboard = async () => {
    try {
      const response = await axios.get(`${DOCTOR_API_URL}/me/profile`, { headers: authHeader });
      const doctorProfile = response.data.profile || {};

      setProfile({
        fullName: doctorProfile.fullName || session.user.fullName || '',
        email: doctorProfile.email || session.user.email || '',
        phoneNumber: doctorProfile.phoneNumber || session.user.phoneNumber || '',
        profilePhoto: doctorProfile.profilePhoto || session.user.doctorProfile?.profilePhoto || '',
        medicalLicenseNumber: doctorProfile.medicalLicenseNumber || session.user.doctorProfile?.medicalLicenseNumber || '',
        specialization: doctorProfile.specialization || session.user.doctorProfile?.specialization || '',
        yearsOfExperience: doctorProfile.yearsOfExperience || session.user.doctorProfile?.yearsOfExperience || '',
        qualifications: parseQualifications(doctorProfile.qualifications || session.user.doctorProfile?.qualifications),
        hospitalOrClinicName: doctorProfile.hospitalOrClinicName || session.user.doctorProfile?.hospitalOrClinicName || '',
        consultationFee: doctorProfile.consultationFee || session.user.doctorProfile?.consultationFee || '',
        clinicAddress: doctorProfile.clinicAddress || session.user.doctorProfile?.clinicAddress || '',
        city: doctorProfile.city || session.user.doctorProfile?.city || '',
        district: doctorProfile.district || session.user.doctorProfile?.district || '',
        bio: doctorProfile.bio || '',
        availabilityNotes: doctorProfile.availabilityNotes || '',
        availabilitySchedule: Array.isArray(doctorProfile.availabilitySchedule)
          ? doctorProfile.availabilitySchedule.map((item) => ({
              date: item.date || '',
              timeSlots: Array.isArray(item.timeSlots) ? item.timeSlots : []
            }))
          : []
      });

      setPrescriptionForm((prev) => ({
        ...prev,
        doctorName: doctorProfile.fullName || session.user.fullName || ''
      }));

      const appointmentResponse = await axios.get(`${APPOINTMENT_API_URL}/me/doctor`, { headers: authHeader });
      setBookedAppointments(appointmentResponse.data.appointments || []);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to load doctor dashboard.');
    }
  };

  useEffect(() => {
    loadDoctorDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!prescriptionForm.patientAuthUserId.trim()) {
      setFeedback('Patient Auth User ID is required.');
      return;
    }

    if (!prescriptionForm.diagnosis.trim()) {
      setFeedback('Diagnosis is required before uploading prescription.');
      return;
    }

    if (!prescriptionForm.medications.trim()) {
      setFeedback('Please add at least one medication.');
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.post(`${DOCTOR_API_URL}/me/prescriptions`, prescriptionForm, {
        headers: authHeader
      });

      setFeedback(response.data.message || 'Prescription uploaded successfully.');
      setSelectedTemplateId('');
      setPrescriptionForm({
        ...initialPrescription,
        doctorName: profile.fullName || session.user.fullName || ''
      });
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to upload prescription.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReports = async () => {
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.get(`${DOCTOR_API_URL}/patient-reports`, {
        headers: authHeader,
        params: {
          patientAuthUserId: patientSearchId || undefined
        }
      });

      setPatientReports(response.data.reports || []);
      setFeedback(`Loaded ${response.data.count || 0} patient reports.`);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to load patient reports.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);

    const template = prescriptionTemplates.find((item) => item.id === templateId);
    if (!template) {
      setPrescriptionForm((prev) => ({
        ...prev,
        templateName: ''
      }));
      return;
    }

    setPrescriptionForm((prev) => ({
      ...prev,
      diagnosis: template.diagnosis,
      medications: template.medications,
      dosageInstructions: template.dosageInstructions,
      testsRecommended: template.testsRecommended,
      templateName: template.label,
      notes: template.notes
    }));
  };

  const addAvailabilityDate = () => {
    const date = newAvailabilityDate.trim();
    if (!date) {
      setFeedback('Select a date before adding availability.');
      return;
    }

    if (date < minSelectableDate) {
      setFeedback('Past dates cannot be added to availability schedule.');
      return;
    }

    const exists = profile.availabilitySchedule.some((item) => item.date === date);
    if (exists) {
      setFeedback('This date is already added. Add time slots for it below.');
      return;
    }

    setProfile((prev) => ({
      ...prev,
      availabilitySchedule: [...prev.availabilitySchedule, { date, timeSlots: [] }]
    }));
    setNewAvailabilityDate('');
    setFeedback('');
  };

  const removeAvailabilityDate = (date) => {
    setProfile((prev) => ({
      ...prev,
      availabilitySchedule: prev.availabilitySchedule.filter((item) => item.date !== date)
    }));
  };

  const addAvailabilitySlot = (date) => {
    if (!newAvailabilityStartTime || !newAvailabilityEndTime) {
      setFeedback('Select both start and end times.');
      return;
    }

    if (newAvailabilityStartTime >= newAvailabilityEndTime) {
      setFeedback('End time must be later than start time.');
      return;
    }

    const slot = `${newAvailabilityStartTime}-${newAvailabilityEndTime}`;

    setProfile((prev) => ({
      ...prev,
      availabilitySchedule: prev.availabilitySchedule.map((item) => {
        if (item.date !== date) {
          return item;
        }

        if (item.timeSlots.includes(slot)) {
          return item;
        }

        return {
          ...item,
          timeSlots: [...item.timeSlots, slot]
        };
      })
    }));

    setNewAvailabilityStartTime('');
    setNewAvailabilityEndTime('');
    setFeedback('');
  };

  const removeAvailabilitySlot = (date, slot) => {
    setProfile((prev) => ({
      ...prev,
      availabilitySchedule: prev.availabilitySchedule.map((item) => {
        if (item.date !== date) {
          return item;
        }

        return {
          ...item,
          timeSlots: item.timeSlots.filter((timeSlot) => timeSlot !== slot)
        };
      })
    }));
  };

  const totalSlots = profile.availabilitySchedule.reduce((sum, item) => sum + item.timeSlots.length, 0);

  const filteredBookedAppointments = bookedAppointmentDateFilter
    ? bookedAppointments.filter((item) => item.appointmentDate === bookedAppointmentDateFilter)
    : bookedAppointments;

  const initials = (profile.fullName || session.user.fullName || 'D')
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

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="bg-white/52">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Doctor profile" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-lake/20" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lake text-lg font-bold text-white">{initials}</div>
              )}
              <div>
                <p className="text-base font-bold text-lake">{profile.fullName || 'Doctor Profile'}</p>
                <p className="text-xs text-ink/70">{profile.specialization || 'Specialization not set'}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/40 bg-white/60 p-3 text-sm text-ink/80">
              <p><strong>License:</strong> {profile.medicalLicenseNumber || 'Not set'}</p>
              <p><strong>Experience:</strong> {profile.yearsOfExperience || 0} years</p>
              <p><strong>Hospital:</strong> {profile.hospitalOrClinicName || 'Not set'}</p>
              <p><strong>Fee:</strong> {profile.consultationFee ? `LKR ${profile.consultationFee}` : 'Not set'}</p>
              <p><strong>Available Dates:</strong> {profile.availabilitySchedule.length}</p>
              <p><strong>Total Slots:</strong> {totalSlots}</p>
            </div>

            <Button className="mt-4 w-full" onClick={() => setEditing(true)}>
              <UserPen size={15} /> Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/56">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope size={18} /> Doctor Clinical Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-white/45 bg-white/65 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-lake">
                <ClipboardPlus size={16} /> Upload Digital Prescription
              </p>
              <Field label="Prescription Template" className="mb-3">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
                >
                  <option value="">No template (custom)</option>
                  {prescriptionTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.label}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Patient Auth User ID">
                  <Input
                    value={prescriptionForm.patientAuthUserId}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientAuthUserId: e.target.value })}
                  />
                </Field>
                <Field label="Doctor Name">
                  <Input
                    value={prescriptionForm.doctorName}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctorName: e.target.value })}
                  />
                </Field>
                <Field label="Diagnosis">
                  <Input
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                  />
                </Field>
                <Field label="Medications (comma-separated)">
                  <Input
                    value={prescriptionForm.medications}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medications: e.target.value })}
                  />
                </Field>
                <Field label="Dosage Instructions">
                  <Input
                    value={prescriptionForm.dosageInstructions}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosageInstructions: e.target.value })}
                  />
                </Field>
                <Field label="Recommended Tests">
                  <Input
                    value={prescriptionForm.testsRecommended}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, testsRecommended: e.target.value })}
                  />
                </Field>
                <Field label="Follow-Up Date">
                  <Input
                    type="date"
                    value={prescriptionForm.followUpDate}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpDate: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Notes" className="mt-3">
                <Input
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                />
              </Field>
              <Button className="mt-3" onClick={submitPrescription} disabled={loading}>
                <FileText size={15} /> {loading ? 'Submitting...' : 'Upload Prescription'}
              </Button>
            </div>

            <div className="rounded-2xl border border-white/45 bg-white/65 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-lake">
                <Eye size={16} /> View Patient Uploaded Reports
              </p>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  placeholder="Optional: Patient Auth User ID"
                  value={patientSearchId}
                  onChange={(e) => setPatientSearchId(e.target.value)}
                />
                <Button variant="secondary" onClick={fetchPatientReports} disabled={loading}>
                  <Search size={15} /> {loading ? 'Loading...' : 'Search'}
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {patientReports.length === 0 ? (
                  <p className="rounded-xl border border-lake/10 bg-white px-3 py-2 text-sm text-ink/65">No reports to display.</p>
                ) : (
                  patientReports.map((report) => (
                    <a
                      key={report._id}
                      href={`http://localhost:3002${report.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-lake/10 bg-white p-3 transition hover:border-lake/30"
                    >
                      <p className="font-semibold text-lake">{report.title}</p>
                      <p className="text-xs text-ink/70">Patient ID: {report.patientAuthUserId}</p>
                      <p className="text-xs text-ink/60">{new Date(report.createdAt).toLocaleString()}</p>
                    </a>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/45 bg-white/65 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-lake">
                <CalendarCheck2 size={16} /> Booked Appointments
              </p>

              <div className="mb-3 flex flex-col gap-2 md:flex-row">
                <Input
                  type="date"
                  value={bookedAppointmentDateFilter}
                  onChange={(e) => setBookedAppointmentDateFilter(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookedAppointmentDateFilter('')}
                  disabled={!bookedAppointmentDateFilter}
                >
                  Clear Filter
                </Button>
              </div>

              <div className="space-y-2">
                {filteredBookedAppointments.slice(0, 6).map((appointment) => (
                  <div key={appointment._id} className="rounded-xl border border-lake/10 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                      Appointment #{appointment.appointmentNumber || '-'}
                    </p>
                    <p className="font-semibold text-lake">{appointment.patientName}</p>
                    <p className="text-xs text-ink/70">{appointment.patientEmail} | {appointment.patientPhoneNumber}</p>
                    <p className="text-xs text-ink/70">
                      {appointment.appointmentDate} at {appointment.appointmentTimeSlot} ({appointment.appointmentType})
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">Status: {appointment.status}</p>
                      {appointment.appointmentType === 'video' && appointment.videoRoomLink && appointment.status !== 'cancelled' ? (
                        <Button asChild type="button" size="sm" variant="secondary">
                          <a href={appointment.videoRoomLink} target="_blank" rel="noreferrer">
                            <Video size={14} /> Join Call
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {filteredBookedAppointments.length === 0 ? (
                  <p className="rounded-xl border border-lake/10 bg-white px-3 py-2 text-sm text-ink/65">No appointments booked yet.</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-white/92">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPen size={18} /> Edit Doctor Profile
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X size={16} /> Close
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Field label="Full Name"><Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
              <Field label="Email"><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
              <Field label="Phone Number"><Input value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} /></Field>
              <Field label="Profile Photo URL / Base64"><Input value={profile.profilePhoto} onChange={(e) => setProfile({ ...profile, profilePhoto: e.target.value })} /></Field>
              <Field label="Medical License Number"><Input value={profile.medicalLicenseNumber} onChange={(e) => setProfile({ ...profile, medicalLicenseNumber: e.target.value })} /></Field>
              <Field label="Specialization"><Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} /></Field>
              <Field label="Years of Experience"><Input type="number" value={profile.yearsOfExperience} onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })} /></Field>
              <Field label="Qualifications (comma-separated)"><Input value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} /></Field>
              <Field label="Hospital / Clinic Name"><Input value={profile.hospitalOrClinicName} onChange={(e) => setProfile({ ...profile, hospitalOrClinicName: e.target.value })} /></Field>
              <Field label="Consultation Fee"><Input type="number" value={profile.consultationFee} onChange={(e) => setProfile({ ...profile, consultationFee: e.target.value })} /></Field>
              <Field label="Clinic Address"><Input value={profile.clinicAddress} onChange={(e) => setProfile({ ...profile, clinicAddress: e.target.value })} /></Field>
              <Field label="City"><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></Field>
              <Field label="District"><Input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} /></Field>
              <Field label="Bio"><Input value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></Field>
              <Field label="Availability Notes"><Input value={profile.availabilityNotes} onChange={(e) => setProfile({ ...profile, availabilityNotes: e.target.value })} /></Field>

              <div className="col-span-full mt-1 rounded-2xl border border-lake/15 bg-white/70 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-lake">
                  <CalendarDays size={16} /> Appointment Availability Schedule
                </p>

                <div className="mb-3 flex flex-col gap-2 md:flex-row">
                  <Input
                    type="date"
                    value={newAvailabilityDate}
                    min={minSelectableDate}
                    onChange={(e) => setNewAvailabilityDate(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={addAvailabilityDate}>
                    <Plus size={14} /> Add Date
                  </Button>
                </div>

                {profile.availabilitySchedule.length === 0 ? (
                  <p className="text-sm text-ink/65">No availability dates added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.availabilitySchedule.map((entry) => (
                      <div key={entry.date} className="rounded-xl border border-lake/10 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-lake">{entry.date}</p>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAvailabilityDate(entry.date)}>
                            <Trash2 size={14} /> Remove Date
                          </Button>
                        </div>

                        <div className="mb-2 flex flex-col gap-2 md:flex-row">
                          <Input
                            type="time"
                            value={newAvailabilityStartTime}
                            onChange={(e) => setNewAvailabilityStartTime(e.target.value)}
                          />
                          <Input
                            type="time"
                            value={newAvailabilityEndTime}
                            onChange={(e) => setNewAvailabilityEndTime(e.target.value)}
                          />
                          <Button type="button" variant="outline" onClick={() => addAvailabilitySlot(entry.date)}>
                            <Plus size={14} /> Add Slot
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {entry.timeSlots.length === 0 ? (
                            <p className="text-sm text-ink/65">No slots added yet for this date.</p>
                          ) : (
                            entry.timeSlots.map((slot) => (
                              <span key={`${entry.date}-${slot}`} className="inline-flex items-center gap-1 rounded-lg border border-lake/20 bg-lake/5 px-2 py-1 text-xs font-medium text-lake">
                                {slot}
                                <button
                                  type="button"
                                  onClick={() => removeAvailabilitySlot(entry.date, slot)}
                                  className="rounded p-0.5 transition hover:bg-lake/15"
                                  aria-label={`Remove ${slot}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-full mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={saveProfile} disabled={loading}>
                  <Save size={15} /> {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium text-ink/80 ${className}`}>
      {label}
      {children}
    </label>
  );
}

export default DoctorDashboard;
