import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { JWTPayload } from "@/types";

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticate(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 },
        );
      }

      const decoded = verifyToken(token);

      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = decoded;

      return handler(authenticatedReq);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      );
    }
  };
}

/**
 * Middleware to check user role
 */
export function authorize(allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const authHeader = req.headers.get("authorization");
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
          return NextResponse.json(
            { success: false, error: "Authentication required" },
            { status: 401 },
          );
        }

        const decoded = verifyToken(token);

        if (!allowedRoles.includes(decoded.role_name)) {
          return NextResponse.json(
            { success: false, error: "Insufficient permissions" },
            { status: 403 },
          );
        }

        // Attach user to request
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = decoded;

        return handler(authenticatedReq);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 },
        );
      }
    };
  };
}

/**
 * Helper to get authenticated user from request
 */
export async function getAuthUser(
  req: NextRequest,
): Promise<JWTPayload | null> {
  try {
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}
