// What We Think About This — lógica do site
// 1) liga ao Firebase  2) mostra as reviews em tempo real  3) publica novas reviews

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  query, orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

const $ = (id) => document.getElementById(id);
let rating = 0;
let myUid = null;
let myName = "";
let reviews = [];

// ---------- TikTok ----------
// Tira o número do vídeo de um link como https://www.tiktok.com/@nome/video/7312345678901234567
function getTikTokId(link) {
  const m = String(link).match(/tiktok\.com\/.*\/video\/(\d{10,25})/);
  return m ? m[1] : null;
}
// Leitor oficial do TikTok (embed)
function tiktokPlayer(id) {
  return `<iframe class="tiktok" src="https://www.tiktok.com/player/v1/${id}?description=1"
            allow="fullscreen; encrypted-media" loading="lazy" title="Vídeo do TikTok"></iframe>`;
}

// ---------- Pinterest ----------
// Tira o número do pin de um link como https://pt.pinterest.com/pin/123456789012345678/
function getPinId(link) {
  const m = String(link).match(/pinterest\.[a-z.]+\/pin\/(\d{5,25})/i);
  return m ? m[1] : null;
}
// Widget oficial do Pinterest (embed)
function pinPlayer(id) {
  return `<iframe class="pin" src="https://assets.pinterest.com/ext/embed.html?id=${id}"
            loading="lazy" scrolling="no" title="Pin do Pinterest"></iframe>`;
}

// Lê o link colado e diz se é TikTok ou Pinterest
function getMedia(link) {
  const t = getTikTokId(link);
  if (t) return { tiktokId: t, pinId: "" };
  const p = getPinId(link);
  if (p) return { tiktokId: "", pinId: p };
  return null;
}
function mediaHTML(m) {
  if (m.tiktokId) return tiktokPlayer(m.tiktokId);
  if (m.pinId) return pinPlayer(m.pinId);
  return "";
}

