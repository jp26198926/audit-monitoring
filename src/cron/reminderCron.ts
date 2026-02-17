#!/usr/bin/env node

/**
 * Reminder Cron Job for Audit Monitoring System
 *
 * This script runs daily to:
 * 1. Send upcoming audit reminders (30 days before due)
 * 2. Send finding due reminders (7 days before target date)
 * 3. Send overdue finding alerts
 * 4. Update overdue finding statuses
 *
 * To run: node src/cron/reminderCron.js
 * Or add to package.json: npm run cron
 *
 * For production, setup as cron job:
 * 0 8 * * * cd /path/to/audit-monitoring && npm run cron
 */

import { query } from "../lib/db";
import {
  sendUpcomingAuditReminder,
  sendFindingDueReminder,
  sendOverdueFindingAlert,
} from "../lib/email";
import { FindingController } from "../controllers/finding.controller";
import { formatDate, daysBetween } from "../utils/helpers";
import { RowDataPacket } from "mysql2";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@auditmonitor.com";

/**
 * Send upcoming audit reminders
 */
async function sendUpcomingAuditReminders() {
  console.log("Checking for upcoming audits...");

  try {
    const today = formatDate(new Date());
    const next30Days = formatDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    // Find audits due in next 30 days
    const audits = await query<RowDataPacket[]>(
      `SELECT 
        a.id,
        a.audit_reference,
        a.next_due_date,
        v.vessel_name,
        at.type_name as audit_type_name
      FROM audits a
      LEFT JOIN vessels v ON a.vessel_id = v.id
      LEFT JOIN audit_types at ON a.audit_type_id = at.id
      WHERE a.next_due_date BETWEEN ? AND ?
      AND a.status NOT IN ('Completed', 'Closed')`,
      [today, next30Days],
    );

    console.log(`Found ${audits.length} upcoming audits`);

    for (const audit of audits) {
      const daysRemaining = daysBetween(today, audit.next_due_date);

      await sendUpcomingAuditReminder(ADMIN_EMAIL, {
        auditReference: audit.audit_reference,
        vesselName: audit.vessel_name,
        auditType: audit.audit_type_name,
        nextDueDate: formatDate(audit.next_due_date),
        daysRemaining,
      });

      console.log(
        `✓ Sent upcoming audit reminder for: ${audit.audit_reference}`,
      );
    }
  } catch (error) {
    console.error("Error sending upcoming audit reminders:", error);
  }
}

/**
 * Send finding due reminders (7 days before)
 */
async function sendFindingDueReminders() {
  console.log("Checking for findings due soon...");

  try {
    const today = formatDate(new Date());
    const in7Days = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    // Find findings due in 7 days
    const findings = await query<RowDataPacket[]>(
      `SELECT 
        f.id,
        f.category,
        f.description,
        f.target_date,
        f.responsible_person,
        a.audit_reference,
        u.email as encoder_email
      FROM findings f
      LEFT JOIN audits a ON f.audit_id = a.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE f.target_date = ?
      AND f.status NOT IN ('Closed', 'Overdue')
      AND u.role IN ('Encoder', 'Admin')`,
      [in7Days],
    );

    console.log(`Found ${findings.length} findings due in 7 days`);

    for (const finding of findings) {
      const daysRemaining = 7;

      // Send to encoder who created the audit
      if (finding.encoder_email) {
        await sendFindingDueReminder(finding.encoder_email, {
          findingId: finding.id,
          auditReference: finding.audit_reference,
          category: finding.category,
          description: finding.description.substring(0, 100) + "...",
          targetDate: formatDate(finding.target_date),
          responsiblePerson: finding.responsible_person || "Not assigned",
          daysRemaining,
        });

        console.log(`✓ Sent finding due reminder for Finding #${finding.id}`);
      }
    }
  } catch (error) {
    console.error("Error sending finding due reminders:", error);
  }
}

/**
 * Send overdue finding alerts
 */
async function sendOverdueFindingAlerts() {
  console.log("Checking for overdue findings...");

  try {
    const today = formatDate(new Date());

    // Find overdue findings
    const findings = await query<RowDataPacket[]>(
      `SELECT 
        f.id,
        f.category,
        f.description,
        f.target_date,
        f.responsible_person,
        a.audit_reference
      FROM findings f
      LEFT JOIN audits a ON f.audit_id = a.id
      WHERE f.target_date < ?
      AND f.status != 'Closed'
      AND f.status = 'Overdue'`,
      [today],
    );

    console.log(`Found ${findings.length} overdue findings`);

    for (const finding of findings) {
      const daysOverdue = Math.abs(daysBetween(finding.target_date, today));

      await sendOverdueFindingAlert(ADMIN_EMAIL, {
        findingId: finding.id,
        auditReference: finding.audit_reference,
        category: finding.category,
        description: finding.description.substring(0, 100) + "...",
        targetDate: formatDate(finding.target_date),
        responsiblePerson: finding.responsible_person || "Not assigned",
        daysOverdue,
      });

      console.log(`✓ Sent overdue finding alert for Finding #${finding.id}`);
    }
  } catch (error) {
    console.error("Error sending overdue finding alerts:", error);
  }
}

/**
 * Update overdue finding statuses
 */
async function updateOverdueFindings() {
  console.log("Updating overdue finding statuses...");

  try {
    const result = await FindingController.updateOverdueFindings();

    if (result.success) {
      console.log(
        `✓ Updated ${result.data?.updatedCount || 0} findings to overdue status`,
      );
    } else {
      console.error("Failed to update overdue findings:", result.error);
    }
  } catch (error) {
    console.error("Error updating overdue findings:", error);
  }
}

/**
 * Main cron job execution
 */
async function runCronJob() {
  console.log("===========================================");
  console.log("Audit Monitoring System - Reminder Cron Job");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("===========================================\n");

  try {
    // Update overdue findings first
    await updateOverdueFindings();
    console.log("");

    // Send reminders
    await sendUpcomingAuditReminders();
    console.log("");

    await sendFindingDueReminders();
    console.log("");

    await sendOverdueFindingAlerts();
    console.log("");

    console.log("===========================================");
    console.log("✓ Cron job completed successfully");
    console.log(`Finished at: ${new Date().toISOString()}`);
    console.log("===========================================");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Cron job failed:", error);
    process.exit(1);
  }
}

// Run the cron job
runCronJob();
