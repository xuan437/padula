import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { XIcon, SearchIcon, ChevronRightIcon, SparklesIcon, ArrowRightIcon } from './Icons';

export interface GuidePointerStep {
  title: string;
  instruction: string;
  view?: string;
  textMatches?: string[];
  selector?: string;
}

export type GuideRole = 'guest' | 'director' | 'coordinator' | 'scorer';

export interface GuideTopic {
  id: string;
  question: string;
  keywords: string[];
  roles: GuideRole[];
  summary: string;
  targetView?: string;
  targetLabel?: string;
  steps: GuidePointerStep[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'tour-current',
    question: 'Where am I? Give me a tour of this page',
    keywords: ['lost', 'where am i', 'help', 'tour', 'guide', 'page', 'start', 'overview', 'what is this'],
    roles: ['guest', 'director', 'coordinator', 'scorer'],
    summary: 'I will point to the main controls on your current screen and explain what each one does.',
    steps: [],
  },
  // ── Public Spectator Topics (Only shown in Public View / Guest Mode) ──────
  {
    id: 'public-live-results',
    question: 'How do I check live scores, final results, and match schedules?',
    keywords: ['live', 'score', 'results', 'schedule', 'upcoming', 'finished', 'matches', 'games', 'time', 'venue'],
    roles: ['guest'],
    summary: 'Use the Live, Results, and Schedule tabs at the top of the Public Hub to follow real-time games, completed scores, and upcoming court schedules.',
    targetView: 'public',
    targetLabel: 'View Live & Results',
    steps: [
      {
        title: '1. Live, Results & Schedule Tabs',
        instruction: 'Click "Live" for ongoing games, "Results" for completed match scores, or "Schedule" for upcoming fixtures and venues.',
        view: 'public',
        textMatches: ['Live', 'Results', 'Schedule'],
      },
      {
        title: '2. Filter by Sport',
        instruction: 'Click any sport pill (such as Basketball, Volleyball, Futsal, Badminton, or Esports) to filter matches for that sport.',
        view: 'public',
        textMatches: ['All Sports', 'Basketball', 'Volleyball'],
      },
    ],
  },
  {
    id: 'public-standings-brackets',
    question: 'How do I view department standings, tournament brackets, and the medal tally?',
    keywords: ['standings', 'brackets', 'medal', 'tally', 'gold', 'silver', 'bronze', 'ranking', 'department', 'tree'],
    roles: ['guest'],
    summary: 'Switch to the Standings, Brackets, or Medal Tally tabs on the Public Hub to track department rankings and championship trees.',
    targetView: 'public',
    targetLabel: 'View Standings & Tally',
    steps: [
      {
        title: '1. Standings, Brackets & Medal Tally Tabs',
        instruction: 'Click "Standings" for team win-loss tables, "Brackets" for elimination trees, or "Medal Tally" for overall department Gold, Silver, and Bronze rankings.',
        view: 'public',
        textMatches: ['Standings', 'Brackets', 'Medal Tally'],
      },
      {
        title: '2. Official Announcements',
        instruction: 'Click "Announcements" to read official tournament updates and schedule notices.',
        view: 'public',
        textMatches: ['Announcements'],
      },
    ],
  },
  {
    id: 'public-ai-predictions',
    question: 'How do I view AI match predictions and win probabilities?',
    keywords: ['ai', 'prediction', 'forecast', 'probability', 'win', 'elo', 'simulate', 'matchup'],
    roles: ['guest'],
    summary: 'Check the AI Forecast strip on any live match card or open the Predictions tab to simulate head-to-head department matchups.',
    targetView: 'public',
    targetLabel: 'View AI Forecasts',
    steps: [
      {
        title: '1. Live Match AI Forecast Strip',
        instruction: 'Click "Full AI Forecast" on any live match card to inspect win probability, projected final score, and Elo comparison.',
        view: 'public',
        textMatches: ['Full AI Forecast', 'Predictions'],
      },
    ],
  },
  {
    id: 'share-livestream',
    question: 'How do I connect my camera or share a live stream to Facebook, TikTok, or YouTube?',
    keywords: ['stream', 'livestream', 'camera', 'facebook', 'tiktok', 'youtube', 'share', 'mobile', 'app', 'video'],
    roles: ['guest'],
    summary: 'On the Public Hub Live tab, click "Share Live Stream" on any match card to connect your camera, overlay the live scoreboard, and launch Facebook, TikTok, or YouTube.',
    targetView: 'public',
    targetLabel: 'Go to Live Matches',
    steps: [
      {
        title: '1. Click "Share Live Stream" on a Match Card',
        instruction: 'On any live match card, click the "Share Live Stream" button in the bottom corner of the card.',
        view: 'public',
        textMatches: ['Share Live Stream'],
      },
      {
        title: '2. Connect Camera & Launch Installed App',
        instruction: 'Inside the studio modal, click "Connect Camera" to overlay the live scoreboard onto your video, then tap Facebook, TikTok, or YouTube (or "Share via Installed Mobile Apps...").',
        view: 'public',
        textMatches: ['Connect Camera', 'Open Installed', 'Share via Installed Mobile Apps'],
      },
    ],
  },
  {
    id: 'public-qr-print',
    question: 'How do I share the tournament link, scan the QR poster, or print schedules?',
    keywords: ['qr', 'print', 'poster', 'share', 'link', 'theme', 'dark', 'light'],
    roles: ['guest'],
    summary: 'Use the Share / QR and Print buttons in the top-right header of the Public Hub to open the scannable QR poster or print clean tournament sheets.',
    targetView: 'public',
    targetLabel: 'Open Share & Print',
    steps: [
      {
        title: '1. Share / QR Poster & Print',
        instruction: 'Click "Share / QR" in the top-right header to display or print the scannable tournament QR poster, or click "Print" to print the current view.',
        view: 'public',
        textMatches: ['Share / QR', 'Print'],
      },
    ],
  },

