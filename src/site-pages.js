// Fonte única de verdade das páginas reais do site — usada pelo ReviewWidget
// (checklist "todas as páginas") e por revisao-admin.html. Mantenha em sincronia
// com a lista `pages` de vite.config.js (index-legado.html não entra: não é
// página publicada, é só referência da home anterior).
export const SITE_PAGES = [
  { slug: "index", title: "Home — Geriatra em Belo Horizonte" },
  { slug: "geriatra-bh", title: "Geriatra em BH: Acompanhamento Contínuo" },
  { slug: "mais60-essencial-plano-particular-idoso", title: "Mais60 Essencial (Plano Particular)" },
  { slug: "fonoaudiologia-idosos-bh", title: "Fonoaudiologia para Idosos" },
  { slug: "reabilitacao-idosos-bh", title: "Reabilitação para Idosos" },
  { slug: "cuidados-medicos-idosos-bh", title: "Cuidados Médicos para Idosos" },
  { slug: "atividades-bem-estar-idosos-bh", title: "Atividades e Bem-estar" },
  { slug: "urgencia-idosos-24h-bh", title: "Urgência 24h para Idosos" },
  { slug: "medico-referencia-idosos-bh", title: "Médico de Referência" },
  { slug: "fisioterapia-idosos-bh", title: "Fisioterapia para Idosos" },
  { slug: "nutricionista-idosos-bh", title: "Nutricionista para Idosos" },
  { slug: "psicologo-idosos-bh", title: "Psicólogo para Idosos" },
  { slug: "educacao-fisica-idosos-bh", title: "Educação Física para Idosos" },
  { slug: "terapeuta-ocupacional-idosos-bh", title: "Terapeuta Ocupacional" },
  { slug: "enfermeiro-navegador-cuidado-coordenado", title: "Enfermeiro Navegador" },
  { slug: "farmaceutico-clinico-idosos-bh", title: "Farmacêutico Clínico" },
  { slug: "pronto-cuidar-bh", title: "Pronto Cuidar" },
  { slug: "alzheimer-bh", title: "Alzheimer em BH" },
  { slug: "demencias-bh", title: "Demências em Idosos" },
  { slug: "parkinson-idosos-bh", title: "Parkinson em Idosos" },
  { slug: "prevencao-quedas-idosos-bh", title: "Prevenção de Quedas" },
  { slug: "diabetes-idosos", title: "Diabetes em Idosos" },
  { slug: "o-que-e-disfagia", title: "O que é Disfagia" },
  { slug: "quando-o-esquecimento-se-tornar-preocupante", title: "Esquecimento: Quando se Preocupar" },
  { slug: "clinica-idosos-barro-preto-bh", title: "Unidade Barro Preto" },
  { slug: "clinica-idosos-pampulha-bh", title: "Unidade Pampulha" },
  { slug: "clinica-idosos-santo-agostinho-bh", title: "Unidade Santo Agostinho" },
  { slug: "clinica-idosos-santa-efigenia-bh", title: "Unidade Santa Efigênia" },
  { slug: "clinica-idosos-betim-mg", title: "Unidade Betim" },
];

export function currentPageSlug() {
  const path = location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path || path === "index.html") return "index";
  return path.replace(/\.html$/, "");
}
