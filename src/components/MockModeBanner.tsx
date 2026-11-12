import { useApp } from '../context/AppContext';

export default function MockModeBanner() {
  const { isMockMode, currentUser, deleteMockData, setActiveView } = useApp();

  if (!isMockMode) return null;

  const isDirector = currentUser?.role === 'director';

  const handleDeleteMock = () => {
    if (window.confirm('Delete all mock records, mock accounts, matches, teams and mock audit logs? This cannot be undone.')) {
      deleteMockData();
    }
  };

  return (
    <div
      style={{
        background: '#dc2626',
        color: '#ffffff',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>⚠️</span>
        <span>MOCK TEST MODE - not the real system</span>
        {currentUser?.isMock && (
          <span
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            Signed in as: {currentUser.name} ({currentUser.role})
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!currentUser && (
          <button
            type="button"
            onClick={() => setActiveView('mock-login')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Open /mock-login →
          </button>
        )}

        {isDirector && (
          <button
            type="button"
            onClick={handleDeleteMock}
            title="Remove every mock record, accounts, and sample data"
            style={{
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#f87171',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🗑️</span>
            <span>Delete all mock data</span>
          </button>
        )}
      </div>
    </div>
  );
}

