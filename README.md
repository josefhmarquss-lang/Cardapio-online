# Cardápio Pronto — cardápio online para restaurantes (SaaS)

Sistema de cardápio digital com pedidos pelo WhatsApp e painel administrativo,
pronto para vender para pizzarias, lanchonetes e restaurantes. Cada cliente
(estabelecimento) tem o próprio cardápio, login, produtos, pedidos e configurações.

Vem com uma **pizzaria fictícia de demonstração — "Brasa & Massa"** — com logo,
banner, cores, 21 produtos ilustrados, tamanhos, bordas, adicionais, taxas por
bairro e Pix. Todos os dados são exemplos editáveis pelo painel.

## As três áreas

| Área | Endereço | Quem usa |
|---|---|---|
| Página comercial (vende o seu produto) | `/` | Possíveis clientes |
| Cardápio público de cada loja | `/{endereço-da-loja}` — ex.: `/brasa-e-massa` | Consumidores |
| Painel da loja (login e senha) | `/admin` | Dono do estabelecimento |
| Painel da plataforma (cadastrar lojas) | `/super` | Você (superadministrador) |

## Como rodar

Requisitos: **Node.js 20.9 ou superior** (recomendado 22 LTS).

```bash
npm install
cp .env.example .env        # ajuste e-mail e senha do superadministrador
npm run seed                # cria a pizzaria demo e a sua conta de superadmin
npm run dev                 # http://localhost:3000
```

Em produção:

```bash
npm run build
npm start                   # porta 3000 (use PORT=8080 npm start para mudar)
```

### Acessos iniciais

| Conta | E-mail | Senha |
|---|---|---|
| Painel da pizzaria demo | `admin@brasaemassa.demo` | `pizza1234` |
| Superadministrador | valor de `SUPERADMIN_EMAIL` | valor de `SUPERADMIN_PASSWORD` |

Se você rodar o `seed` sem definir `SUPERADMIN_PASSWORD`, uma senha aleatória é
gerada e mostrada **uma única vez** no terminal. Para redefinir, rode
`npm run seed` de novo com a variável definida.

`npm run seed -- --reset-demo` apaga a pizzaria demo e a recria do zero
(útil antes de uma apresentação para um cliente).

## Como vender para uma nova loja

1. Entre em `/admin/login` com a conta de superadministrador → você cai em `/super`.
2. Em **Nova loja**, informe o nome, o endereço do cardápio (ex.: `lanchonete-do-ze`),
   o WhatsApp, o e-mail e uma senha inicial do dono. Escolha começar em branco ou com
   o modelo de pizzaria.
3. Envie ao cliente: o link `seudominio.com.br/admin/login`, o e-mail e a senha.
   Ele troca a senha em **Minha conta**.
4. Em `/super` você também pode desativar uma loja (o cardápio sai do ar e o acesso
   é bloqueado) e redefinir a senha do dono.

## O que o dono da loja faz no painel

- **Pedidos**: pedidos em tempo real (atualização a cada 8 s), aviso visual, som
  configurável, título da aba piscando, número do pedido, cliente, telefone, itens,
  adicionais, observações, endereço, entrega/retirada, taxa, total, pagamento
  (com troco), data e hora. Status: Novo → Recebido → Em preparação → Saiu para
  entrega (ou Pronto para retirada) → Concluído, ou Cancelado. Impressão de comanda.
- **Produtos**: cadastrar, editar, duplicar, excluir, foto (redimensionada no
  navegador antes do envio), preço, selo, destaque, disponível/indisponível com um
  toque, ordem, e grupos de opções (tamanhos, bordas, sabores, adicionais) com
  mínimo e máximo de escolhas e preço adicional.
- **Categorias**: criar, renomear, ocultar, ordenar e excluir.
- **Aparência**: logo, banner, paletas prontas ou cores livres, estilo da fonte,
  com prévia ao vivo.
