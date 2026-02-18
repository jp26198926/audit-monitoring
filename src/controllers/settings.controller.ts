import { query } from "@/lib/db";
import { CompanySettings } from "@/types";
import { updateCompanySettingsSchema } from "@/validators/schemas";

export class SettingsController {
  /**
   * Get company settings
   * Returns the first (and should be only) settings record
   */
  static async getSettings(): Promise<CompanySettings | null> {
    try {
      const results = await query<CompanySettings[]>(
        "SELECT * FROM company_settings ORDER BY id ASC LIMIT 1",
      );

      if (results.length === 0) {
        // Return default settings if none exist
        return {
          id: 0,
          company_name: "",
          company_address: null,
          company_phone: null,
          company_email: null,
          contact_person: null,
          registration_number: null,
          tax_id: null,
          website: null,
          logo_path: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      }

      return results[0];
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw new Error("Failed to fetch company settings");
    }
  }

  /**
   * Update or create company settings (UPSERT)
   */
  static async updateSettings(
    data: Partial<CompanySettings>,
  ): Promise<CompanySettings> {
    try {
      // Validate input
      const validated = updateCompanySettingsSchema.parse(data);

      // Check if settings exist
      const existing = await query<CompanySettings[]>(
        "SELECT id FROM company_settings LIMIT 1",
      );

      if (existing.length > 0) {
        // Update existing settings
        const settingsId = existing[0].id;
        const fields = Object.keys(validated)
          .map((key) => `${key} = ?`)
          .join(", ");
        const values = Object.values(validated);

        await query(`UPDATE company_settings SET ${fields} WHERE id = ?`, [
          ...values,
          settingsId,
        ]);

        // Fetch and return updated settings
        const updated = await query<CompanySettings[]>(
          "SELECT * FROM company_settings WHERE id = ?",
          [settingsId],
        );
        return updated[0];
      } else {
        // Insert new settings
        const fields = Object.keys(validated).join(", ");
        const placeholders = Object.keys(validated)
          .map(() => "?")
          .join(", ");
        const values = Object.values(validated);

        const result = await query(
          `INSERT INTO company_settings (${fields}) VALUES (${placeholders})`,
          values,
        );

        // Fetch and return created settings
        const created = await query<CompanySettings[]>(
          "SELECT * FROM company_settings WHERE id = ?",
          [(result as any).insertId],
        );
        return created[0];
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update company settings");
    }
  }
}
