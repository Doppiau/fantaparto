// ── Notifiche email ────────────────────────────────────────────────────────────
// Stub pronto per essere collegato a Resend, SendGrid o Supabase Edge Functions.
// Per attivare l'invio reale: sostituire il corpo di sendEmail con la chiamata
// all'API del provider scelto usando la variabile RESEND_API_KEY (o equivalente).

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email stub] To: ${to} | Subject: ${subject}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      from:    "FantaParto <noreply@fantaparto.com>",
      to:      [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[email] Errore invio a ${to}: ${err}`);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function notificaLimiteRaggiunto(
  emailGenitore: string,
  nomeBimbo: string | null,
): Promise<void> {
  const nome = nomeBimbo ? `Baby ${nomeBimbo}` : "il tuo FantaParto";
  const subject = `🎉 ${nome} ha raggiunto 20 partecipanti!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 24px; color: #1a1a2e; margin-bottom: 8px;">
        Il tuo evento è pieno! 🎊
      </h1>
      <p style="color: #5a4e50; font-size: 15px; line-height: 1.6;">
        <strong>${nome}</strong> ha raggiunto il limite di <strong>20 partecipanti</strong>
        del piano gratuito. Nuovi invitati non potranno più votare.
      </p>
      <p style="color: #5a4e50; font-size: 15px; line-height: 1.6;">
        Passa a <strong>Premium</strong> per sbloccare partecipanti illimitati, metriche
        avanzate e il PDF ricordo con grafica premium.
      </p>
      <a href="https://fantaparto.com/dashboard/profilo"
         style="display: inline-block; background: #874e58; color: #fff; font-weight: 700;
                font-size: 15px; text-decoration: none; padding: 14px 28px;
                border-radius: 999px; margin-top: 16px;">
        Sblocca Premium →
      </a>
      <hr style="border: none; border-top: 1px solid #f0e8e6; margin: 32px 0;" />
      <p style="font-size: 12px; color: #a89a9b;">
        FantaParto · La Gioiosa Attesa
      </p>
    </div>
  `;

  await sendEmail(emailGenitore, subject, html);
}
