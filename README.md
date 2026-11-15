# OryX 3.0 — início do desenvolvimento

Projeto reaproveitado do OryX 2.1. **Protótipo em desenvolvimento**, não é versão final nem aplicativo pronto para publicação.

## Já disponível neste código
- React, TypeScript, Vite, Capacitor Android e interface Web responsiva.
- Player para arquivos locais selecionados pelo usuário e URLs diretas de áudio autorizadas.
- Busca de letras LRCLIB (sujeita à disponibilidade e aos direitos aplicáveis).
- Favoritos locais, fila em memória, volume salvo, controle de mídia Media Session, interface DeX em telas largas.
- Descoberta opcional de vídeos no YouTube, **abrindo-os no site oficial**; não há extração de áudio de vídeos.
- Manifesto PWA inicial (sem service worker ou offline completo).

## Para testar
`npm install` e `npm run dev`. Para compilar: `npm run build`.
Para Android: `npm run android:add` (primeira vez) e `npm run android:sync` com Android SDK/Java instalados.

## Não implementado
Autenticação Google/e-mail, Supabase, catálogo licenciado de streaming, sincronização na nuvem, download offline de streaming, recomendações inteligentes, ferramentas de artistas e testes em hardware Android/DeX.

## Cuidados
Não inclua segredos no frontend. O backend legado de extração de áudio foi retirado desta cópia. A descoberta online exige API própria para metadados autorizados, configurada por `VITE_YOUTUBE_API_BASE_URL`. Direitos de execução pública/distribuição devem ser tratados antes do lançamento.

## GitHub
Este pacote é uma cópia local de desenvolvimento. Nenhum commit ou push foi feito.

## Revisão de estabilidade (15/11/2026)
- Corrigido volume inicial: na primeira execução agora inicia em 85%, em vez de 0%.
- Evitado adicionar entradas duplicadas ao importar arquivos de áudio; URLs temporárias duplicadas são liberadas.
- Ao trocar rapidamente de faixa, uma tentativa antiga de reprodução não deve continuar tocando.
- Estado de carregamento limpo ao terminar a faixa.
- Handlers da Media Session atualizados quando a repetição muda.
- **Validação pendente:** a instalação de dependências expirou por timeout neste ambiente; compilação e teste em Android real ainda não foram concluídos.
- **Músicas:** arquivos locais e URLs diretas autorizadas são as fontes disponíveis; não existe catálogo de streaming licenciado integrado.
- **Recuperação:** a cada cinco versões de desenvolvimento, substituir o checkpoint temporário anterior, mantendo uma referência estável independente.


## Revisão de robustez (15/11/2026)
- Tratamento de falha no armazenamento local (modo privado).
- Remoção de arquivos duplicados antes da reprodução automática.
- URLs malformadas não interrompem a interface.
- Ações de mídia não suportadas pelo navegador são ignoradas.
- Ainda requer instalação de dependências, build, testes Android e catálogo musical autorizado.
- Checkpoint temporário substituído a cada 5 versões; versão estável preservada separadamente.

## Smart Next (protótipo)
O modo **Equilibrado** é o padrão. Ao terminar uma faixa, o app pode selecionar outra da fila já carregada, usando curtidas, artista, título e histórico recente. Modos Meu gosto e Explorar disponíveis. Não busca nem licencia músicas novas e não substitui a fila manual quando o usuário avança pelo botão. Requer testes de compilação e reprodução em dispositivos reais.

**Verificação pendente:** a instalação offline das dependências falhou (`ENOTCACHED`), portanto o build ainda não foi validado.
