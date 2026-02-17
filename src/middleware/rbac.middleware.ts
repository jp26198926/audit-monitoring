import { UserRole } from "@/types";

/**
 * Role-based access control permissions
 */
export const PERMISSIONS = {
  // Audit permissions
  CREATE_AUDIT: ["Admin", "Encoder"] as UserRole[],
  UPDATE_AUDIT: ["Admin", "Encoder"] as UserRole[],
  DELETE_AUDIT: ["Admin"] as UserRole[],
  VIEW_AUDIT: ["Admin", "Encoder", "Viewer"] as UserRole[],

  // Finding permissions
  CREATE_FINDING: ["Admin", "Encoder"] as UserRole[],
  UPDATE_FINDING: ["Admin", "Encoder"] as UserRole[],
  DELETE_FINDING: ["Admin"] as UserRole[],
  CLOSE_FINDING: ["Admin", "Encoder"] as UserRole[],
  REOPEN_FINDING: ["Admin"] as UserRole[],
  VIEW_FINDING: ["Admin", "Encoder", "Viewer"] as UserRole[],

  // Master data permissions
  MANAGE_VESSELS: ["Admin"] as UserRole[],
  MANAGE_AUDIT_TYPES: ["Admin"] as UserRole[],
  MANAGE_AUDIT_PARTIES: ["Admin"] as UserRole[],
  MANAGE_USERS: ["Admin"] as UserRole[],

  // View permissions
  VIEW_DASHBOARD: ["Admin", "Encoder", "Viewer"] as UserRole[],
};

/**
 * Check if user has permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: UserRole[],
): boolean {
  return permission.includes(userRole);
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  userRole: UserRole,
  action: keyof typeof PERMISSIONS,
): boolean {
  return PERMISSIONS[action].includes(userRole);
}