- **Loja e horários**: nome, frase, descrição, WhatsApp, telefone, Instagram,
  endereço completo, horário por dia da semana (inclusive após a meia-noite) e modo
  Automático / Sempre aberto / Fechado agora.
- **Entrega e retirada**: liga/desliga cada modalidade, taxa única ou por bairro,
  pedido mínimo, tempos estimados e instruções de entrega.
- **Pagamento e Pix**: formas aceitas, tipo e chave Pix, recebedor, instruções e
  imagem do QR Code (opcional).

Tudo é salvo no banco e aparece no cardápio público na hora (as páginas são
renderizadas a cada acesso).

## Pedidos, WhatsApp e pagamento — como funciona de verdade

1. O consumidor monta o carrinho e finaliza. O **servidor recalcula todos os preços,
   adicionais e a taxa de entrega a partir do banco** (valores enviados pelo navegador
   são ignorados) e grava o pedido com status **"Novo — aguardando confirmação"**.
2. O consumidor vê um botão **"Enviar pedido pelo WhatsApp"**, que abre o WhatsApp da
   loja com a mensagem pronta (itens, opções, observações, endereço, total, pagamento e
   link de acompanhamento). Isso usa o link oficial `wa.me` — **não requer nenhuma chave
   ou conta de API**. O consumidor ainda precisa tocar em "enviar" no WhatsApp.
3. O pedido **nunca é apresentado como confirmado** só porque o WhatsApp foi aberto.
   A tela diz "aguardando confirmação da loja", e o consumidor acompanha o status pela
   página `/{loja}/pedido/{código}` até a loja clicar em "Confirmar recebimento".
4. **Pagamento**: não há integração bancária nem processamento de pagamento. Com Pix,
   o consumidor vê a chave, o recebedor, as instruções e um QR Code. Se a loja enviou a
   imagem do QR Code do banco, ela é exibida; senão, o sistema gera um **Pix copia e
   cola / QR Code estático com o valor do pedido**, seguindo o padrão BR Code do Banco
   Central (é só um texto formatado — nenhum banco é contatado). A loja confere o
   recebimento no próprio banco. Isso está escrito para o consumidor e para o lojista.

Se no futuro você quiser confirmação automática de pagamento, será preciso contratar
um provedor (Mercado Pago, Asaas, Efí, etc.) e usar as credenciais dele no servidor —
isso não está incluído.

## Segurança

- **Senhas** com bcrypt (custo 12); nunca em texto puro.
- **Sessões no servidor**: token aleatório de 256 bits em cookie `HttpOnly`,
  `SameSite=Lax` e `Secure` em produção; no banco fica só o hash SHA-256 do token.
  Sessões expiram em 14 dias; trocar a senha encerra as outras sessões.
- **Autorização no servidor em toda rota**: o ID da loja vem **da sessão**, nunca da
  URL ou do corpo da requisição. Todas as consultas do painel filtram por `store_id`,
  então trocar IDs na URL retorna 404 (verificado no teste automatizado).
- Superadmin e dono de loja têm papéis separados (`/super` e `/api/super/*` negam
  donos de loja).
- **CSRF**: requisições de escrita vindas de outro site são bloqueadas (checagem de
  `Origin`/`Sec-Fetch-Site`) além do `SameSite`.
- **Limite de tentativas** no login (por IP e por e-mail), em pedidos e em uploads.
- **Uploads**: só JPG/PNG/WEBP/GIF, tipo detectado pelo conteúdo do arquivo (não pela
  extensão), máx. 4 MB, servidos com `nosniff` e CSP restritiva. SVG enviado por
  usuário não é aceito. Uma loja não consegue usar imagens de outra.
- Validação de todos os dados de entrada com Zod.
- Nenhuma credencial vai para o navegador: não há chaves de API no código do cliente.

## Publicação (deploy)

O projeto é um app Next.js com banco **SQLite em arquivo** — não precisa de nenhum
serviço externo de banco ou autenticação. Por isso ele precisa de um servidor com
**disco persistente**:

