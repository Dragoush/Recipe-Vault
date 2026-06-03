import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  configureApiClient,
  resetApiClientConfiguration
} from '../api/apiClient';
import * as authApi from './authApi';

export const AuthContext = createContext(null);

function createAuthenticatedState(session, notice = '') {
  return {
    status: 'authenticated',
    user: session.user,
    accessToken: session.accessToken,
    notice
  };
}

function createGuestState(notice = '') {
  return {
    status: 'guest',
    user: null,
    accessToken: null,
    notice
  };
}

export function createTestSession(overrides = {}) {
  return {
    user: {
      id: 'user-test-owner',
      username: 'test_user',
      role: 'USER',
      createdAt: '2026-05-24T12:00:00.000Z',
      updatedAt: '2026-05-24T12:00:00.000Z'
    },
    accessToken: 'access-token',
    tokenType: 'bearer',
    accessTokenExpiresIn: 900,
    ...overrides
  };
}

export default function AuthProvider({
  children,
  api = authApi,
  initialSession = null,
  bootstrapOnMount = true
}) {
  const [authState, setAuthState] = useState(() => {
    if (initialSession) {
      return createAuthenticatedState(initialSession);
    }

    if (bootstrapOnMount) {
      return {
        status: 'bootstrapping',
        user: null,
        accessToken: null,
        notice: ''
      };
    }

    return createGuestState();
  });
  const accessTokenRef = useRef(authState.accessToken);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    accessTokenRef.current = authState.accessToken;
  }, [authState.accessToken]);

  const clearAuthentication = useCallback(
    ({ reason = 'manual', notice = '' } = {}) => {
      setAuthState((currentState) => {
        if (currentState.status === 'guest' && !notice) {
          return currentState;
        }

        if (reason === 'expired') {
          return createGuestState(
            notice || 'Your session expired. Please sign in again.'
          );
        }

        return createGuestState(notice);
      });
    },
    []
  );

  const applyAuthenticatedSession = useCallback((session) => {
    setAuthState(createAuthenticatedState(session));
  }, []);

  const refreshSession = useCallback(
    async ({ reason = 'request' } = {}) => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      const pendingRefresh = api
        .refresh()
        .then((session) => {
          applyAuthenticatedSession(session);
          return session;
        })
        .catch((error) => {
          const shouldClear =
            reason === 'bootstrap' ||
            error?.status === 401 ||
            error?.status === 403;

          if (shouldClear) {
            const isExpiredSession =
              reason !== 'bootstrap' &&
              (error?.status === 401 || error?.status === 403);

            clearAuthentication({
              reason: isExpiredSession ? 'expired' : 'manual'
            });
          }

          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });

      refreshPromiseRef.current = pendingRefresh;
      return pendingRefresh;
    },
    [api, applyAuthenticatedSession, clearAuthentication]
  );

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken: () => refreshSession({ reason: 'request' })
    });

    return () => {
      resetApiClientConfiguration();
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!bootstrapOnMount) {
      return;
    }

    refreshSession({ reason: 'bootstrap' }).catch(() => {
      setAuthState((currentState) =>
        currentState.status === 'bootstrapping' ? createGuestState() : currentState
      );
    });
  }, [bootstrapOnMount, refreshSession]);

  const login = useCallback(
    async (values) => {
      const session = await api.login(values);
      applyAuthenticatedSession(session);
      return session;
    },
    [api, applyAuthenticatedSession]
  );

  const register = useCallback(
    async (values) => api.register(values),
    [api]
  );

  const logout = useCallback(async () => {
    try {
      if (accessTokenRef.current) {
        await api.logout();
      }
    } catch {
      // Best-effort logout. The local session should still be cleared.
    } finally {
      clearAuthentication();
    }
  }, [api, clearAuthentication]);

  const clearNotice = useCallback(() => {
    setAuthState((currentState) => ({
      ...currentState,
      notice: ''
    }));
  }, []);

  const value = useMemo(
    () => ({
      status: authState.status,
      isAuthenticated: authState.status === 'authenticated',
      isBootstrapping: authState.status === 'bootstrapping',
      user: authState.user,
      notice: authState.notice,
      login,
      register,
      logout,
      refreshSession,
      clearNotice
    }),
    [
      authState.notice,
      authState.status,
      authState.user,
      clearNotice,
      login,
      logout,
      refreshSession,
      register
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
