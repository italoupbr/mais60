import { resolve } from "path";
import { existsSync } from "fs";
import { defineConfig } from "vite";

// Pages are referenced with clean URLs (e.g. /geriatra-bh/) to match the
// production WordPress permalink structure. This dev middleware rewrites
// those clean URLs to the matching flat .html file so local navigation works
// the same way the site will behave once ported.
function cleanUrlsPlugin() {
  return {
    name: "clean-urls-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const [pathname] = req.url.split("?");
        if (pathname === "/" || pathname.includes(".") || pathname.startsWith("/@") || pathname.startsWith("/node_modules")) {
          return next();
        }
        const slug = pathname.replace(/^\/+|\/+$/g, "");
        if (!slug) return next();
        const candidate = resolve(__dirname, `${slug}.html`);
        if (existsSync(candidate)) {
          req.url = `/${slug}.html`;
        }
        next();
      });
    },
  };
}

const pages = [
  "index",
  "geriatra-bh",
  "mais60-essencial-plano-particular-idoso",
  "fonoaudiologia-idosos-bh",
  "reabilitacao-idosos-bh",
  "cuidados-medicos-idosos-bh",
  "atividades-bem-estar-idosos-bh",
  "urgencia-idosos-24h-bh",
  "medico-referencia-idosos-bh",
  "fisioterapia-idosos-bh",
  "nutricionista-idosos-bh",
  "psicologo-idosos-bh",
  "educacao-fisica-idosos-bh",
  "terapeuta-ocupacional-idosos-bh",
  "enfermeiro-navegador-cuidado-coordenado",
  "farmaceutico-clinico-idosos-bh",
  "pronto-cuidar-bh",
  "alzheimer-bh",
  "demencias-bh",
  "parkinson-idosos-bh",
  "prevencao-quedas-idosos-bh",
  "diabetes-idosos",
  "o-que-e-disfagia",
  "quando-o-esquecimento-se-tornar-preocupante",
  "clinica-idosos-barro-preto-bh",
  "clinica-idosos-pampulha-bh",
  "clinica-idosos-santo-agostinho-bh",
  "clinica-idosos-santa-efigenia-bh",
  "clinica-idosos-betim-mg",
];

const input = {};
for (const page of pages) {
  const file = resolve(__dirname, `${page}.html`);
  if (existsSync(file)) input[page] = file;
}

export default defineConfig({
  plugins: [cleanUrlsPlugin()],
  build: {
    rollupOptions: { input },
  },
});
