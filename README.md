# Shopping List Bot

Bot de lista de compras desenvolvido com Node.js, TypeScript e Fastify.

## Requisitos

- Node.js 20+
- pnpm (gerenciador de pacotes)

## Instalação

```bash
pnpm install
```

## Scripts Disponíveis

### Desenvolvimento

```bash
pnpm dev
```

Inicia o servidor em modo de desenvolvimento com hot-reload usando `tsx`.

### Build

```bash
pnpm build
```

Compila o TypeScript para JavaScript na pasta `dist/`.

### Produção

```bash
pnpm start
```

Inicia o servidor usando o código compilado em `dist/`.

### Testes

```bash
pnpm test
```

Executa os testes com Vitest.

```bash
pnpm test:watch
```

Executa os testes em modo watch.

### Lint

```bash
pnpm lint
```

Verifica o código com ESLint.

### Formatação

```bash
pnpm format
```

Formata o código com Prettier.

```bash
pnpm format:check
```

Verifica se o código está formatado corretamente.

### Simulador de WhatsApp

```bash
pnpm sim
```

Inicia o simulador de WhatsApp para testar o bot sem precisar do WhatsApp real. Permite simular mensagens de diferentes grupos e usuários.

## Estrutura do Projeto

```
.
├── src/
│   ├── app/          # Configuração do Fastify e rotas
│   ├── domain/       # Lógica de domínio
│   ├── infra/        # Infraestrutura (banco de dados, APIs externas)
│   └── simulator/    # Simuladores e mocks
├── test/             # Testes
└── dist/             # Código compilado (gerado)
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=3000
HOST=0.0.0.0

# Repositório (MEMORY ou PRISMA)
REPOSITORY_TYPE=MEMORY

# Database (se usar PRISMA)
DATABASE_URL="file:./dev.db"

# WhatsApp Cloud API (opcional)
# Se não configurado, o bot funciona apenas com /webhook/mock e simulador
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=seu_verify_token_personalizado

# LLM Item Extraction (opcional)
# Habilita extração de itens usando OpenAI para mensagens ambíguas
ENABLE_LLM_ITEM_EXTRACTION=false
OPENAI_API_KEY=sua_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Parser Debug (opcional)
# Habilita logs detalhados do parser para diagnóstico
PARSER_DEBUG=false
```

### Configuração do WhatsApp Cloud API

O bot suporta integração opcional com WhatsApp Cloud API da Meta. Se as variáveis de ambiente do WhatsApp não estiverem configuradas, o bot funciona normalmente com o endpoint `/webhook/mock` e o simulador.

Para habilitar o WhatsApp:

