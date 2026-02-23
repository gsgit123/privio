"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

interface HlsPlayerProps {
  url: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HlsPlayer({ url, onPlay, onPause, onEnded }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [levels, setLevels] = useState<{ height: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showQuality, setShowQuality] = useState(false);

  // ── HLS setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels.map((l) => ({ height: l.height })));
        setIsLoading(false);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setCurrentLevel(data.level));
      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      setIsLoading(false);
    }
  }, [url]);

  // ── Video event listeners ──────────────────────────────────────────────────
  // Callbacks (onPlay etc.) are intentionally NOT in the dep array.
  // Re-registering on every render causes duplicate event fires.
  // Wrap them in useCallback at the call site if you need reactivity.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers: Record<string, EventListener> = {
      timeupdate:     () => setCurrentTime(video.currentTime),
      durationchange: () => setDuration(video.duration),
      play:           () => { setPlaying(true);  onPlay?.(); },
      pause:          () => { setPlaying(false); onPause?.(); },
      ended:          () => { setPlaying(false); onEnded?.(); },
      waiting:        () => setIsLoading(true),
      playing:        () => setIsLoading(false),
      progress:       () => {
        if (video.buffered.length > 0)
          setBuffered(video.buffered.end(video.buffered.length - 1));
      },
      volumechange:   () => { setVolume(video.volume); setMuted(video.muted); },
    };

    Object.entries(handlers).forEach(([e, fn]) => video.addEventListener(e, fn));
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      Object.entries(handlers).forEach(([e, fn]) => video.removeEventListener(e, fn));
      document.removeEventListener("fullscreenchange", onFsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-hide controls ─────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [playing]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || (e.target as HTMLElement).tagName === "INPUT") return;
      switch (e.key) {
        case " ":
        case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": video.currentTime = Math.min(video.currentTime + 10, video.duration); break;
        case "ArrowLeft":  video.currentTime = Math.max(video.currentTime - 10, 0); break;
        case "ArrowUp":    video.volume = Math.min(video.volume + 0.1, 1); break;
        case "ArrowDown":  video.volume = Math.max(video.volume - 0.1, 0); break;
        case "m": video.muted = !video.muted; break;
        case "f": toggleFullscreen(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleFullscreen = () => {
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const video = videoRef.current;
    if (video) video.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const setQuality = (level: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = level;
    setCurrentLevel(level);
    setShowQuality(false);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered   / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
        style={{ cursor: showControls ? "default" : "none" }}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin" />
        </div>
      )}

      {/* Paused overlay */}
      {!playing && !isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
      >
        {/* gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        <div className="relative px-4 pb-3 pt-10">
          {/* Scrubber */}
          <div
            className="relative mb-3 cursor-pointer rounded-full overflow-visible"
            style={{ height: "4px" }}
            onClick={handleProgressClick}
            onMouseEnter={(e) => { e.currentTarget.style.height = "6px"; }}
            onMouseLeave={(e) => { e.currentTarget.style.height = "4px"; }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-teal-400 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-400 rounded-full shadow-lg"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-teal-400 transition-colors">
              {playing ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }}
                className="text-white hover:text-teal-400 transition-colors"
              >
                {muted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (v) { v.volume = Number(e.target.value); v.muted = false; }
                }}
                className="w-20 accent-teal-400"
              />
            </div>

            {/* Time */}
            <span className="text-white text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-grow" />

            {/* Quality selector — only shown when HLS gives >1 level */}
            {levels.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQuality(!showQuality)}
                  className="text-white hover:text-teal-400 text-xs font-medium px-2 py-0.5 rounded border border-white/20 hover:border-teal-400/50 transition-colors"
                >
                  {currentLevel === -1 ? "Auto" : `${levels[currentLevel]?.height}p`}
                </button>
                {showQuality && (
                  <div className="absolute bottom-9 right-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl min-w-[90px]">
                    <button
                      onClick={() => setQuality(-1)}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-teal-500/10 transition-colors ${currentLevel === -1 ? "text-teal-400" : "text-white"}`}
                    >
                      Auto
                    </button>
                    {levels.map((l, i) => (
                      <button key={i} onClick={() => setQuality(i)}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-teal-500/10 transition-colors ${currentLevel === i ? "text-teal-400" : "text-white"}`}
                      >
                        {l.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-teal-400 transition-colors">
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
