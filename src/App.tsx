import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import DirectorTempLoginPage from './pages/DirectorTempLoginPage';
import MockLoginPage from './pages/MockLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ScorekeeperDashboard from './pages/ScorekeeperDashboard';
import ScorerDashboard from './pages/ScorerDashboard';
import GuestPublicPage from './pages/GuestPublicPage';
import LiveScoreboard from './pages/LiveScoreboard';
import EventSetupPage from './pages/EventSetupPage';
import SetupWizardPage from './pages/SetupWizardPage';
import OfficialsHubPage from './pages/OfficialsHubPage';
import RegistrationPage from './pages/RegistrationPage';
import BracketPage from './pages/BracketPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AuditLogPage from './pages/AuditLogPage';
import TopScorersPage from './pages/TopScorersPage';
import AIPredictionsPage from './pages/AIPredictionsPage';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerStatsDashboard from './pages/PlayerStatsDashboard';
import AccessRequestsPage from './pages/AccessRequestsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SchedulePage from './pages/SchedulePage';
import Sidebar from './components/Sidebar';
import MockModeBanner from './components/MockModeBanner';
import { isMockModeActive } from './lib/config';

function AppContent() {
  const { currentUser, setCurrentUser, activeView, setActiveView, addAuditLog } = useApp();

  // ── URL Hash / Path Detection (Always default to Public View when opening the system) ──
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (pathname === '/mock-login' && isMockModeActive()) {
      setActiveView('mock-login');
    } else if (pathname === '/director-login') {
      setActiveView('director-login');
    } else if (pathname === '/settings' || hash === '#/settings' || hash === '#settings') {
      setActiveView('settings');
    } else {
      setActiveView('public');
    }
  }, [setActiveView]);

  // ── Role Access Enforcement (Scorer & Guests cannot open Settings/Admin pages) ──
  useEffect(() => {
    if (currentUser) {
      if (currentUser.status === 'disabled') {
        setCurrentUser(null);
        setActiveView('public');
        return;
      }
      if (currentUser.role === 'scorer') {
        const adminViews = ['admin', 'event-setup', 'setup-wizard', 'officials', 'registration', 'teams', 'analytics', 'audit', 'announcements', 'archive', 'settings', 'access-requests'];
        if (adminViews.includes(activeView)) {
          setActiveView('scorekeeper');
        }
      } else if (currentUser.role === 'coordinator') {
        if (activeView === 'scorekeeper' || activeView === 'scorer-dashboard' || activeView === 'audit') {
          setActiveView('admin');
        }
      }
    } else {
      // If unauthenticated guest attempts to access settings, redirect to public
      if (activeView === 'settings') {
        setActiveView('public');
      }
    }
  }, [currentUser, activeView, setCurrentUser, setActiveView]);

  // ── Inactivity Auto-Logout (30 mins standard staff; 120 mins for Scorers during live matches) ──
  useEffect(() => {
    let timer: number;
    const timeoutMs = currentUser?.role === 'scorer'
      ? 120 * 60 * 1000 // 120 minutes for certified scorers during tournament matches
      : 30 * 60 * 1000;  // 30 minutes standard staff session

    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (currentUser) {
          try { sessionStorage.setItem('padula_session_expired', 'true'); } catch {}
          addAuditLog('logout', `Session expired due to inactivity for ${currentUser.name} (${currentUser.role})`);
          setCurrentUser(null);
          setActiveView('login');
        }
      }, timeoutMs);
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, setCurrentUser, setActiveView, addAuditLog]);

  // Dedicated Mock Login Portal (available only in mock mode)
  if (activeView === 'mock-login') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MockModeBanner />
        <MockLoginPage />
      </div>
    );
  }

  // Dedicated Hidden Director Temporary Portal
  if (activeView === 'director-login') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MockModeBanner />
        <DirectorTempLoginPage onBackToPublic={() => setActiveView('public')} />
      </div>
    );
  }

  // If institutional login view is explicitly triggered
  if (activeView === 'login') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MockModeBanner />
        <LoginPage onBackToPublic={() => setActiveView('public')} />
      </div>
    );
  }

  // When viewing public results or not logged in, render standalone public page
  if (activeView === 'public' || !currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MockModeBanner />
        <GuestPublicPage />
      </div>
    );
  }

  const renderPage = () => {
    switch (activeView) {
      case 'live':              return <LiveScoreboard />;
      case 'admin':             return <AdminDashboard />;
      case 'announcements':     return <AnnouncementsPage />;
      case 'schedule':          return <SchedulePage />;
      case 'scorer-dashboard':  return <ScorerDashboard />;
      case 'scorekeeper':       return <ScorekeeperDashboard />;
      case 'registration':      return <RegistrationPage />;
      case 'player':
      case 'players':
      case 'player-list':       return <PlayerDashboard />;
      case 'player-stats':      return <PlayerStatsDashboard />;
      case 'setup-wizard':      return <SetupWizardPage />;
      case 'officials':         return <OfficialsHubPage />;
      case 'event-setup':       return <EventSetupPage />;
      case 'teams':             return <RegistrationPage />;
      case 'bracket':           return <BracketPage />;
      case 'scorers':           return <TopScorersPage />;
      case 'analytics':         return <AnalyticsDashboard />;
      case 'archive':           return <AnalyticsDashboard initialTab="archive" />;
      case 'predictions':       return <AIPredictionsPage />;
      case 'access-requests':   return <AccessRequestsPage />;
      case 'settings':          return <SettingsPage />;
      case 'audit':             return <AuditLogPage />;

      default:
        switch (currentUser.role) {
          case 'director':
          case 'coordinator': return <AdminDashboard />;
          case 'scorer':      return <ScorekeeperDashboard />;
          default:            return <GuestPublicPage />;
        }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MockModeBanner />
      <div className="app-layout" style={{ flex: 1 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <main className="main-content" style={{ paddingBottom: currentUser.role === 'scorer' ? 88 : undefined }}>
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