1. Crie uma conta no [Meta for Developers](https://developers.facebook.com/)
2. Crie um app e configure o WhatsApp Business API
3. Obtenha:
   - `WHATSAPP_PHONE_NUMBER_ID`: ID do número de telefone
   - `WHATSAPP_ACCESS_TOKEN`: Token de acesso permanente ou temporário
   - `WHATSAPP_VERIFY_TOKEN`: Token personalizado para verificação do webhook
4. Configure o webhook no Meta:
   - URL: `https://seu-dominio.com/webhook/whatsapp`
   - Método: GET e POST
   - Campos: `messages`
5. Adicione as variáveis de ambiente no `.env`

**Importante**: Não commite o arquivo `.env` com tokens reais. Use `.env.example` como template.

### Configuração do LLM (Opcional)

O bot suporta extração de itens usando OpenAI para mensagens ambíguas em linguagem natural. Para habilitar:

1. Obtenha uma API key da OpenAI em [platform.openai.com](https://platform.openai.com/)
2. Configure as variáveis de ambiente:
   - `ENABLE_LLM_ITEM_EXTRACTION=true` - Habilita o uso de LLM
   - `OPENAI_API_KEY=sua_chave_aqui` - Sua chave da API OpenAI
   - `OPENAI_MODEL=gpt-4o-mini` - Modelo a usar (padrão: gpt-4o-mini)

**Nota**: O LLM é usado apenas como fallback quando a extração por regras não consegue identificar claramente os itens. Se não configurado, o bot funciona normalmente usando apenas regras.

### Debug do Parser

Para diagnosticar decisões do parser, você pode habilitar logs detalhados:

```env
PARSER_DEBUG=true
```

Quando habilitado, o parser loga:

- Texto original da mensagem
- Intenção classificada (COMMAND, SHOPPING_CANDIDATE, CHAT, IGNORE)
- Itens extraídos por regras
- Decisão de usar LLM
- Itens finais normalizados
- Fallback por erro da LLM (se aplicável)

**Importante**: Os logs não expõem informações sensíveis como API keys.

### Histórico de Parsing (MessageParseEvent)

O bot persiste automaticamente eventos de parsing de mensagens quando usando o repositório PRISMA. Esta tabela armazena:

- Texto original da mensagem
- Itens extraídos por regras
- Itens extraídos por LLM (se usado)
- Itens finais normalizados
- Se o LLM foi usado
- Status do parsing (accepted, ignored, failed)
- Timestamp do evento

**Propósito**: Construir uma base de aprendizado para melhorar o parser ao longo do tempo, analisando padrões de uso e casos onde o LLM foi necessário.

**Nota**: Eventos só são salvos quando `REPOSITORY_TYPE=PRISMA`. Em modo MEMORY, os eventos não são persistidos.

### Feedback de Itens (ItemFeedback)

O bot suporta persistência de feedback de correção de itens quando usando o repositório PRISMA. Esta tabela armazena:

- Texto original da mensagem
- Itens incorretos (wrongItems)
- Itens corretos (correctItems)
- Tipo de feedback (replace, remove_false_positive, add_missing_item, alias_manual)
- ID do evento de parsing relacionado (opcional)
- Timestamp do feedback

**Propósito**: Permitir que usuários corrijam itens extraídos incorretamente, construindo uma base de aprendizado para melhorar o parser e os aliases ao longo do tempo.

**Tipos de feedback**:

- `replace`: Substituir itens incorretos por corretos
- `remove_false_positive`: Remover itens que foram extraídos incorretamente
- `add_missing_item`: Adicionar itens que faltaram na extração
- `alias_manual`: Registrar mapeamento manual de alias (ex: "coca" → "coca-cola")

**Nota**: Feedback só é salvo quando `REPOSITORY_TYPE=PRISMA`. Em modo MEMORY, o feedback não é persistido.

### Aliases por Grupo (GroupItemAlias)

O bot suporta persistência de aliases aprendidos por grupo quando usando o repositório PRISMA. Esta tabela armazena:

- Termo bruto (rawTerm) e item canônico (canonicalItem)
- Fonte do alias (manual, feedback, auto_promoted)
- Contador de uso (usageCount)
- Timestamp da última vez visto (lastSeenAt)

**Propósito**: Memorizar o vocabulário específico de cada grupo/casa, permitindo que o bot aprenda aliases personalizados (ex: "refri" → "coca-cola" em uma casa, mas pode ser diferente em outra).

**Características**:

- Aliases são **por grupo**, não globais
- Quando um alias já existe, o `usageCount` é incrementado e o `lastSeenAt` é atualizado
- Permite atualizar o item canônico se o usuário corrigir
- Suporta diferentes fontes: manual (comando explícito), feedback (correção do usuário), auto_promoted (promovido automaticamente)

**Comandos de aprendizado**:

- `corrigir refri -> coca-cola`
- `refri = coca-cola`
- `refri é coca-cola`
- `refri significa coca-cola`

**Nota**: Aliases só são salvos quando `REPOSITORY_TYPE=PRISMA`. Em modo MEMORY, os aliases não são persistidos.

### Promoção Automática de Aliases

O bot promove automaticamente correções recorrentes para aliases persistentes quando:

- O mesmo padrão de correção (wrong → correct) ocorre **3 ou mais vezes** no mesmo grupo
- As fontes válidas são:
  - `ItemFeedback.feedbackType = "replace"` (correções implícitas ou explícitas)
  - `ItemFeedback.feedbackType = "alias_manual"` (comandos explícitos de aprendizado)

**Regras de promoção**:

- Cria ou atualiza `GroupItemAlias` com `source = "auto_promoted"`
- **Não sobrescreve** aliases manuais existentes com canonical diferente
- Promoção acontece de forma síncrona após gravar feedback
- Apenas funciona em modo PRISMA

**Exemplo**:

1. Usuário remove "papel" e adiciona "papel higiênico" (1ª vez)
2. Usuário remove "papel" e adiciona "papel higiênico" (2ª vez)
3. Usuário remove "papel" e adiciona "papel higiênico" (3ª vez)
4. Bot promove automaticamente: `{ rawTerm: "papel", canonicalItem: "papel higiênico", source: "auto_promoted" }`

## Simulador de WhatsApp

O simulador permite testar o bot localmente sem precisar do WhatsApp real. Ele simula um chat onde você pode enviar mensagens como diferentes usuários em diferentes grupos.

### Como usar

1. Inicie o simulador:

```bash
pnpm sim
```

2. Use os comandos do simulador:

- `/group <nome>` - Mudar grupo (ex: `/group casa`)
- `/user <nome>` - Mudar usuário (ex: `/user mae`, `/user pai`, `/user gabu`)
- `/help` - Mostrar ajuda
- `/exit` ou `/quit` - Sair do simulador

3. Envie mensagens normalmente:

- `lista` - Ver lista de compras
- `limpar lista` - Limpar toda a lista
- `- item` - Remover um item
- `✔ item` ou `check item` - Marcar item como comprado
- `item1` - Adicionar um item
- `item1\nitem2` - Adicionar múltiplos itens (uma por linha)

### Exemplo de uso

```
🤖 WhatsApp Shopping List Bot Simulator

📌 Grupo: casa | Usuário: gabu

[casa][gabu] leite
[casa][bot] ✅ Adicionado: leite

[casa][gabu] pão
[casa][bot] ✅ Adicionado: pão

[casa][gabu] manteiga
[casa][bot] ✅ Adicionado: manteiga

[casa][gabu] lista
[casa][bot] 📝 *Lista de compras:*

*Pendentes:*
1. leite
2. pão
3. manteiga

[casa][gabu] ✔ leite
[casa][bot] ✅ Marcado como comprado: leite

[casa][gabu] lista
[casa][bot] 📝 *Lista de compras:*

*Pendentes:*
1. pão
2. manteiga

*Comprados:*
1. ✔ leite

[casa][gabu] /user mae
✅ Usuário alterado para: mae

[casa][mae] - pão
[casa][bot] ✅ Removido: pão

[casa][mae] limpar lista
[casa][bot] 🗑️ Lista limpa!
```

### Debounce

O simulador implementa debounce de 1 segundo. Se você enviar múltiplas mensagens em sequência rápida, elas serão processadas juntas após 1 segundo de inatividade. Isso simula o comportamento real do WhatsApp onde mensagens podem chegar em sequência.

## Simulador Web (WhatsApp UI)

O simulador web oferece uma interface visual estilo WhatsApp para testar o bot. Ele se conecta ao backend via SSE (Server-Sent Events) para receber mensagens em tempo real.

### Como rodar

1. **Backend** (em um terminal):

```bash
pnpm dev
```

O backend roda na porta `3000` por padrão.

2. **Frontend** (em outro terminal):

```bash
cd simulator-web
pnpm install
pnpm dev
```

O frontend roda na porta `5173` por padrão.

3. **Acesse**: `http://localhost:5173`

### Funcionalidades

- **Sidebar de grupos**: Lista de grupos (casa, apto, etc) com botão para adicionar novos
- **Seletor de usuário**: Escolha entre usuários (mae, pai, gabu) ou adicione novos
- **Chat em tempo real**: Mensagens aparecem automaticamente via SSE
- **Input inteligente**:
  - Enter envia mensagem
  - Shift+Enter quebra linha
- **Botão "Enviar Burst"**: Envia 3 mensagens rápidas (leite, arroz, pão) para testar debounce
- **Histórico**: Carrega últimas 200 mensagens ao trocar de grupo

### Testando Debounce

1. Clique no botão "Enviar Burst"
2. Observe que 3 mensagens são enviadas rapidamente
3. O bot processa todas juntas após 1 segundo e responde com um resumo

### Endpoints do Simulador

#### GET /sim/events?groupId=...

Stream SSE (Server-Sent Events) para receber mensagens em tempo real.

**Eventos:**

- `message`: Nova mensagem recebida
- `heartbeat`: Mantém conexão viva (a cada 15s)

**Formato:**

```
event: message
data: {"id":"...","groupId":"casa","from":"bot","text":"...","createdAt":"..."}
```

#### GET /sim/history?groupId=...

Retorna histórico de mensagens (últimas 200) de um grupo.

**Resposta:**

```json
{
  "groupId": "casa",
  "messages": [...]
}
```

## Endpoints

### GET /health

Retorna o status de saúde da aplicação.

**Resposta:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /webhook/mock

Endpoint para testar o bot sem WhatsApp real. Simula mensagens do WhatsApp.

**Body:**

```json
{
  "groupId": "casa",
  "userId": "gabu",
  "text": "leite"
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "✔ Adicionei 1 item: leite"
}
```

### GET /webhook/whatsapp

Endpoint de verificação do webhook do WhatsApp (usado pelo Meta para validar o webhook).

**Query Parameters:**

- `hub.mode`: deve ser "subscribe"
- `hub.verify_token`: token configurado em `WHATSAPP_VERIFY_TOKEN`
- `hub.challenge`: challenge enviado pelo Meta

**Resposta:** Retorna o `hub.challenge` se o token estiver correto.

### POST /webhook/whatsapp

Endpoint para receber mensagens do WhatsApp Cloud API.

**Body:** Payload do WhatsApp (formato Meta)

O bot processa automaticamente as mensagens recebidas e responde via WhatsApp.

**Nota:** Este endpoint só está disponível se as variáveis de ambiente do WhatsApp estiverem configuradas.

### GET /groups/:groupId/list

Retorna a lista de compras de um grupo.

**Resposta:**

```json
{
  "groupId": "casa",
  "items": [...],
  "count": 2,
  "pending": 1,
  "bought": 1
}
```

### POST /groups/:groupId/clear

Limpa toda a lista de compras de um grupo.

**Resposta:**

```json
{
  "success": true,
  "message": "Lista limpa",
  "groupId": "casa"
}
```

## Tecnologias

### Backend

- **Node.js** 20+
- **TypeScript**
- **Fastify** - Framework web rápido
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **Vitest** - Framework de testes
- **ESLint** - Linter
- **Prettier** - Formatador de código
- **dotenv** - Gerenciamento de variáveis de ambiente
- **WhatsApp Cloud API** - Integração opcional com Meta
- **SSE** - Server-Sent Events para simulador web

### Frontend (Simulador Web)

- **Vite** - Build tool
- **React** - Framework UI
- **TypeScript** - Type safety
- **EventSource API** - SSE client
