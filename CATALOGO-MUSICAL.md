# OryX Smart Catalog — versão inicial

- Resultados de descoberta são deduplicados por artista, título normalizado, versão e duração.
- Original, slowed, sped-up, nightcore, remix, ao vivo e acústico são versões separadas.
- Deduplicação heurística: títulos e metadados incompletos podem gerar falsos positivos/negativos; uma futura integração com identificadores de gravação e fingerprints será mais precisa.
- Arquivos locais são reproduzidos somente após seleção pelo usuário. Nenhuma gravação comercial está embutida neste pacote.
- Resultados do YouTube são abertos na plataforma oficial; não há extração de áudio nem reprodução interna desses vídeos.
- Para streaming dentro do OryX, integrar apenas fontes cujas condições permitam a reprodução desejada.
