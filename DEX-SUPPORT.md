# Samsung DeX support

O script `scripts/enable-dex.py` é executado pelo workflow após `npx cap add android`. Ele marca a MainActivity como redimensionável (`android:resizeableActivity="true"`) para janelas DeX e multi-window. O CSS em `src/styles.css` oferece layout desktop de duas colunas em larguras a partir de 900 px e foco visível para teclado.

A compatibilidade depende do dispositivo Samsung e da versão de Android/One UI. É necessário gerar um APK novo e testar em um dispositivo DeX real; esta alteração não comprova teste em hardware.
