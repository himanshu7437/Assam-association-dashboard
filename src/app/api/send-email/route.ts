import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { userEmail, userName, facility, date, status } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Simulating email dispatch.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const subject = status === 'approved' 
      ? `Booking Confirmed: ${facility}`
      : `Booking Update: ${facility}`;

    const message = status === 'approved'
      ? `Dear ${userName},\n\nYour booking request for ${facility} on ${date} has been APPROVED.\n\nThank you for choosing Assam Association.`
      : `Dear ${userName},\n\nYour booking request for ${facility} on ${date} has been REJECTED.\n\nPlease contact our administrative office for more details.`;

    // Resend's default onboarding testing email
    const data = await resend.emails.send({
      from: "Assam Association Delhi <info@assamassociationdelhi.org>",
      to: [userEmail || "test@example.com"],
      subject: subject,
      text: message,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
