import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Brain, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';

import { Card, CardContent } from '../components/ui/card';

function HomePage() {
  return (
    <div className="px-4 py-8 md:px-8 md:py-12">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-gradient-to-br from-lake/95 via-lake to-teal-700 text-white">
          <CardContent className="p-8 md:p-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]">
              <ShieldCheck size={14} /> AI-Enabled Smart Healthcare Platform
            </p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Your Next-Gen Telemedicine and Appointment Experience
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
              Book appointments, attend video consultations, upload medical reports, and manage health data securely
              with SmartDoc microservices.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/ai-assist" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-lake shadow-sm transition hover:bg-white/90">
                <Brain size={15} /> AI Symptom Checker <ArrowRight size={14} />
              </Link>
              <Link to="/register/patient" className="inline-flex h-10 items-center rounded-xl border border-white/60 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                Start as Patient
              </Link>
              <Link to="/register/doctor" className="inline-flex h-10 items-center rounded-xl border border-white/60 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                Join as Doctor
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Activity className="mt-1 text-lake" size={20} />
              <div>
                <p className="font-semibold text-lake">Smart Patient Dashboard</p>
                <p className="text-sm text-ink/75">Update profile, upload reports, and track prescriptions in one place.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Stethoscope className="mt-1 text-lake" size={20} />
              <div>
                <p className="font-semibold text-lake">Doctor & Admin Flows</p>
                <p className="text-sm text-ink/75">Role-based login with secure JWT and microservice-ready APIs.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60">
            <CardContent className="flex items-start gap-3 p-5">
              <HeartPulse className="mt-1 text-ember" size={20} />
              <div>
                <p className="font-semibold text-lake">Cloud-Native Foundation</p>
                <p className="text-sm text-ink/75">Built for scalable healthcare workflows and future AI symptom intelligence.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
