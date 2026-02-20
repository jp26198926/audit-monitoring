import { query } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class PageController {
  /**
   * Get all pages
   */
  static async getAllPages(filters?: { is_active?: boolean }) {
    try {
      let sql = "SELECT * FROM pages";
      const conditions: string[] = [];
      const values: any[] = [];

      if (filters?.is_active !== undefined) {
        conditions.push("is_active = ?");
        values.push(filters.is_active);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " ORDER BY display_order, name";

      const pages = await query<RowDataPacket[]>(sql, values);

      return {
        success: true,
        data: pages,
      };
    } catch (error) {
      console.error("Get pages error:", error);
      return {
        success: false,
        error: "Failed to fetch pages",
      };
    }
  }

  /**
   * Get page by ID
   */
  static async getPageById(id: number) {
    try {
      const pages = await query<RowDataPacket[]>(
        "SELECT * FROM pages WHERE id = ?",
        [id],
      );

      if (pages.length === 0) {
        return {
          success: false,
          error: "Page not found",
        };
      }

      return {
        success: true,
        data: pages[0],
      };
    } catch (error) {
      console.error("Get page error:", error);
      return {
        success: false,
        error: "Failed to fetch page",
      };
    }
  }

  /**
   * Create page
   */
  static async createPage(data: {
    name: string;
    path: string;
    description?: string;
    icon?: string;
    is_active?: boolean;
    display_order?: number;
  }) {
    try {
      // Check for duplicate name or path
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM pages WHERE name = ? OR path = ?",
        [data.name, data.path],
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: "Page name or path already exists",
        };
      }

      const result = await query<ResultSetHeader>(
        `INSERT INTO pages (name, path, description, icon, is_active, display_order) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.path,
          data.description || null,
          data.icon || null,
          data.is_active !== undefined ? data.is_active : true,
          data.display_order || 0,
        ],
      );

      const newPage = await query<RowDataPacket[]>(
        "SELECT * FROM pages WHERE id = ?",
        [result.insertId],
      );

      return {
        success: true,
        data: newPage[0],
      };
    } catch (error) {
      console.error("Create page error:", error);
      return {
        success: false,
        error: "Failed to create page",
      };
    }
  }

  /**
   * Update page
   */
  static async updatePage(
    id: number,
    data: {
      name?: string;
      path?: string;
      description?: string;
      icon?: string;
      is_active?: boolean;
      display_order?: number;
    },
  ) {
    try {
      // Check if exists
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM pages WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Page not found",
        };
      }

      // Check for duplicate name or path
      if (data.name || data.path) {
        const conditions: string[] = [];
        const values: any[] = [];

        if (data.name) {
          conditions.push("name = ?");
          values.push(data.name);
        }
        if (data.path) {
          if (conditions.length > 0) conditions.push("OR");
          conditions.push("path = ?");
          values.push(data.path);
        }
        values.push(id);

        const duplicate = await query<RowDataPacket[]>(
          `SELECT id FROM pages WHERE (${conditions.join(" ")}) AND id != ?`,
          values,
        );

        if (duplicate.length > 0) {
          return {
            success: false,
            error: "Page name or path already exists",
          };
        }
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push("name = ?");
        values.push(data.name);
      }
      if (data.path !== undefined) {
        updates.push("path = ?");
        values.push(data.path);
      }
      if (data.description !== undefined) {
        updates.push("description = ?");
        values.push(data.description);
      }
      if (data.icon !== undefined) {
        updates.push("icon = ?");
        values.push(data.icon);
      }
      if (data.is_active !== undefined) {
        updates.push("is_active = ?");
        values.push(data.is_active);
      }
      if (data.display_order !== undefined) {
        updates.push("display_order = ?");
        values.push(data.display_order);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: "No fields to update",
        };
      }

      values.push(id);

      await query(
        `UPDATE pages SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated = await query<RowDataPacket[]>(
        "SELECT * FROM pages WHERE id = ?",
        [id],
      );

      return {
        success: true,
        data: updated[0],
      };
    } catch (error) {
      console.error("Update page error:", error);
      return {
        success: false,
        error: "Failed to update page",
      };
    }
  }

  /**
   * Delete page
   */
  static async deletePage(id: number) {
    try {
      const existing = await query<RowDataPacket[]>(
        "SELECT id FROM pages WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: "Page not found",
        };
      }

      await query("DELETE FROM pages WHERE id = ?", [id]);

      return {
        success: true,
        message: "Page deleted successfully",
      };
    } catch (error) {
      console.error("Delete page error:", error);
      return {
        success: false,
        error: "Failed to delete page",
      };
    }
  }
}
