# Duas melhorias do player OryX 3.0

1. **Velocidade de reprodução:** 0,75×, 1×, 1,25×, 1,5× e 2×; preferência guardada localmente.
2. **Sleep Timer:** pausa a reprodução após 15, 30, 45 ou 60 minutos; pode ser cancelado. Usa horário absoluto para resistir a atrasos de timers em abas inativas, mas depende da execução do JavaScript no navegador/WebView.

**Limites:** recursos implementados na UI Web/React, não validados em aparelho Android. Não substituem serviço de áudio nativo em segundo plano. Build TypeScript/Vite depende de instalar as bibliotecas.
