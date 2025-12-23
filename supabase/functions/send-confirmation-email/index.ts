import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCORS, createResponse, createErrorResponse } from "../_shared/utils.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
    email: string;
    fullName: string;
    isWaitlist: boolean;
    accessToken?: string;
    waitlistPosition?: number;
}

serve(async (req: Request) => {
    const corsResponse = handleCORS(req);
    if (corsResponse) return corsResponse;

    try {
        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY not configured");
            return createErrorResponse("Email service not configured", 500);
        }

        const { email, fullName, isWaitlist, accessToken, waitlistPosition }: EmailRequest = await req.json();

        if (!email || !fullName) {
            return createErrorResponse("Email and Full Name are required", 400);
        }

        const subject = isWaitlist
            ? "You're on the JengaHacks 2026 Waitlist!"
            : "Registration Confirmed - JengaHacks 2026";

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #eee; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          .button { display: inline-block; padding: 12px 24px; background: #65bb3a; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .highlight { color: #65bb3a; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JENGA<span style="color: #65bb3a">HACKS</span> 2026</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            ${isWaitlist
                ? `<p>Thanks for your interest in JengaHacks 2026. We've added you to our waitlist.</p>
                 <p>Your current position is: <span class="highlight">#${waitlistPosition}</span></p>
                 <p>We'll notify you as soon as a spot becomes available!</p>`
                : `<p>Your registration for JengaHacks 2026 is confirmed! We're excited to have you join us at the Silicon Savannah for 48 hours of innovation.</p>
                 <p><strong>Event Dates:</strong> January 23-25, 2026</p>
                 <p><strong>Location:</strong> Nairobi, Kenya</p>`
            }
            
            ${accessToken ? `
              <p>You can manage your registration using your unique access token:</p>
              <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; font-family: monospace;">${accessToken}</p>
            ` : ''}

            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Happy Hacking,<br>The JengaHacks Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 JengaHacks. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "JengaHacks <hello@jengahacks.com>",
                to: [email],
                subject: subject,
                html: htmlContent,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("Resend API error:", errorData);
            return createErrorResponse("Failed to send email", 500);
        }

        return createResponse({ success: true });
    } catch (error) {
        console.error("Internal error:", error);
        return createErrorResponse(error instanceof Error ? error.message : "Unknown error", 500);
    }
});
