import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BadgeCheck,
  BadgeX,
  Brain,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload
} from 'lucide-react';

import { AUTH_API_URL, AI_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

// ─── Tab Enum ─────────────────────────────────────────────────────────────────

const TABS = { DOCTORS: 'doctors', DOCUMENTS: 'documents' };

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminDashboard({ session }) {
  const [activeTab, setActiveTab] = useState(TABS.DOCTORS);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {/* Tab Switcher */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setActiveTab(TABS.DOCTORS)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === TABS.DOCTORS
              ? 'bg-lake text-white shadow-md'
              : 'border border-lake/20 bg-white/60 text-ink/70 hover:bg-lake/10 hover:text-lake'
          }`}
        >
          <Stethoscope size={15} /> Doctor Approvals
        </button>
        <button
          onClick={() => setActiveTab(TABS.DOCUMENTS)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === TABS.DOCUMENTS
              ? 'bg-lake text-white shadow-md'
              : 'border border-lake/20 bg-white/60 text-ink/70 hover:bg-lake/10 hover:text-lake'
          }`}
        >
          <Brain size={15} /> AI Health Documents
        </button>
      </div>

      {activeTab === TABS.DOCTORS ? (
        <DoctorApprovalTab session={session} />
      ) : (
        <HealthDocumentsTab session={session} />
      )}
    </div>
  );
}

// ─── Doctor Approval Tab ──────────────────────────────────────────────────────

