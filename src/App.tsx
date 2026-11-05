import { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ScorekeeperDashboard from './pages/ScorekeeperDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import GuestPublicPage from './pages/GuestPublicPage';
import LiveScoreboard from './pages/LiveScoreboard';
import EventSetupPage from './pages/EventSetupPage';
import RegistrationPage from './pages/RegistrationPage';
import BracketPage from './pages/BracketPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AuditLogPage from './pages/AuditLogPage';
import PlayerStatsDashboard from './pages/PlayerStatsDashboard';
import TopScorersPage from './pages/TopScorersPage';
import Sidebar from './components/Sidebar';
import PasswordChangeModal from './components/PasswordChangeModal';

function AppContent() {
  const { currentUser, setCurrentUser, activeView, setActiveView } = useApp();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // ── 30-Minute Inactivity Auto-Logout ──
  useEffect(() => {
    let timer: number;
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (currentUser && currentUser.role !== 'guest') {
          setCurrentUser({
            id: 'guest',
            name: 'Public Visitor',
            role: 'guest',
            username: 'guest',
            avatarInitials: 'PV',
          });
          setActiveView('public');
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, setCurrentUser, setActiveView]);

  // If login view is explicitly triggered, display the dedicated login portal
  if (activeView === 'login') {
    return <LoginPage onBackToPublic={() => setActiveView('public')} />;
  }

  // When viewing public results, render standalone without admin sidebar or buttons
  if (activeView === 'public') {
    return <GuestPublicPage />;
  }

  const user = currentUser || {
    id: 'guest',
    name: 'Public Visitor',
    role: 'guest',
    username: 'guest',
    avatarInitials: 'PV',
  };

  const renderPage = () => {
    switch (activeView) {
      case 'live':          return <LiveScoreboard />;
      case 'admin':         return <AdminDashboard />;
      case 'scorekeeper':   return <ScorekeeperDashboard />;
      case 'player-stats':  return <PlayerStatsDashboard />;
      case 'player':        return <PlayerDashboard />;
      case 'registration':  return <RegistrationPage />;
      case 'event-setup':   return <EventSetupPage />;
      case 'teams':         return <RegistrationPage />;
      case 'bracket':       return <BracketPage />;
      case 'scorers':       return <TopScorersPage />;
      case 'analytics':     return <AnalyticsDashboard />;
      case 'audit':         return <AuditLogPage />;

      default:
        switch (user.role) {
          case 'director':
          case 'coordinator': return <AdminDashboard />;
          case 'scorer':      return <ScorekeeperDashboard />;
          case 'player':      return <PlayerDashboard />;
          case 'guest':
          default:            return <GuestPublicPage />;
        }
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <main className="main-content">
          {renderPage()}
        </main>
      </div>

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
