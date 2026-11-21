# Padrões e Desvios

Site de Tiago Neves e Gil Nata: textos de opinião sobre a atualidade educativa e registo do trabalho académico.
Endereço previsto: **https://padroesedesvios.eu**

- **Gerador:** [Astro](https://astro.build). Transforma os ficheiros de conteúdo em páginas HTML estáticas.
- **Alojamento:** Cloudflare Workers (gratuito para sites estáticos). Publica o site de novo sempre que algo muda neste repositório.
- **Editor no browser:** [Pages CMS](https://app.pagescms.org) (gratuito). Formulários para editar os conteúdos sem tocar em código.
- **Newsletter:** Buttondown, a partir do feed RSS do site (`/rss.xml`).

---

## Onde está cada coisa

| O quê | Ficheiro | Separador no editor |
|---|---|---|
| Textos de opinião (um ficheiro por texto) | `src/content/opiniao/*.md` | Opinião |
| Publicações | `src/data/publicacoes.json` | Publicações |
| Intervenções nos media | `src/data/media.json` | Media |
| Projetos | `src/data/projetos.json` | Projetos |
| Biografias e ligações | `src/data/pessoas.json` | Quem somos |
| Apresentação, rodapé, newsletter | `src/data/site.json` | Textos gerais |
| Valores das figuras do topo | `src/data/figura.json` | (não editável no editor) |
| Imagens dos textos | `public/imagens/` | (carregadas a partir do editor) |

### Textos de opinião

- **Texto publicado num jornal:** preencher «Publicado em» (ex.: Público) e a ligação. O título no site liga para o jornal e o campo «Texto» fica vazio.
- **Texto do próprio site:** deixar «Publicado em» e a ligação vazios e escrever o texto no campo «Texto». O texto ganha página própria em `padroesedesvios.eu/opiniao/…`, entra no RSS completo e segue na newsletter.
- **Rascunho:** marcar «Rascunho» guarda o texto sem o publicar.

### Publicações

As referências seguem a APA 7. Para pôr texto em itálico, rodeia-se com asteriscos: `*Higher Education, 68*(6), 851–874.` O site ordena por ano automaticamente. Nos filtros, a «Autoria» depende do campo «Autores do site».

---

## Pôr o site online (uma vez só)

### 1. GitHub
1. Criar conta em https://github.com/signup (gratuita).
2. Ligar o GitHub ao Claude (claude.ai, Definições, ligação ao GitHub), para o Claude criar o repositório `padroes-e-desvios` e enviar estes ficheiros. Em alternativa, criar o repositório à mão e carregar os ficheiros pela página do GitHub.
3. No repositório, em *Settings → Collaborators*, convidar o Gil, que também precisa de conta GitHub.

### 2. Cloudflare (feito)
O projeto `padroes-e-desvios` está criado no Cloudflare (*Workers & Pages*) e ligado a este repositório. Cada alteração no GitHub publica o site de novo automaticamente. O endereço provisório é `https://padroes-e-desvios.c6wfy24nv2.workers.dev`.

### 3. Domínio padroesedesvios.eu
1. Registar `padroesedesvios.eu` num registador que venda .eu (por exemplo, um registador português ou europeu). O Cloudflare não vende .eu. Um .eu exige um titular residente ou cidadão da UE.
2. No Cloudflare: *Add a domain → padroesedesvios.eu → plano Free*. O Cloudflare indica dois *nameservers*.
3. No registador, trocar os *nameservers* pelos do Cloudflare. A mudança pode demorar algumas horas.
4. No Cloudflare, abrir o projeto `padroes-e-desvios`, ir a *Settings → Domains & Routes → Add → Custom domain*, juntar `padroesedesvios.eu` e depois `www.padroesedesvios.eu`. O certificado HTTPS é tratado automaticamente.

### 4. Editor (Pages CMS)
1. Entrar em https://app.pagescms.org com a conta GitHub.
2. Escolher o repositório `padroes-e-desvios`. Os separadores (Opinião, Publicações, Media, Projetos, Quem somos, Textos gerais) aparecem logo.
3. Cada «Save» grava no GitHub, e o Cloudflare publica a nova versão em 1 a 2 minutos.

### 5. Newsletter (Buttondown)
1. Criar conta em https://buttondown.com. É gratuita até 100 subscritores.
2. No editor, em *Textos gerais*, escrever o nome de utilizador do Buttondown no campo «Nome de utilizador no Buttondown». A caixa de subscrição aparece no rodapé do site.
3. **Envio automático a partir do RSS:** no Buttondown, ligar o feed `https://padroesedesvios.eu/rss.xml` à funcionalidade *RSS-to-email*. Atenção: esta funcionalidade é um extra pago do Buttondown. Sem ela, cada texto novo pode ser enviado à mão a partir do Buttondown, em poucos cliques.

---

## Para quem mexe no código

```bash
npm install
npm run dev      # pré-visualização em http://localhost:4321
npm run build    # gera o site em dist/
```

- `src/components/Home.astro`: página principal, em PT (`/`) e EN (`/en/`).
- `src/pages/opiniao/[slug].astro`: página de cada texto de opinião do próprio site.
- `src/pages/rss.xml.js`: feed RSS.
- `src/lib/i18n.js`: textos fixos da interface, em português e inglês.
- `src/scripts/home.js`: figuras animadas, filtros das publicações, «mostrar mais».
- `.pages.yml`: formulários do editor.
