# Vercel Cron Setup Guide - CRM EUROVIA Sync

## O que o Cron faz

O job Cron do Vercel executa o sync de dados do Syonet (CRM da empresa) a cada 15 minutos, mantendo os dados do CRM EUROVIA atualizados.

- **Endpoint:** `GET /api/cron/sync`
- **Frequencia:** A cada 15 minutos (`*/15 * * * *`)
- **Autenticacao:** Via header `x-vercel-cron`

## Configuracao no vercel.json

Ja configurado no arquivo `apps/api/vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "pnpm turbo build --filter=@crm/api",
  "installCommand": "pnpm install",
  "framework": null,
  "outputDirectory": "apps/api/dist",
  "functions": {
    "api/index.ts": { "runtime": "nodejs24.x", "maxDuration": 300 }
  },
  "regions": ["gru1"],
  "crons": [{ "path": "/api/cron/sync", "schedule": "*/15 * * * *" }]
}
```

### Detalhes da Configuracao

| Campo | Valor | Descricao |
|-------|-------|-----------|
| `path` | `/api/cron/sync` | Rota que sera executada |
| `schedule` | `*/15 * * * *` | Executa a cada 15 minutos |
| `maxDuration` | `300` (5 min) | Tempo maximo de execucao |

## Verificacao no Painel Vercel

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Selecione o projeto **api**
3. Va para **Settings** > **Cron Jobs**
4. Verifique se aparece:
   - **Path:** `/api/cron/sync`
   - **Schedule:** `*/15 * * * *`
   - **Region:** GRU1 (Sao Paulo)

## Teste Manual

Para testar o cron localmente ou em production:

```bash
# Testar em production
curl -i -H "x-vercel-cron: 1" https://seu-projeto.vercel.app/api/cron/sync

# Testar localmente (com tunnel como ngrok)
curl -i -H "x-vercel-cron: 1" http://localhost:3000/api/cron/sync
```

### Resposta Esperada

```
HTTP/2 200
x-vercel-cron: true
content-type: application/json

{"success":true,"synced":true,"timestamp":"2026-10-13T10:30:00.000Z"}
```

## Verificacao de Logs

### Via CLI

```bash
# Ver logs de cron do projeto api
vercel logs --project api --cron

# Com filtro de tempo
vercel logs --project api --cron --since 1h

# Ver todos os logs do projeto
vercel logs api
```

### Via Dashboard

1. **Vercel Dashboard** > projeto **api**
2. **Deployments** > selecione o deployment
3. **Runtime Logs** > filtrar por **Function**

## Monitoramento

### Sentry (Erros)

Se o Sentry estiver configurado, erros do cron aparecem em:
- https://sentry.io > projeto CRM_EUROVIA > **Issues**

### Alertas Recomendados

Configure alertas em **Settings > Cron Jobs > Alerts**:
- Falha em execucao
- Execucao demorada (> 4 minutos)
- Ausencia de execucao (> 30 minutos)

## Troubleshoot

### Cron nao executa

1. Verificar se o deployment esta em production
2. Confirmar que a rota `/api/cron/sync` existe
3. Checar logs em tempo real: `vercel logs api`
4. Verificar se ha erros no handler em `apps/api/src/routes/cron.routes.ts`

### Erro 401 Unauthorized

O header `x-vercel-cron` deve ser exatamente `x-vercel-cron: 1`. Verificar:
- Nao usar `x-vercel-cron: true`
- Nao usar `X-Vercel-Cron: 1` (case-sensitive)

### Timeout

Se o sync demorar mais de 5 minutos:
- Aumentar `maxDuration` no vercel.json
- Dividir o sync em batches menores
- Implementar sync incremental

## Referencias

- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)
- [vercel.json crons](https://vercel.com/docs/projects/project-configuration#crons)
- Handler: `apps/api/src/routes/cron.routes.ts`
