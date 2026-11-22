import { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon, SPORTS_CATALOG } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
  TrophyIcon,
  MapPinIcon,
  FlameIcon,
  MedalIcon,
  FileTextIcon,
  PrinterIcon,
  BracketsIcon,
  CalendarIcon,
  SearchIcon,
  ShieldIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  SparklesIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import TournamentTreeBracket from '../components/TournamentTreeBracket';
import AIPredictionModal from '../components/AIPredictionModal';
import FloatingDepartmentCards from '../components/FloatingDepartmentCards';
import DigitalLedClock from '../components/DigitalLedClock';
import PublicMatchPlayersFoulsPanel from '../components/PublicMatchPlayersFoulsPanel';
import {
  getSportFoulRules,
  getPlayerFoulBreakdown,
  getPlayerTotalFouls,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { SportFilter } from '../components/ui';
import { predictMatch } from '../lib/predictionAi';
import type { Match } from '../types';

type PublicTab = 'live' | 'results' | 'standings' | 'brackets' | 'schedule' | 'tally' | 'announcements' | 'predictions' | 'players';

// ── Real Scannable QR Code Component (ISO/IEC 18004 SVG) ────────────────────
function QRCodeDisplay({ url, size = 110 }: { url: string; size?: number }) {
  const { modules, moduleCount } = useMemo(() => {
    const safeText = (url || (typeof window !== 'undefined' ? window.location.href : 'https://padula.asiancollege.edu.ph')).trim();
    const qr = QRCode.create(safeText, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const grid: boolean[][] = [];
    for (let r = 0; r < count; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < count; c++) {
        row.push(Boolean(qr.modules.get(r, c)));
      }
      grid.push(row);
    }
    return { modules: grid, moduleCount: count };
  }, [url]);

  const quietZone = 2;
  const totalViewSize = moduleCount + quietZone * 2;

  return (
    <div style={{
      background: '#ffffff',
      padding: '10px',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${totalViewSize} ${totalViewSize}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Scannable QR Code for ${url}`}
      >
        <rect x={0} y={0} width={totalViewSize} height={totalViewSize} fill="#ffffff" />
        {modules.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c + quietZone}
                y={r + quietZone}
                width={1}
                height={1}
                fill="#0a1128"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

const STREAM_APPS = {
  facebook: {
    id: 'facebook' as const,
    name: 'Facebook Live',
    shortName: 'Facebook',
    rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    producerUrl: 'https://www.facebook.com/live/producer',
    iosScheme: 'fb://composer',
    androidPackage: 'com.facebook.katana',
    androidIntent: 'intent://facewebmodal/f?href=https://www.facebook.com/live/producer#Intent;package=com.facebook.katana;scheme=fb;S.browser_fallback_url=https%3A%2F%2Fwww.facebook.com%2Flive%2Fproducer;end',
    bg: '#1877F2',
    border: '#38bdf8',
  },
  tiktok: {
    id: 'tiktok' as const,
    name: 'TikTok Live',
    shortName: 'TikTok',
    rtmpUrl: 'rtmp://push.tiktokv.com/live/',
    producerUrl: 'https://www.tiktok.com/live',
    iosScheme: 'snssdk1233://live',
    androidPackage: 'com.zhiliaoapp.musically',
    androidIntent: 'intent://live#Intent;package=com.zhiliaoapp.musically;scheme=snssdk1233;S.browser_fallback_url=https%3A%2F%2Fwww.tiktok.com%2Flive;end',
    bg: '#0f172a',
    border: '#38bdf8',
  },
  youtube: {
    id: 'youtube' as const,
    name: 'YouTube Live',
    shortName: 'YouTube',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
    producerUrl: 'https://studio.youtube.com/',
    iosScheme: 'vnd.youtube://www.youtube.com/live_dashboard_splash',
    androidPackage: 'com.google.android.youtube',
    androidIntent: 'intent://www.youtube.com/live_dashboard_splash#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=https%3A%2F%2Fstudio.youtube.com%2F;end',
    bg: '#0f2d5c',
    border: '#0ea5e9',
  },
};

// ── Share Match, Live Camera & Livestream Studio Card ──────────────────────
function ShareMatchModal({ match, onClose }: { match: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [platformNotice, setPlatformNotice] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<'facebook' | 'tiktok' | 'youtube'>('facebook');
  const [rtmpOrStreamKey, setRtmpOrStreamKey] = useState<string>('');

  // Camera & Broadcast Recording State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [micMuted, setMicMuted] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSeconds, setBroadcastSeconds] = useState(0);
  const [recordedClipUrl, setRecordedClipUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const matchRef = useRef<any>(match);
  matchRef.current = match;
  const appRef = useRef(selectedApp);
  appRef.current = selectedApp;

  const isLive = match.status === 'live';
  const formatLabel = match.format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
  const liveMatchUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?tab=${isLive ? 'live' : 'results'}&sport=${encodeURIComponent(match.sport || '')}&match=${encodeURIComponent(match.id || '')}`
    : '';
  const streamPrefix = isLive ? 'LIVE STREAM' : 'OFFICIAL MATCH';
  const streamLinkLine = streamUrl.trim() ? `\nWatch Stream: ${streamUrl.trim()}` : '';
  const text = `${streamPrefix}: ${match.teamA} ${match.scoreA} – ${match.scoreB} ${match.teamB} (${getSportName(match.sport)} · ${match.round} · ${formatLabel}) @ ${match.venue || 'Main Court'} — Asian College Padula 2026${streamLinkLine}\nLive Scoreboard: ${liveMatchUrl}`;

  // Cleanly format scheduled date & time (avoid raw ISO strings)
  const displayDate = useMemo(() => {
    const raw = match.scheduledDate || match.scheduledTime;
    if (!raw) return 'Date TBA';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return match.scheduledDate || 'Date TBA';
  }, [match.scheduledDate, match.scheduledTime]);

  const displayTime = useMemo(() => {
    const raw = match.scheduledTime;
    if (!raw) return '09:00 AM';
    if (String(raw).includes('T')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    }
    return raw;
  }, [match.scheduledTime]);

  const activeAppConfig = STREAM_APPS[selectedApp];

  const stopBroadcastRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch {}
    }
    recorderRef.current = null;
    setIsBroadcasting(false);
  };

  const stopCamera = () => {
    stopBroadcastRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser or requires HTTPS.');
      return;
    }
    stopCamera();
    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch {
        // Fallback to video-only if microphone access is denied
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !micMuted;
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 30);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera. Check browser camera permissions.');
      setCameraActive(false);
    }
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      void startCamera(nextMode);
    }
  };

  const toggleMic = () => {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Re-attach srcObject if videoRef mounts after cameraActive toggles
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Timer + Canvas 30fps Compositor (burns live scoreboard directly onto video recording)
  useEffect(() => {
    if (!isBroadcasting) return;
    const timer = setInterval(() => {
      setBroadcastSeconds(s => s + 1);
    }, 1000);

    let rafId = 0;
    const drawFrame = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const curMatch = matchRef.current;
          const curApp = STREAM_APPS[appRef.current];

          // Top Broadcast Tag
          ctx.fillStyle = 'rgba(15, 45, 92, 0.85)';
          ctx.fillRect(28, 24, 420, 40);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(48, 44, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 17px Inter, Arial, sans-serif';
          ctx.fillText(`LIVE · ${curApp.name.toUpperCase()} · PADULA 2026`, 64, 50);

          // Bottom Live Scorebug
          ctx.fillStyle = 'rgba(10, 17, 40, 0.88)';
          ctx.fillRect(28, canvas.height - 96, canvas.width - 56, 68);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(28, canvas.height - 96, 8, 68);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px Inter, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(String(curMatch.teamA || 'Team A'), 56, canvas.height - 54);

          ctx.fillStyle = '#0284c7';
          ctx.fillRect(canvas.width / 2 - 80, canvas.height - 86, 160, 48);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 30px Inter, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${curMatch.scoreA}  :  ${curMatch.scoreB}`, canvas.width / 2, canvas.height - 52);

          ctx.textAlign = 'right';
          ctx.font = 'bold 26px Inter, Arial, sans-serif';
          ctx.fillText(String(curMatch.teamB || 'Team B'), canvas.width - 52, canvas.height - 54);
          ctx.textAlign = 'left';
        }
      }
      rafId = requestAnimationFrame(drawFrame);
    };
    rafId = requestAnimationFrame(drawFrame);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(rafId);
    };
  }, [isBroadcasting]);

  // Always release camera tracks when modal unmounts
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedClipUrl) URL.revokeObjectURL(recordedClipUrl);
    };
  }, [recordedClipUrl]);

  const startBroadcastRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraActive) {
      setCameraError('Connect your camera first before starting stream recording.');
      return;
    }
    try {
      const captured: MediaStream = (canvas as any).captureStream(30);
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => captured.addTrack(track));
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(captured, { mimeType });
      recorder.ondataavailable = ev => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedBlob(blob);
          setRecordedClipUrl(url);
        }
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setBroadcastSeconds(0);
      setIsBroadcasting(true);
      setPlatformNotice(`Recording camera + live scoreboard overlay for ${activeAppConfig.name}!`);
    } catch (err: any) {
      setCameraError(err?.message || 'Recording is not supported by this browser.');
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobileDevice = isAndroid || isIOS;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareTargetUrl = streamUrl.trim() || liveMatchUrl;

  const copyText = (notice?: string, customValue?: string) => {
    const payload = customValue ?? text;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
      setCopied(true);
    }
    if (notice) setPlatformNotice(notice);
    setTimeout(() => {
      setCopied(false);
      setPlatformNotice(null);
    }, 3600);
  };

  const launchInstalledMobileApp = (platform: 'facebook' | 'tiktok' | 'youtube') => {
    const cfg = STREAM_APPS[platform];
    copyText(
      isMobileDevice
        ? `Opening installed ${cfg.shortName} app... Live score caption & link copied to clipboard!`
        : `Opened ${cfg.name} studio! Live score caption & RTMP/URL copied.`
    );

    if (isAndroid) {
      window.location.href = cfg.androidIntent;
      return;
    }

    if (isIOS) {
      let switchedToApp = false;
      const handleVisibility = () => {
        if (document.hidden) {
          switchedToApp = true;
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      window.location.href = cfg.iosScheme;
      window.setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibility);
        if (!switchedToApp && !document.hidden) {
          window.open(cfg.producerUrl, '_blank', 'noopener,noreferrer');
        }
      }, 1400);
      return;
    }

    if (platform === 'facebook') {
      const target = streamUrl.trim()
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(streamUrl.trim())}&quote=${encodeURIComponent(text)}`
        : cfg.producerUrl;
      window.open(target, '_blank', 'noopener,noreferrer');
    } else {
      window.open(cfg.producerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const shareToInstalledMobileApps = async () => {
    copyText();
    if (!canNativeShare) {
      launchInstalledMobileApp(selectedApp);
      return;
    }

    const shareTitle = `${match.teamA} vs ${match.teamB} — Live Scoreboard Stream`;
    try {
      if (recordedBlob && (navigator as any).canShare) {
        const file = new File([recordedBlob], `padula-live-${match.id || 'stream'}.webm`, {
          type: recordedBlob.type || 'video/webm',
        });
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            title: shareTitle,
            text,
            url: shareTargetUrl,
            files: [file],
          });
          setPlatformNotice('Shared camera clip + live scoreboard via your installed mobile app!');
          return;
        }
      }

      await navigator.share({
        title: shareTitle,
        text,
        url: shareTargetUrl,
      });
      setPlatformNotice('Shared live stream link & scoreboard via your installed mobile app!');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      launchInstalledMobileApp(selectedApp);
    }
  };

  const connectAndStreamToApp = async (platform: 'facebook' | 'tiktok' | 'youtube') => {
    setSelectedApp(platform);
    const cfg = STREAM_APPS[platform];
    if (!cameraActive) {
      void startCamera();
    }

    // Share recorded camera+scoreboard clip directly to installed mobile apps when supported
    if (recordedBlob && typeof navigator !== 'undefined' && (navigator as any).canShare) {
      try {
        const file = new File([recordedBlob], `padula-live-${match.id || 'stream'}.webm`, { type: recordedBlob.type || 'video/webm' });
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            title: `${match.teamA} vs ${match.teamB} — Live Scoreboard Stream`,
            text,
            url: shareTargetUrl,
            files: [file],
          });
          setPlatformNotice(`Shared camera stream + live scoreboard clip to ${cfg.name}!`);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    launchInstalledMobileApp(platform);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '580px',
        width: '100%',
        padding: '22px',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        maxHeight: '94vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              {isLive ? 'Live Camera Broadcast & Scoreboard Studio' : 'Share Official Match Stream'}
            </h3>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Connect your camera, overlay live scores, and stream directly to Facebook, TikTok, or YouTube
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={16} />
          </button>
        </div>

        {/* 16:9 Live Camera Viewport + Live TV Scorebug Overlay */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#080d1a',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1.5px solid ${cameraActive ? '#38bdf8' : 'var(--border)'}`,
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <canvas ref={canvasRef} width={1280} height={720} style={{ display: 'none' }} />
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#cbd5e1', zIndex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                Camera Not Connected
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px', maxWidth: '340px' }}>
                Click below to connect your device camera with the real-time {getSportName(match.sport)} scoreboard overlay.
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void startCamera()}
                style={{ fontWeight: 700, padding: '7px 14px' }}
              >
                Connect Device Camera
              </button>
            </div>
          )}

          {/* Top Broadcast Status Overlay */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
            gap: '8px',
          }}>
            <span style={{
              background: 'rgba(15, 45, 92, 0.88)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              padding: '3px 9px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <span className="live-dot" />
              {isBroadcasting ? `REC ${formatDuration(broadcastSeconds)}` : cameraActive ? 'CAMERA LIVE' : 'PREVIEW'} · {activeAppConfig.name.toUpperCase()}
            </span>
            <span style={{
              background: 'rgba(10, 17, 40, 0.78)',
              color: '#bae6fd',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
            }}>
              {displayDate} · {displayTime}
            </span>
          </div>

          {/* Bottom Real-Time Scoreboard Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: 'rgba(10, 17, 40, 0.9)',
            borderLeft: '4px solid #0284c7',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#ffffff',
            pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {match.teamA}
              </span>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '16px',
                padding: '3px 12px',
                borderRadius: '6px',
                letterSpacing: '1.5px',
                flexShrink: 0,
              }}>
                {match.scoreA} : {match.scoreB}
              </span>
              <span style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {match.teamB}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#93c5fd', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{getSportName(match.sport)} · {match.round}</span>
              <span>{match.venue || 'Main Court'}</span>
            </div>
          </div>
        </div>

        {/* Camera Toolbar */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            type="button"
            className={`btn btn-sm ${cameraActive ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => (cameraActive ? stopCamera() : void startCamera())}
            style={{ fontSize: '11.5px', fontWeight: 700 }}
          >
            {cameraActive ? 'Disconnect Camera' : 'Connect Camera'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={flipCamera}
            style={{ fontSize: '11.5px', fontWeight: 600 }}
          >
            Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={toggleMic}
            disabled={!cameraActive}
            style={{ fontSize: '11.5px', fontWeight: 600 }}
          >
            {micMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isBroadcasting ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => (isBroadcasting ? stopBroadcastRecording() : startBroadcastRecording())}
            style={{ fontSize: '11.5px', fontWeight: 700, marginLeft: 'auto' }}
          >
            {isBroadcasting ? `Stop Recording (${formatDuration(broadcastSeconds)})` : 'Record Overlay Clip'}
          </button>
        </div>

        {cameraError && (
          <div style={{
            fontSize: '11.5px',
            color: '#0284c7',
            background: 'rgba(2, 132, 199, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '6px',
            padding: '7px 10px',
            marginBottom: '10px',
          }}>
            {cameraError}
          </div>
        )}

        {recordedClipUrl && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '10px',
            fontSize: '11.5px',
          }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>
              Livestream overlay clip ready ({recordedBlob ? `${(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB` : 'WebM'})
            </span>
            <a
              href={recordedClipUrl}
              download={`padula-live-${match.id || 'match'}.webm`}
              className="btn btn-xs btn-primary"
              style={{ textDecoration: 'none', fontWeight: 700 }}
            >
              Download Video
            </a>
          </div>
        )}

        {/* Connect App Selector (Facebook, TikTok, YouTube + Installed Mobile Apps) */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Connect Livestream App (Camera + Live Scoreboard)
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#0284c7',
              background: 'rgba(14, 165, 233, 0.12)',
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.03em',
            }}>
              {canNativeShare || isMobileDevice ? 'INSTALLED APP READY' : 'MOBILE APP DEEP-LINK + OS SHARE'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['facebook', 'tiktok', 'youtube'] as const).map(key => {
              const cfg = STREAM_APPS[key];
              const isSelected = selectedApp === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedApp(key);
                    setPlatformNotice(`Selected ${cfg.name} — tap Open Installed ${cfg.shortName} App or Share via Mobile Apps.`);
                  }}
                  style={{
                    background: cfg.bg,
                    color: '#ffffff',
                    border: isSelected ? '2px solid #38bdf8' : `1px solid ${cfg.border}`,
                    fontWeight: 700,
                    fontSize: '12px',
                    boxShadow: isSelected ? '0 0 0 2px rgba(56, 189, 248, 0.28)' : 'none',
                  }}
                >
                  {isSelected ? `✓ ${cfg.shortName}` : cfg.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connected App RTMP / URL / Stream Key */}
        <div style={{
          padding: '10px 0',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeAppConfig.name} Server URL: <code style={{ color: 'var(--accent)' }}>{activeAppConfig.rtmpUrl}</code>
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => copyText(`Copied ${activeAppConfig.name} RTMP Server URL!`, activeAppConfig.rtmpUrl)}
              >
                Copy RTMP
              </button>
              <button
                type="button"
                className="btn btn-xs btn-primary"
                onClick={() => launchInstalledMobileApp(selectedApp)}
              >
                Open {activeAppConfig.shortName} App
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
                Stream Key (Optional)
              </label>
              <input
                type="password"
                value={rtmpOrStreamKey}
                onChange={e => setRtmpOrStreamKey(e.target.value)}
                placeholder={`${activeAppConfig.shortName} stream key`}
                className="form-input"
                style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
                Public Watch URL (Optional)
              </label>
              <input
                type="url"
                value={streamUrl}
                onChange={e => setStreamUrl(e.target.value)}
                placeholder={`https://${selectedApp}.com/...`}
                className="form-input"
                style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
              />
            </div>
          </div>
        </div>

        {platformNotice && (
          <div style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#0284c7',
            borderLeft: '3px solid #0284c7',
            padding: '4px 10px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <CheckIcon size={13} color="#0284c7" />
            <span>{platformNotice}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: '1 1 210px', fontWeight: 700 }}
            onClick={() => void connectAndStreamToApp(selectedApp)}
          >
            Open Installed {activeAppConfig.shortName} App &amp; Go Live
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: '1 1 190px', fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
            onClick={() => void shareToInstalledMobileApps()}
          >
            Share via Installed Mobile Apps...
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => copyText()}
          >
            {copied ? <><CheckIcon size={14} /> Copied!</> : 'Copy Score & Link'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── QR Poster Print Modal ──────────────────────────────────────────────────
function QRPosterModal({ url, onClose }: { url: string; onClose: () => void }) {
  const handlePrint = () => {
    document.body.classList.add('printing-qr-poster');
    const cleanup = () => {
      document.body.classList.remove('printing-qr-poster');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  return (
    <div className="qr-poster-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div className="glass-card qr-poster-printable" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '32px',
        background: '#ffffff',
        color: '#0a1128',
        borderRadius: '20px',
        textAlign: 'center',
      }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Asian College Athletics • Dumaguete
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0a1128', margin: '6px 0 2px' }}>
          Padula 2026
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>
          Live Scores, Brackets, Schedules & Standings
        </p>

        <div style={{ margin: '0 auto 20px', display: 'inline-block' }}>
          <QRCodeDisplay url={url} size={180} />
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a1128', marginBottom: '4px' }}>
          Scan with your phone camera
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '24px' }}>
          {url}
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
            <PrinterIcon size={16} /> Print QR Poster
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ color: '#334155', borderColor: '#cbd5e1' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GUEST PUBLIC RESULTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function GuestPublicPage() {
  const { matches, teams, players, announcements, departments, events, venues, computeMedalTally, computeStandings, setActiveView, currentUser, settings } = useApp();

  // Helper to resolve full Event & Venue details for any match
  const getMatchContext = (m: Match) => {
    const ev = events.find(e => e.id === m.eventId || e.sport === m.sport);
    const venueName = m.venue || ev?.venue || 'Asian College Main Gym';
    const venueObj = venues.find(v => v.name.toLowerCase() === venueName.toLowerCase());
    const format = m.format || ev?.format || (m.round.toLowerCase().includes('round robin') ? 'round_robin' : 'single_elimination');
    const formatLabel = format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    let formattedDate = m.scheduledDate || ev?.startDate || 'Nov 10, 2026';
    let timeStr = m.scheduledTime || ev?.startTime || '09:00 AM';
    if (m.scheduledTime && m.scheduledTime.includes('T')) {
      const d = new Date(m.scheduledTime);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        timeStr = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      }
    } else if (formattedDate && /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      const d = new Date(`${formattedDate}T00:00:00`);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return {
      eventName: ev?.name || `${getSportName(m.sport)} Tournament`,
      eventStartTime: ev?.startTime || '08:00',
      eventEndTime: ev?.endTime || '17:00',
      venueName,
      venueLocation: venueObj?.location || 'Asian College Dumaguete Campus',
      venueCapacity: venueObj?.capacity,
      format,
      formatLabel,
      formattedDate,
      timeStr,
    };
  };

  // Read initial tab and sport filter from URL query params (for sharing)
  const [tab, setTab] = useState<PublicTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab') as PublicTab;
      if (['live', 'results', 'standings', 'brackets', 'schedule', 'tally', 'announcements', 'predictions', 'players'].includes(t)) {
        return t;
      }
    }
    return 'live';
  });

  const [filterSport, setFilterSport] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('sport') || 'all';
    }
    return 'all';
  });

  const [searchTeam, setSearchTeam] = useState('');
  const [myTeam, setMyTeam] = useState<string>(() => {
    try { return localStorage.getItem('padula_my_team') || ''; } catch { return ''; }
  });
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [shareMatch, setShareMatch] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAiMatch, setSelectedAiMatch] = useState<Match | null>(null);
  const [simSport, setSimSport] = useState<string>('s1');
  const [simTeamA, setSimTeamA] = useState<string>('');
  const [simTeamB, setSimTeamB] = useState<string>('');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const liveFeedRef = useRef<HTMLElement | null>(null);

  const handleViewLiveFeed = () => {
    setTab('live');
    setFilterSport('all');
    setSearchTeam('');
    setTimeout(() => {
      liveFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleToggleMyTeam = (teamName: string) => {
    const next = myTeam === teamName ? '' : teamName;
    setMyTeam(next);
    setSearchTeam(next);
    try { localStorage.setItem('padula_my_team', next); } catch { }
  };

  // Update URL params when tab or filter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'public');
      url.searchParams.set('tab', tab);
      if (filterSport !== 'all') url.searchParams.set('sport', filterSport);
      else url.searchParams.delete('sport');
      window.history.replaceState({}, '', url.toString());
    }
  }, [tab, filterSport]);

  const togglePublicTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('padula_theme', next); } catch { }
  };

  // Canonical public URL
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=public&tab=${tab}${filterSport !== 'all' ? `&sport=${filterSport}` : ''}`
    : 'https://padula.asiancollege.edu.ph/?view=public';

  const copyPublicUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filtered datasets
  const liveMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'live') return false;
      if (m.isBye || isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) return false;
      if (filterSport !== 'all' && m.sport !== filterSport) return false;
      if (searchTeam) {
        const q = searchTeam.toLowerCase();
        if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, filterSport, searchTeam]);

  const finishedMatches = useMemo(() => {
    return matches
      .filter(m => {
        if (m.status !== 'finished') return false;
        if (m.isBye || isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) return false;
        if (filterSport !== 'all' && m.sport !== filterSport) return false;
        if (searchTeam) {
          const q = searchTeam.toLowerCase();
          if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .reverse();
  }, [matches, filterSport, searchTeam]);

  const scheduledMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'scheduled') return false;
      if (m.isBye || (isPlaceholder(m.teamA) && isPlaceholder(m.teamB))) return false;
      if (filterSport !== 'all' && m.sport !== filterSport) return false;
      if (searchTeam) {
        const q = searchTeam.toLowerCase();
        if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, filterSport, searchTeam]);

  const nextUpcoming = useMemo(() => {
    return matches.find(m => m.status === 'scheduled' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB));
  }, [matches]);

  const medalTally = useMemo(() => computeMedalTally(), [computeMedalTally]);

  // Standings per active sport
  const activeStandings = useMemo(() => {
    const sportToUse = filterSport !== 'all' ? filterSport : 's1';
    return computeStandings(sportToUse);
  }, [filterSport, computeStandings]);

  // Print trigger
  const handlePrint = () => window.print();

  return (
    <div style={{
      maxWidth: '1240px',
      width: '100%',
      margin: '0 auto',
      padding: '20px 16px 88px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxSizing: 'border-box',
      minWidth: 0,
    }}>

      {/* ── TOP NAV BAR: Spectator Header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Left: Branding & Event */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px 10px',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}>
                Asian College Athletics · Dumaguete
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px 14px', flexWrap: 'wrap' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{
                  height: 'clamp(42px, 7vw, 56px)',
                  width: 'auto',
                  maxWidth: '200px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 14px rgba(15, 35, 71, 0.35))',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <h1 style={{
                  fontFamily: 'var(--font-sports)',
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '0.02em',
                  lineHeight: 1.15,
                }}>
                  Asian College Padula — Tournament Hub
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Public Results, Live Scores, Brackets &amp; Standings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compact Icon Group (Share/QR, Theme, Print) + One Labeled "Staff Login" Button */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setShowSharePanel(p => !p)}
            title="Share or scan QR code"
            style={{ fontWeight: 600 }}
          >
            <GlobeIcon size={14} />
            <span>Share / QR</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={togglePublicTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handlePrint}
            title="Print Tournament Sheet"
          >
            <PrinterIcon size={14} />
            <span>Print</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setActiveView(currentUser.role === 'scorer' ? 'scorekeeper' : 'admin')}
              style={{ fontWeight: 700 }}
            >
              <span>← Back to Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setActiveView('login')}
              style={{ fontWeight: 700 }}
            >
              <ShieldIcon size={14} />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ── QR SHARE PANEL (Collapsible) ── */}
      {showSharePanel && (
        <div className="glass-card" style={{
          padding: '20px 24px',
          background: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          borderRadius: '16px',
        }}>
          <QRCodeDisplay url={publicUrl} size={100} />
          <div style={{ flex: '1 1 260px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Scan for Mobile Live Scoreboard
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Spectators on courtside can scan this code to view live scores, tournament brackets, and standings on their smartphones.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {publicUrl}
              </div>
              <button className="btn btn-sm btn-primary" onClick={copyPublicUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {copiedLink ? <><CheckIcon size={12} /> Copied</> : 'Copy Link'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowPosterModal(true)}>
                Print QR Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE NOW HERO STRIP (Big scores, sport icon, court, pulsing dot) ── */}
      {liveMatches.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1.5px solid var(--badge-live-border)',
            background: 'linear-gradient(135deg, var(--badge-live-bg), var(--bg-surface))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: 'var(--color-live)', letterSpacing: '0.06em' }}>
              <span className="live-dot" style={{ background: 'var(--color-live)' }} />
              LIVE NOW ON COURT ({liveMatches.length})
            </div>
            <button
              type="button"
              onClick={handleViewLiveFeed}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11.5, padding: '3px 9px', fontWeight: 700 }}
            >
              View Live Feed →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {liveMatches.map(m => (
              <div
                key={`strip-${m.id}`}
                onClick={handleViewLiveFeed}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {getSportIcon(m.sport, 13, 'var(--accent)')}
                    <span>{getSportName(m.sport)} · {m.venue || 'Main Arena'}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginTop: 3 }}>
                    {m.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>vs</span> {m.teamB}
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-live)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                  {m.scoreA} – {m.scoreB}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DIGITAL ARENA LED CLOCK & CALENDAR ── */}
      <DigitalLedClock />

      {/* ── FLOATING DEPARTMENT CARDS (Animated with Official Department Logos & Acronyms) ── */}
      <FloatingDepartmentCards
        selectedAcronym={searchTeam}
        onSelectDepartment={acronym => {
          if (searchTeam.toUpperCase() === acronym.toUpperCase()) {
            setSearchTeam('');
          } else {
            setSearchTeam(acronym);
          }
        }}
      />

      {/* ── ONE UNIFIED SPORT SELECTOR FOR ALL TABS ── */}
      <SportFilter
        value={filterSport === 'all' ? 'ALL' : filterSport}
        onChange={sp => setFilterSport(sp === 'ALL' ? 'all' : sp)}
      />

      {/* ── TABS ROW + SEARCH TEAMS + MY TEAM BOOKMARK ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <nav className="glass-card no-scrollbar" style={{
          display: 'flex',
          gap: '4px',
          padding: '5px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '12px',
          flex: '1 1 560px',
          maxWidth: '100%',
          minWidth: 0,
        }}>
          {([
            { id: 'live', label: 'Live', icon: <FlameIcon size={14} />, count: liveMatches.length, visible: true },
            { id: 'players', label: 'Players & Fouls', icon: <UsersIcon size={14} />, count: players.length, visible: true },
            { id: 'results', label: 'Results', icon: <TrophyIcon size={14} />, count: finishedMatches.length, visible: true },
            { id: 'standings', label: 'Standings', icon: <MedalIcon size={14} />, count: undefined, visible: settings?.publicDisplay?.showPublicStandings !== false },
            { id: 'brackets', label: 'Brackets', icon: <BracketsIcon size={14} />, count: undefined, visible: settings?.publicDisplay?.showPublicBrackets !== false },
            { id: 'schedule', label: 'Schedule', icon: <CalendarIcon size={14} />, count: scheduledMatches.length, visible: settings?.publicDisplay?.showPublicSchedule !== false },
            { id: 'tally', label: 'Medal Tally', icon: <MedalIcon size={14} />, count: undefined, visible: settings?.publicDisplay?.showPublicMedalTally !== false },
            { id: 'announcements', label: 'Announcements', icon: <FileTextIcon size={14} />, count: announcements.length, visible: true },
            { id: 'predictions', label: 'Predictions', icon: <SparklesIcon size={14} />, count: undefined, visible: true },
          ]).filter(t => t.visible).map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap',
                  padding: '8px 12px',
                  minHeight: '36px',
                }}
                onClick={() => setTab(t.id as PublicTab)}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : t.id === 'live' ? 'var(--badge-live-bg)' : 'var(--bg-elevated)',
                    color: isActive ? '#fff' : t.id === 'live' ? 'var(--badge-live-text)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Teams + My Team Star Filter on the Tab Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', maxWidth: '100%', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              value={searchTeam}
              onChange={e => setSearchTeam(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingRight: '26px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '12.5px',
                borderRadius: '10px',
              }}
            />
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <SearchIcon size={14} />
            </div>
            {searchTeam && (
              <button
                type="button"
                onClick={() => { setSearchTeam(''); setMyTeam(''); }}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          <select
            value={myTeam}
            onChange={e => handleToggleMyTeam(e.target.value)}
            className="form-input"
            title="Bookmark My Team to highlight and filter their matches"
            style={{ width: 'auto', maxWidth: '150px', padding: '8px 10px', fontSize: '12px', borderRadius: '10px', fontWeight: 700 }}
          >
            <option value="">★ My Team</option>
            {teams.map(t => (
              <option key={t.id} value={t.name}>★ {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: LIVE MATCHES
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'live' && (
        <section ref={liveFeedRef} style={{ scrollMarginTop: '20px' }}>
          {liveMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <FlameIcon size={36} color="var(--accent)" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
                No live matches right now
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                {nextUpcoming
                  ? `Next match: ${nextUpcoming.teamA} vs ${nextUpcoming.teamB} (${getSportName(nextUpcoming.sport)}) scheduled at ${nextUpcoming.venue}.`
                  : 'All scheduled matches for today have concluded. Check Match Results or Standings for updates.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
              alignItems: 'stretch',
            }}>
              {liveMatches.map(m => {
                const sportMeta = SPORTS_CATALOG.find(s => s.id === m.sport);
                const livePred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players, m);
                const ctx = getMatchContext(m);
                return (
                  <div key={m.id} className="scoreboard-card glass-card" style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header: Sport, Format & LIVE badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {getSportIcon(m.sport, 16, 'var(--accent)')}
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {sportMeta?.name || m.sport} · {m.round}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: ctx.format === 'round_robin' ? 'rgba(59,130,246,0.14)' : 'rgba(2, 132, 199,0.14)',
                          color: ctx.format === 'round_robin' ? '#3b82f6' : 'var(--accent)',
                        }}>
                          {ctx.formatLabel}
                        </span>
                      </div>
                      <div className="live-indicator">
                        <span className="live-dot" /> LIVE
                      </div>
                    </div>

                    {/* Full Date, Time & Event Place Banner */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px 12px',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      marginBottom: '12px',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon size={12} color="var(--text-muted)" />
                        <strong>Date:</strong> {ctx.formattedDate}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon size={12} color="var(--text-muted)" />
                        <strong>Time:</strong> {ctx.timeStr}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPinIcon size={12} color="var(--accent)" />
                        <strong>Event Place:</strong> {ctx.venueName} ({ctx.venueLocation}{ctx.venueCapacity ? ` · Cap ${ctx.venueCapacity}` : ''})
                      </span>
                    </div>

                    {/* Team vs Team with score in center (consistent height across grid) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '8px 0 16px',
                      minHeight: '68px',
                    }}>
                      {/* Team A */}
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                          {m.teamA}
                        </div>
                      </div>

                      {/* Large Center Score */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)', minWidth: '32px', textAlign: 'center' }}>
                          {m.scoreA}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>:</span>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)', minWidth: '32px', textAlign: 'center' }}>
                          {m.scoreB}
                        </span>
                      </div>

                      {/* Team B */}
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {m.teamB}
                        </div>
                      </div>
                    </div>

                    {/* AI Live Winner Prediction Strip (based on Past Performance + Live Score) */}
                    {livePred && (
                      <div
                        onClick={() => setSelectedAiMatch(m)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(59, 130, 246, 0.10))',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          marginBottom: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <SparklesIcon size={13} /> AI Predicts: <strong style={{ color: 'var(--text-primary)' }}>{livePred.predictedWinner}</strong> ({livePred.predictedWinnerProb}%)
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Proj Final: {livePred.predictedScoreA}–{livePred.predictedScoreB}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'rgba(59, 130, 246, 0.35)', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '5px' }}>
                          <div style={{ width: `${livePred.winProbA}%`, background: 'var(--accent)' }} />
                          <div style={{ width: `${livePred.winProbB}%`, background: '#3b82f6' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          <span>Past Perf: {livePred.statsA.eloRating} Elo ({livePred.statsA.wins}W–{livePred.statsA.losses}L) vs {livePred.statsB.eloRating} Elo ({livePred.statsB.wins}W–{livePred.statsB.losses}L)</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>Full AI Forecast ↗</span>
                        </div>
                      </div>
                    )}

                    {/* Sport-specific round & detail info */}
                    <div style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px',
                    }}>
                      <span>
                        {m.sport === 's1' && 'Quarter 3 · 4:12 remaining'}
                        {m.sport === 's2' && 'Set 2 of 3 · Set Points: 21–18'}
                        {m.sport === 's3' && 'Game 2 · 15–12'}
                        {m.sport === 's4' && 'Game 3 · 9–11'}
                        {m.sport === 's5' && 'Map 1 · 14m · Towers: 4–2'}
                        {m.sport === 's6' && 'Round 5 · Standard Time Control'}
                        {m.sport === 's7' && 'Judges Evaluation Scoring in Progress'}
                        {!['s1', 's2', 's3', 's4', 's5', 's6', 's7'].includes(m.sport) && 'Regulation Play Active'}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Active</span>
                    </div>

                    {/* Live Player List (In Play / Reserved) & All Game Fouls */}
                    <PublicMatchPlayersFoulsPanel match={m} defaultOpen={true} />

                    {/* Footer: Officials & Share Action */}
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '10px',
                      gap: '10px',
                    }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Scorer: <strong>{m.scorekeeper || 'Official Desk'}</strong> · Ref: <strong>{m.referee || 'Certified Official'}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setShareMatch(m)}
                        style={{ padding: '5px 10px', fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap' }}
                      >
                        Share Live Stream
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1B: PLAYERS & FOULS (IN PLAY / RESERVED & ALL GAME FOULS)
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'players' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Counters */}
          {(() => {
            const visiblePlayers = players.filter(p => {
              if (filterSport !== 'all' && p.sport !== filterSport && getSportName(p.sport) !== getSportName(filterSport)) return false;
              if (searchTeam) {
                const q = searchTeam.toLowerCase();
                const pTeam = teams.find(t => t.id === p.teamId)?.name || '';
                const pDept = departments.find(d => d.id === p.department)?.shortName || p.department || '';
                if (!p.name.toLowerCase().includes(q) && !pTeam.toLowerCase().includes(q) && !pDept.toLowerCase().includes(q)) return false;
              }
              return true;
            });
            const inPlayList = visiblePlayers.filter(p => getPlayerRosterStatus(p) === 'in_play');
            const reservedList = visiblePlayers.filter(p => getPlayerRosterStatus(p) === 'reserved');
            const totalFoulsCount = visiblePlayers.reduce((sum, p) => sum + getPlayerTotalFouls(p), 0);

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Listed Players</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{visiblePlayers.length}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Across active tournament teams</div>
                  </div>
                  <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>● Players In Play</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{inPlayList.length}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Active on court / field lineup</div>
                  </div>
                  <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>◐ Reserved Players</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{reservedList.length}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Official bench / substitute unit</div>
                  </div>
                  <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Recorded Game Fouls</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>{totalFoulsCount}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>All sport-specific fouls &amp; cards</div>
                  </div>
                </div>

                {/* Live Matches Lineups & Fouls Quick View */}
                {liveMatches.length > 0 && (
                  <div className="glass-card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: 900, color: 'var(--color-live)', textTransform: 'uppercase' }}>
                      <span className="live-dot" style={{ background: 'var(--color-live)' }} />
                      <span>Live Court Lineups (In Play vs Reserved) &amp; Match Fouls ({liveMatches.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {liveMatches.map(m => (
                        <div key={`players-live-${m.id}`} style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px' }}>
                              {getSportIcon(m.sport, 15, 'var(--accent)')}
                              <span>{getSportName(m.sport)}: {m.teamA} ({m.scoreA}) vs {m.teamB} ({m.scoreB})</span>
                            </div>
                            <span className="status-badge live"><span className="live-dot" /> LIVE</span>
                          </div>
                          <PublicMatchPlayersFoulsPanel match={m} defaultOpen={true} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Player Roster Table with Status (In Play / Reserved) & All Fouls Breakdown */}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Official Player List — Lineup Status (In Play / Reserved) &amp; All Game Fouls
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Live roster status and complete sport-specific foul breakdown for every registered student-athlete
                      </p>
                    </div>
                    <span className="badge-chip">{visiblePlayers.length} Athletes</span>
                  </div>

                  {visiblePlayers.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No players match the selected sport or team search.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '10px 14px' }}>Jersey &amp; Athlete</th>
                            <th style={{ padding: '10px 14px' }}>Team &amp; Dept</th>
                            <th style={{ padding: '10px 14px' }}>Sport &amp; Position</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Lineup Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total Fouls</th>
                            <th style={{ padding: '10px 14px' }}>All Game Fouls Breakdown</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePlayers.map(p => {
                            const status = getPlayerRosterStatus(p);
                            const totalFouls = getPlayerTotalFouls(p);
                            const breakdown = getPlayerFoulBreakdown(p);
                            const foulEntries = Object.entries(breakdown).filter(([, c]) => c > 0);
                            const rules = getSportFoulRules(p.sport);
                            const isFouledOut = Boolean(
                              (rules.foulOutLimit && totalFouls >= rules.foulOutLimit) ||
                              (breakdown['Red Card'] || 0) > 0 ||
                              (breakdown['Red Card Penalty'] || 0) > 0 ||
                              (breakdown['Fault Card (Red)'] || 0) > 0
                            );
                            const teamObj = teams.find(t => t.id === p.teamId);
                            const deptObj = departments.find(d => d.id === p.department);

                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      background: 'var(--bg-elevated)',
                                      border: '1px solid var(--border)',
                                      fontFamily: 'monospace',
                                    }}>
                                      #{p.jerseyNumber}
                                    </span>
                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{teamObj?.name || deptObj?.shortName || p.department}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{deptObj?.name || p.department}</div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                                    {getSportIcon(p.sport, 13, 'var(--accent)')}
                                    <span>{getSportName(p.sport)}</span>
                                  </div>
                                  {p.position && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.position}</div>}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    background: status === 'in_play' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: status === 'in_play' ? '#10b981' : '#f59e0b',
                                    border: status === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                                  }}>
                                    {status === 'in_play' ? '● IN PLAY' : '◐ RESERVED'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: '999px',
                                    background: isFouledOut
                                      ? 'rgba(239, 68, 68, 0.16)'
                                      : totalFouls > 0
                                      ? 'rgba(245, 158, 11, 0.16)'
                                      : 'var(--bg-elevated)',
                                    color: isFouledOut ? '#ef4444' : totalFouls > 0 ? '#f59e0b' : 'var(--text-muted)',
                                    border: isFouledOut
                                      ? '1px solid rgba(239, 68, 68, 0.4)'
                                      : totalFouls > 0
                                      ? '1px solid rgba(245, 158, 11, 0.35)'
                                      : '1px solid var(--border-light)',
                                  }}>
                                    {totalFouls} {totalFouls === 1 ? 'Foul' : 'Fouls'}
                                    {isFouledOut ? ` · ${rules.foulOutLabel || 'FOULED OUT'}` : ''}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  {foulEntries.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {foulEntries.map(([fType, count]) => (
                                        <span
                                          key={fType}
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 7px',
                                            borderRadius: '5px',
                                            background: fType.toLowerCase().includes('red')
                                              ? 'rgba(239, 68, 68, 0.15)'
                                              : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                                              ? 'rgba(245, 158, 11, 0.15)'
                                              : 'rgba(56, 189, 248, 0.12)',
                                            color: fType.toLowerCase().includes('red')
                                              ? '#ef4444'
                                              : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                                              ? '#f59e0b'
                                              : '#38bdf8',
                                          }}
                                        >
                                          {fType}: {count}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      Clean record · Possible fouls: {rules.types.map(t => t.shortLabel).join(', ')}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: MATCH RESULTS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'results' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {finishedMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No completed matches found matching the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {finishedMatches.map(m => {
                const ctx = getMatchContext(m);
                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    {/* Left: Sport, Format, Teams & Full Details */}
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {getSportIcon(m.sport, 14, 'var(--accent)')}
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round} {m.matchNumber ? `(Match #${m.matchNumber})` : ''}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: ctx.format === 'round_robin' ? 'rgba(59,130,246,0.14)' : 'rgba(2, 132, 199,0.14)',
                          color: ctx.format === 'round_robin' ? '#3b82f6' : 'var(--accent)',
                        }}>
                          {ctx.formatLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        <span style={{ color: m.winner === m.teamA ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamA ? 900 : 700 }}>
                          {m.teamA}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, margin: '0 6px' }}>vs</span>
                        <span style={{ color: m.winner === m.teamB ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamB ? 900 : 700 }}>
                          {m.teamB}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon size={12} color="var(--text-muted)" />
                          <strong>Date:</strong> {ctx.formattedDate}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ClockIcon size={12} color="var(--text-muted)" />
                          <strong>Time:</strong> {ctx.timeStr}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPinIcon size={12} color="var(--accent)" />
                          <strong>Event Place:</strong> {ctx.venueName} ({ctx.venueLocation})
                        </span>
                        {m.winner && (
                          <span style={{ color: '#10b981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            • Winner: {m.winner}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Event: {ctx.eventName} · Official Scorer: {m.scorekeeper || 'Official Desk'} · Referee: {m.referee || 'Certified Official'}
                      </div>
                    </div>

                    {/* Right: Final score badge & Share Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '1px',
                      }}>
                        {m.scoreA} – {m.scoreB}
                      </div>
                      <span className="status-badge finished">FINAL</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setShareMatch(m)}
                        style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      >
                        Share Card
                      </button>
                    </div>

                    {/* Completed Match Player Lineup (In Play / Reserved) & Game Fouls */}
                    <div style={{ width: '100%', flexBasis: '100%', marginTop: '4px' }}>
                      <PublicMatchPlayersFoulsPanel match={m} defaultOpen={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: STANDINGS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'standings' && (
        <section className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {filterSport !== 'all' ? getSportName(filterSport) : 'Basketball'} Tournament Standings
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Ranked by match points, victories, and goal differentials
              </p>
            </div>
            <span className="badge-chip">
              <span>{activeStandings.length} Teams Competing</span>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px', width: '50px' }}>Rank</th>
                  <th style={{ padding: '10px 16px' }}>Team</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Played</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Won</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Lost</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {activeStandings.map((row, idx) => (
                  <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {row.teamName}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.played}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{row.won}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.lost}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900, color: 'var(--accent)' }}>{row.won * 2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: BRACKETS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'brackets' && (
        <TournamentTreeBracket
          initialSportId={filterSport !== 'all' ? filterSport : 's1'}
          showSportSelector={false}
          isPublicView={true}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 5: SCHEDULE
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'schedule' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scheduledMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No upcoming scheduled matches found matching this filter.
            </div>
          ) : (
            scheduledMatches.map(m => {
              const ctx = getMatchContext(m);
              return (
                <div key={m.id} className="glass-card" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}>
                  <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {getSportIcon(m.sport, 14, 'var(--accent)')}
                      </span>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {getSportName(m.sport)} · {m.round} {m.matchNumber ? `(Match #${m.matchNumber})` : ''}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: ctx.format === 'round_robin' ? 'rgba(56, 189, 248, 0.14)' : 'var(--accent-light)',
                        color: ctx.format === 'round_robin' ? '#0284c7' : 'var(--accent)',
                      }}>
                        {ctx.formatLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {isPlaceholder(m.teamA) ? 'TBD' : m.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>vs</span> {isPlaceholder(m.teamB) ? 'TBD' : m.teamB}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CalendarIcon size={12} color="var(--text-muted)" />
                        <span>{ctx.formattedDate}</span>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <MapPinIcon size={12} color="var(--accent)" />
                        <span>{ctx.venueName} ({ctx.venueLocation}{ctx.venueCapacity ? ` · Cap ${ctx.venueCapacity}` : ''})</span>
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {ctx.eventName} · Scorer: {m.scorekeeper || 'Official Desk'} · Referee: {m.referee || 'Certified Official'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                    {!isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setSelectedAiMatch(m)}
                        title="View AI Match Probability Forecast"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          color: 'var(--accent)',
                          borderColor: 'var(--accent-border)',
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: 'var(--accent-subtle)',
                        }}
                      >
                        <SparklesIcon size={12} color="var(--accent)" />
                        <span>AI Forecast</span>
                      </button>
                    )}
                    <span className="status-badge scheduled" style={{ borderRadius: '4px' }}>SCHEDULED</span>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      background: 'var(--bg-elevated)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      minWidth: '88px',
                      whiteSpace: 'nowrap',
                    }}>
                      <ClockIcon size={12} color="var(--accent)" />
                      <span>{ctx.timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 6: MEDAL TALLY
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'tally' && (
        <section className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Overall Department Medal Standings
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Official Asian College Dumaguete Athletic Standings
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '520px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px', width: '50px' }}>Rank</th>
                  <th style={{ padding: '10px 16px' }}>Department / College</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#eab308' }}>Gold</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#94a3b8' }}>Silver</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#b45309' }}>Bronze</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {medalTally.map((row, idx) => {
                  const dept = departments.find(d => d.id === row.departmentId);
                  return (
                    <tr key={row.departmentId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: dept?.color || 'var(--accent)' }} />
                          <strong style={{ color: 'var(--text-primary)' }}>{dept?.name || row.departmentName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({dept?.shortName || row.departmentName})</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#eab308' }}>{row.gold}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>{row.silver}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#b45309' }}>{row.bronze}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900, color: 'var(--text-primary)' }}>{row.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 7: ANNOUNCEMENTS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'announcements' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No official tournament announcements at this time.
            </div>
          ) : (
            announcements.map(ann => (
              <div
                key={ann.id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  {ann.priority === 'urgent' && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0284c7',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
                      Urgent
                    </span>
                  )}
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ann.title}
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {ann.body}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Posted by {ann.createdBy} · {new Date(ann.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 8: PREDICTION AI
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'predictions' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '20px 24px', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff'
              }}>
                <SparklesIcon size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Padula AI Match Intelligence
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Machine learning model estimating tournament win probabilities, projected scores, and key matchup factors.
                </p>
              </div>
            </div>

            {/* Quick Interactive Simulator Box */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 10, padding: 16,
              border: '1px solid var(--border)', marginTop: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SparklesIcon size={14} /> Simulate Any Head-to-Head Matchup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Sport
                  </label>
                  <select
                    className="input-field"
                    value={simSport}
                    onChange={e => {
                      setSimSport(e.target.value);
                      setSimTeamA('');
                      setSimTeamB('');
                      setSimResult(null);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {SPORTS_CATALOG.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Competitor A
                  </label>
                  <select
                    className="input-field"
                    value={simTeamA}
                    onChange={e => setSimTeamA(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Select Team A --</option>
                    {teams.filter(t => t.sport === simSport && t.isActive !== false).map(t => (
                      <option key={t.id} value={t.name} disabled={t.name === simTeamB}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Competitor B
                  </label>
                  <select
                    className="input-field"
                    value={simTeamB}
                    onChange={e => setSimTeamB(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Select Team B --</option>
                    {teams.filter(t => t.sport === simSport && t.isActive !== false).map(t => (
                      <option key={t.id} value={t.name} disabled={t.name === simTeamA}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!simTeamA || !simTeamB || simTeamA === simTeamB}
                onClick={() => {
                  const pred = predictMatch(simTeamA, simTeamB, simSport, matches, teams, players);
                  setSimResult(pred);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <SparklesIcon size={14} /> Forecast Matchup
              </button>

              {/* Simulation Output */}
              {simResult && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamA}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: simResult.winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)', marginLeft: 8 }}>
                        {simResult.winProbA}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      Projected {simResult.predictedScoreA} – {simResult.predictedScoreB}
                    </div>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: simResult.winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)', marginRight: 8 }}>
                        {simResult.winProbB}%
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamB}</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(59, 130, 246, 0.3)', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                    <div style={{ width: `${simResult.winProbA}%`, background: 'var(--accent)' }} />
                    <div style={{ width: `${simResult.winProbB}%`, background: '#3b82f6' }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <SparklesIcon size={12} color="var(--accent)" /> {simResult.tacticalSummary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Live Matches Winner Predictions */}
          {liveMatches.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 12, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" /> Live Match Winner Predictions ({liveMatches.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {liveMatches.map(m => {
                  const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players, m);
                  if (!pred) return null;

                  return (
                    <div
                      key={m.id}
                      className="glass-card"
                      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', border: '1.5px solid rgba(2, 132, 199,0.4)' }}
                      onClick={() => setSelectedAiMatch(m)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round} · LIVE ({m.scoreA}–{m.scoreB})
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800 }}>
                          {pred.confidencePct}% AI Conf
                        </span>
                      </div>

                      <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <TrophyIcon size={12} color="#10b981" /> Predicted Winner:
                        </span>
                        <strong style={{ color: '#10b981' }}>{pred.predictedWinner} ({pred.predictedWinnerProb}%)</strong>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                          <span>{m.teamA} ({pred.winProbA}%)</span>
                          <span>{m.teamB} ({pred.winProbB}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#3b82f6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <span>Proj Final: <strong>{pred.predictedScoreA} – {pred.predictedScoreB}</strong></span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          Full Breakdown <ChevronRightIcon size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Scheduled Matches Forecast Cards */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.04em' }}>
              Forecasts for Scheduled Matches ({scheduledMatches.length})
            </div>

            {scheduledMatches.length === 0 ? (
              <div className="empty-state glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                No scheduled matches currently queued. Use the simulator above to forecast any matchup.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {scheduledMatches.map(m => {
                  const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players);
                  if (!pred) return null;

                  return (
                    <div
                      key={m.id}
                      className="glass-card"
                      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
                      onClick={() => setSelectedAiMatch(m)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(2, 132, 199,0.12)', color: 'var(--accent)', fontWeight: 700 }}>
                          {pred.confidence}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                          <span>{m.teamA} ({pred.winProbA}%)</span>
                          <span>{m.teamB} ({pred.winProbB}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#3b82f6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <span>Spread: <strong>{pred.predictedScoreA} – {pred.predictedScoreB}</strong></span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          Details <ChevronRightIcon size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── MODALS ── */}
      {selectedAiMatch && <AIPredictionModal match={selectedAiMatch} onClose={() => setSelectedAiMatch(null)} />}
      {showPosterModal && <QRPosterModal url={publicUrl} onClose={() => setShowPosterModal(false)} />}
      {shareMatch && (
        <ShareMatchModal
          match={matches.find(x => x.id === shareMatch.id) || shareMatch}
          onClose={() => setShareMatch(null)}
        />
      )}

      {/* ── SPECTATOR MOBILE BOTTOM NAVIGATION (44px+ touch targets) ── */}
      <nav className="mobile-bottom-nav" aria-label="Spectator Mobile Navigation">
        <button
          type="button"
          className={tab === 'live' ? 'active' : ''}
          onClick={() => setTab('live')}
        >
          <FlameIcon size={18} />
          <span>Live {liveMatches.length > 0 ? `(${liveMatches.length})` : ''}</span>
        </button>
        <button
          type="button"
          className={tab === 'players' ? 'active' : ''}
          onClick={() => setTab('players')}
        >
          <UsersIcon size={18} />
          <span>Players &amp; Fouls</span>
        </button>
        <button
          type="button"
          className={tab === 'results' ? 'active' : ''}
          onClick={() => setTab('results')}
        >
          <TrophyIcon size={18} />
          <span>Results</span>
        </button>
        <button
          type="button"
          className={tab === 'standings' ? 'active' : ''}
          onClick={() => setTab('standings')}
        >
          <MedalIcon size={18} />
          <span>Standings</span>
        </button>
        <button
          type="button"
          className={tab === 'brackets' ? 'active' : ''}
          onClick={() => setTab('brackets')}
        >
          <BracketsIcon size={18} />
          <span>Brackets</span>
        </button>
      </nav>
    </div>
  );
}
