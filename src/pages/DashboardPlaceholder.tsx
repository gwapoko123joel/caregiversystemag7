import { useNavigate } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  Activity,
  FileText,
  Phone,
  Bell,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import '../styles/dashboard.css'

const ROLE_LABELS: Record<string, string> = {
  caregiver: 'Caregiver',
  medical_practitioner: 'Medical Practitioner',
  admin: 'Administrator',
}

export default function DashboardPlaceholder() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const features = [
    { icon: <Activity size={24} />, title: 'Real-Time Monitoring', desc: 'Live vitals dashboard for assigned patients', soon: false },
    { icon: <FileText size={24} />, title: 'Automated Reports', desc: 'Schedule and submit caregiver data reports', soon: false },
    { icon: <Bell size={24} />, title: 'Alert System', desc: 'Visual & audio emergency notifications', soon: false },
    { icon: <Phone size={24} />, title: 'Cellular Consult', desc: 'Secure phone consultation with medical practitioners', soon: false },
  ]

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Heart size={26} />
          <span>BantayanCare</span>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item nav-item--active">
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button className="nav-item">
            <Activity size={20} />
            Monitoring
          </button>
          <button className="nav-item">
            <FileText size={20} />
            Reports
          </button>
          <button className="nav-item">
            <Bell size={20} />
            Alerts
          </button>
          <button className="nav-item">
          <Phone size={20} />
            Contact
          </button>
        </nav>
        <button className="nav-item nav-item--signout" onClick={handleSignOut}>
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <header className="dash-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to the BantayanCare Portal</p>
          </div>
          <div className="dash-user">
            <div className="dash-avatar">
              <User size={20} />
            </div>
            <div className="dash-user-info">
              <strong>{profile?.full_name ?? 'Loading…'}</strong>
              <span>{ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}</span>
            </div>
          </div>
        </header>

        {/* Welcome card */}
        <div className="welcome-card">
          <div className="welcome-card__icon">
            <Heart size={40} strokeWidth={1.5} />
          </div>
          <div className="welcome-card__body">
            <h2>System Initializing</h2>
            <p>
              The BantayanCare monitoring system is ready. Your access ID{' '}
              <code>{profile?.access_id ?? '—'}</code> has been verified. Full module
              development is underway — your care dashboard will be available shortly.
            </p>
          </div>
          <div className="welcome-pulse" aria-hidden="true">
            <span /><span /><span />
          </div>
        </div>

        {/* Feature cards */}
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className={`feature-card${f.soon ? ' feature-card--soon' : ''}`}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              {f.soon && <span className="soon-badge">Coming Soon</span>}
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="stats-strip">
          {[
            { label: 'Access ID', value: profile?.access_id ?? '—' },
            { label: 'Role', value: ROLE_LABELS[profile?.role ?? ''] ?? '—' },
            { label: 'Status', value: 'Active' },
            { label: 'Last Login', value: new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' }) },
          ].map((s) => (
            <div key={s.label} className="stat">
              <span className="stat-label">{s.label}</span>
              <strong className="stat-value">{s.value}</strong>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
