export interface NuovoEventoFormData {
  nomeFeto: string;
  dpp: string; // "YYYY-MM-DD"
  nomeMamma: string;
  metriche: {
    sesso: boolean;
    data: boolean;
    peso: boolean;
    ora: boolean;
    lunghezza: boolean;
    capelli: boolean;
    occhi: boolean;
  };
  messaggioBenvenuto: string;
}

export const initialFormData: NuovoEventoFormData = {
  nomeFeto: "",
  dpp: "",
  nomeMamma: "",
  metriche: {
    sesso: true,
    data: true,
    peso: true,
    ora: false,
    lunghezza: false,
    capelli: false,
    occhi: false,
  },
  messaggioBenvenuto: "",
};
