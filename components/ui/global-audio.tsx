"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const TRACK_PATH = "/assets/music/gta_iv_theme_song.mp3";
const AUDIO_UNLOCK_KEY = "gta-theme-audio-unlocked";

export function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 0.45;

    const tryPlay = async () => {
      try {
        await audio.play();
        window.sessionStorage.setItem(AUDIO_UNLOCK_KEY, "true");
      } catch {
        // Ignore autoplay failures when the browser requires user interaction.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void tryPlay();
      }
    };

    const handleCanPlayThrough = () => {
      void tryPlay();
    };

    void tryPlay();
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const wasUnlocked =
      typeof window !== "undefined" && window.sessionStorage.getItem(AUDIO_UNLOCK_KEY) === "true";

    if (!wasUnlocked) {
      return;
    }

    const ensurePlayback = async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          // Ignore if the browser still refuses playback.
        }
      }
    };

    void ensurePlayback();
  }, [pathname]);

  return <audio ref={audioRef} src={TRACK_PATH} loop preload="auto" autoPlay />;
}
