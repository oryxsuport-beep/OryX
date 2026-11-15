# OryX 3.0 — status de desenvolvimento

## Atualização Smart Next + Smart Catalog
- Recomendações automáticas priorizam outra música em vez de uma versão slowed/sped-up da faixa atual.
- Histórico recente penaliza versões da mesma música.
- Deduplicação evita apagar gravações distintas quando a duração não está disponível.
- Ajustada a identificação de `Slowed + Reverb`.

## Validação
- Testes isolados dos serviços TypeScript: 4 passaram.
- Compilação integral não validada: dependências React/Vite não instaladas no ambiente.
- APK, reprodução Android em segundo plano, login e catálogo musical remoto: ainda pendentes.
- Nenhum arquivo de música comercial foi incluído.

## Política de recuperação
- Checkpoint temporário a cada cinco versões, substituindo o anterior, sem apagar a versão estável.

## Revisão incremental
- Corrigida identificação de versões `sped-up` com hífen.
- Adicionados testes automatizados de catálogo e deduplicação (`npm test`).
- Testes de catálogo: 2 aprovados em Node 22.
- Compilação Web e APK ainda não validados; dependências não instaladas.
- Sem upload para GitHub nesta etapa.

## Verificação de dependências e CI — 15/11/2026
- Node 22.16.0 e npm 10.9.2 detectados.
- `npm install` não concluiu neste ambiente: resolução DNS do registry.npmjs.org falhou com `EAI_AGAIN`.
- Configurado `.github/workflows/web-checks.yml` para instalar dependências, testar, compilar e arquivar `dist` no GitHub Actions.
- Workflow Android existente passou a executar `npm test` antes da compilação.
- `npm test`: 2 testes passaram, 0 falharam.
- Não houve compilação Web ou APK confirmada neste ambiente; não declarar aplicativo pronto.

## Verificação incremental de CI
- Testes locais de catálogo executados com Node 22: 2 aprovados.
- Workflows Web e Android receberam permissões mínimas, controle de concorrência e cache npm.
- Sem lockfile confirmado: npm ci será usado quando existir; caso contrário, npm install.
- Compilação Web e Android ainda dependem de execução em ambiente com acesso às dependências.

2026-11-15: Smart Next prioriza músicas não ouvidas recentemente, incluindo evitar edições da mesma composição; fallback mantém fila funcional. 8 testes locais aprovados. Build Web/Android ainda não validado.
