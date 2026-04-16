import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Brain, Calendar, CheckCircle2, ChevronRight,
  FileText, HeartPulse, MessageSquare, Shield, ShieldCheck, Stethoscope,
  Star, Video, Zap, Bell, CreditCard, Users, Clock, TrendingUp,
  Sparkles, Bot, Send, X,
} from 'lucide-react';

/* ─── Animated counter hook ───────────────────────────────────────── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ─── Intersection observer hook ──────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Hero image slides ───────────────────────────────────────────── */
const heroSlides = [
  { src: '/hero_slide_1.png', label: 'Smart Consultation' },
  { src: '/hero_slide_2.png', label: 'AI Diagnosis' },
  { src: '/hero_slide_3.png', label: 'Patient Care' },
];

/* ─── Feature cards data ──────────────────────────────────────────── */
const features = [
  { icon: Brain, title: 'AI Symptom Checker', desc: 'RAG-powered diagnosis assistant analyses your symptoms and recommends the right specialist instantly.', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Calendar, title: 'Smart Appointment Booking', desc: 'Real-time slot availability. Book, reschedule, or cancel appointments with a single click.', gradient: 'from-teal-500 to-cyan-600' },
  { icon: Video, title: 'Video Consultations', desc: 'HD encrypted telemedicine sessions — consult your doctor from anywhere, anytime.', gradient: 'from-violet-500 to-purple-600' },
  { icon: FileText, title: 'Medical Report Upload', desc: 'Securely upload and share diagnostic reports. AI extracts key findings automatically.', gradient: 'from-emerald-500 to-green-600' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Stripe-powered checkout with instant confirmation, receipts, and refund management.', gradient: 'from-orange-500 to-amber-600' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Proactive reminders, prescription alerts, and real-time appointment updates.', gradient: 'from-pink-500 to-rose-600' },
];

/* ─── Steps data ──────────────────────────────────────────────────── */
const steps = [
  { number: '01', title: 'Register / Login', desc: 'Create your account as a Patient or Doctor in under 60 seconds.' },
  { number: '02', title: 'Choose Your Doctor', desc: 'Browse verified specialists, read profiles, and check availability.' },
  { number: '03', title: 'Book an Appointment', desc: 'Pick a date, time slot, and confirm with secure online payment.' },
  { number: '04', title: 'Attend Video Consultation', desc: 'Join your HD telemedicine session directly from the dashboard.' },
  { number: '05', title: 'Receive Prescription', desc: 'Get your digital prescription, lab orders, and follow-up schedule.' },
];

/* ─── Stats data ──────────────────────────────────────────────────── */
const stats = [
  { value: 10000, suffix: '+', label: 'Appointments Booked', icon: Calendar },
  { value: 500, suffix: '+', label: 'Verified Doctors', icon: Stethoscope },
  { value: 98, suffix: '%', label: 'Patient Satisfaction', icon: HeartPulse },
  { value: 24, suffix: '/7', label: 'AI Availability', icon: Clock },
];

