import { z } from "zod";

// Valori ammessi per i campi a scelta fissa.
// Gestiti come String nel DB (non enum Prisma) per flessibilità futura.
const SESSO_VALUES    = ["MASCHIO", "FEMMINA"] as const;
const CAPELLI_VALUES  = ["LISCI", "RICCI", "CALVO"] as const;
const OCCHI_VALUES    = ["CHIARI", "SCURI"] as const;

// ============================================================
// PredictionInputSchema
// Valida i dati in entrata dalla pagina /vota/[codiceCondivisione]
// Nota Zod v4: required_error/invalid_type_error/errorMap rimossi —
//              si usa `error` come stringa o funzione.
// ============================================================

export const PredictionInputSchema = z.object({
  // Dati invitato
  nomeInvitato: z
    .string()
    .trim()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(80, "Il nome non può superare 80 caratteri"),

  emailInvitato: z
    .string()
    .trim()
    .email("Formato email non valido")
    .optional()
    .or(z.literal("")),

  messaggioAugurio: z
    .string()
    .trim()
    .max(500, "Il messaggio non può superare 500 caratteri")
    .optional(),

  // Obbligatorio per anti-bypass
  deviceFingerprint: z
    .string()
    .min(1, "deviceFingerprint non può essere vuoto"),

  // Pronostici
  votoSesso: z
    .enum(SESSO_VALUES, { error: "Sesso non valido: usa MASCHIO o FEMMINA" })
    .optional(),

  votoData: z.coerce.date().optional(),

  votoPeso: z
    .number()
    .int("Il peso deve essere un numero intero")
    .min(1000, "Il peso minimo è 1000g")
    .max(6000, "Il peso massimo è 6000g")
    .optional(),

  votoLunghezza: z
    .number()
    .int("La lunghezza deve essere un numero intero")
    .min(300, "La lunghezza minima è 300mm (30cm)")
    .max(700, "La lunghezza massima è 700mm (70cm)")
    .optional(),

  votoOra: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato ora non valido (HH:MM)")
    .optional(),

  votoCapelli: z
    .enum(CAPELLI_VALUES, { error: "Valore capelli non valido" })
    .optional(),

  votoOcchi: z
    .enum(OCCHI_VALUES, { error: "Valore occhi non valido" })
    .optional(),

  votoCustomAnswers: z.record(z.string(), z.unknown()).optional(),
});

export type PredictionInput = z.infer<typeof PredictionInputSchema>;

// ============================================================
// CreateEventSchema
// Valida i dati in entrata per la creazione di un nuovo evento
// ============================================================

export const CreateEventSchema = z.object({
  nomeBimbo: z
    .string()
    .trim()
    .max(50, "Il nome non può superare 50 caratteri")
    .optional(),

  dataPresuntaParto: z.coerce.date(),

  isPremium: z.boolean().default(false),

  sessoAttivo:     z.boolean().default(true),
  dataAttiva:      z.boolean().default(true),
  pesoAttivo:      z.boolean().default(true),
  lunghezzaAttiva: z.boolean().default(true),
  oraAttiva:       z.boolean().default(true),
  capelliAttivo:   z.boolean().default(true),
  occhiAttivo:     z.boolean().default(true),

  customQuestions: z
    .array(
      z.object({
        id:      z.string().min(1),
        domanda: z.string().min(3).max(200),
        tipo:    z.enum(["testo", "scelta"]),
        opzioni: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

// ============================================================
// RealResultsSchema
// Valida i risultati reali inseriti dalla mamma post-parto
// ============================================================

export const RealResultsSchema = z.object({
  realeSesso:         z.enum(SESSO_VALUES).optional(),
  realeData:          z.coerce.date().optional(),
  realePeso:          z.number().int().min(500).max(8000).optional(),
  realeLunghezza:     z.number().int().min(200).max(800).optional(),
  realeOra:           z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  realeCapelli:       z.enum(CAPELLI_VALUES).optional(),
  realeOcchi:         z.enum(OCCHI_VALUES).optional(),
  realeCustomAnswers: z.record(z.string(), z.unknown()).optional(),
});

export type RealResultsInput = z.infer<typeof RealResultsSchema>;
