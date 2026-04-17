import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hp-footer" style={{ marginTop: 'auto' }}>
      <div className="hp-container">
        <div className="hp-footer-top">
          <div className="hp-footer-brand">
            <div className="hp-footer-logo">
              <ShieldCheck size={20} />
              <span>SmartDoc</span>
            </div>
            <p className="hp-footer-tagline">
              AI-Enabled Smart Healthcare, Appointment & Telemedicine Platform.
            </p>
            <div className="hp-footer-socials">
              {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                <a key={s} href="#" className="hp-social-btn" aria-label={s}>
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          <div className="hp-footer-links">
            <div>
              <h4>Platform</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/ai-assist">AI Symptom Checker</Link></li>
                <li><Link to="/appointments">Book Appointment</Link></li>
                <li><Link to="/register/patient">Patient Register</Link></li>
              </ul>
            </div>
            <div>
              <h4>Doctors</h4>
              <ul>
                <li><Link to="/register/doctor">Join as Doctor</Link></li>
                <li><Link to="/login">Doctor Login</Link></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hp-footer-bottom">
          <p>© 2026 SmartDoc. All rights reserved.</p>
          <p className="hp-footer-sub">Built with ❤️ for better healthcare.</p>
        </div>
      </div>
    </footer>
  );
}