/* ─── Testimonials data ───────────────────────────────────────────── */
const testimonials = [
  { name: 'Priya Mendis', role: 'Patient', rating: 5, text: 'SmartDoc completely changed how I manage my health. The AI symptom checker helped me find the right specialist before my condition worsened.', color: 'from-blue-400 to-indigo-500' },
  { name: 'Dr. Rohan Silva', role: 'Cardiologist', rating: 5, text: 'As a doctor, the dashboard is incredibly intuitive. Managing appointments and video consultations has never been this seamless.', color: 'from-teal-400 to-cyan-500' },
  { name: 'Kasun Perera', role: 'Patient', rating: 5, text: 'Booking a specialist consultation at midnight from home felt impossible before SmartDoc. Now it takes 30 seconds.', color: 'from-violet-400 to-purple-500' },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  HOMEPAGE COMPONENT                                                  */
/* ──────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [statsRef, statsInView] = useInView(0.2);
  const [featuresRef, featuresInView] = useInView(0.1);

  /* Hero image slider — auto-advance every 3 s */
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const count0 = useCounter(stats[0].value, 2200, statsInView);
  const count1 = useCounter(stats[1].value, 2000, statsInView);
  const count2 = useCounter(stats[2].value, 1800, statsInView);
  const count3 = useCounter(stats[3].value, 1600, statsInView);
  const counts = [count0, count1, count2, count3];

  return (
    <div className="hp-root">
      {/* ── BACKGROUND BLOBS ─────────────────────────────────────── */}
      <div className="hp-blob hp-blob-1" />
      <div className="hp-blob hp-blob-2" />
      <div className="hp-blob hp-blob-3" />
      <div className="hp-grid-bg" />

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 1. HERO                                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hp-container hp-hero-inner">
          {/* Left content */}
          <div className="hp-hero-left hp-fade-in">
            <span className="hp-badge">
              <Sparkles size={13} />
              AI-Enabled Smart Healthcare Platform
            </span>

            <h1 className="hp-hero-heading">
              Your Next-Gen{' '}
              <span className="hp-gradient-text">Telemedicine</span> and{' '}
              <span className="hp-gradient-text">Appointment</span> Experience
            </h1>

            <p className="hp-hero-sub">
              Book appointments, attend video consultations, upload reports, and manage
              healthcare securely with AI-powered SmartDoc.
            </p>

            <div className="hp-hero-ctas">
              <Link to="/ai-assist" className="hp-btn-primary">
                <Brain size={16} />
                AI Symptom Checker
                <ArrowRight size={15} className="hp-btn-arrow" />
              </Link>
              <Link to="/register/patient" className="hp-btn-secondary">
                Start as Patient
              </Link>
              <Link to="/register/doctor" className="hp-btn-outline">
                Join as Doctor
              </Link>
            </div>

            <div className="hp-trust-row">
              <div className="hp-trust-item">
                <CheckCircle2 size={14} className="hp-trust-icon" />
                <span>500+ Verified Doctors</span>
              </div>
              <div className="hp-trust-item">
                <ShieldCheck size={14} className="hp-trust-icon" />
                <span>HIPAA-Ready Platform</span>
              </div>
              <div className="hp-trust-item">
                <Star size={14} className="hp-trust-icon" style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                <span>98% Satisfaction</span>
              </div>
            </div>
          </div>

          {/* Right: floating UI mockup */}
          <div className="hp-hero-right">

            {/* ── IMAGE SLIDER (behind everything) ── */}
            <div className="hp-slider-wrap">
              {heroSlides.map((slide, i) => (
                <div
                  key={slide.src}
                  className={`hp-slide ${i === activeSlide ? 'hp-slide--active' : ''}`}
                >
                  <img src={slide.src} alt={slide.label} className="hp-slide-img" />
                  {/* Glassmorphic overlay */}
                  <div className="hp-slide-overlay" />
                </div>
              ))}
              {/* Fade edges */}
              <div className="hp-slider-edge hp-slider-edge--top" />
              <div className="hp-slider-edge hp-slider-edge--bottom" />
              <div className="hp-slider-edge hp-slider-edge--left" />
              <div className="hp-slider-edge hp-slider-edge--right" />
              {/* Dots */}
              <div className="hp-slider-dots">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    className={`hp-slider-dot ${i === activeSlide ? 'hp-slider-dot--active' : ''}`}
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              {/* Label pill */}
              <div className="hp-slide-label">
                <span className="hp-live-dot" />
                {heroSlides[activeSlide].label}
              </div>
            </div>

            {/* Glow orb */}
            <div className="hp-hero-orb" />

            {/* Doctor card */}
            <div className="hp-float-card hp-float-top hp-float-card--doctor">
              <div className="hp-doctor-avatar">
                <Stethoscope size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <p className="hp-card-title">Video Consultations</p>
                <p className="hp-card-sub">HD encrypted . telemedicine sessions</p>
              </div>
              <span className="hp-live-dot" />
            </div>

            {/* AI card */}
            <div className="hp-float-card hp-float-mid hp-float-card--ai">
              <Brain size={18} style={{ color: '#818CF8' }} />
              <div>
                <p className="hp-card-title">AI Diagnosis Ready</p>
                <p className="hp-card-sub">98.4% accuracy · 3 conditions matched</p>
              </div>
              <div className="hp-pulse-ring" />
            </div>

            {/* Appointment chips */}
            <div className="hp-float-card hp-float-bot hp-float-card--appt">
              <Calendar size={16} style={{ color: '#34D399' }} />
              <div>
                <p className="hp-card-title">Secure Payments</p>
                <p className="hp-card-sub">PayPal-powered checkout</p>
              </div>
              <Video size={16} style={{ color: '#60A5FA' }} />
            </div>

            {/* Stat chips */}
            <div className="hp-stat-chip hp-stat-chip-1">
              <TrendingUp size={13} />
              <span>+24% recoveries this month</span>
            </div>
            <div className="hp-stat-chip hp-stat-chip-2">
              <Users size={13} />
              <span>12k+ active patients</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 2. FEATURES                                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--light" ref={featuresRef}>
        <div className="hp-container">
          <div className={`hp-section-header ${featuresInView ? 'hp-fade-in-up' : 'hp-hidden'}`}>
            <span className="hp-badge hp-badge--dark">Platform Features</span>
            <h2 className="hp-section-title">
              Everything You Need in One{' '}
              <span className="hp-gradient-text">Smart Platform</span>
            </h2>
            <p className="hp-section-sub">
              From AI diagnosis to encrypted video calls — SmartDoc covers the full
              healthcare journey.
            </p>
          </div>

          <div className="hp-features-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`hp-feature-card ${featuresInView ? 'hp-fade-in-up' : 'hp-hidden'}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`hp-feature-icon bg-gradient-to-br ${f.gradient}`}>
                  <f.icon size={22} color="#fff" />
                </div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
                <span className="hp-feature-link">
                  Learn more <ChevronRight size={14} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 3. HOW IT WORKS                                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--gradient">
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-badge hp-badge--glass">How It Works</span>
            <h2 className="hp-section-title hp-light">
              From Registration to{' '}
              <span className="hp-gradient-text">Prescription</span> in Minutes
            </h2>
          </div>

          <div className="hp-steps">
            {steps.map((s, i) => (
              <div key={s.number} className="hp-step">
                <div className="hp-step-number">{s.number}</div>
                {i < steps.length - 1 && <div className="hp-step-connector" />}
                <div className="hp-step-content">
                  <h3 className="hp-step-title">{s.title}</h3>
                  <p className="hp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 4. AI FEATURE HIGHLIGHT                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-container hp-ai-inner">
          {/* Left: description */}
          <div className="hp-ai-left">
            <span className="hp-badge hp-badge--dark">AI-Powered</span>
            <h2 className="hp-section-title">
              AI-Powered Smart{' '}
              <span className="hp-gradient-text">Diagnosis Assistant</span>
            </h2>
            <p className="hp-section-sub" style={{ textAlign: 'left' }}>
              Our RAG-based engine analyses your symptoms against a curated medical
              knowledge base to pinpoint likely conditions and recommend the right
              specialist — all in seconds.
            </p>
            <ul className="hp-ai-perks">
              {[
                'Natural language symptom input',
                'Top-3 condition suggestions with confidence scores',
                'Recommended doctor specialties',
                'Powered by HuggingFace embeddings + vector search',
              ].map((p) => (
                <li key={p}>
                  <CheckCircle2 size={16} className="hp-ai-check" />
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/ai-assist" className="hp-btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
              Try AI Symptom Checker
              <ArrowRight size={15} className="hp-btn-arrow" />
            </Link>
          </div>

          {/* Right: AI demo widget */}
          <div className="hp-ai-right">
            <div className="hp-ai-orb-wrap">
              <div className="hp-ai-orb">
                <Brain size={42} style={{ color: '#fff' }} />
              </div>
              <div className="hp-ai-ring hp-ai-ring-1" />
              <div className="hp-ai-ring hp-ai-ring-2" />
              <div className="hp-ai-ring hp-ai-ring-3" />
            </div>

            <div className="hp-ai-widget">
              <div className="hp-ai-widget-header">
                <Bot size={16} style={{ color: '#818CF8' }} />
                <span>SmartDoc AI Assistant</span>
                <span className="hp-live-dot" style={{ marginLeft: 'auto' }} />
              </div>
              <div className="hp-ai-widget-body">
                <div className="hp-ai-msg hp-ai-msg--ai">
                  Hello! Describe your symptoms and I'll help identify possible conditions.
                </div>
                <div className="hp-ai-msg hp-ai-msg--user">
                  I have a persistent headache, fatigue, and mild fever for 3 days.
                </div>
                <div className="hp-ai-msg hp-ai-msg--ai">
                  <p style={{ margin: 0 }}>Based on your symptoms, possible conditions include:</p>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '1rem', fontSize: '0.78rem' }}>
                    <li>Viral fever (74% match)</li>
                    <li>Tension headache (18% match)</li>
                    <li>Sinusitis (8% match)</li>
                  </ul>
                  <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    Recommended: <strong style={{ color: '#60A5FA' }}>General Physician</strong>
                  </p>
                </div>
              </div>
              <div className="hp-ai-widget-input">
                <input
                  type="text"
                  placeholder="Describe your symptoms…"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                />
                <button type="button" className="hp-ai-send">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 5. DOCTOR / PATIENT ROLES                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--roles">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title hp-light">
              Built for <span className="hp-gradient-text">Everyone</span>
            </h2>
          </div>
          <div className="hp-roles-grid">
            {/* Patient */}
            <div className="hp-role-card hp-role-card--patient">
              <div className="hp-role-icon-wrap">
                <HeartPulse size={28} />
              </div>
              <h3>For Patients</h3>
              <ul>
                {[
                  'Book appointments with verified specialists',
                  'AI-powered symptom analysis',
                  'Join HD video consultations',
                  'Upload & manage medical reports',
                  'Secure Stripe payments & receipts',
                  'Get prescription & follow-up reminders',
                ].map((f) => (
                  <li key={f}><CheckCircle2 size={14} /> {f}</li>
                ))}
              </ul>
              <Link to="/register/patient" className="hp-btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
                Start as Patient <ArrowRight size={14} className="hp-btn-arrow" />
              </Link>
            </div>

            {/* Doctor */}
            <div className="hp-role-card hp-role-card--doctor">
              <div className="hp-role-icon-wrap hp-role-icon-wrap--teal">
                <Stethoscope size={28} />
              </div>
              <h3>For Doctors</h3>
              <ul>
                {[
                  'Manage your appointment calendar',
                  'Conduct encrypted video consultations',
                  'Access patient history & reports',
                  'Issue digital prescriptions',
                  'AI-assisted diagnosis suggestions',
                  'Dashboard analytics & insights',
                ].map((f) => (
                  <li key={f}><CheckCircle2 size={14} /> {f}</li>
                ))}
              </ul>
              <Link to="/register/doctor" className="hp-btn-secondary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
                Join as Doctor <ArrowRight size={14} className="hp-btn-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 6. STATS (DARK)                                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--dark" ref={statsRef}>
        <div className="hp-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title hp-light">
              Trusted by Thousands,{' '}
              <span className="hp-gradient-text">Backed by Data</span>
            </h2>
          </div>
          <div className="hp-stats-grid">
            {stats.map((s, i) => (
              <div key={s.label} className="hp-stat-card">
                <div className="hp-stat-icon-wrap">
                  <s.icon size={22} />
                </div>
                <div className="hp-stat-value">
                  {counts[i].toLocaleString()}{s.suffix}
                </div>
                <div className="hp-stat-label">{s.label}</div>
                <div className="hp-stat-glow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 7. TESTIMONIALS                                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-section--light">
        <div className="hp-container">
          <div className="hp-section-header">
            <span className="hp-badge hp-badge--dark">Testimonials</span>
            <h2 className="hp-section-title">
              What People Are <span className="hp-gradient-text">Saying</span>
            </h2>
          </div>
          <div className="hp-testimonials-grid">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="hp-testimonial-card"
                style={{ '--card-offset': `${i % 2 === 1 ? '16px' : '0px'}` }}
              >
                <div className="hp-testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} size={14} style={{ fill: '#FBBF24', color: '#FBBF24' }} />
                  ))}
                </div>
                <p className="hp-testimonial-text">"{t.text}"</p>
                <div className="hp-testimonial-author">
                  <div className={`hp-testimonial-avatar bg-gradient-to-br ${t.color}`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="hp-testimonial-name">{t.name}</p>
                    <p className="hp-testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* 8. FINAL CTA                                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-cta-section">
        <div className="hp-cta-glow hp-cta-glow-1" />
        <div className="hp-cta-glow hp-cta-glow-2" />
        <div className="hp-container hp-cta-inner">
          <Sparkles size={36} className="hp-cta-sparkle" />
          <h2 className="hp-cta-title">
            Start Your Smart Healthcare{' '}
            <span className="hp-gradient-text">Journey Today</span>
          </h2>
          <p className="hp-cta-sub">
            Join thousands of patients and doctors already transforming healthcare
            with SmartDoc.
          </p>
          <form
            className="hp-cta-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              className="hp-cta-input"
            />
            <button type="submit" className="hp-btn-primary hp-cta-btn">
              Get Started Free
              <ArrowRight size={16} className="hp-btn-arrow" />
            </button>
          </form>
          <p className="hp-cta-hint">No credit card required · Free forever plan included</p>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════ */}
      {/* FLOATING CHATBOT                                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="hp-chatbot-wrap">
        {chatOpen && (
          <div className="hp-chatbot-box">
            <div className="hp-chatbot-header">
              <Bot size={16} />
              <span>SmartDoc AI</span>
              <button onClick={() => setChatOpen(false)} className="hp-chatbot-close">
                <X size={14} />
              </button>
            </div>
            <div className="hp-chatbot-body">
              <div className="hp-ai-msg hp-ai-msg--ai" style={{ borderRadius: '12px' }}>
                👋 Hi! I'm SmartDoc's AI assistant. How can I help you today?
              </div>
            </div>
            <div className="hp-chatbot-footer">
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Ask me anything…"
              />
              <button type="button" className="hp-ai-send">
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
        <button
          className="hp-chatbot-fab"
          onClick={() => setChatOpen((v) => !v)}
          aria-label="Open AI chat"
        >
          <Bot size={24} />
          <span className="hp-live-dot" style={{ position: 'absolute', top: 6, right: 6 }} />
        </button>
      </div>
    </div>
  );
}
