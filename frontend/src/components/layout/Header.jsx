import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, CalendarCheck2, HeartPulse, LayoutDashboard, LogOut, Menu, ShieldPlus, X } from 'lucide-react';

function Header({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive(path)
      ? 'text-white'
      : 'text-slate-300 hover:text-white hover:bg-white/10'
    }`;

  const getDashboardPath = () => {
    if (!session?.user) return '/login';
    if (session.user.role === 'patient') return '/dashboard/patient';
    if (session.user.role === 'doctor') return '/dashboard/doctor';
    if (session.user.role === 'admin') return '/dashboard/admin';
    return '/';
  };

  const getRoleBadgeStyle = () => {
    const role = session?.user?.role;
    if (role === 'admin') return { background: 'linear-gradient(135deg, #7C3AED, #6366F1)', label: 'Admin' };
    if (role === 'doctor') return { background: 'linear-gradient(135deg, #0F766E, #14B8A6)', label: 'Doctor' };
    return { background: 'linear-gradient(135deg, #0052FF, #4D7CFF)', label: 'Patient' };
  };

  const roleStyle = getRoleBadgeStyle();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, rgba(15,42,68,0.96) 0%, rgba(19,78,94,0.96) 60%, rgba(31,122,122,0.94) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
              boxShadow: '0 0 0 2px rgba(77,124,255,0.25), 0 4px 12px rgba(0,82,255,0.35)',
            }}
          >
            <ShieldPlus size={16} className="text-white" />
          </div>
          <span
            className="text-base font-black tracking-tight text-white"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}
          >
            Smart<span style={{ color: '#4D7CFF' }}>Doc</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {!session?.user && (
            <>
              <Link to="/" className={navLinkClass('/')}>
                {isActive('/') && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }}
                  />
                )}
                <span className="relative">Home</span>
              </Link>
              <Link to="/login" className={navLinkClass('/login')}>
                {isActive('/login') && (
                  <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }} />
                )}
                <span className="relative">Login</span>
              </Link>
              <Link to="/register/patient" className={navLinkClass('/register/patient')}>
                {isActive('/register/patient') && (
                  <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }} />
                )}
                <span className="relative"></span>
              </Link>
              <Link to="/register/doctor" className={navLinkClass('/register/doctor')}>
                {isActive('/register/doctor') && (
                  <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }} />
                )}
                <span className="relative"></span>
              </Link>
            </>
          )}
          {session?.user && (
            <>
              <Link to={getDashboardPath()} className={navLinkClass(getDashboardPath())}>
                {isActive(getDashboardPath()) && (
                  <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }} />
                )}
                <span className="relative flex items-center gap-1.5">
                  <LayoutDashboard size={13} />
                  Dashboard
                </span>
              </Link>
              {session.user.role === 'patient' && (
                <Link to="/appointments" className={navLinkClass('/appointments')}>
                  {isActive('/appointments') && (
                    <span className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,82,255,0.5), rgba(77,124,255,0.4))' }} />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <CalendarCheck2 size={13} />
                    Appointments
                  </span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* AI Symptom Checker */}
          <button
            type="button"
            onClick={() => navigate('/ai-assist')}
            className="flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3.5 py-2 text-xs font-bold text-violet-300 transition-all hover:-translate-y-0.5 hover:bg-violet-500/25 hover:border-violet-400/50"
          >
            <Brain size={13} />
            AI Checker
          </button>

          {session?.user ? (
            <div className="flex items-center gap-2">
              {/* Role badge */}
              <div
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: roleStyle.background, opacity: 0.9 }}
              >
                <HeartPulse size={12} />
                {roleStyle.label}
              </div>
              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                boxShadow: '0 4px 16px rgba(0,82,255,0.35)',
              }}
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="border-t border-white/10 px-4 py-4 md:hidden"
          style={{ background: 'rgba(15,42,68,0.98)', animation: 'slideUpPop 0.2s ease' }}
        >
          <div className="space-y-1">
            {!session?.user ? (
              <>
                {[['/', 'Home'], ['/login', 'Login'], ['/register/patient', 'Patient Register'], ['/register/doctor', 'Doctor Register']].map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive(path) ? 'bg-blue-500/30 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                  >
                    {label}
                  </Link>
                ))}
              </>
            ) : (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => { navigate('/ai-assist'); setMobileOpen(false); }}
              className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-violet-300 hover:bg-violet-500/15"
            >
              🧠 AI Symptom Checker
            </button>
            {session?.user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/15"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { navigate('/login'); setMobileOpen(false); }}
                className="mt-2 block w-full rounded-xl py-3 text-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0052FF, #4D7CFF)' }}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
