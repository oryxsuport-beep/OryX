# OryX 3.0 — preparar teste no celular

## Situação real

Este ZIP contém o **código-fonte**, não um APK instalável. Os 19 testes automatizados passaram no ambiente local. A compilação Web e Android 3.0 ainda não foram validadas.

## Gerar o APK com GitHub Actions

1. Envie os arquivos **extraídos** deste ZIP para uma branch de desenvolvimento do repositório OryX no GitHub, mantendo `package.json` na raiz. Não envie apenas o ZIP.
2. Abra a aba **Actions** do repositório e escolha **Build OryX Android APK**. Use **Run workflow** e selecione a branch com o código 3.0.
3. Aguarde a execução. Se o build falhar, consulte os logs do job `build-apk`.
4. Se passar, abra a execução e baixe o artefato **OryX-debug-APK**. Extraia o ZIP do artefato e instale o arquivo `app-debug.apk` no Android.
5. No Samsung, autorize a instalação dessa origem somente se você confiar no arquivo. Depois teste importação de áudio próprio, reprodução, avanço/retrocesso, fila, busca, favoritos, volume, Sleep Timer e rotação/DeX.

## Atenção

- Reprodução em segundo plano e controles de tela bloqueada ainda exigem implementação e testes nativos.
- Login, sincronização, comunidade e várias ideias do Universe não estão concluídos.
- Não há catálogo comercial licenciado embutido. Use arquivos de áudio que você tem direito de reproduzir.
- DJ e equalizador estão fora do escopo conforme decisão do projeto.