  // ── Official Scorer Topics (Only shown when logged in as Scorer) ──────────
  {
    id: 'scorer-assigned-matches',
    question: 'How do I view my assigned matches and court schedule?',
    keywords: ['assigned', 'my matches', 'schedule', 'court', 'upcoming', 'duty'],
    roles: ['scorer'],
    summary: 'Open My Assigned Matches or Schedule & Results in the sidebar to see the games and courts assigned to you.',
    targetView: 'scorer-dashboard',
    targetLabel: 'Open My Assigned Matches',
    steps: [
      {
        title: '1. Open My Assigned Matches',
        instruction: 'Click "My Assigned Matches" in the sidebar to view your upcoming and active court assignments.',
        view: 'scorer-dashboard',
        textMatches: ['My Assigned Matches', 'Scorer Desk'],
      },
    ],
  },
  {
    id: 'score-live-match',
    question: 'How do I enter live scores and finalize a match?',
    keywords: ['score', 'live', 'scorer desk', 'points', 'quarter', 'set', 'finalize', 'clock', 'timer'],
    roles: ['scorer', 'coordinator', 'director'],
    summary: 'Use the Scorer Desk to start a scheduled match, increment team and player stats in real time, and finalize the official result.',
    targetView: 'scorekeeper',
    targetLabel: 'Open Scorer Desk',
    steps: [
      {
        title: '1. Open Scorer Desk',
        instruction: 'Click "Scorer Desk" in the sidebar to open the court-side scoring console.',
        view: 'scorekeeper',
        textMatches: ['Scorer Desk'],
      },
      {
        title: '2. Select Active Match & Update Scores',
        instruction: 'Pick a live or scheduled match, use the quick +1 / +2 / +3 score buttons and period controls, then click Finalize when the game ends.',
        view: 'scorekeeper',
        textMatches: ['Live', 'Scheduled', 'Finalize'],
      },
    ],
  },
  {
    id: 'generate-brackets',
    question: 'How do I view or manage tournament brackets & standings?',
    keywords: ['bracket', 'draw', 'seed', 'matchup', 'tree', 'elimination', 'round robin', 'standings', 'bye'],
    roles: ['scorer', 'coordinator', 'director'],
    summary: 'Open Brackets & Standings to view elimination trees, round-robin tables, seed teams, or generate matchups.',
    targetView: 'bracket',
    targetLabel: 'Open Brackets',
    steps: [
      {
        title: '1. Open Brackets & Standings',
        instruction: 'Click "Brackets & Standings" (or "Brackets") in the sidebar.',
        view: 'bracket',
        textMatches: ['Brackets & Standings', 'Brackets'],
      },
      {
        title: '2. Filter by Sport & Inspect Bracket',
        instruction: 'Choose a sport pill at the top to view its bracket tree and current round progression.',
        view: 'bracket',
        textMatches: ['Basketball', 'Volleyball', 'Single Elimination', 'Round Robin'],
      },
    ],
  },

