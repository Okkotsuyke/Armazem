# Teste de Conexão com Syonet

Este diretório contém scripts para testar a conexão com o CRM Syonet.

## Scripts Disponíveis

### 1. `simple-syonet-test.ts` - Teste Simples (Recomendado)
Teste básico de login e APIs internas.

```bash
cd apps/api
npx tsx scripts/simple-syonet-test.ts
```

**Características:**
- Abre navegador visível para debug
- Mostra todos os campos encontrados na página
- Testa múltiplas APIs internas
- Salva screenshots em caso de erro

### 2. `test-syonet-connection-v2.ts` - Teste Completo
Teste mais elaborado com extração de dados.

```bash
cd apps/api
npx tsx scripts/test-syonet-connection-v2.ts
```

### 3. `test-syonet-connection.ts` - Script Original
Script original do projeto.

```bash
cd apps/api
npx ts-node test-syonet-connection.ts
```

## Configuração

O teste usa as credenciais configuradas em `apps/api/.env`:

```env
SYONET_URL="https://viasul.syonet.com"
SYONET_USERNAME="camila.brito"
SYONET_PASSWORD="C@mila1234"
```

## Fluxo do Teste

1. **Login**: Navega para página de login e preenche credenciais
2. **Autenticação**: Aguarda redirecionamento para `acessaSistema`
3. **APIs**: Testa endpoints internos do Syonet
4. **Extração**: Tenta extrair dados de Funil e Produtividade

## Endpoints do Syonet Testados

| Endpoint | Descrição | Status |
|----------|-----------|--------|
| `/api/dashboard` | Lista de dashboards | ? |
| `/api/empresa` | Lista de empresas | ? |
| `/api/usuario` | Lista de usuários | ? |
| `/api/funil` | Dados do funil | ? |
| `/api/v1/dashboard` | API v1 dashboards | ? |
| `/api/v1/empresa` | API v1 empresas | ? |

## IDs de Dashboards Conhecidos

| ID | Nome |
|----|------|
| 189 | Incluidos / Agendados / Comparecidos / Vendas |
| 162 | Produtividade Resultado |
| 244 | Funil de Vendas |

## IDs de Empresas (Lojas)

| ID | Nome | Marca |
|----|------|-------|
| 71 | VIASUL PIEDADE - PE | FIAT |
| 72 | VIASUL ARRUDA - PE | FIAT |
| 75 | VIASUL DUNAS - CE | FIAT |
| 91 | BYD ARRUDA - PE | BYD |
| 92 | BYD CAMINHO DAS ARVORES - BA | BYD |
| 102 | BYD WASHINGTON SOARES - CE | BYD |

## Troubleshooting

### "Campos de login não encontrados"
- A página pode estar usando um framework SPA diferente
- Tente tirar screenshot: `await page.screenshot({ path: 'debug.png' })`

### "Login falha mesmo com credenciais corretas"
- Verifique se o usuário tem permissão de acesso
- Teste manualmente no navegador primeiro

### "APIs retornam 401 ou 403"
- A sessão pode ter expirado
- Tente fazer login novamente

### "Navegador não abre"
- Verifique se o Playwright está instalado: `npx playwright install chromium`
