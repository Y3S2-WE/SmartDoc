import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, BadgeX, ChevronDown, ChevronUp, ShieldCheck, Stethoscope } from 'lucide-react';

import { AUTH_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

function AdminDashboard({ session }) {
  const [doctors, setDoctors] = useState([]);
  const [expandedDoctorIds, setExpandedDoctorIds] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const loadDoctors = async () => {
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.get(`${AUTH_API_URL}/admin/users`, { headers: authHeader });
      const allUsers = response.data.users || [];
      const doctorUsers = allUsers.filter((user) => user.role === 'doctor');
      setDoctors(doctorUsers);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDoctorVerification = async (doctorId, approved) => {
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.patch(
        `${AUTH_API_URL}/admin/doctors/${doctorId}/verify`,
        { approved },
        { headers: authHeader }
      );

      setFeedback(response.data.message || (approved ? 'Doctor approved.' : 'Doctor rejected.'));
      await loadDoctors();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Verification action failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (doctorId) => {
    setExpandedDoctorIds((prev) => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {feedback ? (
        <p className="mb-4 rounded-xl border border-white/30 bg-white/55 px-4 py-3 text-sm font-medium text-lake backdrop-blur">
          {feedback}
        </p>
      ) : null}

      <Card className="bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <ShieldCheck size={18} /> Admin Doctor Approval Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white/70">
            <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 border-b border-lake/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/65">
              <p>Doctor Name</p>
              <p>Email</p>
              <p>Tel Number</p>
              <p>Status</p>
              <p>Action</p>
              <p>Details</p>
            </div>

            {doctors.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink/65">{loading ? 'Loading doctors...' : 'No doctors found.'}</p>
            ) : (
              doctors.map((doctor) => {
                const profile = doctor.doctorProfile || {};
                const status = profile.verificationStatus || (profile.isVerified ? 'approved' : 'pending');
                const isExpanded = !!expandedDoctorIds[doctor._id];

                return (
                  <div key={doctor._id} className="border-b border-lake/10 last:border-b-0">
                    <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_1fr_110px] gap-2 px-3 py-3 text-sm">
                      <p className="font-semibold text-lake">{doctor.fullName}</p>
                      <p className="truncate text-ink/80">{doctor.email}</p>
                      <p className="text-ink/80">{doctor.phoneNumber}</p>
                      <StatusPill status={status} />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateDoctorVerification(doctor._id, true)}
                          disabled={loading || status === 'approved'}
                        >
                          <BadgeCheck size={14} /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDoctorVerification(doctor._id, false)}
                          disabled={loading || status === 'rejected'}
                        >
                          <BadgeX size={14} /> Reject
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => toggleExpand(doctor._id)}>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />} More
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="grid gap-2 bg-white/60 px-3 pb-3 text-sm md:grid-cols-2">
                        <PhotoDetail label="Profile Photo" value={profile.profilePhoto} doctorName={doctor.fullName} />
                        <Detail label="Medical License Number" value={profile.medicalLicenseNumber || 'Not provided'} />
                        <Detail label="Specialization" value={profile.specialization || 'Not provided'} />
                        <Detail label="Years Of Experience" value={profile.yearsOfExperience ?? 'Not provided'} />
                        <Detail
                          label="Qualifications"
                          value={Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') || 'Not provided' : 'Not provided'}
                        />
                        <Detail label="Hospital / Clinic" value={profile.hospitalOrClinicName || 'Not provided'} />
                        <Detail label="Consultation Fee" value={profile.consultationFee ?? 'Not provided'} />
                        <Detail label="Clinic Address" value={profile.clinicAddress || 'Not provided'} />
                        <Detail label="City" value={profile.city || 'Not provided'} />
                        <Detail label="District" value={profile.district || 'Not provided'} />
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-3 flex items-center gap-2 text-xs text-ink/60">
            <Stethoscope size={13} /> Approving a doctor updates status to approved immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  const classes =
    normalized === 'approved'
      ? 'bg-green-100 text-green-700 border-green-200'
      : normalized === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200'
        : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex w-fit rounded-lg border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${classes}`}>
      {normalized}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-lake/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-sm text-ink/85 break-words">{String(value)}</p>
    </div>
  );
}

function PhotoDetail({ label, value, doctorName }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = normalizePhotoSrc(value);

  return (
    <div className="rounded-xl border border-lake/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      {!src || imageFailed ? (
        <p className="mt-1 text-sm text-ink/70">Photo not provided</p>
      ) : (
        <img
          src={src}
          alt={`${doctorName || 'Doctor'} profile`}
          className="mt-2 h-24 w-24 rounded-xl object-cover ring-1 ring-lake/20"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

function normalizePhotoSrc(value) {
  if (!value) {
    return '';
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('data:image') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  if (raw.length > 100) {
    return `data:image/jpeg;base64,${raw}`;
  }

  return '';
}

export default AdminDashboard;
