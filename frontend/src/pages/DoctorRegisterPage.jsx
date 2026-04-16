import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, Building2, Camera, CheckCircle2, DollarSign,
  Lock, Mail, MapPin, Phone, Stethoscope, User, UserCheck
} from 'lucide-react';

import { AUTH_API_URL } from '../lib/api';

const initialState = {
  fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '',
  profilePhoto: '', medicalLicenseNumber: '', specialization: '',
  yearsOfExperience: '', qualifications: '', hospitalOrClinicName: '',
  consultationFee: '', clinicAddress: '', city: '', district: '',
};

function DoctorRegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [photoPreview, setPhotoPreview] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const STEPS = [
    { id: 1, label: 'Account', icon: User },
    { id: 2, label: 'Professional', icon: Stethoscope },
    { id: 3, label: 'Practice', icon: Building2 },
  ];

  const onPhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || '');
      setForm((prev) => ({ ...prev, profilePhoto: base64 }));
      setPhotoPreview(base64);
      setFeedback('');
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.post(`${AUTH_API_URL}/register/doctor`, {
        ...form,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : '',
        consultationFee: form.consultationFee ? Number(form.consultationFee) : '',
      });
      onLogin(response.data);
      navigate('/login');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: (e) => setForm({ ...form, [field]: e.target.value }) });

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)' }}
    >
      {/* BG decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)', top: -150, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,82,255,0.05) 0%, transparent 70%)', bottom: -80, left: -100 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(15,42,68,0.025) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative mx-auto max-w-4xl" style={{ animation: 'fadeInUp 0.5s ease both' }}>
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)', boxShadow: '0 0 0 6px rgba(20,184,166,0.15), 0 12px 36px rgba(15,118,110,0.30)' }}>
            <UserCheck size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Doctor Registration
          </h1>
          <p className="mt-1 text-sm text-slate-500">Join SmartDoc as a verified medical professional</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            ⚠ Your account will be reviewed by admin before approval
          </div>
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
                    ? 'border-teal-400 text-white shadow-md'
                    : currentStep > step.id
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
                style={currentStep === step.id ? { background: 'linear-gradient(135deg, #0F766E, #14B8A6)', boxShadow: '0 4px 14px rgba(20,184,166,0.30)' } : {}}
              >
                {currentStep > step.id ? <CheckCircle2 size={12} className="text-emerald-500" /> : <step.icon size={12} />}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-px w-8 transition-all ${currentStep > step.id ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="overflow-hidden rounded-3xl border border-white/60 shadow-xl backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.87)', boxShadow: '0 20px 70px rgba(15,42,68,0.10)' }}
        >
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0F766E, #14B8A6, #0052FF)' }} />

          <form onSubmit={submit} className="p-7 md:p-9">

            {/* Step 1: Account */}
            {currentStep === 1 && (
              <DoctorFormSection title="Account Credentials" subtitle="Login details and profile photo">
                <div className="grid gap-4 md:grid-cols-2">
                  <DRegField label="Full Name" icon={<User size={13} />}>
                    <input {...f('fullName')} placeholder="Dr. John Doe" required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Email Address" icon={<Mail size={13} />}>
                    <input type="email" {...f('email')} placeholder="doctor@hospital.com" required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Password" icon={<Lock size={13} />}>
                    <input type="password" {...f('password')} placeholder="Min. 6 characters" required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Confirm Password" icon={<Lock size={13} />}>
                    <input type="password" {...f('confirmPassword')} placeholder="Repeat password" required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Phone Number" icon={<Phone size={13} />}>
                    <input {...f('phoneNumber')} placeholder="0771234567" required className={dFieldClass()} />
                  </DRegField>

                  {/* Photo upload */}
                  <DRegField label="Profile Photo" icon={<Camera size={13} />}>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-4 transition hover:border-teal-300 hover:bg-teal-50">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-xl object-cover ring-2 ring-teal-200" />
                      ) : (
                        <>
                          <Camera size={22} className="text-slate-300" />
                          <p className="text-xs font-semibold text-slate-400">Click to upload photo</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
                    </label>
                  </DRegField>
                </div>
              </DoctorFormSection>
            )}

            {/* Step 2: Professional */}
            {currentStep === 2 && (
              <DoctorFormSection title="Professional Details" subtitle="Medical credentials and specialization">
                <div className="grid gap-4 md:grid-cols-2">
                  <DRegField label="Medical License Number" icon={<Stethoscope size={13} />}>
                    <input {...f('medicalLicenseNumber')} placeholder="SLMC-12345" required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Specialization" icon={<Stethoscope size={13} />}>
                    <input {...f('specialization')} placeholder="Cardiology, Internal Medicine..." required className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Years of Experience">
                    <input type="number" min="0" max="60" {...f('yearsOfExperience')} placeholder="e.g. 8" className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Qualifications">
                    <input {...f('qualifications')} placeholder="MBBS, MD, MRCP..." className={dFieldClass()} />
                  </DRegField>
                </div>
              </DoctorFormSection>
            )}

            {/* Step 3: Practice */}
            {currentStep === 3 && (
              <DoctorFormSection title="Practice Information" subtitle="Where you practice and consultation fees">
                <div className="grid gap-4 md:grid-cols-2">
                  <DRegField label="Hospital / Clinic Name" icon={<Building2 size={13} />}>
                    <input {...f('hospitalOrClinicName')} placeholder="City Medical Center" className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Consultation Fee (LKR)" icon={<DollarSign size={13} />}>
                    <input type="number" min="0" {...f('consultationFee')} placeholder="e.g. 2500" className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="Clinic Address" icon={<MapPin size={13} />}>
                    <input {...f('clinicAddress')} placeholder="No. 15, Hospital Road" className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="City">
                    <input {...f('city')} placeholder="Colombo" className={dFieldClass()} />
                  </DRegField>
                  <DRegField label="District">
                    <input {...f('district')} placeholder="Western" className={dFieldClass()} />
                  </DRegField>
                </div>
              </DoctorFormSection>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" style={{ animation: 'slideUpPop 0.25s ease' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {feedback}
              </div>
            )}

            {/* Nav */}
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
                  <div key={s.id} className={`h-2 rounded-full transition-all ${currentStep === s.id ? 'w-6 bg-teal-500' : currentStep > s.id ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)', boxShadow: '0 4px 16px rgba(20,184,166,0.30)' }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0F766E, #0052FF)', boxShadow: '0 8px 24px rgba(20,184,166,0.30)' }}
                >
                  {loading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting…</>
                  ) : (
                    <><CheckCircle2 size={15} />Register Doctor Account</>
                  )}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function DoctorFormSection({ title, subtitle, children }) {
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

function DRegField({ label, icon, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon && <span className="text-teal-500">{icon}</span>}
        {label}
      </span>
      {children}
    </label>
  );
}

const dFieldClass = () =>
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 placeholder:text-slate-400';

export default DoctorRegisterPage;
