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
  RotateCw,
  Share2,
  Filter,
  TrendingUp,
  Crown,
  Zap,
  Layers,
  Medal,
  Award,
  Copy,
  Trash2,
  Menu,
  Send,
  Building2,
  School,
} from 'lucide-react';

import schoolLogo from '../assets/logo.png';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
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

// ── Navigation Icons — unified 1.75px stroke ──────────────────
export function HomeIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Home size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function LiveIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Tv2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function BracketsIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <GitBranch size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function UsersIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Users size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function BuildingIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Building2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function SchoolIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <School size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function UserIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <User size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function MedalIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Medal size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function TrophyIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Trophy size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function AwardIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Award size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function CrownIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Crown size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function StarIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Star size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ClipboardListIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ClipboardList size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ClipboardIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ClipboardCheck size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function CalendarIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Calendar size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ShieldIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ShieldCheck size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function BarChartIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <BarChart2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function FileTextIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ScrollText size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function GlobeIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Globe size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

// ── Utility Icons ─────────────────────────────────────────────
export function SettingsIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Settings size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function LogoutIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <LogOut size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function MapPinIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <MapPin size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function FlameIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Flame size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ZapIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Zap size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function PlusIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Plus size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function CheckIcon({ className = '', size = 18, color, strokeWidth = 2 }: IconProps) {
  return <Check size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function XIcon({ className = '', size = 18, color, strokeWidth = 2 }: IconProps) {
  return <X size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ChevronRightIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ChevronRight size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ActivityIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Activity size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function TrendingUpIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <TrendingUp size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function SearchIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Search size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function PrinterIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Printer size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function MoonIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Moon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function SunIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Sun size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function RefreshIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <RotateCw size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ShareIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Share2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function FilterIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Filter size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function LayersIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Layers size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function CopyIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Copy size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function TrashIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Trash2 size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function MenuIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Menu size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

// ── Auth & Form Icons ─────────────────────────────────────────
export function MailIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Mail size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function SendIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Send size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function EyeIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Eye size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function EyeOffIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <EyeOff size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function LockIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Lock size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function AlertTriangleIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <AlertTriangle size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ArrowRightIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <ArrowRight size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function ClockIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Clock size={size} color={color} strokeWidth={strokeWidth} className={className} />;
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

export function SparklesIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Sparkles size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

export function CpuIcon({ className = '', size = 18, color, strokeWidth = 1.75 }: IconProps) {
  return <Cpu size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}

// ── Simplified Sport Icons — Clean SVG line glyphs ────────────
export function BasketballIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="M4.93 4.93c4.2 4.2 4.2 9.94 0 14.14" />
      <path d="M19.07 4.93c-4.2 4.2-4.2 9.94 0 14.14" />
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
      <path d="M9 13 4 8l3-3 5 5" />
      <path d="m12 10 3-3" />
      <path d="m14 12 3-3" />
      <path d="M8 14a3 3 0 1 0 4.24 4.24L20 10.5 13.5 4 8 14Z" />
    </svg>
  );
}

export function TableTennisIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="9" r="6" />
      <path d="m15.5 13.5 4.5 4.5a1.5 1.5 0 0 1-2.12 2.12l-4.5-4.5" />
      <circle cx="18" cy="6" r="1.5" />
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
      <path d="M12 2v4" />
      <path d="M10 4h4" />
      <path d="M7 8h10l-2 5H9L7 8z" />
      <path d="M9 13v4h6v-4" />
      <path d="M5 21h14v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2z" />
    </svg>
  );
}

export function FootballIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7 15,9.5 13.5,13.5 10.5,13.5 9,9.5" />
      <path d="M12 7V2" />
      <path d="M15 9.5 19.5 8" />
      <path d="M13.5 13.5 16 18" />
      <path d="M10.5 13.5 8 18" />
      <path d="M9 9.5 4.5 8" />
    </svg>
  );
}

export function SepakTakrawIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M5 9c5-2 9-2 14 0" />
      <path d="M5 15c5 2 9 2 14 0" />
      <path d="M9 5c-2 5-2 9 0 14" />
      <path d="M15 5c2 5 2 9 0 14" />
    </svg>
  );
}

export function FrisbeeIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="4.5" />
      <path d="M2 12c0 1.8 4.5 3.5 10 3.5s10-1.7 10-3.5" />
      <ellipse cx="12" cy="11.5" rx="5.5" ry="2" />
    </svg>
  );
}

export function ScrabbleIcon({ className = '', size = 18, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 16V8l4 4 4-4v8" />
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
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
