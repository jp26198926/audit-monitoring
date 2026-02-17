import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        "Audit Monitoring System <noreply@auditmonitor.com>",
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Send upcoming audit reminder
 */
export async function sendUpcomingAuditReminder(
  adminEmail: string,
  auditDetails: {
    auditReference: string;
    vesselName: string;
    auditType: string;
    nextDueDate: string;
    daysRemaining: number;
  },
): Promise<void> {
  const html = `
    <h2>Upcoming Audit Reminder</h2>
    <p>An audit is due within the next 30 days.</p>
    <h3>Audit Details:</h3>
    <ul>
      <li><strong>Audit Reference:</strong> ${auditDetails.auditReference}</li>
      <li><strong>Vessel:</strong> ${auditDetails.vesselName}</li>
      <li><strong>Audit Type:</strong> ${auditDetails.auditType}</li>
      <li><strong>Next Due Date:</strong> ${auditDetails.nextDueDate}</li>
      <li><strong>Days Remaining:</strong> ${auditDetails.daysRemaining}</li>
    </ul>
    <p>Please ensure necessary preparations are made.</p>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `Upcoming Audit: ${auditDetails.auditReference}`,
    html,
  });
}

/**
 * Send finding due reminder (7 days before)
 */
export async function sendFindingDueReminder(
  encoderEmail: string,
  findingDetails: {
    findingId: number;
    auditReference: string;
    category: string;
    description: string;
    targetDate: string;
    responsiblePerson: string;
    daysRemaining: number;
  },
): Promise<void> {
  const html = `
    <h2>Finding Due Reminder</h2>
    <p>A finding is due within 7 days.</p>
    <h3>Finding Details:</h3>
    <ul>
      <li><strong>Finding ID:</strong> #${findingDetails.findingId}</li>
      <li><strong>Audit Reference:</strong> ${findingDetails.auditReference}</li>
      <li><strong>Category:</strong> ${findingDetails.category}</li>
      <li><strong>Description:</strong> ${findingDetails.description}</li>
      <li><strong>Responsible Person:</strong> ${findingDetails.responsiblePerson}</li>
      <li><strong>Target Date:</strong> ${findingDetails.targetDate}</li>
      <li><strong>Days Remaining:</strong> ${findingDetails.daysRemaining}</li>
    </ul>
    <p>Please ensure the corrective action is completed on time.</p>
  `;

  await sendEmail({
    to: encoderEmail,
    subject: `Finding Due Reminder: #${findingDetails.findingId}`,
    html,
  });
}

/**
 * Send overdue finding alert
 */
export async function sendOverdueFindingAlert(
  adminEmail: string,
  findingDetails: {
    findingId: number;
    auditReference: string;
    category: string;
    description: string;
    targetDate: string;
    responsiblePerson: string;
    daysOverdue: number;
  },
): Promise<void> {
  const html = `
    <h2>⚠️ Overdue Finding Alert</h2>
    <p style="color: red;"><strong>A finding is overdue and requires immediate attention.</strong></p>
    <h3>Finding Details:</h3>
    <ul>
      <li><strong>Finding ID:</strong> #${findingDetails.findingId}</li>
      <li><strong>Audit Reference:</strong> ${findingDetails.auditReference}</li>
      <li><strong>Category:</strong> ${findingDetails.category}</li>
      <li><strong>Description:</strong> ${findingDetails.description}</li>
      <li><strong>Responsible Person:</strong> ${findingDetails.responsiblePerson}</li>
      <li><strong>Target Date:</strong> ${findingDetails.targetDate}</li>
      <li><strong>Days Overdue:</strong> ${findingDetails.daysOverdue}</li>
    </ul>
    <p>Please take immediate action to close this finding.</p>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `⚠️ Overdue Finding: #${findingDetails.findingId}`,
    html,
  });
}
