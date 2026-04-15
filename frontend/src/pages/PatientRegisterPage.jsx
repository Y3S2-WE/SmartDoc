import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { AUTH_API_URL, PATIENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const GENDER_OPTIONS = ['male', 'female', 'other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nicRegex = /^(\d{9}[VvXx]|\d{12})$/;

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const isPhoneNumber = (value) => normalizePhone(value).length === 10;

const limitPhoneDigits = (value) => normalizePhone(value).slice(0, 10);

const isValidNic = (value) => nicRegex.test(String(value || '').trim());

const getFieldError = (fieldName, values) => {
  if (fieldName === 'fullName') {
    if (!values.fullName.trim()) {
      return 'Full name is required.';
    }
    if (values.fullName.trim().length < 3) {
      return 'Full name must be at least 3 characters.';
    }
    if (/\d/.test(values.fullName)) {
      return 'Full name cannot contain numbers.';
    }
    return '';
  }

  if (fieldName === 'email') {
    if (!values.email.trim()) {
      return 'Email is required.';
    }
    if (!emailRegex.test(values.email.trim())) {
      return 'Please enter a valid email address.';
    }
    return '';
  }

  if (fieldName === 'password') {
    if (!values.password) {
      return 'Password is required.';
    }
    if (values.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return '';
  }

  if (fieldName === 'confirmPassword') {
    if (!values.confirmPassword) {
      return 'Confirm password is required.';
    }
    if (values.password !== values.confirmPassword) {
      return 'Password and confirm password must match.';
    }
    return '';
  }

  if (fieldName === 'phoneNumber') {
    if (!values.phoneNumber.trim()) {
      return 'Phone number is required.';
    }
    if (!isPhoneNumber(values.phoneNumber)) {
      return 'Use a valid 10-digit phone number.';
    }
    return '';
  }

  if (fieldName === 'dateOfBirth') {
    if (!values.dateOfBirth) {
      return 'Date of birth is required.';
    }

    const birthDate = new Date(values.dateOfBirth);
    const now = new Date();
    if (Number.isNaN(birthDate.getTime()) || birthDate > now) {
      return 'Date of birth must be a valid past date.';
    }
    return '';
  }

  if (fieldName === 'gender') {
    if (!values.gender) {
      return 'Gender is required.';
    }
    if (!GENDER_OPTIONS.includes(values.gender)) {
      return 'Please select a valid gender.';
    }
    return '';
  }

  if (fieldName === 'bloodGroup') {
    if (!values.bloodGroup) {
      return 'Blood group is required.';
    }
    if (!BLOOD_GROUP_OPTIONS.includes(values.bloodGroup)) {
      return 'Please select a valid blood group.';
    }
    return '';
  }

  if (fieldName === 'emergencyContactPhone') {
    if (values.emergencyContactPhone && !isPhoneNumber(values.emergencyContactPhone)) {
      return 'Emergency contact phone must be 10 digits.';
    }
    return '';
  }

  if (fieldName === 'nationalId') {
    if (values.nationalId && !isValidNic(values.nationalId)) {
      return 'NIC must be 12 digits or 9 digits followed by V/X.';
    }
    return '';
  }

  return '';
};

const validateForm = (values) => {
  const errors = {};

  [
    'fullName',
    'email',
    'password',
    'confirmPassword',
    'phoneNumber',
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'emergencyContactPhone',
    'nationalId'
  ].forEach((fieldName) => {
    const error = getFieldError(fieldName, values);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

function PatientRegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (fieldName, value) => {
    setForm((previous) => {
      const nextForm = { ...previous, [fieldName]: value };

      setErrors((previousErrors) => {
        const nextErrors = { ...previousErrors };

        const currentFieldError = getFieldError(fieldName, nextForm);
        if (currentFieldError) {
          nextErrors[fieldName] = currentFieldError;
        } else {
          delete nextErrors[fieldName];
        }

        if (fieldName === 'password' || fieldName === 'confirmPassword') {
          const confirmPasswordError = getFieldError('confirmPassword', nextForm);
          if (confirmPasswordError) {
            nextErrors.confirmPassword = confirmPasswordError;
          } else {
            delete nextErrors.confirmPassword;
          }
        }

        return nextErrors;
      });

      return nextForm;
    });
  };

  const updatePhoneField = (fieldName, value) => {
    updateField(fieldName, limitPhoneDigits(value));
  };

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

      // Seed the patient-service profile with registration data so the
      // dashboard displays it immediately without requiring a manual update.
      try {
        await axios.put(`${PATIENT_API_URL}/me/profile`, form, {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
      } catch {
        // Non-fatal: profile can be updated from the dashboard later
      }

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
            <Field label="Full Name" error={errors.fullName}>
              <Input
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                required
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Field label="Confirm Password" error={errors.confirmPassword}>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Field label="Phone Number" error={errors.phoneNumber}>
              <Input
                value={form.phoneNumber}
                onChange={(e) => updatePhoneField('phoneNumber', e.target.value)}
                required
                placeholder="e.g. 0771234567"
                maxLength={10}
                inputMode="numeric"
              />
            </Field>
            <Field label="Date of Birth" error={errors.dateOfBirth}>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                required
              />
            </Field>
            <Field label="Gender" error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className="flex h-10 w-full rounded-xl border border-lake/20 bg-white/75 px-3 py-2 text-sm text-ink outline-none ring-0 transition focus:border-lake focus:bg-white"
                required
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="National ID / NIC" error={errors.nationalId}>
              <Input
                value={form.nationalId}
                onChange={(e) => updateField('nationalId', String(e.target.value || '').trim())}
                placeholder="e.g. 199012345678 or 901234567V"
                maxLength={12}
              />
            </Field>
            <Field label="Profile Photo URL">
              <Input value={form.profilePhoto} onChange={(e) => updateField('profilePhoto', e.target.value)} />
            </Field>
            <Field label="Blood Group" error={errors.bloodGroup}>
              <select
                value={form.bloodGroup}
                onChange={(e) => updateField('bloodGroup', e.target.value)}
                className="flex h-10 w-full rounded-xl border border-lake/20 bg-white/75 px-3 py-2 text-sm text-ink outline-none ring-0 transition focus:border-lake focus:bg-white"
                required
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Known Allergies">
              <Input value={form.knownAllergies} onChange={(e) => updateField('knownAllergies', e.target.value)} />
            </Field>
            <Field label="Medical Conditions">
              <Input value={form.medicalConditions} onChange={(e) => updateField('medicalConditions', e.target.value)} />
            </Field>
            <Field label="Current Medications">
              <Input value={form.currentMedications} onChange={(e) => updateField('currentMedications', e.target.value)} />
            </Field>
            <Field label="Emergency Contact Name">
              <Input value={form.emergencyContactName} onChange={(e) => updateField('emergencyContactName', e.target.value)} />
            </Field>
            <Field label="Emergency Contact Phone" error={errors.emergencyContactPhone}>
              <Input
                value={form.emergencyContactPhone}
                onChange={(e) => updatePhoneField('emergencyContactPhone', e.target.value)}
                maxLength={10}
                inputMode="numeric"
              />
            </Field>
            <Field label="Address Line">
              <Input value={form.addressLine} onChange={(e) => updateField('addressLine', e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => updateField('district', e.target.value)} />
            </Field>
            <Field label="Postal Code">
              <Input value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} />
            </Field>

            {feedback ? <p className="md:col-span-2 rounded-lg bg-ember/15 px-3 py-2 text-sm text-ember">{feedback}</p> : null}
            <Button className="md:col-span-2" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register Patient'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink/80">
      {label}
      {children}
      {error ? <span className="text-xs text-ember">{error}</span> : null}
    </label>
  );
}

export default PatientRegisterPage;
