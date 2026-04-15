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

function PatientRegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.post(`${AUTH_API_URL}/register/patient`, form);
      onLogin(response.data);
      navigate('/dashboard/patient');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Patient registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Patient Registration</CardTitle>
          <CardDescription>Create a patient account with health profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
            <Field label="Confirm Password"><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></Field>
            <Field label="Phone Number"><Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required /></Field>
            <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
            <Field label="Gender"><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="male / female / other" /></Field>
            <Field label="National ID / NIC"><Input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></Field>
            <Field label="Profile Photo URL"><Input value={form.profilePhoto} onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })} /></Field>
            <Field label="Blood Group"><Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></Field>
            <Field label="Known Allergies"><Input value={form.knownAllergies} onChange={(e) => setForm({ ...form, knownAllergies: e.target.value })} /></Field>
            <Field label="Medical Conditions"><Input value={form.medicalConditions} onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })} /></Field>
            <Field label="Current Medications"><Input value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} /></Field>
            <Field label="Emergency Contact Name"><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></Field>
            <Field label="Emergency Contact Phone"><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></Field>
            <Field label="Address Line"><Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="District"><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
            <Field label="Postal Code"><Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></Field>

            {feedback ? <p className="md:col-span-2 rounded-lg bg-ember/15 px-3 py-2 text-sm text-ember">{feedback}</p> : null}
            <Button className="md:col-span-2" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register Patient'}</Button>
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

export default PatientRegisterPage;
