import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ApiError,
  configureApiClient,
  resetApiClientConfiguration
} from '../api/apiClient';
import * as authApi from './authApi';
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken
} from './authStorage';

export const AuthContext = createContext(null);

function createAuthenticatedState(session, notice = '') {
  return {
    status: 'authenticated',
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    notice
  };
}

function createGuestState(notice = '') {
  return {
    status: 'guest',
    user: null,
    accessToken: null,
    refreshToken: null,
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
    refreshToken: 'refresh-token',
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
        refreshToken: null,
        notice: ''
      };
    }

    return createGuestState();
  });
  const accessTokenRef = useRef(authState.accessToken);
  const refreshTokenRef = useRef(authState.refreshToken);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    accessTokenRef.current = authState.accessToken;
    refreshTokenRef.current = authState.refreshToken;
  }, [authState.accessToken, authState.refreshToken]);

  const clearAuthentication = useCallback(
    ({ reason = 'manual', notice = '' } = {}) => {
      clearStoredRefreshToken();
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
    setStoredRefreshToken(session.refreshToken);
    setAuthState(createAuthenticatedState(session));
  }, []);

  const refreshSession = useCallback(
    async ({ reason = 'request' } = {}) => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      const storedRefreshToken =
        refreshTokenRef.current ?? getStoredRefreshToken();

      if (!storedRefreshToken) {
        const error = new ApiError('Authentication required.', {
          status: 401,
          detail: 'Authentication required.'
        });

        if (reason !== 'manual') {
          clearAuthentication({ reason: 'expired' });
        }

        throw error;
      }

      const pendingRefresh = api
        .refresh(storedRefreshToken)
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
            clearAuthentication({
              reason: error?.status === 401 || error?.status === 403 ? 'expired' : 'manual'
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

    const storedRefreshToken = getStoredRefreshToken();

    if (!storedRefreshToken) {
      setAuthState((currentState) =>
        currentState.status === 'bootstrapping' ? createGuestState() : currentState
      );
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
