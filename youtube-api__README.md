# OryX YouTube API — instalação e inicialização automáticas

O backend usa `youtubei.js` e já declara essa biblioteca em `dependencies` no `package.json`. **Não é necessário executar `npm install youtubei.js` manualmente**: quando o serviço for publicado no Render, o comando `npm install` instala automaticamente todas as dependências, incluindo `youtubei.js`, e `npm start` inicia `server.js`.

## Publicação automática no Render

1. Envie os arquivos extraídos para o GitHub (não envie somente o ZIP como arquivo isolado).
2. No Render, crie um serviço usando o Blueprint `render.yaml` desta pasta `OryX`. Se o repositório tiver a pasta `OryX` dentro da raiz, selecione `OryX/render.yaml`; se os arquivos de OryX estiverem diretamente na raiz, mova `render.yaml` para a raiz e ajuste `rootDir` para `./youtube-api`.
3. O Blueprint configura `youtube-api` como diretório do serviço, executa `npm install`, inicia com `npm start` e verifica `/health`.
4. Após o deploy, copie a URL HTTPS do serviço e substitua `https://SEU-SERVICO.onrender.com` em `src/services/youtube.ts`.
5. Gere novamente o APK pelo GitHub Actions para incorporar a URL correta.

Depois da primeira configuração, novos commits no branch conectado podem disparar novo deploy automaticamente conforme as configurações do serviço no Render. O primeiro deploy e a conexão com o Render ainda exigem uma configuração inicial feita pelo usuário.

## Teste de saúde

Abra `https://SUA-URL.onrender.com/health`. A resposta esperada é JSON com `"ok": true`.

## Observações

- `youtubei.js` executa no servidor Node.js, não dentro do APK/Capacitor.
- Não use Electron (`ipcMain` ou `preload.ts`) neste app Android.
- `youtubei.js` é uma biblioteca não oficial e mudanças/restrições do YouTube podem afetar buscas ou reprodução.
- O plano gratuito do Render pode suspender serviços inativos; a primeira solicitação pode demorar para acordar.
