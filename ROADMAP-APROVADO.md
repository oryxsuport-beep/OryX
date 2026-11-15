# OryX 3.0 — Roadmap aprovado em 15/11/2026

## Prioridade 0 — APK de teste
1. Enviar o código-fonte completo para uma branch do GitHub.
2. Rodar testes, compilação Web e build Android em CI.
3. Corrigir falhas de compilação e disponibilizar APK de debug.
4. Validar no Samsung: importação de áudio, fila, favoritos, busca, seek, volume, pausa, velocidade e timer.

## Recursos aprovados para depois do primeiro APK
- **Gesture:** swipe horizontal no player e proteção contra conflitos com rolagem vertical. Lógica de reconhecimento inicial em `src/services/gesture.ts`; integração visual pendente.
- **LockScreen:** reprodução em segundo plano, notificação de mídia e controles de bloqueio Android; implementação nativa e teste em dispositivo pendentes.
- **Dynamic Skin:** temas personalizados e preferências persistidas; seleção de cor já existe, expansão pendente.
- **Time Capsule:** playlists com data futura; regras e validação em `src/services/timeCapsule.ts`; interface e persistência pendentes.
- **Voice:** comandos de voz com consentimento, indicação clara de uso do microfone e alternativa por toque; pendente.
- **Battery Guardian:** reduzir animações e tarefas opcionais, respeitando preferência do usuário; pendente.
- **Achievements:** regras locais de conquistas em `src/services/achievements.ts`; interface e persistência pendentes.

Sem DJ e sem equalizador, conforme decisão do projeto. Não declarar esses recursos prontos antes da integração e testes.
