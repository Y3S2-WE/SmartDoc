import { useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HeartPulse,
  Info,
  Loader2,
  Plus,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react';

import { AI_API_URL } from '../lib/api';

/* ─── Symptom Catalogue ────────────────────────────────────────────────────── */
const SYMPTOM_CATEGORIES = [
  {
    category: 'General',
    icon: '🌡️',
    symptoms: ['Fever', 'Fatigue', 'Weakness', 'Weight loss', 'Night sweats', 'Chills', 'Loss of appetite'],
  },
  {
    category: 'Head & Neurological',
    icon: '🧠',
    symptoms: ['Headache', 'Dizziness', 'Confusion', 'Memory loss', 'Fainting', 'Numbness', 'Tingling sensation', 'Vision changes'],
  },
  {
    category: 'Respiratory',
    icon: '🫁',
    symptoms: ['Cough', 'Shortness of breath', 'Chest tightness', 'Wheezing', 'Sore throat', 'Runny nose', 'Nasal congestion', 'Loss of smell'],
  },
  {
    category: 'Cardiovascular',
    icon: '❤️',
    symptoms: ['Chest pain', 'Palpitations', 'Rapid heartbeat', 'Irregular heartbeat', 'Swollen legs', 'High blood pressure'],
  },
  {
    category: 'Gastrointestinal',
    icon: '🫃',
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Bloating', 'Heartburn', 'Blood in stool', 'Loss of taste'],
  },
  {
    category: 'Musculoskeletal',
    icon: '🦴',
    symptoms: ['Joint pain', 'Muscle pain', 'Back pain', 'Neck pain', 'Muscle cramps', 'Stiffness', 'Swollen joints'],
  },
  {
    category: 'Skin',
    icon: '🩹',
    symptoms: ['Rash', 'Itching', 'Skin discoloration', 'Hives', 'Dry skin', 'Excessive sweating', 'Jaundice'],
  },
  {
    category: 'Urinary & Reproductive',
    icon: '💧',
    symptoms: ['Frequent urination', 'Painful urination', 'Blood in urine', 'Lower back pain', 'Pelvic pain'],
  },
];

/* ─── Urgency Config ─────────────────────────────────────────────────────────── */
const URGENCY_CONFIG = {
  emergency: {
    label: 'EMERGENCY',
    sublabel: 'Seek immediate medical attention',
    bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
    border: '#FECACA',
    textColor: '#991B1B',
    accentColor: '#DC2626',
    badgeBg: '#DC2626',
    icon: Zap,
    pulse: true,
    barColor: '#DC2626',
  },
  high: {
    label: 'HIGH PRIORITY',
    sublabel: 'See a doctor within 24 hours',
    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
    border: '#FED7AA',
    textColor: '#9A3412',
    accentColor: '#EA580C',
    badgeBg: '#EA580C',
    icon: AlertTriangle,
    pulse: false,
    barColor: '#EA580C',
  },
  medium: {
    label: 'MODERATE',
    sublabel: 'Schedule an appointment soon',
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    border: '#FDE68A',
    textColor: '#92400E',
    accentColor: '#D97706',
    badgeBg: '#D97706',
    icon: AlertCircle,
    pulse: false,
    barColor: '#D97706',
  },
  low: {
    label: 'LOW CONCERN',
    sublabel: 'Monitor symptoms, consult if persists',
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    border: '#BBF7D0',
    textColor: '#166534',
    accentColor: '#16A34A',
    badgeBg: '#16A34A',
    icon: CheckCircle2,
    pulse: false,
    barColor: '#16A34A',
  },
};

/* ─── Self-care tip color palette ─────────────────────────────────────────── */
const TIP_COLORS = [
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', iconColor: '#3B82F6' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', iconColor: '#16A34A' },
  { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8', iconColor: '#9333EA' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', iconColor: '#EA580C' },
  { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', iconColor: '#0284C7' },
  { bg: '#FDF4FF', border: '#F5D0FE', text: '#701A75', iconColor: '#C026D3' },
];

/* ───────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                               */
/* ───────────────────────────────────────────────────────────────────────────── */
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

  /* ── Symptom Logic ─────────────────────────────────────────────────────── */
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : prev.length < 20
          ? [...prev, symptom]
          : prev
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

  /* ── Filter ────────────────────────────────────────────────────────────── */
  const filteredCategories = SYMPTOM_CATEGORIES.filter(
    (c) => activeCategory === 'All' || c.category === activeCategory
  )
    .map((c) => ({
      ...c,
      symptoms: c.symptoms.filter(
        (s) => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((c) => c.symptoms.length > 0);

  /* ── Analysis ──────────────────────────────────────────────────────────── */
  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom before analyzing.');
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
        setError(
          err.response.data.message ||
          'AI model is warming up. Please wait and try again.'
        );
        setRetryCountdown(retryAfter);
        const interval = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(
          err.response?.data?.message || 'Analysis failed. Please try again.'
        );
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

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFC 45%, #EEF7F7 100%)' }}
    >
      {/* ── Decorative background ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          top: -200, right: -100,
          animation: 'blobFloat 16s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,82,255,0.05) 0%, transparent 70%)',
          bottom: '10%', left: -150,
          animation: 'blobFloat 12s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(15,42,68,0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Floating medical icons */}
        <div style={{ position: 'absolute', right: '8%', top: '18%', opacity: 0.06, animation: 'floatY 10s ease-in-out infinite' }}>
          <Brain size={120} style={{ color: '#6366F1' }} />
        </div>
        <div style={{ position: 'absolute', left: '5%', bottom: '25%', opacity: 0.05, animation: 'floatY 14s ease-in-out infinite 3s' }}>
          <HeartPulse size={90} style={{ color: '#0052FF' }} />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8" style={{ zIndex: 1 }}>

        {/* ════════════════════════════════════════════════════════════
            HERO HEADER
        ════════════════════════════════════════════════════════════ */}
        <div
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
            boxShadow: '0 20px 70px rgba(99,102,241,0.25), 0 8px 28px rgba(0,82,255,0.12)',
            animation: 'fadeInUp 0.6s ease both',
          }}
        >
          {/* Background effects */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.25) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(0,82,255,0.20) 0%, transparent 50%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.10, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }} />
          {/* Floating brain icon */}
          <div className="pointer-events-none absolute right-8 top-4 opacity-10 hidden md:block"
            style={{ animation: 'floatY 8s ease-in-out infinite' }}>
            <Brain size={110} className="text-white" />
          </div>

          <div className="relative px-8 py-10">
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <Sparkles size={11} className="text-violet-300" />
              RAG · Model . AI
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                {/* Title row */}
                <div className="mb-3 flex items-center gap-4">
                  {/* Glowing brain orb */}
                  <div className="relative flex-shrink-0">
                    <div style={{
                      width: 56, height: 56,
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 0 6px rgba(99,102,241,0.2), 0 8px 28px rgba(99,102,241,0.45)',
                      animation: 'orbPulse 3s ease-in-out infinite',
                    }}>
                      <Brain size={26} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white leading-tight"
                      style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                      AI Symptom Checker
                    </h1>
                    <p className="text-sm text-white/60 mt-0.5">
                      AI-powered health insights in seconds
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-white/65">
                  Describe your symptoms and our RAG-based AI engine retrieves relevant medical context to generate a structured health report — including urgency assessment, doctor recommendations, and self-care guidance.
                </p>

                {/* Trust badges */}
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {[
                    { icon: <Shield size={11} />, label: 'Privacy protected' },
                    { icon: <Zap size={11} />, label: 'Real-time AI analysis' },
                    { icon: <BookOpen size={11} />, label: 'Medical knowledge base' },
                  ].map((b) => (
                    <div key={b.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur">
                      <span className="text-violet-300">{b.icon}</span>
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 md:flex-col lg:flex-row">
                {[
                  { label: 'Symptom categories', value: '8' },
                  { label: 'Symptoms indexed', value: '60+' },
                ].map((s) => (
                  <div key={s.label}
                    className="flex flex-col items-center rounded-2xl border border-white/12 bg-white/8 px-6 py-4 text-center backdrop-blur">
                    <span className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {s.value}
                    </span>
                    <span className="mt-0.5 text-[10px] text-white/55">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer banner */}
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5">
              <AlertTriangle size={14} className="flex-shrink-0 text-amber-300" />
              <p className="text-xs text-amber-200/90 font-medium">
                This tool provides preliminary AI-generated guidance only. It is <strong className="text-amber-200">not a substitute</strong> for professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            INPUT PHASE
        ════════════════════════════════════════════════════════════ */}
        {!result ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]" style={{ animation: 'fadeInUp 0.5s ease both 0.1s' }}>

            {/* ── LEFT: Symptom Selector ────────────────────────────── */}
            <div
              className="overflow-hidden rounded-3xl border border-white/60 shadow-xl backdrop-blur-xl"
              style={{ background: 'rgba(255,255,255,0.80)', boxShadow: '0 8px 40px rgba(15,42,68,0.09)' }}
            >
              {/* Card header */}
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="flex items-center gap-2 text-base font-bold text-slate-700"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Activity size={16} className="text-blue-500" />
                  Select Your Symptoms
                </p>
                <p className="mt-0.5 text-xs text-slate-400">Choose up to 20 symptoms or add your own</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Search bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search symptoms…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {['All', ...SYMPTOM_CATEGORIES.map((c) => c.category)].map((cat) => {
                    const catObj = SYMPTOM_CATEGORIES.find((c) => c.category === cat);
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 ${isActive
                            ? 'border-blue-400 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                          boxShadow: '0 4px 14px rgba(0,82,255,0.28)',
                        } : {}}
                      >
                        {catObj?.icon && <span className="mr-1">{catObj.icon}</span>}
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Symptom grid */}
                <div
                  className="max-h-[380px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <Search size={28} className="text-slate-300" />
                      <p className="text-sm text-slate-400">No symptoms match "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <div key={cat.category} className="mb-5 last:mb-0">
                        <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>{cat.icon}</span>
                          {cat.category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cat.symptoms.map((symptom) => {
                            const isSelected = selectedSymptoms.includes(symptom);
                            return (
                              <button
                                key={symptom}
                                onClick={() => toggleSymptom(symptom)}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 ${isSelected
                                    ? 'border-blue-400 text-white shadow-md'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                                  }`}
                                style={isSelected ? {
                                  background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                                  boxShadow: '0 3px 10px rgba(0,82,255,0.25)',
                                } : {}}
                              >
                                {isSelected && <CheckCircle2 size={10} className="mr-1 inline text-blue-100" />}
                                {symptom}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Custom symptom */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Add custom symptom</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Plus size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Type a symptom and press Enter…"
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addCustomSymptom}
                      disabled={!customSymptom.trim()}
                      className="rounded-xl border border-blue-400 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Selected Symptoms + CTA ───────────────────── */}
            <div className="space-y-4">
              {/* Selected symptoms panel */}
              <div
                className="overflow-hidden rounded-3xl border border-white/60 shadow-xl backdrop-blur-xl"
                style={{ background: 'rgba(255,255,255,0.80)', boxShadow: '0 8px 40px rgba(15,42,68,0.09)' }}
              >
                {/* Header */}
                <div
                  className="px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #0F2A44 0%, #134E5E 60%, #1F7A7A 100%)', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{
                    position: 'absolute', inset: 0, opacity: 0.10, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart size={15} className="text-rose-300" />
                      <span className="text-sm font-bold text-white">Selected Symptoms</span>
                    </div>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{
                        background: selectedSymptoms.length > 0
                          ? 'linear-gradient(135deg, #0052FF, #4D7CFF)'
                          : 'rgba(255,255,255,0.15)',
                        boxShadow: selectedSymptoms.length > 0 ? '0 0 0 3px rgba(77,124,255,0.3)' : 'none',
                      }}
                    >
                      {selectedSymptoms.length}
                    </div>
                  </div>
                  <p className="relative mt-0.5 text-[11px] text-white/55">Max 20 · {20 - selectedSymptoms.length} remaining</p>
                </div>

                <div className="p-4">
                  {selectedSymptoms.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <Activity size={22} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-400">No symptoms selected</p>
                        <p className="mt-0.5 text-xs text-slate-300">Pick from the list on the left</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                          style={{
                            background: 'rgba(0,82,255,0.08)',
                            borderColor: 'rgba(0,82,255,0.20)',
                            color: '#1D4ED8',
                          }}
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => removeSymptom(s)}
                            className="ml-0.5 rounded-full p-0.5 opacity-60 transition hover:opacity-100"
                            style={{ color: '#1D4ED8' }}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error / retry alert */}
                {error && (
                  <div
                    className="mx-4 mb-3 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs"
                    style={{ animation: 'slideUpPop 0.25s ease', background: '#FFF1F2', borderColor: '#FECDD3', color: '#9F1239' }}
                  >
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-rose-500" />
                    <span className="flex-1">
                      {error}
                      {retryCountdown > 0 && (
                        <span className="ml-1 font-bold text-rose-700">
                          Retry in {retryCountdown}s…
                        </span>
                      )}
                    </span>
                    <button type="button" onClick={() => setError('')} className="opacity-60 hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* CTA Button */}
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={analyzeSymptoms}
                    disabled={loading || selectedSymptoms.length === 0 || retryCountdown > 0}
                    className="group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #1E1B4B 0%, #0052FF 55%, #4D7CFF 100%)',
                      boxShadow: selectedSymptoms.length > 0 && !loading
                        ? '0 8px 32px rgba(0,82,255,0.40)'
                        : 'none',
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Analyzing with AI…</span>
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
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  {loading && (
                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-center text-xs text-violet-700">
                      <Loader2 size={12} className="mx-auto mb-1.5 animate-spin text-violet-500" />
                      AI is retrieving medical context from our knowledge base and generating your personalized health report…
                      <br />
                      <span className="font-semibold">This may take up to 60 seconds on first use.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* How it works info card */}
              <div
                className="overflow-hidden rounded-2xl border border-white/60 p-5 backdrop-blur-xl"
                style={{ background: 'rgba(255,255,255,0.75)', boxShadow: '0 4px 20px rgba(15,42,68,0.06)' }}
              >
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <Info size={11} />
                  How It Works
                </p>
                <ol className="space-y-2.5">
                  {[
                    { step: '1', text: 'Select symptoms from the catalogue or add custom ones' },
                    { step: '2', text: 'AI retrieves relevant health guidance from medical documents' },
                    { step: '3', text: 'AI Model generates urgency assessment & recommendations' },
                    { step: '4', text: 'Book with the recommended specialist on SmartDoc' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-2.5 text-xs text-slate-500">
                      <div
                        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)' }}
                      >
                        {item.step}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

        ) : (

          /* ════════════════════════════════════════════════════════════
              RESULTS PHASE — AI Health Report
          ════════════════════════════════════════════════════════════ */
          <div className="space-y-5" style={{ animation: 'fadeInUp 0.4s ease both' }}>

            {/* Results header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Your AI Health Report
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Based on <span className="font-bold text-slate-600">{result.symptoms_analyzed?.length || 0}</span> symptoms
                  &nbsp;·&nbsp;
                  <span className="font-bold text-slate-600">{result.retrieved_chunks || 0}</span> medical document chunks retrieved
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <X size={14} />
                New Analysis
              </button>
            </div>

            {/* Analyzed symptoms row */}
            <div
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/60 px-5 py-4 backdrop-blur-xl"
              style={{ background: 'rgba(255,255,255,0.80)', boxShadow: '0 4px 20px rgba(15,42,68,0.06)' }}
            >
              <p className="mr-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Analyzed Symptoms:
              </p>
              {(result.symptoms_analyzed || selectedSymptoms).map((s) => (
                <span
                  key={s}
                  className="rounded-xl border px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(0,82,255,0.08)', borderColor: 'rgba(0,82,255,0.18)', color: '#1D4ED8' }}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* ── URGENCY CARD ── */}
            <div
              className="relative overflow-hidden rounded-3xl border-2 p-6"
              style={{
                background: urgencyConf.bg,
                borderColor: urgencyConf.border,
                boxShadow: `0 8px 40px ${urgencyConf.accentColor}20`,
                animation: 'slideUpPop 0.35s ease',
              }}
            >
              {/* Colored top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '24px 24px 0 0',
                background: urgencyConf.barColor,
              }} />
              {/* Glow orb */}
              <div style={{
                position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%',
                background: `radial-gradient(circle, ${urgencyConf.accentColor}15, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div className="relative flex flex-col gap-4 md:flex-row md:items-start">
                {/* Icon */}
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: `${urgencyConf.accentColor}18`,
                    border: `2px solid ${urgencyConf.accentColor}30`,
                    animation: urgencyConf.pulse ? 'orbPulse 1.5s ease-in-out infinite' : 'none',
                  }}
                >
                  <urgencyConf.icon size={30} style={{ color: urgencyConf.accentColor }} />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${urgencyConf.accentColor}80` }}>
                        Urgency Level
                      </p>
                      <p className="text-2xl font-black leading-tight" style={{ color: urgencyConf.textColor, fontFamily: 'Space Grotesk, sans-serif' }}>
                        {urgencyConf.label}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ background: urgencyConf.badgeBg }}
                    >
                      <urgencyConf.icon size={11} />
                      {urgencyConf.sublabel}
                    </span>
                  </div>

                  {result.urgency_explanation && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: urgencyConf.textColor, opacity: 0.85 }}>
                      {result.urgency_explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── MAIN REPORT GRID ── */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {/* Preliminary Suggestions — spans 2 cols */}
              <div
                className="overflow-hidden rounded-3xl border border-white/60 backdrop-blur-xl md:col-span-2"
                style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 8px 36px rgba(15,42,68,0.08)', animation: 'slideUpPop 0.35s ease both 0.1s' }}
              >
                <div className="border-b border-slate-100 px-6 py-5">
                  <p className="flex items-center gap-2 text-base font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <Brain size={14} style={{ color: '#6366F1' }} />
                    </div>
                    Preliminary Suggestions
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">AI-generated health guidance based on your symptoms</p>
                </div>
                <div className="p-5">
                  <ul className="space-y-2.5">
                    {(result.preliminary_suggestions || []).map((suggestion, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-100 hover:bg-blue-50/40"
                        style={{ animation: `slideUpPop 0.3s ease both ${i * 0.06}s` }}
                      >
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ background: 'rgba(0,82,255,0.12)' }}>
                          <CheckCircle2 size={12} style={{ color: '#0052FF' }} />
                        </div>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Doctor Recommendations */}
              <div
                className="overflow-hidden rounded-3xl border border-white/60 backdrop-blur-xl"
                style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 8px 36px rgba(15,42,68,0.08)', animation: 'slideUpPop 0.35s ease both 0.15s' }}
              >
                <div className="border-b border-slate-100 px-6 py-5">
                  <p className="flex items-center gap-2 text-base font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: 'rgba(20,184,166,0.12)' }}>
                      <Stethoscope size={14} style={{ color: '#0F766E' }} />
                    </div>
                    Doctor Recommendations
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Recommended specialties based on your symptoms</p>
                </div>
                <div className="p-5 space-y-3">
                  {(result.doctor_recommendations || []).map((rec, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-2xl border border-slate-100 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                      style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)', animation: `slideUpPop 0.3s ease both ${i * 0.08}s` }}
                    >
                      <div style={{
                        height: 3, borderRadius: '16px 16px 0 0',
                        background: 'linear-gradient(90deg, #0F766E, #14B8A6)',
                      }} />
                      <div className="px-4 py-3">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-teal-800">{rec.specialty}</p>
                          {rec.doctor_name && (
                            <span className="rounded-md bg-white/80 border border-teal-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                              Dr. {rec.doctor_name.replace(/^Dr\.?\s+/i, '')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-teal-700/80">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Self-Care Tips — full width */}
              {result.self_care_tips && result.self_care_tips.length > 0 && (
                <div
                  className="overflow-hidden rounded-3xl border border-white/60 backdrop-blur-xl md:col-span-2 lg:col-span-3"
                  style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 8px 36px rgba(15,42,68,0.08)', animation: 'slideUpPop 0.35s ease both 0.2s' }}
                >
                  <div className="border-b border-slate-100 px-6 py-5">
                    <p className="flex items-center gap-2 text-base font-bold text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
                        <Heart size={14} style={{ color: '#059669' }} />
                      </div>
                      Self-Care Tips
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">Practical steps you can take right now</p>
                  </div>
                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {result.self_care_tips.map((tip, i) => {
                        const palette = TIP_COLORS[i % TIP_COLORS.length];
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{ background: palette.bg, borderColor: palette.border, animation: `slideUpPop 0.3s ease both ${i * 0.05}s` }}
                          >
                            <div
                              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ background: `${palette.iconColor}18`, border: `1.5px solid ${palette.iconColor}30` }}
                            >
                              <ThumbsUp size={12} style={{ color: palette.iconColor }} />
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: palette.text }}>{tip}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div
              className="flex items-start gap-3 rounded-2xl border px-5 py-4"
              style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
            >
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-amber-800">
                {result.disclaimer ||
                  'This is preliminary AI-generated guidance only. Please consult a qualified healthcare professional for actual diagnosis and treatment.'}
              </p>
            </div>

            {/* Book appointment CTA */}
            <div
              className="relative overflow-hidden rounded-3xl px-8 py-8 text-center"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
                boxShadow: '0 12px 48px rgba(99,102,241,0.25)',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25), transparent 65%)',
              }} />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
                  <Stethoscope size={24} className="text-white" />
                </div>
                <p className="mb-1 text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ready to speak with a doctor?
                </p>
                <p className="mb-6 text-sm text-white/60">
                  Book an appointment with a verified specialist on SmartDoc
                </p>
                <button
                  type="button"
                  onClick={() => (window.location.href = '/appointments')}
                  className="group inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', boxShadow: '0 8px 28px rgba(0,82,255,0.40)' }}
                >
                  <Stethoscope size={16} />
                  Book Appointment
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAssistPage;
