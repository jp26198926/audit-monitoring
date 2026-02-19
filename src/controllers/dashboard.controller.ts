import { query } from "@/lib/db";
import { DashboardFilters } from "@/types";
import { RowDataPacket } from "mysql2";
import { getYearToDateStart, formatDate } from "@/utils/helpers";

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  static async getStats(filters?: DashboardFilters) {
    try {
      const today = formatDate(new Date());
      const ytdStart = getYearToDateStart();
      const next30Days = formatDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      );

      // Build filter conditions
      const auditConditions: string[] = [];
      const values: any[] = [];

      if (filters?.vessel_id) {
        auditConditions.push("vessel_id = ?");
        values.push(filters.vessel_id);
      }
      if (filters?.audit_type_id) {
        auditConditions.push("audit_type_id = ?");
        values.push(filters.audit_type_id);
      }
      if (filters?.audit_party_id) {
        auditConditions.push("audit_party_id = ?");
        values.push(filters.audit_party_id);
      }
      if (filters?.status) {
        auditConditions.push("status = ?");
        values.push(filters.status);
      }
      if (filters?.date_from) {
        auditConditions.push("audit_start_date >= ?");
        values.push(filters.date_from);
      }
      if (filters?.date_to) {
        auditConditions.push("audit_start_date <= ?");
        values.push(filters.date_to);
      }

      const auditWhere =
        auditConditions.length > 0
          ? `AND ${auditConditions.join(" AND ")}`
          : "";

      // Audit statistics
      const auditStats = await query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total_ytd,
          SUM(CASE WHEN next_due_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as upcoming_30days,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN next_due_date < ? AND status NOT IN ('Completed', 'Closed') THEN 1 ELSE 0 END) as overdue
        FROM audits
        WHERE audit_start_date >= ? ${auditWhere}`,
        [today, next30Days, today, ytdStart, ...values],
      );

      // Finding statistics
      const findingConditions =
        auditConditions.length > 0
          ? `WHERE audit_id IN (SELECT id FROM audits WHERE ${auditConditions.join(" AND ")})`
          : "";

      const findingStats = await query<RowDataPacket[]>(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN status = 'Closed' AND MONTH(closure_date) = MONTH(?) AND YEAR(closure_date) = YEAR(?) THEN 1 ELSE 0 END) as closed_this_month
        FROM findings
        ${findingConditions}`,
        auditConditions.length > 0 ? [...values, today, today] : [today, today],
      );

      return {
        success: true,
        data: {
          audits: auditStats[0],
          findings: findingStats[0],
        },
      };
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return {
        success: false,
        error: "Failed to fetch dashboard statistics",
      };
    }
  }

  /**
   * Get chart data
   */
  static async getChartData(filters?: DashboardFilters) {
    try {
      // Build filter conditions
      const auditConditions: string[] = [];
      const values: any[] = [];

      if (filters?.vessel_id) {
        auditConditions.push("vessel_id = ?");
        values.push(filters.vessel_id);
      }
      if (filters?.audit_type_id) {
        auditConditions.push("audit_type_id = ?");
        values.push(filters.audit_type_id);
      }
      if (filters?.audit_party_id) {
        auditConditions.push("audit_party_id = ?");
        values.push(filters.audit_party_id);
      }
      if (filters?.date_from) {
        auditConditions.push("audit_start_date >= ?");
        values.push(filters.date_from);
      }
      if (filters?.date_to) {
        auditConditions.push("audit_start_date <= ?");
        values.push(filters.date_to);
      }

      const auditWhere =
        auditConditions.length > 0
          ? `WHERE ${auditConditions.join(" AND ")}`
          : "";

      // Monthly audit trend (last 12 months)
      const monthlyTrend = await query<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(audit_start_date, '%Y-%m') as month,
          COUNT(*) as count
        FROM audits
        ${auditWhere}
        ${auditConditions.length > 0 ? "AND" : "WHERE"} audit_start_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(audit_start_date, '%Y-%m')
        ORDER BY month`,
        values,
      );

      // Findings by category
      const findingConditions =
        auditConditions.length > 0
          ? `WHERE audit_id IN (SELECT id FROM audits WHERE ${auditConditions.join(" AND ")})`
          : "";

      const findingsByCategory = await query<RowDataPacket[]>(
        `SELECT
          category,
          COUNT(*) as count
        FROM findings
        ${findingConditions}
        GROUP BY category`,
        auditConditions.length > 0 ? values : [],
      );

      // Audits by party type
      const auditsByParty = await query<RowDataPacket[]>(
        `SELECT
          ap.party_name,
          COUNT(*) as count
        FROM audits a
        LEFT JOIN audit_parties ap ON a.audit_party_id = ap.id
        ${auditWhere}
        GROUP BY ap.party_name`,
        values,
      );

      return {
        success: true,
        data: {
          monthly_audit_trend: monthlyTrend,
          findings_by_category: findingsByCategory,
          audits_by_party: auditsByParty,
        },
      };
    } catch (error) {
      console.error("Get chart data error:", error);
      return {
        success: false,
        error: "Failed to fetch chart data",
      };
    }
  }

  /**
   * Get findings trend data for comparison
   */
  static async getFindingsTrend(filters?: DashboardFilters) {
    try {
      // Build filter conditions for audits
      const auditConditions: string[] = [];
      const values: any[] = [];

      if (filters?.vessel_id) {
        auditConditions.push("a.vessel_id = ?");
        values.push(filters.vessel_id);
      }
      if (filters?.audit_type_id) {
        auditConditions.push("a.audit_type_id = ?");
        values.push(filters.audit_type_id);
      }

      const auditWhere =
        auditConditions.length > 0
          ? `AND ${auditConditions.join(" AND ")}`
          : "";

      // Get findings trend over the last 12 months, grouped by audit
      const findingsTrend = await query<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(a.audit_start_date, '%Y-%m') as month,
          v.vessel_name,
          at.type_name,
          COUNT(f.id) as finding_count
        FROM audits a
        LEFT JOIN vessels v ON a.vessel_id = v.id
        LEFT JOIN audit_types at ON a.audit_type_id = at.id
        LEFT JOIN findings f ON a.id = f.audit_id
        WHERE a.audit_start_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${auditWhere}
        GROUP BY DATE_FORMAT(a.audit_start_date, '%Y-%m'), v.vessel_name, at.type_name
        ORDER BY month`,
        values,
      );

      // Get total findings per month for overall trend
      const monthlyTotals = await query<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(a.audit_start_date, '%Y-%m') as month,
          COUNT(f.id) as total_findings
        FROM audits a
        LEFT JOIN findings f ON a.id = f.audit_id
        WHERE a.audit_start_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${auditWhere}
        GROUP BY DATE_FORMAT(a.audit_start_date, '%Y-%m')
        ORDER BY month`,
        values,
      );

      return {
        success: true,
        data: {
          findings_trend: findingsTrend,
          monthly_totals: monthlyTotals,
        },
      };
    } catch (error) {
      console.error("Get findings trend error:", error);
      return {
        success: false,
        error: "Failed to fetch findings trend data",
      };
    }
  }
}
