import { useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Loader2,
  Search,
  Stethoscope,
  X,
  Zap
} from 'lucide-react';

import { AI_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// ─── Symptom Catalogue ────────────────────────────────────────────────────────

const SYMPTOM_CATEGORIES = [
  {
    category: 'General',
    symptoms: ['Fever', 'Fatigue', 'Weakness', 'Weight loss', 'Night sweats', 'Chills', 'Loss of appetite']
  },
  {
    category: 'Head & Neurological',
    symptoms: ['Headache', 'Dizziness', 'Confusion', 'Memory loss', 'Fainting', 'Numbness', 'Tingling sensation', 'Vision changes']
  },
  {
    category: 'Respiratory',
    symptoms: ['Cough', 'Shortness of breath', 'Chest tightness', 'Wheezing', 'Sore throat', 'Runny nose', 'Nasal congestion', 'Loss of smell']
  },
  {
    category: 'Cardiovascular',
    symptoms: ['Chest pain', 'Palpitations', 'Rapid heartbeat', 'Irregular heartbeat', 'Swollen legs', 'High blood pressure']
  },
  {
    category: 'Gastrointestinal',
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Bloating', 'Heartburn', 'Blood in stool', 'Loss of taste']
  },
  {
    category: 'Musculoskeletal',
    symptoms: ['Joint pain', 'Muscle pain', 'Back pain', 'Neck pain', 'Muscle cramps', 'Stiffness', 'Swollen joints']
  },
  {
    category: 'Skin',
    symptoms: ['Rash', 'Itching', 'Skin discoloration', 'Hives', 'Dry skin', 'Excessive sweating', 'Jaundice']
  },
  {
    category: 'Urinary & Reproductive',
    symptoms: ['Frequent urination', 'Painful urination', 'Blood in urine', 'Lower back pain', 'Pelvic pain']
  }
];

const ALL_SYMPTOMS = SYMPTOM_CATEGORIES.flatMap((c) => c.symptoms);

// ─── Urgency Config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  emergency: {
    label: 'EMERGENCY',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-300',
    icon: Zap,
    iconColor: 'text-red-600',
    pulse: true
  },
  high: {
    label: 'HIGH',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-300',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    pulse: false
  },
  medium: {
    label: 'MODERATE',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-300',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    pulse: false
  },
  low: {
    label: 'LOW',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-300',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    pulse: false
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

function AIAssistPage({ session }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);

  const authHeader = { Authorization: `Bearer ${session.token}` };

  // ── Symptom Selection ───────────────────────────────────────────────────────

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : prev.length < 20 ? [...prev, symptom] : prev
    );
  };

  const addCustomSymptom = () => {
    const s = customSymptom.trim();
    if (!s || selectedSymptoms.includes(s) || selectedSymptoms.length >= 20) return;
    setSelectedSymptoms((prev) => [...prev, s]);
    setCustomSymptom('');
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filteredCategories = SYMPTOM_CATEGORIES.filter(
    (c) => activeCategory === 'All' || c.category === activeCategory
  ).map((c) => ({
    ...c,
    symptoms: c.symptoms.filter(
      (s) => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((c) => c.symptoms.length > 0);

  // ── Analysis ────────────────────────────────────────────────────────────────

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(
        `${AI_API_URL}/symptom-check`,
        { symptoms: selectedSymptoms },
        { headers: authHeader, timeout: 120000 }
      );
      setResult(response.data.data);
    } catch (err) {
      if (err.response?.status === 503) {
        const retryAfter = err.response.data.retryAfter || 30;
        setError(err.response.data.message || 'AI model is warming up. Please wait and try again.');
        // Countdown timer
        setRetryCountdown(retryAfter);
        const interval = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(err.response?.data?.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
    setSelectedSymptoms([]);
  };

  const urgencyKey = (result?.urgency_level || 'low').toLowerCase();
  const urgencyConf = URGENCY_CONFIG[urgencyKey] || URGENCY_CONFIG.low;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lake to-blue-700 shadow-md">
          <Brain size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-lake" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Symptom Checker
          </h1>
          <p className="text-sm text-ink/60">
            Powered by RAG &amp; Hugging Face — Preliminary guidance only
          </p>
        </div>
        <div className="ml-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          ⚠️ Not a substitute for professional medical advice
        </div>
      </div>

      {!result ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left — Symptom Selector */}
          <div className="space-y-4">
            {/* Search + Category filter */}
            <Card className="bg-white/55">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-lake">
                  <Activity size={16} /> Select Your Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    placeholder="Search symptoms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-lake/20 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-lake/50 focus:ring-2 focus:ring-lake/10"
                  />
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {['All', ...SYMPTOM_CATEGORIES.map((c) => c.category)].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                        activeCategory === cat
                          ? 'bg-lake text-white shadow-sm'
                          : 'bg-white/70 text-ink/70 hover:bg-lake/10 hover:text-lake'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Symptom grid */}
                <div className="max-h-[400px] overflow-y-auto rounded-xl border border-lake/10 bg-white/60 p-3">
                  {filteredCategories.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ink/55">No symptoms match your search.</p>
                  ) : (
                    filteredCategories.map((cat) => (
                      <div key={cat.category} className="mb-4 last:mb-0">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ink/40">
                          {cat.category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cat.symptoms.map((symptom) => {
                            const selected = selectedSymptoms.includes(symptom);
                            return (
                              <button
                                key={symptom}
                                onClick={() => toggleSymptom(symptom)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                  selected
                                    ? 'border-lake bg-lake text-white shadow-sm'
                                    : 'border-lake/20 bg-white text-ink/75 hover:border-lake/50 hover:text-lake'
                                }`}
                              >
                                {symptom}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Custom symptom input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a custom symptom..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
                    className="flex-1 rounded-xl border border-lake/20 bg-white px-3 py-2 text-sm outline-none focus:border-lake/50 focus:ring-2 focus:ring-lake/10"
                  />
                  <Button size="sm" variant="outline" onClick={addCustomSymptom}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right — Selected symptoms + analyze */}
          <div className="space-y-4">
            <Card className="bg-white/55">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base text-lake">
                  <span className="flex items-center gap-2">
                    <Heart size={16} /> Selected
                  </span>
                  <span className="rounded-full bg-lake/10 px-2.5 py-0.5 text-xs font-bold text-lake">
                    {selectedSymptoms.length}/20
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSymptoms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-lake/20 bg-white/60 py-8 text-center">
                    <Activity size={24} className="mx-auto mb-2 text-ink/30" />
                    <p className="text-sm text-ink/50">No symptoms selected yet</p>
                    <p className="mt-1 text-xs text-ink/35">Click symptoms from the list</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1.5 rounded-lg bg-lake/10 px-2.5 py-1 text-xs font-semibold text-lake"
                      >
                        {s}
                        <button onClick={() => removeSymptom(s)} className="rounded text-lake/60 hover:text-lake">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      {error}
                      {retryCountdown > 0 && (
                        <span className="ml-1 font-bold">Retry in {retryCountdown}s…</span>
                      )}
                    </span>
                  </div>
                )}

                <Button
                  className="mt-4 w-full gap-2"
                  onClick={analyzeSymptoms}
                  disabled={loading || selectedSymptoms.length === 0 || retryCountdown > 0}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing with AI…
                    </>
                  ) : retryCountdown > 0 ? (
                    <>
                      <Clock size={16} />
                      Retry in {retryCountdown}s
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      Analyze Symptoms
                    </>
                  )}
                </Button>

                {loading && (
                  <p className="mt-2 text-center text-xs text-ink/50">
                    AI is retrieving medical context and generating your report…
                    <br />
                    This may take up to 60 seconds on first use.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info card */}
            <div className="rounded-xl border border-lake/15 bg-lake/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-lake/70">
                <Info size={12} /> How it works
              </p>
              <ol className="space-y-1.5 text-xs text-ink/65">
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-lake" />
                  Select your symptoms from the catalogue
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-lake" />
                  AI retrieves relevant health guidance from our document library
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-lake" />
                  Mistral-7B generates preliminary suggestions &amp; urgency assessment
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-lake" />
                  Review and consult with the recommended doctor specialty
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Results Panel ─────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-lake">Your AI Health Report</h2>
              <p className="text-xs text-ink/55">
                Based on {result.symptoms_analyzed?.length || 0} symptoms ·{' '}
                {result.retrieved_chunks || 0} medical document chunks retrieved
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <X size={14} /> New Analysis
            </Button>
          </div>

          {/* Symptoms summary */}
          <div className="flex flex-wrap gap-2 rounded-xl border border-lake/15 bg-white/60 px-4 py-3">
            <p className="mr-1 text-xs font-bold text-ink/50">ANALYZED SYMPTOMS:</p>
            {(result.symptoms_analyzed || selectedSymptoms).map((s) => (
              <span key={s} className="rounded-lg bg-lake/10 px-2 py-0.5 text-xs font-semibold text-lake">
                {s}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Urgency Level Card */}
            <div
              className={`col-span-full rounded-2xl border-2 p-5 ${urgencyConf.bg} ${urgencyConf.pulse ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-3">
                <urgencyConf.icon size={28} className={urgencyConf.iconColor} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/60">Urgency Level</p>
                  <p className={`text-2xl font-bold ${urgencyConf.color}`}>{urgencyConf.label}</p>
                </div>
              </div>
              {result.urgency_explanation && (
                <p className="mt-3 text-sm text-ink/75">{result.urgency_explanation}</p>
              )}
            </div>

            {/* Preliminary Suggestions */}
            <Card className="bg-white/70 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-lake">
                  <Brain size={16} /> Preliminary Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {(result.preliminary_suggestions || []).map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl bg-lake/5 px-3 py-2.5 text-sm text-ink/80">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-lake" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Doctor Recommendations */}
            <Card className="bg-white/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-lake">
                  <Stethoscope size={16} /> Doctor Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {(result.doctor_recommendations || []).map((rec, i) => (
                    <div key={i} className="rounded-xl border border-lake/15 bg-white p-3">
                      <p className="text-sm font-bold text-lake">
                        {rec.specialty}
                        {rec.doctor_name && (
                          <span className="ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-600">
                            Dr. {rec.doctor_name.replace(/^Dr\.?\s+/i, '')}
                          </span>
                        )}
                      </p>
                      <p className="mt-1.5 text-xs text-ink/65">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Self-Care Tips */}
            {result.self_care_tips && result.self_care_tips.length > 0 && (
              <Card className="bg-white/70 md:col-span-2 lg:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-lake">
                    <Heart size={16} /> Self-Care Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {result.self_care_tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p>{result.disclaimer || 'This is preliminary AI-generated guidance only. Please consult a qualified healthcare professional for actual diagnosis and treatment.'}</p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-lake/15 bg-gradient-to-r from-lake/5 to-blue-50 p-5 text-center">
            <p className="mb-1 text-sm font-bold text-lake">Ready to speak with a doctor?</p>
            <p className="mb-4 text-xs text-ink/60">Book an appointment with a specialist on SmartDoc</p>
            <Button onClick={() => (window.location.href = '/appointments')}>
              <Stethoscope size={15} /> Book Appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAssistPage;
