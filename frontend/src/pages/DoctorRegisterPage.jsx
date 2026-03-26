import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { AUTH_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const initialState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
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
  district: ''
};

function DoctorRegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [photoPreview, setPhotoPreview] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const onPhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = String(reader.result || '');
      setForm((prev) => ({ ...prev, profilePhoto: base64Image }));
      setPhotoPreview(base64Image);
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
        consultationFee: form.consultationFee ? Number(form.consultationFee) : ''
      });
      onLogin(response.data);
      navigate('/login');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Registration</CardTitle>
          <CardDescription>Register professional details and create your doctor account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
            <Field label="Confirm Password"><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></Field>
            <Field label="Phone Number"><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required /></Field>
            <Field label="Profile Photo (Upload)">
              <Input type="file" accept="image/*" onChange={onPhotoSelect} />
              {photoPreview ? (
                <img src={photoPreview} alt="Doctor profile preview" className="mt-2 h-16 w-16 rounded-xl object-cover ring-2 ring-lake/20" />
              ) : null}
            </Field>
            <Field label="Medical License Number"><Input value={form.medicalLicenseNumber} onChange={(e) => setForm({ ...form, medicalLicenseNumber: e.target.value })} required /></Field>
            <Field label="Specialization"><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required /></Field>
            <Field label="Years of Experience"><Input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} /></Field>
            <Field label="Qualifications"><Input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} placeholder="MBBS, MD" /></Field>
            <Field label="Hospital / Clinic Name"><Input value={form.hospitalOrClinicName} onChange={(e) => setForm({ ...form, hospitalOrClinicName: e.target.value })} /></Field>
            <Field label="Consultation Fee"><Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} /></Field>
            <Field label="Clinic Address"><Input value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="District"><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>

            {feedback ? <p className="md:col-span-2 rounded-lg bg-ember/15 px-3 py-2 text-sm text-ember">{feedback}</p> : null}
            <Button className="md:col-span-2" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register Doctor'}</Button>
          </form>
        </CardContent>
      </Card>
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

export default DoctorRegisterPage;
