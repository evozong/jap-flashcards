import { useEffect, useState } from "react";

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential: string; select_by: string }) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
      use_fedcm_for_prompt?: boolean;
    }) => void;
    prompt: (callback?: (notification: {
      isNotDisplayed: () => boolean;
      getNotDisplayedReason: () => string;
      isSkippedMoment: () => boolean;
      getSkippedReason: () => string;
      isDismissedMoment: () => boolean;
      getDismissedReason: () => string;
    }) => void) => void;
    cancel: () => void;
    revoke: (hint: string, callback: () => void) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

type JwtPayload = {
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
};

export type UserProfile = {
  name?: string;
  email?: string;
  picture?: string;
};

const decodeJwt = <T,>(token: string): T => {
  const [, payload] = token.split(".");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, "=");
  const json = atob(padded);
  return JSON.parse(json) as T;
};

export function useGoogleAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [authReady, setAuthReady] = useState(() => typeof window !== "undefined" && !!window.google?.accounts);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(() =>
    clientId ? null : "Missing VITE_GOOGLE_CLIENT_ID environment variable."
  );
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!clientId) return;
    if (window.google && window.google.accounts) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setAuthReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setAuthReady(true);
    script.onerror = () => setAuthError("Failed to load Google Identity Services");
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!authReady || !clientId || !window.google?.accounts?.id) return;

    const handleCredential = (response: { credential: string; select_by: string }) => {
      try {
        const payload = decodeJwt<JwtPayload>(response.credential);
        setUserProfile({
          name: payload.name || payload.given_name,
          email: payload.email,
          picture: payload.picture,
        });
        setAuthError(null);
        setProfileOpen(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Login failed";
        setAuthError(message);
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, [authReady, clientId]);

  const signIn = () => {
    if (!clientId) {
      setAuthError("Missing VITE_GOOGLE_CLIENT_ID environment variable.");
      return;
    }
    if (!authReady || !window.google?.accounts?.id) {
      setAuthError("Google auth not ready. Please try again.");
      return;
    }
    setAuthError(null);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        setAuthError(`Google One Tap unavailable: ${notification.getNotDisplayedReason()}`);
      } else if (notification.isSkippedMoment()) {
        setAuthError(`Google One Tap skipped: ${notification.getSkippedReason()}`);
      }
    });
    setProfileOpen(true);
  };

  const signOut = () => {
    const email = userProfile?.email;
    if (email && window.google?.accounts?.id?.revoke) {
      window.google.accounts.id.revoke(email, () => {
        setUserProfile(null);
      });
      return;
    }
    setUserProfile(null);
    setProfileOpen(false);
  };

  return {
    authReady,
    authError,
    userProfile,
    profileOpen,
    toggleProfile: () => setProfileOpen((o) => !o),
    closeProfile: () => setProfileOpen(false),
    openProfile: () => setProfileOpen(true),
    signIn,
    signOut,
  };
}
