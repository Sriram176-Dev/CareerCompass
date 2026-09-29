import nodemailer from "nodemailer";

// Creates a transporter based on env config.
// Supports: Gmail (SMTP_SERVICE=gmail), any SMTP, or falls back to console log in dev.
function createTransporter() {
  const { SMTP_SERVICE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    // No email configured — use ethereal (dev catch-all) or console
    return null;
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE, // e.g. "gmail"
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(toEmail, resetToken) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  const transporter = createTransporter();

  if (!transporter) {
    // Dev mode: print to console
    console.log("\n──────────────────────────────────────────────────");
    console.log("[DEV] Password reset requested for:", toEmail);
    console.log("[DEV] Reset URL:", resetUrl);
    console.log("──────────────────────────────────────────────────\n");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"AI Career Compass" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Reset your AI Career Compass password",
      text: `You requested a password reset.\n\nClick the link below to reset your password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f9eff;">Reset your password</h2>
          <p>You requested a password reset for your AI Career Compass account.</p>
          <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #4f9eff; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">AI Career Compass — Career Guidance for Indian Students</p>
        </div>
      `,
    });
  } catch (error) {
    if (error.responseCode === 535) {
      console.log("\n❌ SMTP LOGIN FAILED: Your Gmail password/app password was REJECTED.");
      console.log("👉 Printing password reset link to console as fallback:\n");
    } else {
      console.error("❌ Email failed to send due to unknown error:", error);
    }
    
    // Fallback: print to console anyway
    console.log("\n──────────────────────────────────────────────────");
    console.log("[FALLBACK] Password Reset URL:", resetUrl);
    console.log("──────────────────────────────────────────────────\n");
    
    // Specifically throw a custom "SMTP_FAILED" error so auth.js knows
    // it was a mail failure, not a critical server crash
    error.isEmailSendError = true;
    throw error;
  }
}

