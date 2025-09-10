import { useRef, useEffect } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ url, onPlay, onPause, onEnded }: { 
  url: string; 
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('play', () => onPlay?.());
    video.addEventListener('pause', () => onPause?.());
    video.addEventListener('ended', () => onEnded?.());

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
    
    return () => {
      video.removeEventListener('play', () => onPlay?.());
      video.removeEventListener('pause', () => onPause?.());
      video.removeEventListener('ended', () => onEnded?.());
    }
  }, [url, onPlay, onPause, onEnded]);
  
  return <video ref={videoRef} controls style={{ width: "100%" }} />;
}