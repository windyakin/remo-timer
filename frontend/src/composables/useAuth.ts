import { ref, computed, readonly } from 'vue';

interface AuthUser {
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthStatus {
  authEnabled: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

// Singleton state for auth status
const status = ref<AuthStatus | null>(null);
const isLoading = ref(false);
const error = ref<Error | null>(null);

async function fetchStatus(): Promise<void> {
  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/status', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch auth status: ${response.status}`);
    }

    status.value = await response.json();
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Unknown error');
    // If we can't fetch status, assume auth is disabled
    status.value = {
      authEnabled: false,
      isAuthenticated: false,
      user: null,
    };
  } finally {
    isLoading.value = false;
  }
}

function login(): void {
  // Redirect to backend login endpoint
  window.location.href = '/api/auth/login';
}

function logout(): void {
  // Redirect to backend logout endpoint
  window.location.href = '/api/auth/logout';
}

export function useAuth() {
  return {
    // State
    status: readonly(status),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    authEnabled: computed(() => status.value?.authEnabled ?? false),
    isAuthenticated: computed(() => status.value?.isAuthenticated ?? false),
    user: computed(() => status.value?.user ?? null),

    // Actions
    fetchStatus,
    login,
    logout,
  };
}

// Export for use in router guard
export { fetchStatus, status, isLoading };
