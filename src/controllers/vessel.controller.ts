import { query } from "@/lib/db";
import { Vessel } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class VesselController {
  /**
   * Get all vessels
   */
  static async getAllVessels(
    activeOnly: boolean = false,
    includeDeleted: boolean = false,
  ) {
    try {
      let sql = "";
      if (activeOnly) {
        sql = includeDeleted
          ? 'SELECT * FROM vessels WHERE status = "Active" ORDER BY vessel_name'
          : 'SELECT * FROM vessels WHERE status = "Active" AND deleted_at IS NULL ORDER BY vessel_name';
      } else {
        sql = includeDeleted
          ? "SELECT * FROM vessels ORDER BY vessel_name"
          : "SELECT * FROM vessels WHERE deleted_at IS NULL ORDER BY vessel_name";
      }

      const vessels = await query<(Vessel & RowDataPacket)[]>(sql);

      return {
        success: true,
        data: vessels,
      };
    } catch (error) {
      console.error("Get vessels error:", error);
      return {
        success: false,
        error: "Failed to fetch vessels",
      };
    }
  }

  /**
   * Get vessel by ID
   */
  static async getVesselById(id: number) {
    try {
      const vessels = await query<(Vessel & RowDataPacket)[]>(
        "SELECT * FROM vessels WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (vessels.length === 0) {
        return {
          success: false,
          error: "Vessel not found",
        };
      }

      return {
        success: true,
        data: vessels[0],
      };
    } catch (error) {
      console.error("Get vessel error:", error);
      return {
        success: false,
        error: "Failed to fetch vessel",
      };
    }
  }

  /**
   * Create vessel
   */
  static async createVessel(data: {
    vessel_name: string;
    vessel_code: string;
    registration_number?: string | null;
    status?: "Active" | "Inactive";
  }) {
    try {
      const result = await query<ResultSetHeader>(
        "INSERT INTO vessels (vessel_name, vessel_code, registration_number, status) VALUES (?, ?, ?, ?)",
        [
          data.vessel_name,
          data.vessel_code,
          data.registration_number || null,
          data.status || "Active",
        ],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Vessel created successfully",
      };
    } catch (error: any) {
      console.error("Create vessel error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("vessel_code")) {
          return {
            success: false,
            error: "Vessel code already exists",
          };
        }
        return {
          success: false,
          error: "Registration number already exists",
        };
      }
      return {
        success: false,
        error: "Failed to create vessel",
      };
    }
  }

  /**
   * Update vessel
   */
  static async updateVessel(
    id: number,
    data: {
      vessel_name?: string;
      vessel_code?: string;
      registration_number?: string | null;
      status?: "Active" | "Inactive";
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.vessel_name !== undefined) {
        updates.push("vessel_name = ?");
        values.push(data.vessel_name);
      }
      if (data.vessel_code !== undefined) {
        updates.push("vessel_code = ?");
        values.push(data.vessel_code);
      }
      if (data.registration_number !== undefined) {
        updates.push("registration_number = ?");
        values.push(data.registration_number || null);
      }
      if (data.status !== undefined) {
        updates.push("status = ?");
        values.push(data.status);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);
      await query(
        `UPDATE vessels SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      return {
        success: true,
        message: "Vessel updated successfully",
      };
    } catch (error: any) {
      console.error("Update vessel error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("vessel_code")) {
          return {
            success: false,
            error: "Vessel code already exists",
          };
        }
        return {
          success: false,
          error: "Registration number already exists",
        };
      }
      return {
        success: false,
        error: "Failed to update vessel",
      };
    }
  }

  /**
   * Delete vessel (soft delete)
   */
  static async deleteVessel(id: number, deletedBy: number) {
    try {
      // Check if vessel exists and is not already deleted
      const [vessel] = await query<RowDataPacket[]>(
        "SELECT id FROM vessels WHERE id = ? AND deleted_at IS NULL",
        [id],
      );

      if (!vessel) {
        return {
          success: false,
          error: "Vessel not found or already deleted",
        };
      }

      // Soft delete the vessel
      await query(
        "UPDATE vessels SET deleted_at = NOW(), deleted_by = ? WHERE id = ?",
        [deletedBy, id],
      );

      return {
        success: true,
        message: "Vessel deleted successfully",
      };
    } catch (error) {
      console.error("Delete vessel error:", error);
      return {
        success: false,
        error: "Failed to delete vessel",
      };
    }
  }

  /**
   * Restore deleted vessel
   */
  static async restoreVessel(id: number) {
    try {
      // Check if vessel exists and is deleted
      const [vessel] = await query<RowDataPacket[]>(
        "SELECT id FROM vessels WHERE id = ? AND deleted_at IS NOT NULL",
        [id],
      );

      if (!vessel) {
        return {
          success: false,
          error: "Vessel not found or not deleted",
        };
      }

      // Restore the vessel
      await query(
        "UPDATE vessels SET deleted_at = NULL, deleted_by = NULL WHERE id = ?",
        [id],
      );

      return {
        success: true,
        message: "Vessel restored successfully",
      };
    } catch (error) {
      console.error("Restore vessel error:", error);
      return {
        success: false,
        error: "Failed to restore vessel",
      };
    }
  }
}
