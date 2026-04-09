"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const TRACK_PATH = "/assets/music/gta_iv_theme_song.mp3";
const AUDIO_UNLOCK_KEY = "gta-theme-audio-unlocked";

export function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 0.1;

    const tryPlay = async () => {
      try {
        await audio.play();
        startedRef.current = true;
        window.sessionStorage.setItem(AUDIO_UNLOCK_KEY, "true");
        detachUnlockListeners();
      } catch {
        // Ignore autoplay failures when the browser requires user interaction.
      }
    };

    const unlockAudio = () => {
      void tryPlay();
    };

    const detachUnlockListeners = () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("focus", unlockAudio);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void tryPlay();
      }
    };

    void tryPlay();

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("focus", unlockAudio);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      detachUnlockListeners();
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
          startedRef.current = true;
        } catch {
          // Ignore if the browser still refuses playback.
        }
      }
    };

    void ensurePlayback();
  }, [pathname]);

  return <audio ref={audioRef} src={TRACK_PATH} loop preload="auto" autoPlay />;
}
