import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

type NotificationData = {
  student_name: string;
  student_email: string;
  topic: string | null;
  scheduled_date: string;
  scheduled_time: string;
  mode: string;
};

export async function sendBookingNotification(data: NotificationData) {
  try {
    await resend.emails.send({
      from: "Monitorías <onboarding@resend.dev>",
      to: data.student_email,
      subject: "Solicitud de Monitoría Recibida",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Solicitud de Monitoría</h2>
          <p>Hola <strong>${data.student_name}</strong>,</p>
          <p>Hemos recibido tu solicitud de monitoría. Pronto recibirás la confirmación.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Tema</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.topic || "General"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.scheduled_date}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.scheduled_time}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Modalidad</td><td style="padding: 8px;">${data.mode === "virtual" ? "Virtual" : "Presencial"}</td></tr>
          </table>
          <p style="color: #666;">Atentamente,<br/>Jose Gilberto Soler Callejas</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

export async function sendConfirmationNotification(data: NotificationData) {
  try {
    await resend.emails.send({
      from: "Monitorías <onboarding@resend.dev>",
      to: data.student_email,
      subject: "Monitoría Confirmada",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #16a34a;">¡Monitoría Confirmada!</h2>
          <p>Hola <strong>${data.student_name}</strong>,</p>
          <p>Tu solicitud de monitoría ha sido <strong style="color: #16a34a;">confirmada</strong>. Te esperamos en la siguiente cita:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Tema</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.topic || "General"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.scheduled_date}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.scheduled_time}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Modalidad</td><td style="padding: 8px;">${data.mode === "virtual" ? "Virtual" : "Presencial"}</td></tr>
          </table>
          <p style="color: #666;">Atentamente,<br/>Jose Gilberto Soler Callejas</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}
