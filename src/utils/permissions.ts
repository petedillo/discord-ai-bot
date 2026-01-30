// User permission utilities

/**
 * Check if a user is authorized to use bot commands
 */
export function isUserAuthorized(userId: string, allowedUsers: string[]): boolean {
  if (!allowedUsers || allowedUsers.length === 0) {
    return true; // No restrictions if no allowed users configured
  }
  return allowedUsers.includes(userId);
}

export default isUserAuthorized;