- **VPS** (Hostinger, DigitalOcean, Contabo, Magalu Cloud…): instale o Node 22,
  `npm ci && npm run build && npm run seed`, rode `npm start` com PM2 ou systemd
  atrás de um Nginx/Caddy com **HTTPS** (obrigatório: os cookies de login são
  `Secure`).
- **Railway** (já configurado em `railway.json`): New Project → Deploy from GitHub
  repo; adicione um **Volume** montado em `/data`; em Variables defina
  `DATABASE_PATH=/data/cardapio.db`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` e
  `NEXT_PUBLIC_SALES_WHATSAPP`; em Networking gere um domínio. O start roda
  `npm run seed && npm start` (o seed não altera lojas existentes, mas redefine a
  senha do superadmin para o valor da variável a cada reinício).
- **Render / Fly.io**: crie um disco persistente, aponte `DATABASE_PATH` para ele,
  build `npm run build`, start `npm run seed && npm start`.
- **Vercel/Netlify (serverless) não servem** com SQLite: o disco é apagado a cada
  execução. Para usar essas plataformas seria preciso trocar o banco por um
  Postgres gerenciado (as consultas estão isoladas em `src/lib/repo/`).

**Backup**: todo o conteúdo (lojas, produtos, pedidos e imagens) fica no arquivo do
banco. Copie `data/cardapio.db` periodicamente (com o app parado, ou use
`sqlite3 cardapio.db ".backup backup.db"`).

Cada loja fica em `seudominio.com.br/endereco-da-loja`. Domínios próprios por loja
não estão incluídos.

## Personalizar o SEU produto

- Nome, sigla, slogan e **planos/preços** da página comercial:
  `src/lib/brand.ts` (Essencial R$ 79,90/mês, Profissional R$ 139,90/mês, Redes sob consulta).
- WhatsApp comercial: `NEXT_PUBLIC_SALES_WHATSAPP` no `.env` (depois rode o build de novo).
- Conteúdo da pizzaria demo: `src/lib/demo-data.ts`. Ilustrações: `npm run art`
  regera os SVGs em `public/demo/`.

## Testes

Com o servidor rodando e o `seed` feito:

```bash
npm run test:e2e
```

O teste percorre o fluxo inteiro num navegador real: o superadmin cadastra uma loja;
o dono da pizzaria entra, troca logo, banner, cores, endereço e WhatsApp, cadastra um
produto com foto e preço; o cardápio público mostra as alterações; um pedido é feito;
o pedido aparece no painel certo e muda de status; o consumidor vê o novo status; e
a outra loja tenta ler e alterar pedidos, produtos e imagens da pizzaria (tudo negado),
além de chamadas sem login e de outro site. Precisa do Playwright com Chromium
(`npx playwright install chromium`; ou defina `CHROMIUM_PATH`).

Outros comandos: `npm run typecheck`, `npm run lint`.

## Estrutura

```
src/app/                 páginas e rotas de API (Next.js App Router)
  page.tsx               página comercial
  [slug]/                cardápio público e acompanhamento de pedido
  admin/                 login e painel da loja
  super/                 painel da plataforma
  api/                   APIs (auth, admin, public, super, images)
src/components/menu/     cardápio, carrinho, finalização, Pix
src/components/admin/    painel (pedidos, produtos, configurações)
src/lib/                 banco, autenticação, validação, regras de negócio
  repo/                  acesso a dados (sempre filtrado por loja)
scripts/                 seed e gerador das ilustrações
tests/e2e.mjs            teste de ponta a ponta
```

## Limitações conhecidas

- O limitador de tentativas guarda contadores em memória: vale por processo. Se rodar
  várias instâncias, use um limitador compartilhado (ex.: Redis).
- As ilustrações da demo são vetoriais (desenhadas pelo gerador), não fotos. O dono
  da loja envia as fotos reais pelo painel.
- Pizza meio a meio não tem fluxo próprio; o consumidor pode pedir nas observações ou
  a loja pode criar um grupo de opções "2º sabor".
