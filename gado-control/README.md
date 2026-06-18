# GadoControl

Sistema de gestão de gado leiteiro — vacas, inseminações e bezerros.

## Funcionalidades

### Vacas
- Cadastro com status: Vazia, Prenha, Lactação, Seca, Pré-Parto, Em Protocolo IATF
- Listagem com todas as datas do ciclo:
  - **Parto** → **Fim Lactação** (7 meses) → **Início Seca** → **Pré-Parto** (30 dias antes do fim da seca) → **Fim Seca** (60 dias de descanso)
- Registrar parto (somente vacas prenhas) → cadastra bezerro automaticamente
- Após 40 dias do parto: alerta para inseminar ou entrar em Protocolo IATF
- Registrar cio manualmente

### Inseminações
- Registro de inseminação
- Após **21 dias** sem repetir cio → verificar prenhez
- Confirmar prenhez ou marcar repetição de cio

### Bezerros
- Cadastro automático no parto
- **90 dias** no bezerreiro
- Programa de leite:
  - **1º mês:** 6L/dia (3 manhã + 3 tarde)
  - **2º mês:** 4L/dia (2 + 2)
  - **3º mês:** 3L manhã (desmame)
  - **4º mês:** sem leite

## Setup Supabase (gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto (plano Free)
3. Vá em **SQL Editor** e execute o arquivo `supabase/schema.sql`
4. Em **Settings → API**, copie:
   - **Project URL**
   - **anon public key**
5. Edite `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://SEU_PROJETO.supabase.co',
  supabaseKey: 'SUA_CHAVE_ANON',
};
```

## Desenvolvimento local

```bash
cd gado-control
npm install
npm start
```

Acesse `http://localhost:4200`

## Deploy no GitHub Pages (gratuito)

1. Crie um repositório no GitHub (ex: `gado-control`)
2. Envie o código para a branch `main`
3. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**
4. Em **Settings → Secrets → Actions**, adicione:
   - `SUPABASE_URL` — URL do Supabase
   - `SUPABASE_KEY` — chave anon do Supabase
5. O workflow `.github/workflows/deploy.yml` faz o deploy automaticamente

> Se o nome do repositório for diferente de `gado-control`, altere o `baseHref` em `angular.json` (produção) para `/<nome-do-repo>/`.

## Estrutura

```
src/app/
  core/          # modelos, serviços, utilitários de datas
  layout/        # sidebar e layout principal
  pages/         # painel, vacas, inseminações, bezerros
  shared/        # componentes reutilizáveis
supabase/
  schema.sql     # schema do banco
```

## Ciclo da vaca (resumo)

```
Prenha → Parto → Lactação (7 meses) → Seca (60 dias) → Pré-Parto (últimos 30 dias da seca) → Vazia
                ↓
         Bezerro cadastrado
                ↓
    40 dias após parto: inseminar ou Protocolo IATF
```