// ---------- Estrelas ----------
function drawStars() {
  $("stars").innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" role="radio" aria-checked="${n === rating}" aria-label="${n} de 5"
       class="${n <= rating ? "on" : ""}" data-n="${n}">★</button>`).join("");
}
$("stars").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  rating = Number(b.dataset.n);
  drawStars();
});
drawStars();

// ---------- Links curtos ----------
// pin.it/..., vm.tiktok.com/..., vt.tiktok.com/..., tiktok.com/t/... são transformados no link completo
// pelo servidor do Netlify (ficheiro netlify/functions/resolve.mjs).
const isShortLink = (l) => /^(https?:\/\/)?(pin\.it|vm\.tiktok\.com|vt\.tiktok\.com|(www\.)?tiktok\.com\/t)\//i.test(l);
async function resolveShort(link) {
  const url = /^https?:/i.test(link) ? link : "https://" + link;
  const res = await fetch("/api/resolve?url=" + encodeURIComponent(url));
  if (!res.ok) throw new Error("resolve failed");
  const data = await res.json();
  if (!data.url) throw new Error("no url");
  return data.url;
}

// Pré-visualização quando a pessoa cola o link
let resolving = null;
async function updatePreview() {
  let link = $("fTikTok").value.trim();
  if (link && isShortLink(link)) {
    $("tiktokPreview").innerHTML = `<p class="hint">A abrir o link…</p>`;
    const mine = resolving = resolveShort(link);
    try {
      const full = await mine;
      if (resolving !== mine) return;              // a pessoa já colou outro link entretanto
      $("fTikTok").value = full;                   // troca pelo link completo
      link = full;
    } catch {
      if (resolving !== mine) return;
      $("tiktokPreview").innerHTML = `<p class="hint" style="color:var(--danger)">Não consegui abrir este link curto. Abre-o no browser e copia o link completo da barra de endereço.</p>`;
      return;
    }
  }
  const m = getMedia(link);
  $("tiktokPreview").innerHTML = m ? mediaHTML(m)
    : (link ? `<p class="hint" style="color:var(--danger)">Este link não funciona. Cola o link do vídeo do TikTok ou do pin do Pinterest.</p>` : "");
}
$("fTikTok").addEventListener("input", updatePreview);

// ---------- Mostrar reviews ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const fmtDate = (d) => d ? d.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }) : "agora";

function currentList() {
  const q = $("q").value.trim().toLowerCase();
  const sort = $("sort").value;
  let list = reviews.filter(r => !q || r.product.toLowerCase().includes(q));
  if (sort === "top") list = [...list].sort((a, b) => b.rating - a.rating);
  if (sort === "low") list = [...list].sort((a, b) => a.rating - b.rating);
  return list;
}

// Um cartão da grelha (estilo Pinterest)
function cardHTML(r) {
  const kind = r.tiktokId ? "video" : r.pinId ? "pin" : "text";
  return `
    <article class="card card-${kind}">
      ${mediaHTML(r)}
      ${r.tiktokId ? `<button type="button" class="play-full" data-id="${esc(r.id)}">▶ Ver em ecrã inteiro</button>` : ""}
      <div class="card-body">
        <h3 class="prod">${esc(r.product)}</h3>
        <span class="rstars" aria-label="${r.rating} de 5 estrelas">${stars(r.rating)}</span>
        ${r.comment ? `<p class="comment">${esc(r.comment)}</p>` : ""}
        <div class="by">
          <span>${esc(r.name) || "Anónimo"} · ${fmtDate(r.createdAt)}</span>
          ${r.uid === myUid ? `<button class="del" data-id="${esc(r.id)}">Apagar</button>` : ""}
        </div>
      </div>
    </article>`;
}

function render() {
  const list = currentList();
  if (!list.length) {
    $("feed").innerHTML = reviews.length
      ? `<div class="empty"><b>Nada encontrado</b>Experimenta procurar outro produto.</div>`
      : `<div class="empty"><b>Ainda não há reviews</b>Sê a primeira pessoa a dizer o que pensa de um produto.</div>`;
    return;
  }
  $("feed").innerHTML = list.map(cardHTML).join("");
}
$("q").addEventListener("input", render);
$("sort").addEventListener("change", render);

// ---------- Modo Vídeos (estilo TikTok) ----------
// Só os vídeos à volta do que está no ecrã são carregados, para o site não ficar lento.
let reelObserver = null;
function reelPlayer(id) {
  return `<iframe src="https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&description=0&rel=0"
            allow="autoplay; fullscreen; encrypted-media" title="Vídeo do TikTok"></iframe>`;
}
function openReels(startId) {
  const vids = currentList().filter(r => r.tiktokId);
  const track = $("reelsTrack");
  if (!vids.length) {
    track.innerHTML = `<div class="reel reel-empty"><p>Ainda não há vídeos.<br>Publica o primeiro com um link do TikTok!</p></div>`;
  } else {
    track.innerHTML = vids.map(r => `
      <section class="reel" data-tt="${esc(r.tiktokId)}" data-id="${esc(r.id)}">
        <div class="reel-frame"></div>
        <div class="reel-info">
          <b>${esc(r.product)}</b>
          <span class="rstars">${stars(r.rating)}</span>
          ${r.comment ? `<p>${esc(r.comment)}</p>` : ""}
          <small>${esc(r.name) || "Anónimo"}</small>
        </div>
      </section>`).join("");
  }
  $("reels").hidden = false;
  document.body.style.overflow = "hidden";
  setTab("reels");

  if (reelObserver) reelObserver.disconnect();
  reelObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      const frame = en.target.querySelector(".reel-frame");
      if (en.isIntersecting) { if (!frame.innerHTML) frame.innerHTML = reelPlayer(en.target.dataset.tt); }
      else frame.innerHTML = ""; // pára o vídeo que saiu do ecrã
    });
  }, { root: track, threshold: 0.6 });
  track.querySelectorAll(".reel[data-tt]").forEach(el => reelObserver.observe(el));

  const start = startId ? track.querySelector(`.reel[data-id="${CSS.escape(startId)}"]`) : null;
  track.scrollTop = start ? start.offsetTop : 0;
  $("closeReels").focus();
}
function closeReels() {
  if (reelObserver) reelObserver.disconnect();
  $("reelsTrack").innerHTML = "";
  $("reels").hidden = true;
  document.body.style.overflow = "";
  setTab("grid");
}
function setTab(which) {
  $("tabGrid").setAttribute("aria-selected", which === "grid");
  $("tabReels").setAttribute("aria-selected", which === "reels");
}
$("tabGrid").addEventListener("click", () => { if (!$("reels").hidden) closeReels(); });
$("tabReels").addEventListener("click", () => openReels());
$("closeReels").addEventListener("click", closeReels);
$("feed").addEventListener("click", (e) => {
  const b = e.target.closest(".play-full");
  if (b) openReels(b.dataset.id);
});

// ---------- Janela do formulário ----------
function openForm() {
  $("sheet").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("fProduct").focus(), 50);
}
function closeForm() {
  $("sheet").hidden = true;
  document.body.style.overflow = "";
  $("openForm").focus();
}
$("openForm").addEventListener("click", openForm);
$("closeForm").addEventListener("click", closeForm);
$("sheet").addEventListener("click", (e) => { if (e.target === $("sheet")) closeForm(); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("sheet").hidden) closeForm();
  else if (!$("reels").hidden) closeReels();
});

// Apagar a própria review (pede confirmação com um segundo clique)
$("feed").addEventListener("click", async (e) => {
  const b = e.target.closest(".del");
  if (!b) return;
  if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "Confirmar?"; return; }
  b.disabled = true;
  try { await deleteDoc(doc(db, "reviews", b.dataset.id)); }
  catch { b.disabled = false; b.textContent = "Erro, tenta de novo"; }
});

// ---------- Publicar ----------
function showMsg(text, isError) {
  const m = $("msg");
  m.textContent = text;
  m.className = "msg" + (isError ? " err" : "");
  m.style.display = "block";
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const product = $("fProduct").value.trim();
  let link = $("fTikTok").value.trim();
  if (link && isShortLink(link)) {
    try { link = await resolveShort(link); $("fTikTok").value = link; }
    catch { showMsg("Não consegui abrir o link curto. Abre-o no browser e copia o link completo.", true); return; }
  }
  const comment = $("fComment").value.trim();
  const name = myName;
  const media = link ? getMedia(link) : { tiktokId: "", pinId: "" };

  if (product.length < 2) { showMsg("Escreve o nome do produto.", true); $("fProduct").focus(); return; }
  if (!rating) { showMsg("Escolhe uma nota de 1 a 5 estrelas.", true); return; }
  if (!media) { showMsg("O link não é válido. Usa o link completo do TikTok ou do Pinterest.", true); $("fTikTok").focus(); return; }
  if (!media.tiktokId && !media.pinId && !comment) { showMsg("Põe um link (TikTok ou Pinterest) ou escreve a tua opinião.", true); return; }
  const { tiktokId, pinId } = media;
  if (!myUid) { showMsg("Entra com a tua conta Google para publicar.", true); return; }

  $("submit").disabled = true;
  try {
    await addDoc(reviewsRef, { product, rating, tiktokId, pinId, comment, name, uid: myUid, createdAt: serverTimestamp() });
    showMsg("Obrigado! A tua review foi publicada.");
    $("form").reset();
    $("tiktokPreview").innerHTML = "";
    rating = 0; drawStars();
    setTimeout(() => { closeForm(); $("msg").style.display = "none"; }, 1200);
    setTimeout(() => { closeForm(); $("msg").style.display = "none"; }, 1200);
  } catch (err) {
    console.error(err);
    showMsg("Não foi possível publicar. Tenta outra vez daqui a pouco.", true);
  }
  $("submit").disabled = false;
});

// ---------- Ligar ----------
// Login com Google: qualquer pessoa VÊ as reviews; para PUBLICAR tem de entrar com a conta Google.
// No site aparece só o primeiro nome da pessoa (nunca o email).
onAuthStateChanged(auth, (user) => {
  myUid = user ? user.uid : null;
  myName = user ? (user.displayName || "").trim().split(/\s+/)[0].slice(0, 40) : "";
  $("login").hidden = !!user;
  $("submit").hidden = !user;
  $("who").innerHTML = user
    ? `A publicar como <b>${esc(myName || "Anónimo")}</b> · <button type="button" class="linkbtn" id="logout">Sair</button>`
    : "Só precisas de entrar para publicar. Ver as reviews é livre.";
  render();
});

$("login").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    $("msg").style.display = "none";
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") return;
    console.error(err);
    showMsg(err.code === "auth/popup-blocked"
      ? "O browser bloqueou a janela do Google. Permite pop-ups para este site e tenta outra vez."
      : "Não foi possível entrar com o Google. Tenta outra vez.", true);
  }
});

$("who").addEventListener("click", (e) => {
  if (e.target.id === "logout") signOut(auth);
});

// Reviews em tempo real (as 200 mais recentes)
onSnapshot(query(reviewsRef, orderBy("createdAt", "desc"), limit(200)), (snap) => {
  reviews = snap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      product: String(x.product || ""),
      rating: Math.min(5, Math.max(1, Number(x.rating) || 1)),
      tiktokId: /^\d{10,25}$/.test(x.tiktokId || "") ? x.tiktokId : "",
      pinId: /^\d{5,25}$/.test(x.pinId || "") ? x.pinId : "",
      comment: String(x.comment || ""),
      name: String(x.name || ""),
      uid: x.uid,
      createdAt: x.createdAt ? x.createdAt.toDate() : null
    };
  });
  render();
}, (err) => {
  console.error(err);
  $("feed").innerHTML = `<div class="empty"><b>Não foi possível carregar as reviews</b>Confirma a configuração do Firebase.</div>`;
});