  // ── Coordinator & Director Topics (Hidden in Public View and from Scorers) ──
  {
    id: 'setup-tournament',
    question: 'How do I create or set up a tournament & venues?',
    keywords: ['create', 'setup', 'tournament', 'event', 'venue', 'court', 'sport', 'date', 'new event'],
    roles: ['director', 'coordinator'],
    summary: 'Go to Event Setup to configure tournament dates, accredited sports, and playing venues, or use Settings for format rules.',
    targetView: 'event-setup',
    targetLabel: 'Open Event Setup',
    steps: [
      {
        title: '1. Open Event Setup',
        instruction: 'Click "Event Setup" in the sidebar under Competition to manage tournament details, sports, and venues.',
        view: 'event-setup',
        textMatches: ['Event Setup'],
      },
      {
        title: '2. Configure Event & Sports',
        instruction: 'Fill in the tournament name, dates, and select which sports and venues are active for this season.',
        view: 'event-setup',
        selector: 'main .glass-card, main form, main input',
      },
      {
        title: '3. Customize Rules & Formats',
        instruction: 'Need to change Single Elimination, Round Robin, Best-of-3/5 series, or point systems? Click "Settings" in the sidebar.',
        view: 'settings',
        textMatches: ['Settings', 'Tournament Format'],
      },
    ],
  },
  {
    id: 'register-teams-players',
    question: 'How do I register teams and student-athletes?',
    keywords: ['register', 'team', 'player', 'athlete', 'roster', 'jersey', 'medical', 'excel', 'import'],
    roles: ['director', 'coordinator'],
    summary: 'Open Registration under People to add department teams, register players, or bulk-import rosters via Excel.',
    targetView: 'registration',
    targetLabel: 'Go to Registration',
    steps: [
      {
        title: '1. Open Registration Portal',
        instruction: 'Click "Registration" in the sidebar under the People section.',
        view: 'registration',
        textMatches: ['Registration'],
      },
      {
        title: '2. Register a Team or Import Excel',
        instruction: 'Use the Teams tab to register a department team for a sport, or click the Players tab to add student-athletes with jersey numbers and positions.',
        view: 'registration',
        textMatches: ['Teams', 'Players', 'Register Team'],
      },
    ],
  },
  {
    id: 'register-scorers-coordinators',
    question: 'How do I register staff and send their appointment letter?',
    keywords: ['scorekeeper', 'scorer', 'coordinator', 'gmail', 'email', 'invitation', 'letter', 'token', 'staff', 'official'],
    roles: ['director', 'coordinator'],
    summary: 'In Registration, open the Scorekeepers or Coordinators tab to register staff with a 24-hour one-time password setup link, or click "Open in Gmail" to send manually.',
    targetView: 'registration',
    targetLabel: 'Open Staff Registration',
    steps: [
      {
        title: '1. Go to Registration',
        instruction: 'Click "Registration" in the left navigation sidebar.',
        view: 'registration',
        textMatches: ['Registration'],
      },
      {
        title: '2. Select Scorekeepers or Coordinators Tab',
        instruction: 'Click the "Scorekeepers" tab (or "Coordinators" tab) at the top of the Registration page.',
        view: 'registration',
        textMatches: ['Scorekeepers', 'Coordinators'],
      },
      {
        title: '3. Register & Send Appointment Letter',
        instruction: 'Submit their name, sport, and email. The appointment letter includes a one-time 24-hour password setup link, and you can click "Open in Gmail" to send it directly.',
        view: 'registration',
        textMatches: ['Register Scorekeeper', 'Register Coordinator', 'Open in Gmail', 'View Letter'],
      },
    ],
  },
  {
    id: 'customize-settings',
    question: 'How do I customize tournament settings, formats & tiebreakers?',
    keywords: ['settings', 'format', 'tiebreaker', 'series', 'best of 3', 'best of 5', 'points', 'lock', 'unlock', 'permission', 'customize'],
    roles: ['director', 'coordinator'],
    summary: 'Open Settings in the sidebar to access all 8 configuration sections for formats, tiebreakers, rosters, stats formulas, and displays.',
    targetView: 'settings',
    targetLabel: 'Open Settings Console',
    steps: [
      {
        title: '1. Open Settings Console',
        instruction: 'Click "Settings" in the left sidebar.',
        view: 'settings',
        textMatches: ['Settings'],
      },
      {
        title: '2. Switch Between All 8 Settings Sections',
        instruction: 'Choose any of the 8 sections on the left (Sports & Competition, Teams & Rosters, Stats & Metrics, Scoring, Users & Security, Dashboards, Public Display, System).',
        view: 'settings',
        textMatches: ['Sports & Competition', 'Teams & Rosters', 'Stats & Metrics', 'Save Current Settings'],
      },
      {
        title: '3. Save Your Changes',
        instruction: 'After updating any rules, tiebreakers, or formats, click "Save Section" or "Save Current Settings" to persist them.',
        view: 'settings',
        textMatches: ['Save Section', 'Save Current Settings'],
      },
    ],
  },
];

