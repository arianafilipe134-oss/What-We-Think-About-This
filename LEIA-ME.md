# What We Think About This — como pôr o site online

O site tem 5 ficheiros:

| Ficheiro | O que faz |
|---|---|
| `index.html` | A estrutura da página (cabeçalho, formulário, lista de reviews) |
| `style.css` | O visual: cores, letras, tamanhos |
| `app.js` | A lógica: publica reviews, mostra-as em tempo real, mostra os vídeos do TikTok |
| `firebase-config.js` | A "morada" do teu projeto Firebase (tens de preencher) |
| `firestore.rules` | As regras de segurança da base de dados |

O formulário só tem 3 perguntas: **produto**, **nota** e **link (TikTok ou Pinterest) ou opinião**. O nome vem automaticamente da conta Google (só o primeiro nome, nunca o email).

Qualquer pessoa pode **ver** as reviews. Para **publicar**, tem de entrar com a conta Google.

---

## Passo 1 — Criar o projeto no Firebase (grátis, sem cartão)

1. Vai a https://console.firebase.google.com e entra com a tua conta Google.
2. Clica **Criar projeto** → nome `what-we-think-about-this` → podes desligar o Google Analytics → **Criar**.

## Passo 2 — Ativar a base de dados

1. No menu à esquerda: **Compilação → Firestore Database → Criar base de dados**.
2. Localização: escolhe **europe-west** (mais perto de Portugal).
3. Escolhe **Modo de produção** → **Criar**.
4. Vai ao separador **Regras**, apaga o que lá está, cola todo o conteúdo do ficheiro `firestore.rules` e clica **Publicar**.

## Passo 3 — Ativar o login com Google

1. Menu: **Compilação → Authentication → Começar**.
2. Separador **Método de início de sessão** → **Google** → ativa.
3. Em "Email de suporte do projeto", escolhe o teu email → **Guardar**.

## Passo 4 — Ligar o site ao projeto

1. Clica na roda dentada ⚙️ → **Definições do projeto**.
2. Em "As tuas apps", clica no ícone **</>** (Web) → dá um nome → **Registar app**.
3. Aparece um bloco `firebaseConfig = { ... }`. Copia esses valores para o ficheiro `firebase-config.js`, no lugar de cada `COLA_AQUI`.

## Passo 5 — Pôr online (a forma mais fácil: Netlify Drop)

1. Vai a https://app.netlify.com/drop
2. Arrasta a pasta inteira `what-we-think-about-this` para a página.
3. Em segundos recebes um link tipo `https://nome-aleatorio.netlify.app`. Podes mudar o nome em **Site configuration → Change site name**.
4. **Importante:** volta ao Firebase → **Authentication → Definições → Domínios autorizados → Adicionar domínio** e cola o teu endereço Netlify (sem `https://`, ex.: `whatwethink.netlify.app`). Sem isto, o botão "Entrar com Google" não funciona no site.

> Abrir o `index.html` diretamente com duplo clique **não funciona** (os browsers bloqueiam módulos JavaScript em ficheiros locais). Testa sempre no link do Netlify.

---

## Como moderar

- Para apagar uma review ofensiva: Firebase → **Firestore Database → Dados → reviews** → clica na review → ⋮ → **Eliminar documento**.
- Cada pessoa pode apagar as suas próprias reviews no site (botão "Apagar"), desde que tenha entrado com a mesma conta Google.
- Para ver quem publicou o quê: Firebase → **Authentication → Utilizadores** (o `uid` de cada review corresponde a um utilizador).

## Como funcionam os vídeos e os pins

- Pinterest: a pessoa cola o link do pin (tipo `https://pt.pinterest.com/pin/123456789/`) e o site mostra o pin com o widget oficial do Pinterest. Links curtos `pin.it/...` não funcionam: abre-os no browser e copia o link completo.

- O site **não guarda vídeos**, só o número do vídeo do TikTok. O vídeo continua no TikTok de quem o publicou e aparece no site através do leitor oficial do TikTok.
- Se a pessoa apagar o vídeo ou puser a conta privada, o vídeo deixa de aparecer.
- Links curtos (`vm.tiktok.com/...`) não funcionam: pede o link completo, que tem `/video/` e um número comprido. No telemóvel, abrir o link curto no browser mostra o link completo na barra de endereços.

## Custos

Com o plano gratuito do Firebase (Spark) e do Netlify, um site deste tamanho fica a custo zero até ter muitos milhares de visitas por dia. Os vídeos não gastam nada, porque ficam no TikTok.

## Mudar o visual

- Cores: as primeiras linhas do `style.css` (`--gold`, `--green`, etc.).
- Textos: estão todos no `index.html`.

---

## Links curtos (pin.it, vm.tiktok.com)

O site transforma sozinho os links curtos no link completo. Isto usa uma pequena "função" que corre no servidor do Netlify (`netlify/functions/resolve.mjs`).

**Atenção:** as funções do Netlify **não funcionam** quando o site é publicado arrastando a pasta (Netlify Drop). Para funcionarem, publica através do GitHub (não precisas de terminal):

1. Cria conta em https://github.com e clica **New repository** → nome `what-we-think-about-this` → **Create repository**.
2. Clica **uploading an existing file** e arrasta para lá **todo o conteúdo** da pasta (incluindo as pastas `icons` e `netlify`) → **Commit changes**.
3. No Netlify: **Add new project → Import an existing project → GitHub** → escolhe o repositório → **Deploy**. (Se o site antigo do Netlify Drop já tiver o nome que queres, apaga-o primeiro ou muda o nome deste.)
4. Adiciona o novo endereço `.netlify.app` em Firebase → Authentication → Definições → Domínios autorizados.

A partir daí, para atualizar o site, basta carregares os ficheiros novos no GitHub: o Netlify publica sozinho.

Se publicares só com o Netlify Drop, tudo o resto funciona; os links curtos mostram apenas uma mensagem a pedir o link completo.
