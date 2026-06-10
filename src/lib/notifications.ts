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

export async function notificaEnatoAi(
  invitati: Array<{ email: string; nome: string; posizione: number; punteggio: number }>,
  nomeBimbo: string | null,
  isFemmina: boolean,
  codiceCondivisione: string,
): Promise<void> {
  const nome = nomeBimbo ?? (isFemmina ? "la piccola" : "il piccolo");
  const titolo = isFemmina ? `${nome} è nata! 🩷` : `${nome} è nato! 💙`;
  const classificaUrl = `https://fantaparto.com/vota/${codiceCondivisione}`;

  await Promise.allSettled(
    invitati.map(({ email, nome: nomeInvitato, posizione, punteggio }) => {
      const subject = `🎉 ${titolo} — Ecco il tuo punteggio nel FantaParto`;
      const medaglia = posizione === 1 ? "🥇" : posizione === 2 ? "🥈" : posizione === 3 ? "🥉" : `#${posizione}`;
      const html = `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; font-size: 56px; margin-bottom: 16px;">${isFemmina ? "🩷" : "💙"}</div>
          <h1 style="font-size: 24px; color: #1a1a2e; text-align: center; margin: 0 0 8px;">
            ${titolo}
          </h1>
          <p style="color: #5a4e50; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
            Ciao <strong>${nomeInvitato}</strong>! ${nome} è arrivat${isFemmina ? "a" : "o"} e la classifica è pronta.
          </p>
          <div style="background: #fbf9f5; border: 1px solid #f0e8e6; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 36px; margin: 0 0 4px;">${medaglia}</p>
            <p style="font-size: 28px; font-weight: 800; color: #874e58; margin: 0 0 4px;">${punteggio} pt</p>
            <p style="font-size: 14px; color: #a89a9b; margin: 0;">Posizione ${posizione} in classifica</p>
          </div>
          <a href="${classificaUrl}"
             style="display: block; background: #874e58; color: #fff; font-weight: 700;
                    font-size: 15px; text-decoration: none; padding: 14px 28px; text-align: center;
                    border-radius: 999px; margin-bottom: 16px;">
            Vedi la classifica completa →
          </a>
          <a href="https://fantaparto.com"
             style="display: block; color: #874e58; font-weight: 600; font-size: 13px;
                    text-decoration: none; text-align: center; margin-bottom: 32px;">
            Crea il tuo FantaParto gratis →
          </a>
          <hr style="border: none; border-top: 1px solid #f0e8e6; margin: 0 0 16px;" />
          <p style="font-size: 12px; color: #a89a9b; text-align: center; margin: 0;">
            FantaParto · La Gioiosa Attesa
          </p>
        </div>
      `;
      return sendEmail(email, subject, html);
    }),
  );
}

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
      <a href="https://fantaparto.com/dashboard/upgrade"
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
