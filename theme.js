// Personalização do visual pelo visitante.
// Cada pessoa escolhe tema, cor de fundo, cor de destaque e tipo de letra.
// A escolha fica guardada no browser dessa pessoa (não muda o site para os outros).

(function () {
  const KEY = "wwt-theme";
  const root = document.documentElement;

  // ---------- Temas prontos ----------
  // Para criar um tema novo, copia um bloco e muda as cores.
  const PRESETS = {
    classico: { nome: "Clássico", bg: "#f3f0ea", surface: "#ffffff", ink: "#1b1714", muted: "#6b625a", line: "#e2dcd2", accent: "#d59a00", accent2: "#1d6b4b", dark: false },
    noite:    { nome: "Noite",    bg: "#141110", surface: "#1f1a17", ink: "#f3ede6", muted: "#a99e94", line: "#3a322c", accent: "#f0b828", accent2: "#4fb488", dark: true },
    dourado:  { nome: "Preto e dourado", bg: "#0e0c09", surface: "#1a1610", ink: "#f6efe2", muted: "#b3a68c", line: "#3b3222", accent: "#e6b422", accent2: "#e6b422", dark: true },
    rosa:     { nome: "Rosa",     bg: "#fbe9ee", surface: "#fff7f9", ink: "#3a1420", muted: "#8a5a68", line: "#f0cdd7", accent: "#d6336c", accent2: "#a61e4d", dark: false },
    verde:    { nome: "Verde",    bg: "#e6f0e8", surface: "#f6fbf7", ink: "#11281c", muted: "#557063", line: "#c9ddcf", accent: "#1d7a50", accent2: "#14583a", dark: false },
    terra:    { nome: "Terra",    bg: "#efe2d3", surface: "#fbf5ee", ink: "#2b1b10", muted: "#7d6450", line: "#dfcbb5", accent: "#b5541c", accent2: "#7a3a12", dark: false },
    azul:     { nome: "Azul",     bg: "#e7eefb", surface: "#f7f9ff", ink: "#0f1d3a", muted: "#58658a", line: "#cfdbf2", accent: "#2f5bd3", accent2: "#1e3f9c", dark: false },
    lilas:    { nome: "Lilás",    bg: "#1b1426", surface: "#261c35", ink: "#f2ecfb", muted: "#ab9cc4", line: "#3f3156", accent: "#c08cff", accent2: "#9f6bff", dark: true }
  };

  // Temas extra (paletas e padrões) vêm do ficheiro patterns.js
  const COLOR_KEYS = Object.keys(PRESETS);
  Object.assign(PRESETS, window.WWT_COLORS || {});
  COLOR_KEYS.push(...Object.keys(window.WWT_COLORS || {}));
  const PATTERN_KEYS = Object.keys(window.WWT_PATTERNS || {});
  Object.assign(PRESETS, window.WWT_PATTERNS || {});

  // ---------- Tipos de letra ----------
  const FONTS = {
    moderno:   { nome: "Moderno",   display: '"Bricolage Grotesque", system-ui, sans-serif', body: '"DM Sans", system-ui, sans-serif' },
    elegante:  { nome: "Elegante",  display: '"Playfair Display", Georgia, serif',           body: '"DM Sans", system-ui, sans-serif' },
    divertido: { nome: "Divertido", display: '"Fredoka", system-ui, sans-serif',              body: '"Fredoka", system-ui, sans-serif' },
    simples:   { nome: "Simples",   display: 'system-ui, -apple-system, "Segoe UI", sans-serif', body: 'system-ui, -apple-system, "Segoe UI", sans-serif' }
  };

  // ---------- Ajudas de cor ----------
  const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgbToHex = (r) => "#" + r.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const isDark = (h) => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) < 140; };

  // A partir de 2 cores (fundo + destaque), cria uma paleta completa e legível
  function paletteFrom(bg, accent) {
    const dark = isDark(bg);
    const ink = dark ? "#f5f0ea" : "#1b1714";
    return {
      bg, accent, accent2: accent, dark, ink,
      surface: dark ? mix(bg, "#ffffff", 0.07) : mix(bg, "#ffffff", 0.65),
      line:    dark ? mix(bg, "#ffffff", 0.16) : mix(bg, "#000000", 0.1),
      muted:   mix(ink, bg, 0.42)
    };
  }

  function apply(s) {
    let p = s.preset === "custom" ? paletteFrom(s.bg, s.accent) : (PRESETS[s.preset] || null);
    if (s.preset === "image") {
      const img = loadImage();
      // Cores neutras (claras ou escuras, conforme a imagem) para o texto se ler sempre bem
      p = img ? Object.assign(paletteFrom(isDark(s.bg) ? "#1b1714" : "#f6f3ee", s.accent), {
        pattern: `url("${img}")`,
        size: s.imgMode === "repeat" ? "320px" : "cover"
      }) : null;
    }
    const props = ["--bg", "--surface", "--ink", "--muted", "--line", "--gold", "--green", "--green-soft"];
    if (p) {
      root.style.setProperty("--bg", p.bg);
      root.style.setProperty("--surface", p.surface);
      root.style.setProperty("--ink", p.ink);
      root.style.setProperty("--muted", p.muted);
      root.style.setProperty("--line", p.line);
      root.style.setProperty("--gold", p.accent);
      root.style.setProperty("--green", p.accent2);
      root.style.setProperty("--green-soft", mix(p.accent2, p.bg, p.dark ? 0.8 : 0.85));
      root.style.colorScheme = p.dark ? "dark" : "light";
      if (p.pattern) {
        root.style.setProperty("--pattern", p.pattern);
        root.style.setProperty("--pattern-size", p.size || "auto");
        root.classList.add("has-pattern");
      } else {
        root.style.removeProperty("--pattern");
        root.classList.remove("has-pattern");
      }
    } else {
      root.style.removeProperty("--pattern");
      root.classList.remove("has-pattern");
      props.forEach(k => root.style.removeProperty(k));   // "Automático": segue o modo claro/escuro do telemóvel
      root.style.colorScheme = "";
    }
    const f = FONTS[s.font] || FONTS.moderno;
    root.style.setProperty("--display", f.display);
    root.style.setProperty("--body", f.body);
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
  const IMG_KEY = "wwt-bg-image";
  function loadImage() { try { return localStorage.getItem(IMG_KEY); } catch { return null; } }
  function saveImage(dataUrl) {
    try { if (dataUrl) localStorage.setItem(IMG_KEY, dataUrl); else localStorage.removeItem(IMG_KEY); return true; }
    catch { return false; }
  }

  // Lê a imagem escolhida, reduz o tamanho (para caber no browser) e calcula a cor média
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4 * 97) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        URL.revokeObjectURL(url);
        resolve({ dataUrl: c.toDataURL("image/jpeg", 0.8), avg: rgbToHex([r / n, g / n, b / n]) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagem inválida")); };
      img.src = url;
    });
  }

  let state = Object.assign({ preset: "auto", bg: "#f3f0ea", accent: "#d59a00", font: "moderno" }, load());
  apply(state); // aplica já, antes de a página aparecer (evita "piscar")

  // ---------- Painel ----------
  function buildPanel() {
    const btn = document.createElement("button");
    btn.className = "theme-btn";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "themePanel");
    btn.innerHTML = '<span aria-hidden="true">🎨</span> Personalizar';

    const panel = document.createElement("div");
    panel.className = "theme-panel";
    panel.id = "themePanel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Personalizar o visual");

    const swatch = (k) => {
      const p = PRESETS[k];
      const bgStyle = p.pattern
        ? `background:${p.bg} ${p.pattern.replace(/"/g, "&quot;")} center / ${p.size === "cover" ? "cover" : "28px"} repeat`
        : `background:${p.bg}`;
      return `<button type="button" class="swatch" data-preset="${k}" aria-pressed="false" title="${p.nome}">
         <span class="sw" style="${bgStyle};border-color:${p.line}"><i style="background:${p.accent}"></i></span>
         <small>${p.nome}</small>
       </button>`;
    };
    const swatches = COLOR_KEYS.map(swatch).join("");
    const patternSwatches = PATTERN_KEYS.map(swatch).join("");

    panel.innerHTML = `
      <div class="tp-head"><b>Personaliza o teu visual</b><button type="button" class="tp-close" aria-label="Fechar">✕</button></div>
      <p class="tp-label">Cores</p>
      <div class="swatches">
        <button type="button" class="swatch" data-preset="auto" aria-pressed="false" title="Automático">
          <span class="sw sw-auto"><i style="background:#d59a00"></i></span><small>Automático</small>
        </button>
        ${swatches}
      </div>
      <p class="tp-label">Padrões</p>
      <div class="swatches">${patternSwatches}</div>
      <p class="tp-label">O teu fundo</p>
      <div class="tp-upload">
        <label class="tp-file" for="tpFile">＋ Carregar imagem
          <input type="file" id="tpFile" accept="image/*">
        </label>
        <div class="tp-mode" role="group" aria-label="Como mostrar a imagem">
          <button type="button" class="fontbtn" data-mode="cover" aria-pressed="false">Ecrã inteiro</button>
          <button type="button" class="fontbtn" data-mode="repeat" aria-pressed="false">Repetir</button>
        </div>
        <button type="button" class="linkbtn tp-remove">Remover a minha imagem</button>
        <p class="tp-err" id="tpErr" role="status"></p>
      </div>
      <p class="tp-label">Ou escolhe as tuas cores</p>
      <div class="tp-colors">
        <label for="tpBg">Fundo <input type="color" id="tpBg"></label>
        <label for="tpAccent">Destaque <input type="color" id="tpAccent"></label>
      </div>
      <p class="tp-label">Tipo de letra</p>
      <div class="fonts">
        ${Object.entries(FONTS).map(([k, f]) => `<button type="button" class="fontbtn" data-font="${k}" aria-pressed="false" style="font-family:${f.display.replace(/"/g, "'")}">${f.nome}</button>`).join("")}
      </div>
      <button type="button" class="tp-reset">Repor original</button>
      <p class="tp-note">A tua escolha e a tua imagem ficam guardadas só neste browser. Ninguém mais as vê.</p>`;

    document.body.append(btn, panel);

    const $ = (sel) => panel.querySelector(sel);
    function sync() {
      panel.querySelectorAll(".swatch").forEach(b => b.setAttribute("aria-pressed", b.dataset.preset === state.preset));
      panel.querySelectorAll(".fontbtn[data-font]").forEach(b => b.setAttribute("aria-pressed", b.dataset.font === state.font));
      const hasImg = !!loadImage();
      panel.querySelector(".tp-mode").hidden = !hasImg;
      panel.querySelector(".tp-remove").hidden = !hasImg;
      panel.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", state.preset === "image" && (state.imgMode || "cover") === b.dataset.mode));
      const p = PRESETS[state.preset];
      $("#tpBg").value = state.preset === "custom" ? state.bg : (p ? p.bg : "#f3f0ea");
      $("#tpAccent").value = state.preset === "custom" ? state.accent : (p ? p.accent : "#d59a00");
    }
    function update(changes) { state = Object.assign({}, state, changes); apply(state); save(state); sync(); }

    btn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    $(".tp-close").addEventListener("click", () => { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) $(".tp-close").click(); });

    panel.addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch");
      if (sw) return update({ preset: sw.dataset.preset });
      const fb = e.target.closest(".fontbtn[data-font]");
      if (fb) return update({ font: fb.dataset.font });
      const mb = e.target.closest("[data-mode]");
      if (mb) return update({ preset: "image", imgMode: mb.dataset.mode });
      if (e.target.closest(".tp-remove")) { saveImage(null); return update({ preset: "auto" }); }
      if (e.target.closest(".tp-reset")) update({ preset: "auto", font: "moderno" });
    });
    $("#tpFile").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      $("#tpErr").textContent = "";
      if (!file) return;
      try {
        const { dataUrl, avg } = await readImage(file);
        if (!saveImage(dataUrl)) { $("#tpErr").textContent = "A imagem é grande demais. Experimenta outra."; return; }
        update({ preset: "image", imgMode: state.imgMode || "cover", bg: avg, accent: state.accent });
      } catch {
        $("#tpErr").textContent = "Não foi possível abrir essa imagem. Experimenta outra (JPG ou PNG).";
      }
    });
    $("#tpBg").addEventListener("input", (e) => update({ preset: "custom", bg: e.target.value, accent: $("#tpAccent").value }));
    $("#tpAccent").addEventListener("input", (e) => update({ preset: "custom", bg: $("#tpBg").value, accent: e.target.value }));

    sync();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildPanel);
  else buildPanel();
})();