function DoctorApprovalTab({ session }) {
  const [doctors, setDoctors] = useState([]);
  const [expandedDoctorIds, setExpandedDoctorIds] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const loadAdminData = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const response = await axios.get(`${AUTH_API_URL}/admin/users`, { headers: authHeader });
      const allUsers = response.data.users || [];
      setDoctors(allUsers.filter((user) => user.role === 'doctor'));
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDoctorVerification = async (doctorId, approved) => {
    setActionLoadingKey(`verify-${doctorId}`);
    setFeedback('');
    try {
      const response = await axios.patch(
        `${AUTH_API_URL}/admin/doctors/${doctorId}/verify`,
        { approved },
        { headers: authHeader }
      );
      setFeedback(response.data.message || (approved ? 'Doctor approved.' : 'Doctor rejected.'));
      await loadAdminData();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Verification action failed.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const toggleExpand = (doctorId) => {
    setExpandedDoctorIds((prev) => ({ ...prev, [doctorId]: !prev[doctorId] }));
  };

  return (
    <>
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
                const isBusy = !!actionLoadingKey;

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
                          disabled={loading || isBusy || status === 'approved'}
                        >
                          <BadgeCheck size={14} /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDoctorVerification(doctor._id, false)}
                          disabled={loading || isBusy || status === 'rejected'}
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
    </>
  );
}


// ─── Health Documents Tab ─────────────────────────────────────────────────────

function HealthDocumentsTab({ session }) {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${session.token}` }), [session.token]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${AI_API_URL}/documents`, { headers: authHeader });
      setDocuments(res.data.documents || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to load documents.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please choose a PDF or DOCX file.' });
      return;
    }

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setFeedback({ type: 'error', message: 'Only PDF and DOCX files are supported.' });
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await axios.post(`${AI_API_URL}/documents`, formData, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' }
      });
      setFeedback({
        type: 'success',
        message: `${res.data.originalName} uploaded. Embedding in progress — status will update to "ready" shortly.`
      });
      setSelectedFile(null);
      // Poll after 5s for updated status
      setTimeout(loadDocuments, 5000);
      setTimeout(loadDocuments, 15000);
      setTimeout(loadDocuments, 30000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}" and all its embeddings?`)) return;
    try {
      await axios.delete(`${AI_API_URL}/documents/${docId}`, { headers: authHeader });
      setFeedback({ type: 'success', message: `"${docName}" deleted.` });
      await loadDocuments();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  return (
    <div className="space-y-5">
      {feedback.message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {/* Upload Card */}
      <Card className="bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <Brain size={18} /> Upload Health Guidance Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-ink/65">
            Upload PDF or DOCX health guidance documents. They will be automatically parsed, chunked, and embedded
            into MongoDB Atlas Vector Search to power the AI Symptom Checker.
          </p>

          {/* Drop zone */}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-lake/30 bg-lake/5 py-10 transition-all hover:border-lake/60 hover:bg-lake/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lake/10">
              <Upload size={24} className="text-lake" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-lake">
                {selectedFile ? selectedFile.name : 'Click to choose a document'}
              </p>
              <p className="mt-1 text-xs text-ink/50">Supports PDF and DOCX — Max 30 MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Uploading &amp; Embedding…
                </>
              ) : (
                <>
                  <Upload size={15} /> Upload Document
                </>
              )}
            </Button>
            {selectedFile && (
              <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                Clear
              </Button>
            )}
          </div>

          {uploading && (
            <div className="mt-3 rounded-xl border border-lake/15 bg-lake/5 p-3 text-xs text-ink/65">
              <p className="font-semibold text-lake">⏳ Embedding in progress…</p>
              <p className="mt-1">
                The document is being parsed, chunked, and embedded via HuggingFace. This takes 15–60 seconds
                depending on document size. The status will update to <strong>ready</strong> automatically.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="bg-white/55">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lake">
            <span className="flex items-center gap-2">
              <FileText size={18} /> Uploaded Documents
            </span>
            <Button size="sm" variant="ghost" onClick={loadDocuments} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lake/20 bg-white/60 py-10 text-center">
              <Brain size={28} className="mx-auto mb-2 text-ink/25" />
              <p className="text-sm text-ink/50">{loading ? 'Loading...' : 'No documents uploaded yet.'}</p>
              <p className="mt-1 text-xs text-ink/35">Upload health guidance PDFs above to power the AI Symptom Checker.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-lake/15 bg-white/70">
              <div className="grid grid-cols-[1fr_80px_80px_90px_80px] gap-2 border-b border-lake/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/65">
                <p>Document Name</p>
                <p>Type</p>
                <p>Chunks</p>
                <p>Status</p>
                <p>Actions</p>
              </div>
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="grid grid-cols-[1fr_80px_80px_90px_80px] items-center gap-2 border-b border-lake/10 px-3 py-3 text-sm last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-ink/85 break-all">{doc.originalName}</p>
                    <p className="text-xs text-ink/45">{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-lg border border-lake/15 bg-lake/5 px-2 py-1 text-center text-xs font-bold uppercase text-lake">
                    {doc.fileType}
                  </span>
                  <p className="text-center text-sm font-semibold text-ink/70">{doc.chunkCount || 0}</p>
                  <DocStatusPill status={doc.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc._id, doc.originalName)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-ink/50">
            Documents with status <strong>ready</strong> are actively used by the AI Symptom Checker via MongoDB
            Atlas Vector Search.
          </p>
        </CardContent>
      </Card>

      {/* Atlas Setup Guide */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
          ⚠️ One-time Setup: MongoDB Atlas Vector Search Index
        </p>
        <p className="mb-3 text-xs text-amber-700">
          You must create a vector search index on your Atlas cluster for document retrieval to work.
        </p>
        <ol className="space-y-1 text-xs text-amber-700">
          <li>1. Go to <strong>MongoDB Atlas</strong> → your cluster → <strong>Atlas Search</strong> tab</li>
          <li>2. Click <strong>Create Search Index</strong> → choose <strong>Atlas Vector Search</strong></li>
          <li>3. Select database: <code className="rounded bg-amber-100 px-1">smartdoc_ai</code> → collection: <code className="rounded bg-amber-100 px-1">documentchunks</code></li>
          <li>4. Use the JSON editor and paste the configuration below, then name the index <code className="rounded bg-amber-100 px-1">vector_index</code></li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-amber-100 p-3 text-xs text-amber-900">
{`{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 384,
    "similarity": "cosine"
  }]
}`}
        </pre>
      </div>

    </div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function DocStatusPill({ status }) {
  const map = {
    ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    processing: 'bg-amber-100 text-amber-700 border-amber-200',
    failed: 'bg-red-100 text-red-700 border-red-200'
  };
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${map[status] || map.processing}`}>
      {status === 'processing' && <Loader2 size={10} className="animate-spin" />}
      {status}
    </span>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const classes =
    normalized === 'approved'
      ? 'bg-green-100 text-green-700 border-green-200'
      : normalized === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200'
        : normalized === 'active'
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : normalized === 'inactive'
            ? 'bg-slate-100 text-slate-700 border-slate-200'
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
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('data:image') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.length > 100) return `data:image/jpeg;base64,${raw}`;
  return '';
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default AdminDashboard;
