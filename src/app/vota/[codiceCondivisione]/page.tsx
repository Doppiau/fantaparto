interface Props {
  params: { codiceCondivisione: string };
}

export default function VotaPage({ params }: Props) {
  return (
    <main>
      <h1>Esprimi il tuo pronostico!</h1>
      <p>Evento: {params.codiceCondivisione}</p>
      {/* TODO: form di voto — Fase 4 */}
    </main>
  );
}
