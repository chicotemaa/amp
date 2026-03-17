type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AGENDA_NOTIFICATIONS_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      "Missing email environment variables. Ensure RESEND_API_KEY and AGENDA_NOTIFICATIONS_FROM_EMAIL are set."
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Email provider rejected the request.");
  }

  return response.json();
}
