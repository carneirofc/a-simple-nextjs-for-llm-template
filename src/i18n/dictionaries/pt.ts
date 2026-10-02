import type { Dictionary } from "./en";

export const pt: Dictionary = {
  metadata: {
    title: "Modelo Next.js para LLM",
    description: "Modelo mínimo de Next.js",
  },
  home: {
    hello: "Olá.",
  },
  notes: {
    heading: "Notas",
    form: {
      title: "Título",
      placeholder: "Nova nota",
      add: "Adicionar",
    },
    table: {
      empty: "Nenhuma nota ainda.",
      title: "Título",
      created: "Criada em",
    },
  },
  validation: {
    required: "Este campo é obrigatório",
    tooLong: "Este texto é longo demais",
  },
  errors: {
    title: "Algo deu errado",
    unexpected: "Ocorreu um erro inesperado.",
    reference: "Referência do erro: {digest}",
    retry: "Tentar novamente",
  },
  notFound: {
    title: "Página não encontrada",
    home: "Ir para o início",
  },
  localeSwitcher: {
    label: "Idioma",
  },
};
