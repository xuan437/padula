import {
  Trophy,
  Home,
  Tv2,
  Settings,
  ClipboardCheck,
  ClipboardList,
  Users,
  User,
  LogOut,
  Calendar,
  MapPin,
  Plus,
  Check,
  ChevronRight,
  ShieldCheck,
  Star,
  BarChart2,
  ScrollText,
  Moon,
  Sun,
  Flame,
  Printer,
  Search,
  Activity,
  GitBranch,
  Globe,
  Mail,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  ArrowRight,
  Clock,
  X,
  Sparkles,
  Cpu,
} from 'lucide-react';

import schoolLogo from '../assets/logo.png';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// ── School Logo ──────────────────────────────────────────────
export function PadulaCrest({ className = '', size = 32 }: IconProps) {
  return (
    <img
      src={schoolLogo}
      alt="Asian College Crest"
      width={size}
      height={size}
      style={{
        objectFit: 'cover',
        display: 'inline-block',
        flexShrink: 0,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.18)',
      }}
      className={className}
    />
  );
}

// ── Navigation Icons — uniform 1.75px stroke ─────────────────
export function HomeIcon({ className = '', size = 18, color }: IconProps) {
  return <Home size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Live Scoreboard */
export function LiveIcon({ className = '', size = 18, color }: IconProps) {
  return <Tv2 size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Brackets / Tournament tree */
export function BracketsIcon({ className = '', size = 18, color }: IconProps) {
  return <GitBranch size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Players / Users */
export function UsersIcon({ className = '', size = 18, color }: IconProps) {
  return <Users size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function UserIcon({ className = '', size = 18, color }: IconProps) {
  return <User size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Top Scorers — star */
export function MedalIcon({ className = '', size = 18, color }: IconProps) {
  return <Star size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Registration — clipboard list */
export function ClipboardListIcon({ className = '', size = 18, color }: IconProps) {
  return <ClipboardList size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Scoring Desk — clipboard with tick */
export function ClipboardIcon({ className = '', size = 18, color }: IconProps) {
  return <ClipboardCheck size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Event Setup */
export function CalendarIcon({ className = '', size = 18, color }: IconProps) {
  return <Calendar size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Officials Hub — shield with checkmark */
export function ShieldIcon({ className = '', size = 18, color }: IconProps) {
  return <ShieldCheck size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Analytics */
export function BarChartIcon({ className = '', size = 18, color }: IconProps) {
  return <BarChart2 size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Audit Trail — scroll */
export function FileTextIcon({ className = '', size = 18, color }: IconProps) {
  return <ScrollText size={size} color={color} strokeWidth={1.75} className={className} />;
}

/** Public Results — globe */
export function GlobeIcon({ className = '', size = 18, color }: IconProps) {
  return <Globe size={size} color={color} strokeWidth={1.75} className={className} />;
}

// ── Utility Icons ─────────────────────────────────────────────
export function TrophyIcon({ className = '', size = 18, color }: IconProps) {
  return <Trophy size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function SettingsIcon({ className = '', size = 18, color }: IconProps) {
  return <Settings size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function LogoutIcon({ className = '', size = 18, color }: IconProps) {
  return <LogOut size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function MapPinIcon({ className = '', size = 18, color }: IconProps) {
  return <MapPin size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function FlameIcon({ className = '', size = 18, color }: IconProps) {
  return <Flame size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function PlusIcon({ className = '', size = 18, color }: IconProps) {
  return <Plus size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function CheckIcon({ className = '', size = 18, color }: IconProps) {
  return <Check size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function ChevronRightIcon({ className = '', size = 18, color }: IconProps) {
  return <ChevronRight size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function ActivityIcon({ className = '', size = 18, color }: IconProps) {
  return <Activity size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function SearchIcon({ className = '', size = 18, color }: IconProps) {
  return <Search size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function PrinterIcon({ className = '', size = 18, color }: IconProps) {
  return <Printer size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function MoonIcon({ className = '', size = 18, color }: IconProps) {
  return <Moon size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function SunIcon({ className = '', size = 18, color }: IconProps) {
  return <Sun size={size} color={color} strokeWidth={1.75} className={className} />;
}

// ── Sport Icons — custom SVG, uniform 1.75px stroke ──────────
export function BasketballIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93 19.07 19.07" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function VolleyballIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m18 6-6 6-6-6" />
      <path d="M12 12v10" />
      <path d="m6 18 6-6 6 6" />
    </svg>
  );
}

export function ShuttlecockIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m14 10 7-7" />
      <path d="m10 14-7 7" />
      <path d="M15 15a4 4 0 0 1-5.66-5.66l6.36-6.36a2 2 0 0 1 2.83 2.83L15 15Z" />
      <circle cx="7" cy="17" r="2.5" />
    </svg>
  );
}

export function TableTennisIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="10" r="7" />
      <path d="m16 15 4 6" />
      <circle cx="6" cy="6" r="1.5" />
    </svg>
  );
}

export function GamepadIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="6" />
    </svg>
  );
}

export function ChessIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2h8l-2 5h-4z" />
      <path d="M10 7v6h4V7" />
      <path d="M6 18h12v3H6z" />
      <path d="M7 13h10v5H7z" />
    </svg>
  );
}

export function FootballIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 7 3.5 2.5-1.5 4h-4L8.5 9.5z" />
      <path d="M12 7V2" />
      <path d="M15.5 9.5 20 7.5" />
      <path d="M14 13.5 17 18" />
      <path d="M10 13.5 7 18" />
      <path d="M8.5 9.5 4 7.5" />
    </svg>
  );
}

export function SepakTakrawIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M6 18c4-4 8-4 12 0" />
      <path d="M6 6c4 4 8 4 12 0" />
      <path d="M4 10c4 1 6 5 6 10" />
      <path d="M20 10c-4 1-6 5-6 10" />
      <path d="M10 4c1 4 5 6 10 6" />
      <path d="M10 20c1-4 5-6 10-6" />
    </svg>
  );
}

export function FrisbeeIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="5" />
      <path d="M2 12c0 2 4.5 4 10 4s10-2 10-4" />
      <ellipse cx="12" cy="11.5" rx="6" ry="2.5" />
    </svg>
  );
}

export function ScrabbleIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M15 9a2 2 0 0 0-2-2h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-2-2" />
      <circle cx="17.5" cy="17.5" r="1" fill={color || 'currentColor'} />
    </svg>
  );
}

export function CrosshairIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="3" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="21" y2="12" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// ── Auth / Form Icons — uniform 1.75px stroke ─────────────────
export function MailIcon({ className = '', size = 18, color }: IconProps) {
  return <Mail size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function EyeIcon({ className = '', size = 18, color }: IconProps) {
  return <Eye size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function EyeOffIcon({ className = '', size = 18, color }: IconProps) {
  return <EyeOff size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function LockIcon({ className = '', size = 18, color }: IconProps) {
  return <Lock size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function AlertTriangleIcon({ className = '', size = 18, color }: IconProps) {
  return <AlertTriangle size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function ArrowRightIcon({ className = '', size = 18, color }: IconProps) {
  return <ArrowRight size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function ClockIcon({ className = '', size = 18, color }: IconProps) {
  return <Clock size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function XIcon({ className = '', size = 18, color }: IconProps) {
  return <X size={size} color={color} strokeWidth={2} className={className} />;
}

export function GoogleIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function SparklesIcon({ className = '', size = 18, color }: IconProps) {
  return <Sparkles size={size} color={color} strokeWidth={1.75} className={className} />;
}

export function CpuIcon({ className = '', size = 18, color }: IconProps) {
  return <Cpu size={size} color={color} strokeWidth={1.75} className={className} />;
}
