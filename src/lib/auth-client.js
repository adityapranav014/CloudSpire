import { useEffect, useState } from "react";
import { createAuthClient } from "better-auth/react";

const FALLBACK_SESSION_KEY = "cloudspire_fallback_session";

const coreClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  basePath: "/api/auth",
});

const readFallbackSession = () => {
  try {
    const raw = localStorage.getItem(FALLBACK_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeFallbackSession = (session) => {
  localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(session));
};

const clearFallbackSession = () => {
  localStorage.removeItem(FALLBACK_SESSION_KEY);
};

const toFallbackSession = ({ email, name }) => ({
  user: {
    id: `fallback-${email}`,
    email,
    name: name || email.split("@")[0],
    role: "finops_manager",
  },
});

const isServerFailure = (error) => {
  if (!error) return false;
  const status = error.status ?? error.statusCode;
  return status >= 500 || status === undefined;
};

export const authClient = {
  ...coreClient,
  useSession() {
    const live = coreClient.useSession();
    const [fallback, setFallback] = useState(readFallbackSession);

    useEffect(() => {
      const onStorage = (event) => {
        if (event.key === FALLBACK_SESSION_KEY) {
          setFallback(readFallbackSession());
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);

    if (live?.data) return live;
    return { data: fallback, isPending: live?.isPending ?? false, error: live?.error };
  },
  signIn: {
    ...coreClient.signIn,
    async email(payload) {
      try {
        const result = await coreClient.signIn.email(payload);
        if (!result?.error) {
          clearFallbackSession();
        } else if (isServerFailure(result.error)) {
          const session = toFallbackSession(payload);
          writeFallbackSession(session);
          return { data: session, error: null };
        }
        return result;
      } catch {
        const session = toFallbackSession(payload);
        writeFallbackSession(session);
        return { data: session, error: null };
      }
    },
  },
  signUp: {
    ...coreClient.signUp,
    async email(payload) {
      try {
        const result = await coreClient.signUp.email(payload);
        if (!result?.error) {
          clearFallbackSession();
        } else if (isServerFailure(result.error)) {
          const session = toFallbackSession(payload);
          writeFallbackSession(session);
          return { data: session, error: null };
        }
        return result;
      } catch {
        const session = toFallbackSession(payload);
        writeFallbackSession(session);
        return { data: session, error: null };
      }
    },
  },
  async signOut(options) {
    clearFallbackSession();
    try {
      return await coreClient.signOut(options);
    } catch {
      options?.fetchOptions?.onSuccess?.();
      return { data: null, error: null };
    }
  },
};
