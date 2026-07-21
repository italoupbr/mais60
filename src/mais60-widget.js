// Widget de sugestão de conteúdo: visitante seleciona um trecho de texto
// e envia um comentário sobre o que gostaria de ver alterado ali.
const SUPABASE_URL = "https://viidsfngwjpuejsezzsj.supabase.co";
const SUPABASE_KEY = "sb_publishable_6fHwtzhQyBuUQfnUxZceTg_Mj-p7Tc3";
const TABLE = "mais60_sugestoes";
const MAX_LEN = 2000;

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SuggestionWidget());
} else {
  new SuggestionWidget();
}
