# OryX 3.0 — especificação consolidada

## Princípios
- Android + Web/PWA + Samsung DeX; base React/TypeScript + Capacitor.
- 100% gratuito, sem anúncios, somente doações voluntárias opcionais.
- Catálogo de áudio com fontes permitidas, biblioteca de arquivos pessoais e pesquisa de metadados. Sem distribuição de músicas comerciais sem licença.
- Reprodução em segundo plano e tela de bloqueio no Android: exige implementação e testes nativos adicionais.
- Checkpoint temporário a cada cinco versões, substituindo o checkpoint anterior, preservando a versão estável.

## Núcleo / prioridade 1
- Importação de áudio local, URLs diretas autorizadas, fila, favoritos, volume, busca, letras quando licenciadas, controles de mídia.
- Smart Catalog: deduplicação de resultados e variantes originais, slowed, sped-up, nightcore, remix, acústico, ao vivo.
- Smart Next: familiar, equilibrado (padrão), explorar; respeitar fila manual, não repetir a mesma obra seguida.
- Robustez: tratamento de falhas, testes, cache dentro das permissões, qualidade, economia de dados, restauro de fila.

## Universe / prioridade 2
- OryX Flow, Daily Drop, Vibe Rooms, Motion Player, Swipe, World, Immersive, Replay, Memories, Identity.
- Nesta versão: painéis locais funcionais com dados da biblioteca; World usa categorias, sem mapa externo; Replay mede inícios de reprodução, não minutos.

## Social / prioridade 3
- OryX Social, Friends Mix, perfis públicos, compartilhamento de playlists, privacidade, comunidade moderada.
- Nesta versão: texto de playlist compartilhável; login, seguidores e mistura remota aguardam backend.

## Recursos avançados aprovados / backlog
- Infinity, Studio/equalizador, Lyrics Live, Mood, Party, Themes, Sleep, Discover, Desktop Mode, Connect, Widgets, Mini Player, Vinyl, DJ, Identify, Live Rooms, Galaxy, Ambient, Lyrics Studio, Import, Daily, AI DJ, Blend, Mood Check, Time Machine, Auto Playlist, Beat Match, Codes, Privacy, Access, Smart Storage, Release Radar, Artist Hub, Magic Playlist, Translate, Music Cards, Support Artists, Offline First, Audio Quality, Secure, Radio, Memories, Shortcuts, Safe Community, Artist Analytics, Turbo, Taste DNA, Playlist Fusion, Lyrics Share, Smart Cache, Volume Care, Data Saver, Smart Filters, Reactions, Search Pro, Verified Artists, Restore Queue.
- Taste Profile sugerido, ainda não aprovado explicitamente.

## Integrações futuras
- Login Google/e-mail, perfis @ únicos e sincronização (Supabase em avaliação), sistema de recomendações com catálogo permitido, API MusicBrainz para metadados, Jamendo quando licenças e condições de API permitirem.
- Pagamentos voluntários: somente depois de conferir regras da Play Store, impostos e provedor.
- Android: serviço de mídia nativo/MediaSession para segundo plano e tela bloqueada; controles Web sujeitos ao navegador.

## Honestidade de status
- Este pacote não contém músicas comerciais nem chaves de API.
- Não há autenticação, backend social, sincronização entre aparelhos ou catálogo comercial integrado.
- Nenhuma garantia de APK funcional sem build Android e testes em aparelho.
