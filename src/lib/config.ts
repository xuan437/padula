// ============================================================
// System Configuration & Default Credentials
// Reads from Vite environment variables with secure fallbacks.
// ============================================================

export const APP_CONFIG = {
  directorDefaultEmail: import.meta.env.VITE_DEFAULT_DIRECTOR_EMAIL || 'admin@gmail.com',
  directorDefaultPassword: import.meta.env.VITE_DEFAULT_DIRECTOR_PASSWORD || 'admin123',
  maxFailedLogins: 5,
  lockoutDurationMinutes: 15,
  inactivityTimeoutMinutes: 30,
  maxCoordinators: 3,
};

