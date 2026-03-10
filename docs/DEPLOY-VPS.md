# Atualização no VPS (deploy manual)

Guia objetivo para atualizar o **shopping-list-bot** no servidor após `git pull`.  
Recomenda-se executar na ordem indicada.

---

## Script de deploy (recomendado)

Na raiz do projeto:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O script executa em sequência: `git pull`, `pnpm install`, `db:generate`, `prisma migrate deploy`, `build`, `pm2 restart`.  
Se o processo no PM2 tiver outro nome, use: `PM2_APP_NAME=meu-app ./scripts/deploy.sh`.  
Qualquer comando que falhar interrompe o script (`set -e`).

---

## Pré-requisitos no servidor

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PM2 (`npm install -g pm2`)
- Variável de ambiente `DATABASE_URL` configurada (ex.: `file:./prisma/prod.db`)

---

## 1. Backup do banco (antes de mudanças maiores)

Se houver migrations novas ou alterações sensíveis, faça backup do arquivo do banco **antes** de aplicar migrations.

**SQLite (projeto atual):**

```bash
# Ajuste o caminho conforme onde está o arquivo do banco (ex.: em prisma/ ou raiz)
cp prisma/prod.db prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)
```

Guarde o backup em local seguro se for rollback.

---

## 2. Atualizar código

```bash
cd /caminho/do/shopping-list-bot
git pull
```

---

## 3. Instalar dependências

```bash
pnpm install
```

Instala e atualiza dependências de produção e desenvolvimento (Prisma CLI está em devDependencies e é necessário para `migrate deploy`).

---

## 4. Gerar cliente Prisma

```bash
pnpm run db:generate
```

Equivalente a `npx prisma generate`. Necessário após mudanças no schema ou após `pnpm install`.

---

## 5. Aplicar migrations no VPS

No servidor use **sempre** `migrate deploy` (não `migrate dev`):

```bash
pnpm exec prisma migrate deploy
```

Ou:

```bash
npx prisma migrate deploy
```

Isso aplica as migrations pendentes sem criar novas. O banco deve estar acessível (`DATABASE_URL` configurada).

---

## 6. Build

O projeto **tem** build TypeScript. É obrigatório antes de subir o processo:

```bash
pnpm run build
```

Gera a pasta `dist/` a partir de `tsconfig.build.json`. O comando de produção usa `node dist/index.js`.

---

## 7. Reiniciar o processo (PM2)

Assumindo que o app está rodando com PM2 com o nome `shopping-list-bot`:

```bash
pm2 restart shopping-list-bot
```

Se usar outro nome, troque no comando. Para listar processos:

```bash
pm2 list
```

---

## Comandos finais recomendados (sequência para deploy)

Execute na raiz do projeto, na ordem:

```bash
# 1. Backup do banco (opcional, recomendado em releases com migrations)
cp prisma/prod.db prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)

# 2. Atualizar código
git pull

# 3. Dependências
pnpm install

# 4. Cliente Prisma
pnpm run db:generate

# 5. Migrations (VPS: sempre migrate deploy)
pnpm exec prisma migrate deploy

# 6. Build
pnpm run build

# 7. Restart PM2
pm2 restart shopping-list-bot
```

---

## Resumo rápido

| Etapa              | Comando                              |
|--------------------|--------------------------------------|
| Backup (opcional)  | `cp prisma/prod.db prisma/prod.db.backup.$(date +%Y%m%d-%H%M%S)` |
| Código             | `git pull`                           |
| Dependências       | `pnpm install`                       |
| Prisma client      | `pnpm run db:generate`               |
| Migrations (VPS)   | `pnpm exec prisma migrate deploy`    |
| Build              | `pnpm run build`                     |
| Restart            | `pm2 restart shopping-list-bot`     |

---

## Observações

- **`migrate dev`** não deve ser usado no VPS: ele é interativo e pode criar novas migrations. No servidor use apenas **`migrate deploy`**.
- O script **`db:migrate`** do `package.json` chama `prisma migrate dev`; no VPS use explicitamente `prisma migrate deploy` como acima.
- Se o banco estiver em outro path (ex.: `/var/lib/app/prod.db`), ajuste o `cp` do backup e a `DATABASE_URL` no `.env` do servidor.
