import { query } from "@/lib/db";
import { Vessel } from "@/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class VesselController {
  /**
   * Get all vessels
   */
  static async getAllVessels(activeOnly: boolean = false) {
    try {
      const sql = activeOnly
        ? 'SELECT * FROM vessels WHERE status = "Active" ORDER BY vessel_name'
        : "SELECT * FROM vessels ORDER BY vessel_name";

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
        "SELECT * FROM vessels WHERE id = ?",
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
    registration_number: string;
    status?: "Active" | "Inactive";
  }) {
    try {
      const result = await query<ResultSetHeader>(
        "INSERT INTO vessels (vessel_name, registration_number, status) VALUES (?, ?, ?)",
        [data.vessel_name, data.registration_number, data.status || "Active"],
      );

      return {
        success: true,
        data: { id: result.insertId },
        message: "Vessel created successfully",
      };
    } catch (error: any) {
      console.error("Create vessel error:", error);
      if (error.code === "ER_DUP_ENTRY") {
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
      registration_number?: string;
      status?: "Active" | "Inactive";
    },
  ) {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.vessel_name) {
        updates.push("vessel_name = ?");
        values.push(data.vessel_name);
      }
      if (data.registration_number) {
        updates.push("registration_number = ?");
        values.push(data.registration_number);
      }
      if (data.status) {
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
   * Delete vessel
   */
  static async deleteVessel(id: number) {
    try {
      // Check if vessel is used in audits
      const audits = await query<RowDataPacket[]>(
        "SELECT id FROM audits WHERE vessel_id = ? LIMIT 1",
        [id],
      );

      if (audits.length > 0) {
        return {
          success: false,
          error: "Cannot delete vessel with existing audits",
        };
      }

      await query("DELETE FROM vessels WHERE id = ?", [id]);

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
}
