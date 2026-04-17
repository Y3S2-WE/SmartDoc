import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, CheckCircle2, Droplets, HeartPulse, Lock, Mail, MapPin,
  Phone, ShieldPlus, User, UserPlus
} from 'lucide-react';

import { AUTH_API_URL, PATIENT_API_URL } from '../lib/api';

const GENDER_OPTIONS = ['male', 'female', 'other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const initialState = {
  fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '',
  dateOfBirth: '', gender: '', nationalId: '', profilePhoto: '', bloodGroup: '',
  knownAllergies: '', medicalConditions: '', currentMedications: '',
  emergencyContactName: '', emergencyContactPhone: '',
  addressLine: '', city: '', district: '', postalCode: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nicRegex = /^(\d{9}[VvXx]|\d{12})$/;
const normalizePhone = (v) => String(v || '').replace(/\D/g, '');
const isPhoneNumber = (v) => normalizePhone(v).length === 10;
const limitPhoneDigits = (v) => normalizePhone(v).slice(0, 10);
const isValidNic = (v) => nicRegex.test(String(v || '').trim());

const getFieldError = (fieldName, values) => {
  switch (fieldName) {
    case 'fullName':
      if (!values.fullName.trim()) return 'Full name is required.';
      if (values.fullName.trim().length < 3) return 'At least 3 characters.';
      if (/\d/.test(values.fullName)) return 'No numbers in name.';
      return '';
    case 'email':
      if (!values.email.trim()) return 'Email is required.';
      if (!emailRegex.test(values.email.trim())) return 'Invalid email address.';
      return '';
    case 'password':
      if (!values.password) return 'Password is required.';
      if (values.password.length < 6) return 'At least 6 characters.';
      return '';
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Please confirm password.';
      if (values.password !== values.confirmPassword) return 'Passwords do not match.';
      return '';
    case 'phoneNumber':
      if (!values.phoneNumber.trim()) return 'Phone number is required.';
      if (!isPhoneNumber(values.phoneNumber)) return 'Enter a valid 10-digit number.';
      return '';
    case 'dateOfBirth': {
      if (!values.dateOfBirth) return 'Date of birth is required.';
      const d = new Date(values.dateOfBirth);
      if (isNaN(d.getTime()) || d > new Date()) return 'Enter a valid past date.';
      return '';
    }
    case 'gender':
      if (!values.gender) return 'Gender is required.';
      if (!GENDER_OPTIONS.includes(values.gender)) return 'Select a valid gender.';
      return '';
    case 'bloodGroup':
      if (!values.bloodGroup) return 'Blood group is required.';
      if (!BLOOD_GROUP_OPTIONS.includes(values.bloodGroup)) return 'Select a valid blood group.';
      return '';
    case 'emergencyContactPhone':
      if (values.emergencyContactPhone && !isPhoneNumber(values.emergencyContactPhone)) return '10 digits required.';
      return '';
    case 'nationalId':
      if (values.nationalId && !isValidNic(values.nationalId)) return 'NIC: 12 digits or 9 + V/X.';
      return '';
    default:
      return '';
  }
};

const validateForm = (values) => {
  const errors = {};
  ['fullName', 'email', 'password', 'confirmPassword', 'phoneNumber',
    'dateOfBirth', 'gender', 'bloodGroup', 'emergencyContactPhone', 'nationalId'].forEach((f) => {
    const err = getFieldError(f, values);
    if (err) errors[f] = err;
  });
  return errors;
};

/* ── Section step config ── */
const STEPS = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Personal', icon: HeartPulse },
  { id: 3, label: 'Medical', icon: Droplets },
  { id: 4, label: 'Emergency & Address', icon: MapPin },
];

function PatientRegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const updateField = (fieldName, value) => {
    setForm((prev) => {
      const next = { ...prev, [fieldName]: value };
      setErrors((prevErr) => {
        const nextErr = { ...prevErr };
        const err = getFieldError(fieldName, next);
        if (err) nextErr[fieldName] = err; else delete nextErr[fieldName];
        if (fieldName === 'password' || fieldName === 'confirmPassword') {
          const cpErr = getFieldError('confirmPassword', next);
          if (cpErr) nextErr.confirmPassword = cpErr; else delete nextErr.confirmPassword;
        }
        return nextErr;
      });
      return next;
    });
  };

  const updatePhoneField = (fieldName, value) => updateField(fieldName, limitPhoneDigits(value));

  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setFeedback('Please fix the highlighted fields and try again.');
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_URL}/register/patient`, form);
      try {
        await axios.put(`${PATIENT_API_URL}/me/profile`, form, {
          headers: { Authorization: `Bearer ${response.data.token}` },
        });
      } catch { /* non-fatal */ }
      onLogin(response.data);
      navigate('/dashboard/patient');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Patient registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)' }}
    >
      {/* BG */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,82,255,0.05) 0%, transparent 70%)', top: -150, right: -150 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,122,122,0.07) 0%, transparent 70%)', bottom: -100, left: -100 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(15,42,68,0.025) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative mx-auto max-w-5xl" style={{ animation: 'fadeInUp 0.5s ease both' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 0 0 6px rgba(0,82,255,0.12), 0 12px 36px rgba(0,82,255,0.28)' }}>
            <UserPlus size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Patient Registration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create your account with health profile details
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  currentStep === step.id
                    ? 'border-blue-400 text-white shadow-md'
                    : currentStep > step.id
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
                style={currentStep === step.id ? { background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 4px 14px rgba(0,82,255,0.28)' } : {}}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  <step.icon size={12} />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.id}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 transition-all ${currentStep > step.id ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div
          className="overflow-hidden rounded-3xl border border-white/60 shadow-xl backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.87)', boxShadow: '0 20px 70px rgba(15,42,68,0.10)' }}
        >
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0F2A44, #0052FF, #1F7A7A)' }} />

          <form onSubmit={submit} className="p-7 md:p-9">
            {/* Step 1: Account */}
            {currentStep === 1 && (
              <FormSection title="Account Credentials" subtitle="Your login email and secure password">
                <div className="grid gap-4 md:grid-cols-2">
                  <RegField label="Full Name" icon={<User size={13} />} error={errors.fullName}>
                    <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Dr. / Mr. / Ms. ..." required className={fieldClass(errors.fullName)} />
                  </RegField>
                  <RegField label="Email Address" icon={<Mail size={13} />} error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="name@email.com" required className={fieldClass(errors.email)} />
                  </RegField>
                  <RegField label="Password" icon={<Lock size={13} />} error={errors.password}>
                    <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Min. 6 characters" required minLength={6} className={fieldClass(errors.password)} />
                  </RegField>
                  <RegField label="Confirm Password" icon={<Lock size={13} />} error={errors.confirmPassword}>
                    <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Repeat password" required className={fieldClass(errors.confirmPassword)} />
                  </RegField>
                  <RegField label="Phone Number" icon={<Phone size={13} />} error={errors.phoneNumber}>
                    <input value={form.phoneNumber} onChange={(e) => updatePhoneField('phoneNumber', e.target.value)} placeholder="0771234567" maxLength={10} inputMode="numeric" required className={fieldClass(errors.phoneNumber)} />
                  </RegField>
                  <RegField label="Profile Photo URL">
                    <input value={form.profilePhoto} onChange={(e) => updateField('profilePhoto', e.target.value)} placeholder="https://..." className={fieldClass()} />
                  </RegField>
                </div>
              </FormSection>
            )}

            {/* Step 2: Personal */}
            {currentStep === 2 && (
              <FormSection title="Personal Information" subtitle="Demographics and identification">
                <div className="grid gap-4 md:grid-cols-2">
                  <RegField label="Date of Birth" error={errors.dateOfBirth}>
                    <input type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} required className={fieldClass(errors.dateOfBirth)} />
                  </RegField>
                  <RegField label="Gender" error={errors.gender}>
                    <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} required className={selectClass(errors.gender)}>
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  </RegField>
                  <RegField label="National ID / NIC" error={errors.nationalId}>
                    <input value={form.nationalId} onChange={(e) => updateField('nationalId', String(e.target.value || '').trim())} placeholder="199012345678 or 901234567V" maxLength={12} className={fieldClass(errors.nationalId)} />
                  </RegField>
                  <RegField label="Blood Group" error={errors.bloodGroup}>
                    <select value={form.bloodGroup} onChange={(e) => updateField('bloodGroup', e.target.value)} required className={selectClass(errors.bloodGroup)}>
                      <option value="">Select blood group</option>
                      {BLOOD_GROUP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </RegField>
                </div>
              </FormSection>
            )}

            {/* Step 3: Medical */}
            {currentStep === 3 && (
              <FormSection title="Medical Background" subtitle="Help doctors understand your health history">
                <div className="grid gap-4 md:grid-cols-2">
                  <RegField label="Known Allergies">
                    <input value={form.knownAllergies} onChange={(e) => updateField('knownAllergies', e.target.value)} placeholder="e.g. Penicillin, Dust" className={fieldClass()} />
                  </RegField>
                  <RegField label="Medical Conditions">
                    <input value={form.medicalConditions} onChange={(e) => updateField('medicalConditions', e.target.value)} placeholder="e.g. Diabetes, Hypertension" className={fieldClass()} />
                  </RegField>
                  <RegField label="Current Medications" className="md:col-span-2">
                    <input value={form.currentMedications} onChange={(e) => updateField('currentMedications', e.target.value)} placeholder="e.g. Metformin 500mg" className={fieldClass()} />
                  </RegField>
                </div>
              </FormSection>
            )}

            {/* Step 4: Emergency & Address */}
            {currentStep === 4 && (
              <FormSection title="Emergency Contact & Address" subtitle="Who to contact in emergencies and your location">
                <div className="grid gap-4 md:grid-cols-2">
                  <RegField label="Emergency Contact Name">
                    <input value={form.emergencyContactName} onChange={(e) => updateField('emergencyContactName', e.target.value)} placeholder="Full name" className={fieldClass()} />
                  </RegField>
                  <RegField label="Emergency Contact Phone" error={errors.emergencyContactPhone}>
                    <input value={form.emergencyContactPhone} onChange={(e) => updatePhoneField('emergencyContactPhone', e.target.value)} placeholder="0771234567" maxLength={10} inputMode="numeric" className={fieldClass(errors.emergencyContactPhone)} />
                  </RegField>
                  <RegField label="Address Line">
                    <input value={form.addressLine} onChange={(e) => updateField('addressLine', e.target.value)} placeholder="No. 12, Main Street" className={fieldClass()} />
                  </RegField>
                  <RegField label="City">
                    <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Colombo" className={fieldClass()} />
                  </RegField>
                  <RegField label="District">
                    <input value={form.district} onChange={(e) => updateField('district', e.target.value)} placeholder="Western" className={fieldClass()} />
                  </RegField>
                  <RegField label="Postal Code">
                    <input value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} placeholder="10100" className={fieldClass()} />
                  </RegField>
                </div>
              </FormSection>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" style={{ animation: 'slideUpPop 0.25s ease' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {feedback}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
              >
                ← Back
              </button>

              <div className="flex items-center gap-1">
                {STEPS.map((s) => (
                  <div key={s.id} className={`h-2 rounded-full transition-all ${currentStep === s.id ? 'w-6 bg-blue-500' : currentStep > s.id ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 4px 16px rgba(0,82,255,0.28)' }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0F2A44, #0052FF)', boxShadow: '0 8px 24px rgba(0,82,255,0.35)' }}
                >
                  {loading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating Account…</>
                  ) : (
                    <><CheckCircle2 size={15} />Create Patient Account</>
                  )}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-500 hover:text-blue-700">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function RegField({ label, icon, error, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon && <span className="text-blue-400">{icon}</span>}
        {label}
      </span>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
          <AlertCircle size={10} />{error}
        </span>
      )}
    </label>
  );
}

const fieldClass = (error) =>
  `w-full rounded-xl border ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'} px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400`;

const selectClass = (error) =>
  `w-full rounded-xl border ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'} px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100`;

export default PatientRegisterPage;
