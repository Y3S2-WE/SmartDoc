import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, HeartPulse, ShieldPlus } from 'lucide-react';

import { Button } from '../ui/button';

function Header({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const linkClass = (path) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      location.pathname === path ? 'bg-lake text-white' : 'text-lake hover:bg-lake/10'
    }`;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/25 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-lake">
          <ShieldPlus size={18} />
          <span className="text-base font-bold tracking-wide">SmartDoc</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className={linkClass('/')}>Home</Link>
          <Link to="/login" className={linkClass('/login')}>Login</Link>
          <Link to="/register/patient" className={linkClass('/register/patient')}>Patient Register</Link>
          <Link to="/register/doctor" className={linkClass('/register/doctor')}>Doctor Register</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/ai-assist')}
            className="hidden items-center gap-1.5 border-lake/30 bg-lake/5 text-lake hover:border-lake/60 hover:bg-lake/10 md:flex"
          >
            <Brain size={14} /> AI Symptom Checker
          </Button>

          {session?.user ? (
            <>
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-lake/80 md:inline-flex">
                <HeartPulse size={14} className="mr-1" /> {session.user.role}
              </span>
              {session.user.role === 'patient' ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/patient')}>
                    Patient Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
                    Book Appointment
                  </Button>
                </>
              ) : null}
              {session.user.role === 'doctor' ? (
                <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/doctor')}>
                  Doctor Dashboard
                </Button>
              ) : null}
              {session.user.role === 'admin' ? (
                <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/admin')}>
                  Admin Dashboard
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