// Page-specific automatic tour steps when the user asks "Where am I? Give me a tour of this page"
function getPageTourSteps(activeView: string, effectiveRole: GuideRole): GuidePointerStep[] {
  if (activeView === 'public' || effectiveRole === 'guest') {
    return [
      {
        title: '1. Live Scores & Tournament Tabs',
        instruction: 'Use the navigation tabs to switch between Live matches, Results, Standings, Brackets, Schedule, Medal Tally, Announcements, and AI Predictions.',
        textMatches: ['Live', 'Results', 'Standings', 'Medal Tally'],
      },
      {
        title: '2. Filter by Sport & Search Teams',
        instruction: 'Select any sport pill to filter matches and standings for that sport.',
        textMatches: ['All Sports', 'Basketball', 'Volleyball'],
      },
      {
        title: '3. Share Live Stream & Camera Studio',
        instruction: 'Click "Share Live Stream" on any match card to open the camera scoreboard overlay studio and share to Facebook, TikTok, or YouTube.',
        textMatches: ['Share Live Stream'],
      },
      {
        title: '4. QR Code Poster & Print',
        instruction: 'Use "Share / QR" in the top-right header to open the scannable QR poster or "Print" to print tournament sheets.',
        textMatches: ['Share / QR', 'Print'],
      },
    ];
  }

  switch (activeView) {
    case 'login':
    case 'director-login':
    case 'mock-login':
      return [
        {
          title: '1. Account Sign-In',
          instruction: 'Enter your registered email address and password to sign in.',
          textMatches: ['Sign In', 'Return to Public'],
          selector: 'input[type="email"], input[type="text"]',
        },
        {
          title: '2. Return to Public Tournament Hub',
          instruction: 'You can return to the public live scoreboard at any time.',
          textMatches: ['Public', 'Back'],
        },
      ];
    case 'admin':
      return [
        {
          title: '1. Quick-Jump Sidebar Navigation',
          instruction: 'Use the left sidebar (and the "Quick jump..." search box at the top of the sidebar) to jump to Event Setup, Registration, Brackets, Scorer Desk, or Settings.',
          textMatches: ['Event Setup', 'Registration', 'Brackets & Standings'],
        },
        {
          title: '2. 4-Step Tournament Navigation Guide',
          instruction: 'Click the collapsible "Tournament Navigation Guide" bar on your dashboard for a 4-step checklist from Setup to Live Scoring.',
          textMatches: ['Tournament Navigation Guide'],
        },
      ];
    case 'registration':
      return [
        {
          title: '1. Registration Category Tabs',
          instruction: 'Switch between Teams, Players, Referees, Scorekeepers, Coaches, Managers, and Coordinators using these top tabs.',
          textMatches: ['Teams', 'Players', 'Scorekeepers', 'Coordinators'],
        },
        {
          title: '2. Register & Dispatch Gmail Invitations',
          instruction: 'When you register a Scorekeeper or Coordinator, their official appointment letter and temporary login password open directly in Gmail.',
          textMatches: ['Register Team', 'Register Scorekeeper', 'Register Coordinator', 'View Letter'],
        },
      ];
    case 'settings':
      return [
        {
          title: '1. All 8 Settings Sections',
          instruction: 'Select any of the 8 sections on the left to configure sports rules, tournament formats, rosters, stats formulas, security, dashboards, public display, or backups.',
          textMatches: ['Sports & Competition', 'Teams & Rosters', 'Stats & Metrics'],
        },
        {
          title: '2. Sport Selector Pills',
          instruction: 'Click any of the 13 sport pills to customize its period rules, tournament format, series length, and tiebreaker priority order.',
          textMatches: ['Basketball', 'Volleyball', 'Futsal'],
        },
        {
          title: '3. Save Section Changes',
          instruction: 'Click "Save Section" or "Save Current Settings" to apply your configuration across the portal.',
          textMatches: ['Save Section', 'Save Current Settings'],
        },
      ];
    case 'scorekeeper':
    case 'scorer-dashboard':
      return [
        {
          title: '1. Select Match to Score',
          instruction: 'Choose your assigned live or upcoming match from the selector to open the court-side scoring controls.',
          textMatches: ['Scorer Desk', 'Live', 'Scheduled'],
        },
        {
          title: '2. Increment Scores & Finalize',
          instruction: 'Use the team score buttons and player stat controls to record points in real time, then finalize the match when complete.',
          textMatches: ['Finalize', 'Period', 'Quarter', 'Set'],
        },
      ];
    case 'bracket':
      return [
        {
          title: '1. Select Sport Bracket',
          instruction: 'Pick a sport filter at the top to view its elimination bracket tree or round-robin standings table.',
          textMatches: ['Basketball', 'Volleyball', 'Brackets'],
        },
        {
          title: '2. Manage Seeds & Matchups',
          instruction: 'Click on bracket matchups to inspect scores, swap teams, or advance winners to the next round.',
          textMatches: ['Quarter-Final', 'Semi-Final', 'Final', 'Standings'],
        },
      ];
    default:
      return [
        {
          title: '1. Left Navigation Sidebar',
          instruction: 'Use the left sidebar to switch between your authorized navigation sections.',
          textMatches: ['Dashboard', 'Event Setup', 'Registration', 'Settings', 'Live'],
        },
      ];
  }
}

