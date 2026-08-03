import { useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function EnterFullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M9 5H5v4M19 9V5h-4M15 19h4v-4M5 15v4h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 9 5 5M15 9l4-4M15 15l4 4M9 15l-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function MobileFullscreenButton() {
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const root = document.documentElement as FullscreenRoot;

    const supportsFullscreen =
      Boolean(document.fullscreenEnabled) ||
      Boolean(doc.webkitFullscreenEnabled) ||
      Boolean(root.requestFullscreen) ||
      Boolean(root.webkitRequestFullscreen);
    setFullscreenSupported(supportsFullscreen);

    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener(
        "webkitfullscreenchange",
        syncFullscreenState as EventListener
      );
    };
  }, []);

  async function toggleFullscreen() {
    const doc = document as FullscreenDocument;
    const root = document.documentElement as FullscreenRoot;

    try {
      const activeElement = document.fullscreenElement || doc.webkitFullscreenElement;

      if (!activeElement) {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
          return;
        }
        if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        }
        return;
      }

      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch (err) {
      console.error("Impossible de basculer le plein écran :", err);
    }
  }

  if (!fullscreenSupported) {
    return null;
  }

  return (
    <button
      type="button"
      className={`eb-mobile-fullscreen-trigger sm:hidden ${isFullscreen ? "is-active" : ""}`}
      onClick={() => void toggleFullscreen()}
      aria-label={isFullscreen ? "Quitter plein ecran" : "Activer plein ecran"}
      title={isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
    >
      {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
    </button>
  );
}
