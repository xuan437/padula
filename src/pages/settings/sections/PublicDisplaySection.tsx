import type { PublicDisplaySettings, ScoreboardTheme } from '../../../types/settings';
import {
  LiveIcon,
  MailIcon,
} from '../../../components/Icons';

interface Props {
  settings: PublicDisplaySettings;
  onChange: (updated: PublicDisplaySettings) => void;
}

const TV_THEMES: { id: ScoreboardTheme; label: string; previewBg: string }[] = [
  { id: 'asian_crimson', label: 'Asian College Crimson (Official)', previewBg: '#dc2626' },
  { id: 'dark_obsidian', label: 'Dark Obsidian (High Contrast)', previewBg: '#0f172a' },
  { id: 'navy_broadcast', label: 'Navy Blue Broadcast Arena', previewBg: '#1e3a8a' },
];

export default function PublicDisplaySection({
  settings,
  onChange,
}: Props) {
  const handleToggle = <K extends keyof PublicDisplaySettings>(
    field: K,
    val: PublicDisplaySettings[K]
  ) => {
    onChange({
      ...settings,
      [field]: val,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Public Accessibility Toggles ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <LiveIcon size={18} color="var(--accent)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Public Guest Portal Visibility Controls
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Enable or restrict modules visible to unauthenticated guests and spectators.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={settings.showPublicStandings}
              onChange={e => handleToggle('showPublicStandings', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>Department Standings</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show win-loss records and rank points</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={settings.showPublicBrackets}
              onChange={e => handleToggle('showPublicBrackets', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>Tournament Brackets</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show elimination brackets and match trees</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={settings.showPublicSchedule}
              onChange={e => handleToggle('showPublicSchedule', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>Match Schedule</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show game times, venues, and court allocations</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={settings.showPublicMedalTally}
              onChange={e => handleToggle('showPublicMedalTally', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>Official Medal Tally</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show Gold/Silver/Bronze counts and total points</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={settings.showPublicPlayerStats}
              onChange={e => handleToggle('showPublicPlayerStats', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>Player Box-Scores &amp; Stats</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show individual points, rebounds, and PER leaders</div>
            </div>
          </label>
        </div>
      </div>

      {/* ── TV Scoreboard Display Settings ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
          Campus TV &amp; Jumbotron Scoreboard Mode
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SCOREBOARD TV COLOR PALETTE
            </label>
            <select
              value={settings.tvScoreboardTheme}
              onChange={e => handleToggle('tvScoreboardTheme', e.target.value as ScoreboardTheme)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
            >
              {TV_THEMES.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SLIDE ROTATION FREQUENCY (SECONDS)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.tvSlideRotationIntervalSeconds}
              onChange={e => handleToggle('tvSlideRotationIntervalSeconds', parseInt(e.target.value, 10) || 12)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* TV Feature Toggles */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.tvAnimatedWinnerScreen}
              onChange={e => handleToggle('tvAnimatedWinnerScreen', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <span><strong>Animated Winner Screen:</strong> Trigger celebratory confetti and sound upon match finalization.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.tvLiveMedalRaceChart}
              onChange={e => handleToggle('tvLiveMedalRaceChart', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <span><strong>Live Medal Race Bar Chart:</strong> Automatically cycle to the overall championship standings.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.tvAutoMatchRecapCard}
              onChange={e => handleToggle('tvAutoMatchRecapCard', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <span><strong>Auto Match Recap Card:</strong> Surface top performer and team stat cards after each game.</span>
          </label>
        </div>
      </div>

      {/* ── Notification Channels ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <MailIcon size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Automated Alerts &amp; Notification Triggers
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* In-App Alerts */}
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
              In-App Real-Time Push Toasts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyScheduleChangesInApp}
                  onChange={e => handleToggle('notifyScheduleChangesInApp', e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Schedule &amp; Court Changes</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyFinalResultsInApp}
                  onChange={e => handleToggle('notifyFinalResultsInApp', e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Final Match Score Confirmations</span>
              </label>
            </div>
          </div>

          {/* Institutional Email Alerts */}
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
              Asian College Institutional Email Alerts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyScheduleChangesEmail}
                  onChange={e => handleToggle('notifyScheduleChangesEmail', e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Email Coordinators on Rescheduled Matches</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyFinalResultsEmail}
                  onChange={e => handleToggle('notifyFinalResultsEmail', e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Email Department Heads Daily Recap Digest</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

