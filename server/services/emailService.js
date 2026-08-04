import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.ACS_CONNECTION_STRING;
const senderEmail = process.env.ACS_SENDER_EMAIL;
let client = null;

if (connectionString) {
  try {
    client = new EmailClient(connectionString);
  } catch (err) {
    console.error("Failed to initialize ACS EmailClient:", err.message);
  }
}

export function isEmailConfigured() {
  return !!(client && senderEmail);
}

export async function sendEmail({ to, subject, html }) {
  if (!client || !senderEmail) {
    return { sent: false, reason: "ACS not configured" };
  }
  try {
    const poller = await client.beginSend({
      senderAddress: senderEmail,
      recipients: { to: [{ address: to }] },
      content: { subject, htmlContent: html },
    });
    const result = await poller.pollUntilDone();
    return { sent: true, messageId: result.id };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendInviteEmail({ toEmail, toName, tempPassword, companyName, invitedByName }) {
  if (!client || !senderEmail) {
    return { sent: false, reason: "ACS not configured" };
  }

  const subject = `You've been invited to ${companyName || "Oriveo"}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="font-size: 20px; margin-bottom: 4px;">Welcome to ${companyName || "Oriveo"}</h2>
    <p style="color: #6b7280; margin-top: 0;">Your account has been created</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p>Hi ${toName},</p>
    <p>${invitedByName || "An admin"} has invited you to join <strong>${companyName || "Oriveo"}</strong>.</p>
    <p>Use the temporary password below to sign in:</p>
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; font-size: 18px; font-weight: 600; letter-spacing: 1px; font-family: 'SFMono-Regular', Consolas, monospace;">${tempPassword}</div>
    <p style="color: #6b7280; font-size: 14px;">You'll be prompted to change your password after first login.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">If you didn't expect this invite, you can ignore this email.</p>
  </div>
</body>
</html>`;

  try {
    const poller = await client.beginSend({
      senderAddress: senderEmail,
      recipients: { to: [{ address: toEmail, displayName: toName }] },
      content: { subject, htmlContent },
    });
    const result = await poller.pollUntilDone();
    return { sent: true, messageId: result.id };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendPasswordResetEmail({ toEmail, toName, resetUrl, companyName }) {
  if (!client || !senderEmail) {
    return { sent: false, reason: "ACS not configured" };
  }

  const subject = `Reset your ${companyName || "Oriveo"} password`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="font-size: 20px; margin-bottom: 4px;">Reset your password</h2>
    <p style="color: #6b7280; margin-top: 0;">${companyName || "Oriveo"}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p>Hi ${toName || "there"},</p>
    <p>We received a request to reset your password. Click the button below to set a new one:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${resetUrl}</p>
  </div>
</body>
</html>`;

  try {
    const poller = await client.beginSend({
      senderAddress: senderEmail,
      recipients: { to: [{ address: toEmail, displayName: toName }] },
      content: { subject, htmlContent },
    });
    const result = await poller.pollUntilDone();
    return { sent: true, messageId: result.id };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendFamilyLinkEmail({ toEmail, toName, patientName, familyLink, companyName }) {
  if (!client || !senderEmail) {
    return { sent: false, reason: "ACS not configured" };
  }

  const subject = `${patientName}'s care — Family link from ${companyName || "Oriveo"}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="font-size: 20px; margin-bottom: 4px;">Home care updates for ${patientName}</h2>
    <p style="color: #6b7280; margin-top: 0;">${companyName || "Oriveo"}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p>Hi ${toName || "there"},</p>
    <p>Your family member <strong>${patientName}</strong> has an active home care plan. Click below to view their care plan, medications, tasks and recent visits:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${familyLink}" style="background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View ${patientName}'s care</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link is valid for 30 days and shows read-only information for ${patientName} only.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${familyLink}</p>
  </div>
</body>
</html>`;

  try {
    const poller = await client.beginSend({
      senderAddress: senderEmail,
      recipients: { to: [{ address: toEmail, displayName: toName }] },
      content: { subject, htmlContent },
    });
    const result = await poller.pollUntilDone();
    return { sent: true, messageId: result.id };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendVerificationEmail({ toEmail, toName, verifyUrl, companyName }) {
  if (!client || !senderEmail) {
    return { sent: false, reason: "ACS not configured" };
  }

  const subject = `Verify your ${companyName || "Oriveo"} email`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="font-size: 20px; margin-bottom: 4px;">Verify your email address</h2>
    <p style="color: #6b7280; margin-top: 0;">${companyName || "Oriveo"}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p>Hi ${toName || "there"},</p>
    <p>Thanks for signing up. Please verify your email address to get started:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verifyUrl}" style="background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Verify Email</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${verifyUrl}</p>
  </div>
</body>
</html>`;

  try {
    const poller = await client.beginSend({
      senderAddress: senderEmail,
      recipients: { to: [{ address: toEmail, displayName: toName }] },
      content: { subject, htmlContent },
    });
    const result = await poller.pollUntilDone();
    return { sent: true, messageId: result.id };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}
