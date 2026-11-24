// Transforma links curtos (pin.it/..., vm.tiktok.com/..., vt.tiktok.com/..., tiktok.com/t/...)
// no link completo do pin ou do vídeo. Corre no servidor do Netlify (o browser não consegue fazer isto sozinho).
// Endereço: /api/resolve?url=LINK_CURTO

const ALLOWED = /^(pin\.it|([a-z]+\.)?pinterest\.[a-z.]+|vm\.tiktok\.com|vt\.tiktok\.com|(www\.|m\.)?tiktok\.com)$/i;
const DONE = /(pinterest\.[a-z.]+\/pin\/\d{5,25})|(tiktok\.com\/.*\/video\/\d{10,25})/i;

export default async (req) => {
  const input = new URL(req.url).searchParams.get("url") || "";
  let current;
  try { current = new URL(input.trim()); } catch { return json({ error: "link inválido" }, 400); }
  if (!/^https?:$/.test(current.protocol) || !ALLOWED.test(current.hostname)) {
    return json({ error: "só links do TikTok ou do Pinterest" }, 400);
  }

  // Segue os redirecionamentos (no máximo 6), sempre dentro do TikTok/Pinterest
  for (let i = 0; i < 6 && !DONE.test(current.href); i++) {
    let res;
    try {
      res = await fetch(current.href, {
        redirect: "manual",
        headers: { "user-agent": "Mozilla/5.0 (compatible; WWTAT-link-resolver)" }
      });
    } catch { return json({ error: "não foi possível abrir o link" }, 502); }
    const loc = res.headers.get("location");
    if (!loc) break;
    const next = new URL(loc, current);
    if (!ALLOWED.test(next.hostname)) break;
    current = next;
  }

  const m = current.href.match(DONE);
  if (!m) return json({ error: "não encontrei o pin ou o vídeo" }, 404);
  return json({ url: "https://www." + m[0].replace(/^www\./, "") }, 200);
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" }
  });
}

export const config = { path: "/api/resolve" };