/**
 * Finds a visible DOM element matching `step.textMatches` or `step.selector`
 */
function findDomTarget(step: GuidePointerStep): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const isVisible = (el: HTMLElement) => {
    if (el.closest('.mini-guide-avatar-root')) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  };

  if (step.textMatches && step.textMatches.length > 0) {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a, summary, [role="tab"], label, h1, h2, h3, .nav-btn, .btn'
      )
    ).filter(isVisible);

    for (const phrase of step.textMatches) {
      const q = phrase.toLowerCase();
      // Prefer exact/short match first
      const exact = candidates.find(el => {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        return txt === q || txt.startsWith(q);
      });
      if (exact) return exact;

      const partial = candidates.find(el => {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        return txt.includes(q) && txt.length < 120;
      });
      if (partial) return partial;
    }
  }

  if (step.selector) {
    const els = Array.from(document.querySelectorAll<HTMLElement>(step.selector)).filter(isVisible);
    if (els.length > 0) return els[0];
  }

  return null;
}

/**
 * Animated Mini Coach Avatar SVG (Navy Blue & Light Blue)
 */
function CoachAvatarSvg({
  size = 44,
  pointing = false,
  pointDirection = 'left',
}: {
  size?: number;
  pointing?: boolean;
  pointDirection?: 'left' | 'right' | 'up' | 'down';
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {/* Subtle outer halo */}
      <circle cx="32" cy="34" r="26" fill="#0f2d5c" stroke="#38bdf8" strokeWidth="2.2" />

      {/* Coach shoulders / jersey */}
      <path
        d="M14 52C14 43.5 22 39 32 39C42 39 50 43.5 50 52"
        fill="#0284c7"
        stroke="#bae6fd"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Whistle lanyard V-neck */}
      <path d="M26 40L32 49L38 40" stroke="#e0f2fe" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="50.5" r="2.2" fill="#38bdf8" />

      {/* Head */}
      <circle cx="32" cy="27" r="10.5" fill="#e0f2fe" stroke="#0f2d5c" strokeWidth="1.6" />

      {/* Sports Cap (Navy Blue + Light Blue visor) */}
      <path
        d="M21 24C21 17.8 25.8 14 32 14C38.2 14 43 17.8 43 24H21Z"
        fill="#0f2d5c"
        stroke="#38bdf8"
        strokeWidth="1.5"
      />
      <path d="M20 24H45C46.5 24 47 22 44 21.5H20V24Z" fill="#38bdf8" />

      {/* Friendly Eyes & Smile */}
      <circle cx="28.2" cy="27.5" r="1.5" fill="#0f2d5c" />
      <circle cx="35.8" cy="27.5" r="1.5" fill="#0f2d5c" />
      <path
        d="M28.5 31.8C30 33.4 34 33.4 35.5 31.8"
        stroke="#0f2d5c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Headset mic */}
      <path d="M21.5 28C19.5 28 19.5 32.5 24 33.5" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24.5" cy="33.5" r="1.4" fill="#0284c7" />

      {/* Pointing Arm / Hand when actively guiding */}
      {pointing && (
        <g
          style={{
            transformOrigin: '32px 34px',
            transform:
              pointDirection === 'right'
                ? 'rotate(180deg)'
                : pointDirection === 'up'
                  ? 'rotate(90deg)'
                  : pointDirection === 'down'
                    ? 'rotate(-90deg)'
                    : 'none',
          }}
        >
          <circle cx="7" cy="34" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          <path
            d="M10 34H3M3 34L6 31M3 34L6 37"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

const VIEW_LABELS: Record<string, string> = {
  public: 'Public Spectator Hub',
  login: 'Staff Login Portal',
  'director-login': 'Director Access Portal',
  'mock-login': 'Demo Login Portal',
  admin: 'Main Dashboard',
  'event-setup': 'Event & Venue Setup',
  registration: 'Registration Portal',
  bracket: 'Brackets & Standings',
  schedule: 'Match Schedule & Results',
  scorekeeper: 'Court-Side Scorer Desk',
  'scorer-dashboard': 'My Assigned Matches',
  live: 'Live Arena Scoreboard',
  settings: 'Tournament & System Settings',
  analytics: 'Analytics & Printable Reports',
  scorers: 'Top Scorers & MVP Leaderboards',
  predictions: 'AI Match Predictions',
  announcements: 'Official Announcements',
  officials: 'Match Officials Assignments',
  player: 'Varsity Player Roster',
  'access-requests': 'Staff Access Requests',
  audit: 'Security Audit Trail',
  archive: 'Historical Season Archive',
};

export default function MiniGuideAvatar() {
  const { currentUser, activeView, setActiveView } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [dismissedBubble, setDismissedBubble] = useState(false);

  // Active interactive pointing tour state
  const [activeSteps, setActiveSteps] = useState<GuidePointerStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const stepTimerRef = useRef<number | null>(null);

  // Strict role & view scoping: when in Public View (or not signed in as staff), only show guest/spectator information
  const effectiveRole: GuideRole = useMemo(() => {
    if (activeView === 'public' || !currentUser) return 'guest';
    if (currentUser.role === 'director' || currentUser.role === 'coordinator' || currentUser.role === 'scorer') {
      return currentUser.role;
    }
    return 'guest';
  }, [activeView, currentUser]);

  const currentViewName = VIEW_LABELS[activeView] || 'Tournament Portal';

  const activeStep = activeSteps[currentStepIdx] || null;

  // Clear selected topic if role/view changes so staff topics never persist into Public View
  useEffect(() => {
    setSelectedTopicId(null);
  }, [effectiveRole, activeView]);

  // Locate and track the DOM element for the active pointer step
  const updateSpotlightPosition = useCallback(() => {
    if (!activeStep) {
      setTargetRect(null);
      return;
    }
    const el = findDomTarget(activeStep);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [activeStep]);

  useEffect(() => {
    if (!activeStep) {
      setTargetRect(null);
      return;
    }

    // If step requires a specific view, switch to it first
    if (activeStep.view && activeStep.view !== activeView) {
      setActiveView(activeStep.view);
    }

    // Wait briefly for DOM render, scroll target into view, and measure
    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    stepTimerRef.current = window.setTimeout(() => {
      const el = findDomTarget(activeStep);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch { }
        window.setTimeout(() => {
          setTargetRect(el.getBoundingClientRect());
        }, 260);
      } else {
        setTargetRect(null);
      }
    }, 140);

    const onScrollOrResize = () => updateSpotlightPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [activeStep, activeView, setActiveView, updateSpotlightPosition]);

  // Strictly filter topics to only those permitted for `effectiveRole`
  const roleAllowedTopics = useMemo(
    () => GUIDE_TOPICS.filter(t => t.roles.includes(effectiveRole)),
    [effectiveRole]
  );

  // Filter allowed topics by search query (never leak topics from other roles)
  const matchingTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return roleAllowedTopics;
    }
    const words = q.split(/\s+/).filter(Boolean);
    const scored = roleAllowedTopics
      .map(topic => {
        const haystack = `${topic.question} ${topic.summary} ${topic.keywords.join(' ')}`.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (haystack.includes(w)) score += 2;
          if (topic.keywords.some(k => k.includes(w))) score += 3;
        }
        return { topic, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored.map(s => s.topic) : roleAllowedTopics;
  }, [query, roleAllowedTopics]);

  const selectedTopic = useMemo(
    () => roleAllowedTopics.find(t => t.id === selectedTopicId) || null,
    [roleAllowedTopics, selectedTopicId]
  );

  const startPointerTour = (steps: GuidePointerStep[]) => {
    if (steps.length === 0) return;
    setActiveSteps(steps);
    setCurrentStepIdx(0);
    setIsOpen(false);
  };

  const handleSelectTopic = (topic: GuideTopic) => {
    if (topic.id === 'tour-current') {
      const pageSteps = getPageTourSteps(activeView, effectiveRole);
      startPointerTour(pageSteps);
      return;
    }
    setSelectedTopicId(topic.id);
  };

  const stopPointerTour = () => {
    setActiveSteps([]);
    setCurrentStepIdx(0);
    setTargetRect(null);
  };

  // Compute floating pointer tooltip coordinates next to targetRect
  const pointerTooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect || typeof window === 'undefined') {
      return {
        position: 'fixed',
        bottom: '86px',
        right: '20px',
        zIndex: 10052,
      };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(330, vw - 24);
    const preferBelow = targetRect.bottom + 185 < vh;
    const top = preferBelow
      ? Math.min(vh - 180, targetRect.bottom + 14)
      : Math.max(12, targetRect.top - 168);
    const left = Math.min(
      Math.max(12, targetRect.left),
      Math.max(12, vw - cardWidth - 12)
    );
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      zIndex: 10052,
    };
  }, [targetRect]);

  return (
    <div className="mini-guide-avatar-root no-print">
      {/* ── Active Spotlight Ring & Floating Pointer Avatar Card ── */}
      {activeStep && (
        <>
          {targetRect && (
            <div
              style={{
                position: 'fixed',
                top: `${Math.max(2, targetRect.top - 6)}px`,
                left: `${Math.max(2, targetRect.left - 6)}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
                borderRadius: '10px',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 0 4px rgba(56, 189, 248, 0.25), 0 0 24px rgba(2, 132, 199, 0.55)',
                pointerEvents: 'none',
                zIndex: 10051,
                transition: 'all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            />
          )}

          <div
            style={{
              ...pointerTooltipStyle,
              background: 'var(--bg-surface)',
              border: '1.5px solid #38bdf8',
              borderRadius: '12px',
              padding: '12px 14px',
              boxShadow: '0 14px 34px rgba(10, 17, 40, 0.55)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CoachAvatarSvg
                size={40}
                pointing={true}
                pointDirection={targetRect && targetRect.top < 220 ? 'up' : 'left'}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
                    Coach Padula · Step {currentStepIdx + 1} of {activeSteps.length}
                  </span>
                  <button
                    type="button"
                    onClick={stopPointerTour}
                    style={{ color: 'var(--text-muted)', padding: '2px', cursor: 'pointer' }}
                    title="Close pointer guide"
                  >
                    <XIcon size={13} />
                  </button>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activeStep.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '3px' }}>
                  {activeStep.instruction}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => {
                  stopPointerTour();
                  setIsOpen(true);
                }}
              >
                Ask Another Question
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                {currentStepIdx > 0 && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => setCurrentStepIdx(i => Math.max(0, i - 1))}
                  >
                    Back
                  </button>
                )}
                {currentStepIdx < activeSteps.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={() => setCurrentStepIdx(i => i + 1)}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={stopPointerTour}
                  >
                    Got It!
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Expanded Assistant Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '78px',
            right: '16px',
            width: 'min(370px, calc(100vw - 24px))',
            maxHeight: 'min(540px, calc(100vh - 110px))',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 18px 40px rgba(10, 17, 40, 0.45)',
            zIndex: 10050,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: 'var(--text-primary)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #0f2d5c 0%, #1e3a8a 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <CoachAvatarSvg size={38} pointing={false} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Coach Padula Guide</span>
                  <SparklesIcon size={13} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '11px', color: '#bae6fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Here: {currentViewName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ color: '#bae6fd', padding: '4px', cursor: 'pointer', display: 'inline-flex' }}
              title="Minimize Guide"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Current Page Quick Pointer Action */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: 'var(--bg-elevated)',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Lost on <strong>{currentViewName}</strong>?
            </span>
            <button
              type="button"
              className="btn btn-xs btn-primary"
              onClick={() => startPointerTour(getPageTourSteps(activeView, effectiveRole))}
            >
              Point &amp; Tour This Page
            </button>
          </div>

          {/* Search / Ask Box */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', display: 'inline-flex', pointerEvents: 'none' }}>
                <SearchIcon size={14} />
              </span>
              <input
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedTopicId(null);
                }}
                placeholder="Ask me where something is or how to do it..."
                className="form-input"
                style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: '12px', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Body: Either Selected Topic Step-by-Step Instructions OR Quick Topics List */}
          <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedTopic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTopicId(null)}
                  style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', alignSelf: 'flex-start' }}
                >
                  ← Back to All Questions
                </button>

                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedTopic.question}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedTopic.summary}
                </div>

                {/* Numbered Instructions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                  {selectedTopic.steps.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        borderLeft: '3px solid var(--accent)',
                        background: 'var(--bg-elevated)',
                        borderRadius: '0 6px 6px 0',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                        {st.instruction}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons: Point & Show Me / Go to Page */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {selectedTopic.steps.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1, fontWeight: 700 }}
                      onClick={() => startPointerTour(selectedTopic.steps)}
                    >
                      Point &amp; Show Me on Screen
                    </button>
                  )}
                  {selectedTopic.targetView && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setActiveView(selectedTopic.targetView!);
                        setIsOpen(false);
                      }}
                    >
                      {selectedTopic.targetLabel || 'Go to Page'} <ArrowRightIcon size={13} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {query.trim() ? 'Matching Instructions' : 'Ask Coach Padula — Click a Topic to Point & Guide'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {matchingTopics.map(topic => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic)}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>{topic.question}</span>
                      <ChevronRightIcon size={14} color="var(--accent)" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Bottom-Right Mini Avatar Launcher ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '16px',
          zIndex: 10049,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {!isOpen && !activeStep && !dismissedBubble && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '5px 10px 5px 12px',
              boxShadow: '0 6px 18px rgba(10, 17, 40, 0.25)',
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              style={{ cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700, fontSize: '11.5px' }}
            >
              Lost? Ask Coach Padula
            </button>
            <button
              type="button"
              onClick={() => setDismissedBubble(true)}
              title="Hide label"
              style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', padding: '1px' }}
            >
              <XIcon size={12} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (activeStep) {
              stopPointerTour();
            }
            setIsOpen(prev => !prev);
          }}
          title="Ask Coach Padula — Interactive Guide & Pointer"
          aria-label="Open Coach Padula Guide"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f2d5c 0%, #0284c7 100%)',
            border: '2px solid #38bdf8',
            boxShadow: '0 8px 22px rgba(2, 132, 199, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.15s ease',
          }}
        >
          <CoachAvatarSvg size={42} pointing={Boolean(activeStep)} />
        </button>
      </div>
    </div>
  );
}
