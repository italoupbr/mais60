// Widget de sugestão de conteúdo: visitante seleciona um trecho de texto
// e envia um comentário sobre o que gostaria de ver alterado ali.
import { SITE_PAGES, currentPageSlug } from "./site-pages.js";

const SUPABASE_URL = "https://viidsfngwjpuejsezzsj.supabase.co";
const SUPABASE_KEY = "sb_publishable_6fHwtzhQyBuUQfnUxZceTg_Mj-p7Tc3";
const TABLE = "mais60_sugestoes";
const TABLE_STATUS = "mais60_page_status";
const TABLE_ANOTACOES = "mais60_anotacoes";
const MAX_LEN = 2000;

function supaHeaders(extra) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

async function supaGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: supaHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function supaPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: supaHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status}`);
}

async function supaPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: supaHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  const rows = await res.json();
  return rows[0];
}

async function supaDelete(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: supaHeaders({ Prefer: "return=minimal" }),
  });
  if (!res.ok) throw new Error(`DELETE ${path} -> ${res.status}`);
}

const COLORS = {
  roxo: "#430593",
  verde: "#27CC95",
  neutro: "#E8F3F5",
  texto: "#1A1A2E",
};

function injectStyles() {
  if (document.getElementById("m60-sugestao-style")) return;
  const style = document.createElement("style");
  style.id = "m60-sugestao-style";
  style.textContent = `
    #m60-sugestao-trigger {
      position: absolute;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 6px;
      background: ${COLORS.roxo};
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 8px 16px 8px 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(67,5,147,0.25);
      transform: translate(-50%, -8px);
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    #m60-sugestao-trigger:hover { transform: translate(-50%, -10px); box-shadow: 0 8px 24px rgba(67,5,147,0.32); }
    #m60-sugestao-trigger svg { width: 16px; height: 16px; flex-shrink: 0; }

    #m60-sugestao-panel {
      position: absolute;
      z-index: 10000;
      width: min(340px, calc(100vw - 32px));
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(26,26,46,0.2);
      padding: 18px;
      font-family: 'Poppins', sans-serif;
      color: ${COLORS.texto};
    }
    #m60-sugestao-panel .m60-quote {
      background: ${COLORS.neutro};
      border-left: 3px solid ${COLORS.roxo};
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.4;
      max-height: 90px;
      overflow-y: auto;
      margin-bottom: 12px;
      color: #40405c;
    }
    #m60-sugestao-panel label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    #m60-sugestao-panel textarea {
      width: 100%;
      min-height: 72px;
      resize: vertical;
      border: 1.5px solid #d8d8e6;
      border-radius: 8px;
      padding: 10px;
      font-family: inherit;
      font-size: 13px;
      color: ${COLORS.texto};
      outline: none;
    }
    #m60-sugestao-panel textarea:focus { border-color: ${COLORS.roxo}; }
    #m60-sugestao-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }
    #m60-sugestao-actions button {
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border-radius: 999px;
      padding: 9px 18px;
      cursor: pointer;
      border: none;
    }
    #m60-sugestao-cancel { background: transparent; color: #6b6b85; }
    #m60-sugestao-cancel:hover { background: #f2f2f7; }
    #m60-sugestao-enviar { background: ${COLORS.verde}; color: #0b3d2c; }
    #m60-sugestao-enviar:hover { filter: brightness(0.96); }
    #m60-sugestao-enviar:disabled { opacity: 0.6; cursor: default; }
    #m60-sugestao-msg { font-size: 12px; margin-top: 8px; min-height: 16px; }
    #m60-sugestao-msg.erro { color: #B3271C; }
    #m60-sugestao-msg.sucesso { color: #178a5f; font-weight: 600; }

    /* ── Review widget (checklist + anotações de área/design) ── */
    #m60-review-launcher {
      position: fixed;
      bottom: 28px;
      left: 28px;
      z-index: 998;
      width: 56px;
      height: 56px;
      border-radius: 9999px;
      background: ${COLORS.roxo};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(67,5,147,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      transition: transform 0.2s ease;
    }
    #m60-review-launcher:hover { transform: scale(1.08); }
    #m60-review-launcher svg { width: 26px; height: 26px; }

    #m60-review-panel {
      position: fixed;
      bottom: 96px;
      left: 28px;
      z-index: 999;
      width: min(380px, calc(100vw - 32px));
      max-height: min(560px, calc(100vh - 140px));
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 20px 56px rgba(26,26,46,0.25);
      font-family: 'Poppins', sans-serif;
      color: ${COLORS.texto};
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #m60-review-panel header {
      padding: 16px 18px 0;
    }
    #m60-review-panel .m60r-title { font-size: 15px; font-weight: 700; color: ${COLORS.roxo}; }
    #m60-review-panel .m60r-tabs { display: flex; gap: 4px; margin-top: 12px; border-bottom: 1px solid #ececf3; }
    #m60-review-panel .m60r-tab {
      flex: 1; text-align: center; font-size: 13px; font-weight: 600; color: #8a8aa3;
      padding: 10px 4px; cursor: pointer; border-bottom: 2px solid transparent; background: none; border-top: none; border-left: none; border-right: none;
      font-family: inherit;
    }
    #m60-review-panel .m60r-tab.active { color: ${COLORS.roxo}; border-bottom-color: ${COLORS.roxo}; }
    #m60-review-panel .m60r-body { padding: 16px 18px 18px; overflow-y: auto; }

    .m60r-approve-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      font-family: inherit; font-size: 14px; font-weight: 700; border-radius: 9999px; padding: 12px;
      border: 2px solid ${COLORS.verde}; background: #fff; color: ${COLORS.verde}; cursor: pointer;
      margin-bottom: 16px; transition: all 0.15s;
    }
    .m60r-approve-btn.aprovado { background: ${COLORS.verde}; color: #fff; }

    .m60r-tools { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 14px; }
    .m60r-tool-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: inherit;
      font-size: 11px; font-weight: 600; color: ${COLORS.texto}; background: #f7f7fb; border: 1.5px solid #ececf3;
      border-radius: 12px; padding: 10px 4px; cursor: pointer;
    }
    .m60r-tool-btn.active { background: rgba(67,5,147,0.10); border-color: ${COLORS.roxo}; color: ${COLORS.roxo}; }
    .m60r-tool-btn svg { width: 18px; height: 18px; }

    .m60r-anno-list { display: flex; flex-direction: column; gap: 8px; }
    .m60r-anno-item { background: #f7f7fb; border-radius: 10px; padding: 10px 12px; font-size: 12.5px; line-height: 1.5; }
    .m60r-anno-item .m60r-anno-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
    .m60r-anno-item .m60r-anno-tipo { font-weight: 700; color: ${COLORS.roxo}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .m60r-anno-item button.m60r-del { background:none; border:none; color:#B3271C; font-size:11px; cursor:pointer; font-weight:600; }

    .m60r-page-list { display: flex; flex-direction: column; gap: 2px; }
    .m60r-page-row {
      display: flex; align-items: center; gap: 10px; padding: 9px 6px; border-radius: 8px; cursor: pointer; font-size: 13px;
      text-decoration: none; color: ${COLORS.texto};
    }
    .m60r-page-row:hover { background: #f7f7fb; }
    .m60r-page-row.current { background: rgba(67,5,147,0.06); font-weight: 600; }
    .m60r-page-row .m60r-status-icon { flex-shrink: 0; font-size: 15px; }
    #m60-review-summary { font-size: 12px; color: #6b6b85; margin-top: 8px; }

    #m60-review-mode-pill {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10060;
      background: ${COLORS.roxo}; color: #fff; border-radius: 9999px; padding: 10px 10px 10px 18px;
      font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    }
    #m60-review-mode-pill button {
      background: rgba(255,255,255,0.18); border: none; color: #fff; font-family: inherit; font-size: 12px; font-weight: 700;
      border-radius: 9999px; padding: 7px 14px; cursor: pointer;
    }

    #m60-review-draw-overlay { position: fixed; inset: 0; z-index: 10050; cursor: crosshair; }
    .m60r-marker { position: absolute; pointer-events: auto; cursor: pointer; }
    .m60r-marker-pin {
      width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: ${COLORS.verde}; transform: translate(-50%,-100%) rotate(-45deg);
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .m60r-marker-pin span { transform: rotate(45deg); color: #06331f; font-size: 11px; font-weight: 800; }
    .m60r-marker-box { border: 2px solid ${COLORS.verde}; background: rgba(39,204,149,0.14); border-radius: 4px; }
    .m60r-marker-box.resolvido, .m60r-marker-pin.resolvido { border-color: #9CA3AF; background: rgba(156,163,175,0.14); filter: grayscale(0.6); opacity: 0.7; }
    .m60r-live-box { position: fixed; border: 2px dashed #fff; background: rgba(39,204,149,0.20); pointer-events: none; z-index: 10051; }
    .m60r-live-pen { position: fixed; inset: 0; pointer-events: none; z-index: 10051; }

    #m60-review-comment-popup {
      position: absolute; z-index: 10070; width: min(320px, calc(100vw - 32px));
      background: #fff; border-radius: 16px; box-shadow: 0 16px 48px rgba(26,26,46,0.25); padding: 16px;
      font-family: 'Poppins', sans-serif; color: ${COLORS.texto};
    }
    #m60-review-comment-popup textarea {
      width: 100%; min-height: 70px; resize: vertical; border: 1.5px solid #d8d8e6; border-radius: 8px; padding: 10px;
      font-family: inherit; font-size: 13px; outline: none; box-sizing: border-box;
    }
    #m60-review-comment-popup textarea:focus { border-color: ${COLORS.roxo}; }
    #m60-review-comment-popup .m60r-popup-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:10px; }
    #m60-review-comment-popup .m60r-popup-actions button {
      font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 9999px; padding: 9px 16px; cursor: pointer; border: none;
    }
    #m60-review-comment-popup .m60r-cancel { background: transparent; color: #6b6b85; }
    #m60-review-comment-popup .m60r-save { background: ${COLORS.verde}; color: #0b3d2c; }

    @media (max-width: 600px) {
      #m60-review-launcher { width: 48px; height: 48px; bottom: 20px; left: 16px; }
      #m60-review-launcher svg { width: 22px; height: 22px; }
      #m60-review-panel { left: 16px; bottom: 78px; }
    }
  `;
  document.head.appendChild(style);
}

function pencilIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
}

function clampToViewport(x, y, elWidth) {
  const margin = 16;
  const maxX = window.innerWidth - elWidth / 2 - margin;
  const minX = elWidth / 2 + margin;
  return Math.min(Math.max(x, minX), Math.max(maxX, minX));
}

class SuggestionWidget {
  constructor() {
    injectStyles();
    this.trigger = null;
    this.panel = null;
    this.selectedText = "";
    this.selectionRect = null;
    document.addEventListener("mouseup", (e) => this.onSelectionEnd(e));
    document.addEventListener("touchend", (e) => this.onSelectionEnd(e));
    document.addEventListener("mousedown", (e) => this.onOutsideInteraction(e));
    document.addEventListener("scroll", () => this.dismissAll(), true);
    window.addEventListener("resize", () => this.dismissAll());
  }

  onOutsideInteraction(e) {
    if (this.trigger && this.trigger.contains(e.target)) return;
    if (this.panel && this.panel.contains(e.target)) return;
    this.dismissAll();
  }

  onSelectionEnd(e) {
    if (this.panel) return; // não interfere enquanto o formulário está aberto
    if ((this.trigger && this.trigger.contains(e.target))) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (!text || text.length < 3) {
        this.removeTrigger();
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        this.removeTrigger();
        return;
      }
      this.selectedText = text.slice(0, MAX_LEN);
      this.showTrigger(rect);
    }, 0);
  }

  showTrigger(rect) {
    this.removeTrigger();
    const btn = document.createElement("button");
    btn.id = "m60-sugestao-trigger";
    btn.type = "button";
    btn.innerHTML = `${pencilIcon()}<span>Sugerir alteração</span>`;
    document.body.appendChild(btn);

    const x = clampToViewport(rect.left + rect.width / 2 + window.scrollX, 0, btn.offsetWidth);
    const y = rect.top + window.scrollY;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;

    btn.addEventListener("click", () => this.openPanel(rect));
    this.trigger = btn;
  }

  removeTrigger() {
    if (this.trigger) {
      this.trigger.remove();
      this.trigger = null;
    }
  }

  openPanel(rect) {
    this.removeTrigger();
    this.removePanel();

    const panel = document.createElement("div");
    panel.id = "m60-sugestao-panel";
    panel.innerHTML = `
      <div class="m60-quote">"${escapeHtml(this.selectedText)}"</div>
      <label for="m60-sugestao-textarea">O que você gostaria de mudar aqui?</label>
      <textarea id="m60-sugestao-textarea" maxlength="${MAX_LEN}" placeholder="Escreva sua sugestão..."></textarea>
      <div id="m60-sugestao-actions">
        <button type="button" id="m60-sugestao-cancel">Cancelar</button>
        <button type="button" id="m60-sugestao-enviar">Enviar sugestão</button>
      </div>
      <div id="m60-sugestao-msg"></div>
    `;
    document.body.appendChild(panel);

    const panelWidth = panel.offsetWidth;
    const x = clampToViewport(rect.left + rect.width / 2 + window.scrollX, 0, panelWidth);
    let y = rect.bottom + window.scrollY + 10;
    if (y + panel.offsetHeight > window.scrollY + window.innerHeight) {
      y = rect.top + window.scrollY - panel.offsetHeight - 10;
    }
    panel.style.left = `${x}px`;
    panel.style.top = `${Math.max(y, window.scrollY + 8)}px`;
    panel.style.transform = "translateX(-50%)";

    this.panel = panel;
    panel.querySelector("#m60-sugestao-textarea").focus();
    panel.querySelector("#m60-sugestao-cancel").addEventListener("click", () => this.dismissAll());
    panel.querySelector("#m60-sugestao-enviar").addEventListener("click", () => this.submit());
  }

  removePanel() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  dismissAll() {
    this.removeTrigger();
    this.removePanel();
  }

  async submit() {
    const textarea = this.panel.querySelector("#m60-sugestao-textarea");
    const msg = this.panel.querySelector("#m60-sugestao-msg");
    const btn = this.panel.querySelector("#m60-sugestao-enviar");
    const comentario = textarea.value.trim();

    if (!comentario) {
      msg.textContent = "Escreva sua sugestão antes de enviar.";
      msg.className = "erro";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando...";
    msg.textContent = "";
    msg.className = "";

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          page_path: location.pathname,
          page_title: document.title,
          page_url: location.href,
          texto_selecionado: this.selectedText,
          comentario: comentario.slice(0, MAX_LEN),
          user_agent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error(`status ${res.status}`);

      msg.textContent = "Sugestão enviada. Obrigado!";
      msg.className = "sucesso";
      btn.textContent = "Enviado";
      setTimeout(() => this.dismissAll(), 2200);
    } catch (err) {
      msg.textContent = "Não foi possível enviar. Tente novamente.";
      msg.className = "erro";
      btn.disabled = false;
      btn.textContent = "Enviar sugestão";
    }
  }
}

function iconChecklist() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
}
function iconPin() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
}
function iconBox() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
}
function iconPen() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
}
function iconCheck() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
}
function iconX() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
}

const TOOL_LABELS = {
  comentario: "Comentário",
  caixa: "Marcar área",
  caneta: "Grifar",
};

class ReviewWidget {
  constructor() {
    injectStyles();
    this.slug = currentPageSlug();
    this.activeTool = null;
    this.annotations = [];
    this.approved = false;
    this.panel = null;
    this.currentTab = "pagina";
    this.drag = null;

    this.markersLayer = document.createElement("div");
    this.markersLayer.id = "m60-review-markers-layer";
    Object.assign(this.markersLayer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      zIndex: "9997",
      pointerEvents: "none",
    });
    document.body.appendChild(this.markersLayer);

    this.launcher = document.createElement("button");
    this.launcher.id = "m60-review-launcher";
    this.launcher.type = "button";
    this.launcher.title = "Revisão do site";
    this.launcher.innerHTML = iconChecklist();
    this.launcher.addEventListener("click", () => this.togglePanel());
    document.body.appendChild(this.launcher);

    window.addEventListener("resize", () => this.renderMarkers());

    this.registerVisit();
    this.loadCurrentPageState();
  }

  async registerVisit() {
    try {
      await supaPatch(`${TABLE_STATUS}?page_slug=eq.${encodeURIComponent(this.slug)}`, { visitado: true });
    } catch (_) {
      /* silencioso: telemetria de visita não deve incomodar o cliente */
    }
  }

  async loadCurrentPageState() {
    try {
      const rows = await supaGet(`${TABLE_STATUS}?page_slug=eq.${encodeURIComponent(this.slug)}&select=aprovado`);
      this.approved = !!(rows[0] && rows[0].aprovado);
    } catch (_) {
      this.approved = false;
    }
    await this.loadAnnotations();
    if (this.panel) this.renderPanel();
  }

  async loadAnnotations() {
    try {
      this.annotations = await supaGet(
        `${TABLE_ANOTACOES}?page_slug=eq.${encodeURIComponent(this.slug)}&order=created_at.asc`
      );
    } catch (_) {
      this.annotations = [];
    }
    this.renderMarkers();
  }

  togglePanel() {
    if (this.panel) this.closePanel();
    else this.openPanel();
  }

  openPanel() {
    this.closePanel();
    const panel = document.createElement("div");
    panel.id = "m60-review-panel";
    panel.innerHTML = `
      <header>
        <div class="m60r-title">Revisão do site</div>
        <div class="m60r-tabs">
          <button type="button" class="m60r-tab" data-tab="pagina">Esta página</button>
          <button type="button" class="m60r-tab" data-tab="todas">Todas as páginas</button>
        </div>
      </header>
      <div class="m60r-body"></div>
    `;
    document.body.appendChild(panel);
    this.panel = panel;
    panel.querySelectorAll(".m60r-tab").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });
    this.switchTab(this.currentTab);
  }

  closePanel() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  renderPanel() {
    if (!this.panel) return;
    this.switchTab(this.currentTab, true);
  }

  switchTab(tab, silent) {
    this.currentTab = tab;
    if (!this.panel) return;
    this.panel.querySelectorAll(".m60r-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    const body = this.panel.querySelector(".m60r-body");
    if (tab === "pagina") this.renderTabPagina(body);
    else this.renderTabTodas(body);
  }

  renderTabPagina(body) {
    const abertos = this.annotations.filter((a) => a.status !== "resolvido");
    body.innerHTML = `
      <button type="button" class="m60r-approve-btn ${this.approved ? "aprovado" : ""}" id="m60r-approve-btn">
        <span style="width:15px;height:15px;display:inline-flex;">${iconCheck()}</span>
        ${this.approved ? "Página aprovada" : "Aprovar esta página"}
      </button>
      <div class="m60r-tools">
        <button type="button" class="m60r-tool-btn" data-tool="comentario">${iconPin()}Comentário</button>
        <button type="button" class="m60r-tool-btn" data-tool="caixa">${iconBox()}Marcar área</button>
        <button type="button" class="m60r-tool-btn" data-tool="caneta">${iconPen()}Grifar</button>
      </div>
      <div class="m60r-anno-list">
        ${
          abertos.length === 0
            ? `<div style="font-size:12.5px;color:#8a8aa3;">Nenhum apontamento nesta página ainda. Use as ferramentas acima para marcar algo.</div>`
            : abertos
                .map(
                  (a) => `
              <div class="m60r-anno-item" data-id="${a.id}">
                <div class="m60r-anno-meta">
                  <span class="m60r-anno-tipo">${TOOL_LABELS[a.tipo] || a.tipo}</span>
                  <button type="button" class="m60r-del" data-id="${a.id}">excluir</button>
                </div>
                ${escapeHtml(a.comentario)}
              </div>`
                )
                .join("")
        }
      </div>
    `;
    body.querySelector("#m60r-approve-btn").addEventListener("click", () => this.toggleApprove());
    body.querySelectorAll(".m60r-tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.armTool(btn.dataset.tool));
    });
    body.querySelectorAll(".m60r-del").forEach((btn) => {
      btn.addEventListener("click", () => this.deleteAnnotation(btn.dataset.id));
    });
  }

  async renderTabTodas(body) {
    body.innerHTML = `<div style="font-size:12.5px;color:#8a8aa3;">Carregando...</div>`;
    let rows = [];
    try {
      rows = await supaGet(`${TABLE_STATUS}?select=page_slug,visitado,aprovado`);
    } catch (_) {
      rows = [];
    }
    const statusBySlug = Object.fromEntries(rows.map((r) => [r.page_slug, r]));
    const visitadas = rows.filter((r) => r.visitado).length;
    const aprovadas = rows.filter((r) => r.aprovado).length;
    body.innerHTML = `
      <div id="m60-review-summary">${visitadas}/${SITE_PAGES.length} páginas visitadas · ${aprovadas}/${SITE_PAGES.length} aprovadas</div>
      <div class="m60r-page-list" style="margin-top:10px;">
        ${SITE_PAGES.map((p) => {
          const st = statusBySlug[p.slug] || {};
          const icon = st.aprovado ? "✅" : st.visitado ? "🔵" : "⬜";
          const href = p.slug === "index" ? "index.html" : `${p.slug}.html`;
          const isCurrent = p.slug === this.slug;
          return `<a class="m60r-page-row ${isCurrent ? "current" : ""}" href="${href}"><span class="m60r-status-icon">${icon}</span>${escapeHtml(p.title)}</a>`;
        }).join("")}
      </div>
    `;
  }

  async toggleApprove() {
    const next = !this.approved;
    this.approved = next;
    this.renderTabPagina(this.panel.querySelector(".m60r-body"));
    try {
      await supaPatch(`${TABLE_STATUS}?page_slug=eq.${encodeURIComponent(this.slug)}`, { aprovado: next });
    } catch (_) {
      this.approved = !next;
      this.renderTabPagina(this.panel.querySelector(".m60r-body"));
    }
  }

  armTool(tipo) {
    this.closePanel();
    this.activeTool = tipo;
    this.launcher.style.display = "none";

    const pill = document.createElement("div");
    pill.id = "m60-review-mode-pill";
    pill.innerHTML = `<span>${{ comentario: "📌", caixa: "▭", caneta: "✏️" }[tipo]} Modo: ${TOOL_LABELS[tipo]} — ${
      tipo === "comentario" ? "clique na página" : "arraste na página"
    }</span><button type="button">Sair</button>`;
    pill.querySelector("button").addEventListener("click", () => this.disarmTool());
    document.body.appendChild(pill);
    this.modePill = pill;

    const overlay = document.createElement("div");
    overlay.id = "m60-review-draw-overlay";
    document.body.appendChild(overlay);
    this.drawOverlay = overlay;

    const start = (e) => this.onDrawStart(e);
    const move = (e) => this.onDrawMove(e);
    const end = (e) => this.onDrawEnd(e);
    overlay.addEventListener("mousedown", start);
    overlay.addEventListener("mousemove", move);
    overlay.addEventListener("mouseup", end);
    overlay.addEventListener("touchstart", start, { passive: false });
    overlay.addEventListener("touchmove", move, { passive: false });
    overlay.addEventListener("touchend", end);
    this._drawHandlers = { start, move, end };
  }

  disarmTool() {
    this.activeTool = null;
    this.drag = null;
    if (this.drawOverlay) {
      const { start, move, end } = this._drawHandlers || {};
      if (start) {
        this.drawOverlay.removeEventListener("mousedown", start);
        this.drawOverlay.removeEventListener("mousemove", move);
        this.drawOverlay.removeEventListener("mouseup", end);
        this.drawOverlay.removeEventListener("touchstart", start);
        this.drawOverlay.removeEventListener("touchmove", move);
        this.drawOverlay.removeEventListener("touchend", end);
      }
      this.drawOverlay.remove();
      this.drawOverlay = null;
    }
    if (this.modePill) {
      this.modePill.remove();
      this.modePill = null;
    }
    this.launcher.style.display = "";
  }

  pointFromEvent(e) {
    const t = e.touches && e.touches[0];
    return { clientX: t ? t.clientX : e.clientX, clientY: t ? t.clientY : e.clientY };
  }

  onDrawStart(e) {
    if (!this.activeTool) return;
    e.preventDefault();
    const { clientX, clientY } = this.pointFromEvent(e);

    if (this.activeTool === "comentario") {
      this.finishComentario(clientX, clientY);
      return;
    }

    this.drag = { startX: clientX, startY: clientY, points: [[clientX, clientY]] };

    if (this.activeTool === "caixa") {
      const box = document.createElement("div");
      box.className = "m60r-live-box";
      Object.assign(box.style, { left: `${clientX}px`, top: `${clientY}px`, width: "0px", height: "0px" });
      document.body.appendChild(box);
      this.drag.el = box;
    } else if (this.activeTool === "caneta") {
      const wrap = document.createElement("div");
      wrap.className = "m60r-live-pen";
      wrap.innerHTML = `<svg width="100%" height="100%"><polyline points="" fill="none" stroke="#FFD23F" stroke-opacity="0.6" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      document.body.appendChild(wrap);
      this.drag.el = wrap;
      this.drag.polyline = wrap.querySelector("polyline");
    }
  }

  onDrawMove(e) {
    if (!this.drag) return;
    e.preventDefault();
    const { clientX, clientY } = this.pointFromEvent(e);

    if (this.activeTool === "caixa") {
      const x = Math.min(this.drag.startX, clientX);
      const y = Math.min(this.drag.startY, clientY);
      const w = Math.abs(clientX - this.drag.startX);
      const h = Math.abs(clientY - this.drag.startY);
      Object.assign(this.drag.el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    } else if (this.activeTool === "caneta") {
      this.drag.points.push([clientX, clientY]);
      this.drag.polyline.setAttribute("points", this.drag.points.map((p) => p.join(",")).join(" "));
    }
  }

  onDrawEnd(e) {
    if (!this.drag) return;
    const { clientX, clientY } = this.pointFromEvent(e.changedTouches ? { touches: e.changedTouches } : e);

    if (this.activeTool === "caixa") {
      const x = Math.min(this.drag.startX, clientX);
      const y = Math.min(this.drag.startY, clientY);
      const w = Math.abs(clientX - this.drag.startX);
      const h = Math.abs(clientY - this.drag.startY);
      this.drag.el.remove();
      if (w < 10 || h < 10) {
        this.drag = null;
        return;
      }
      const docW = document.documentElement.scrollWidth;
      const docH = document.documentElement.scrollHeight;
      const pageX = x + window.scrollX;
      const pageY = y + window.scrollY;
      this.finishAnnotation(
        { tipo: "caixa", x: (pageX / docW) * 100, y: (pageY / docH) * 100, largura: (w / docW) * 100, altura: (h / docH) * 100 },
        clientX,
        clientY
      );
    } else if (this.activeTool === "caneta") {
      this.drag.el.remove();
      const pts = this.drag.points;
      const totalDist = pts.reduce((acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0);
      if (totalDist < 15) {
        this.drag = null;
        return;
      }
      const docW = document.documentElement.scrollWidth;
      const docH = document.documentElement.scrollHeight;
      const pontos = pts.map(([cx, cy]) => [((cx + window.scrollX) / docW) * 100, ((cy + window.scrollY) / docH) * 100]);
      this.finishAnnotation({ tipo: "caneta", pontos }, clientX, clientY);
    }
    this.drag = null;
  }

  finishComentario(clientX, clientY) {
    const docW = document.documentElement.scrollWidth;
    const docH = document.documentElement.scrollHeight;
    const pageX = clientX + window.scrollX;
    const pageY = clientY + window.scrollY;
    this.finishAnnotation({ tipo: "comentario", x: (pageX / docW) * 100, y: (pageY / docH) * 100 }, clientX, clientY);
  }

  finishAnnotation(partial, anchorClientX, anchorClientY) {
    const popup = document.createElement("div");
    popup.id = "m60-review-comment-popup";
    popup.innerHTML = `
      <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">O que você quer marcar aqui?</label>
      <textarea maxlength="${MAX_LEN}" placeholder="Escreva seu apontamento..."></textarea>
      <div class="m60r-popup-actions">
        <button type="button" class="m60r-cancel">Cancelar</button>
        <button type="button" class="m60r-save">Salvar</button>
      </div>
    `;
    document.body.appendChild(popup);
    const x = clampToViewport(anchorClientX + window.scrollX, 0, popup.offsetWidth || 320);
    let y = anchorClientY + window.scrollY + 16;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.transform = "translateX(-50%)";
    popup.querySelector("textarea").focus();

    const cleanup = () => popup.remove();
    popup.querySelector(".m60r-cancel").addEventListener("click", cleanup);
    popup.querySelector(".m60r-save").addEventListener("click", async () => {
      const comentario = popup.querySelector("textarea").value.trim();
      if (!comentario) return;
      const saveBtn = popup.querySelector(".m60r-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvando...";
      try {
        const row = await supaPost(TABLE_ANOTACOES, {
          page_slug: this.slug,
          page_title: document.title,
          comentario: comentario.slice(0, MAX_LEN),
          viewport_width: window.innerWidth,
          ...partial,
        });
        this.annotations.push(row);
        this.renderMarkers();
        if (this.panel && this.currentTab === "pagina") this.renderTabPagina(this.panel.querySelector(".m60r-body"));
      } catch (_) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Salvar";
        return;
      }
      cleanup();
    });
  }

  renderMarkers() {
    const docH = document.documentElement.scrollHeight;
    this.markersLayer.style.height = `${docH}px`;
    this.markersLayer.innerHTML = "";
    this.annotations.forEach((a, i) => {
      let el;
      const resolvidoClass = a.status === "resolvido" ? "resolvido" : "";
      if (a.tipo === "comentario") {
        el = document.createElement("div");
        el.className = `m60r-marker m60r-marker-pin ${resolvidoClass}`;
        el.style.left = `${a.x}%`;
        el.style.top = `${a.y}%`;
        el.innerHTML = `<span>${i + 1}</span>`;
      } else if (a.tipo === "caixa") {
        el = document.createElement("div");
        el.className = `m60r-marker m60r-marker-box ${resolvidoClass}`;
        el.style.left = `${a.x}%`;
        el.style.top = `${a.y}%`;
        el.style.width = `${a.largura}%`;
        el.style.height = `${a.altura}%`;
      } else if (a.tipo === "caneta") {
        el = document.createElement("div");
        el.className = "m60r-marker";
        Object.assign(el.style, { left: "0", top: "0", width: "100%", height: `${docH}px`, pointerEvents: "none" });
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.style.overflow = "visible";
        svg.style.pointerEvents = "none";
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        poly.setAttribute("points", (a.pontos || []).map((p) => p.join(",")).join(" "));
        poly.setAttribute("fill", "none");
        poly.setAttribute("stroke", a.status === "resolvido" ? "#9CA3AF" : "#FFD23F");
        poly.setAttribute("stroke-opacity", "0.55");
        poly.setAttribute("stroke-width", "1.4");
        poly.setAttribute("stroke-linecap", "round");
        poly.setAttribute("stroke-linejoin", "round");
        poly.style.pointerEvents = "stroke";
        svg.appendChild(poly);
        el.appendChild(svg);
      }
      el.title = a.comentario;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.showAnnotationTooltip(a, el);
      });
      this.markersLayer.appendChild(el);
    });
  }

  showAnnotationTooltip(a, el) {
    const existing = document.getElementById("m60-review-comment-popup");
    if (existing) existing.remove();
    const rect = el.getBoundingClientRect();
    const popup = document.createElement("div");
    popup.id = "m60-review-comment-popup";
    popup.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:${COLORS.roxo};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">${TOOL_LABELS[a.tipo] || a.tipo}${a.status === "resolvido" ? " · resolvido" : ""}</div>
      <div style="font-size:13px;line-height:1.5;">${escapeHtml(a.comentario)}</div>
      <div class="m60r-popup-actions">
        <button type="button" class="m60r-cancel">Fechar</button>
        <button type="button" class="m60r-save" style="background:#f2d4d4;color:#B3271C;">Excluir</button>
      </div>
    `;
    document.body.appendChild(popup);
    const x = clampToViewport(rect.left + rect.width / 2 + window.scrollX, 0, popup.offsetWidth || 320);
    popup.style.left = `${x}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
    popup.style.transform = "translateX(-50%)";
    popup.querySelector(".m60r-cancel").addEventListener("click", () => popup.remove());
    popup.querySelector(".m60r-save").addEventListener("click", () => {
      popup.remove();
      this.deleteAnnotation(a.id);
    });
  }

  async deleteAnnotation(id) {
    this.annotations = this.annotations.filter((a) => a.id !== id);
    this.renderMarkers();
    if (this.panel && this.currentTab === "pagina") this.renderTabPagina(this.panel.querySelector(".m60r-body"));
    try {
      await supaDelete(`${TABLE_ANOTACOES}?id=eq.${id}`);
    } catch (_) {
      /* já removido da tela; próxima carga da página resincroniza se falhar */
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initWidgets() {
  new SuggestionWidget();
  new ReviewWidget();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidgets);
} else {
  initWidgets();
}
