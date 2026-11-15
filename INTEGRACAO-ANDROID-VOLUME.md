# Integração de volume Android — pendente de build nativo

O código React chama o plugin Capacitor `OryXSystemVolume` no Android e controla apenas o volume do elemento de áudio no navegador. Para ativar o volume do sistema no APK:

1. Gerar o projeto Android com `npm install`, `npm run build` e `npx cap add android` (somente se ainda não existir).
2. Copiar `android-native/OryXSystemVolumePlugin.java` para a pasta Java correspondente ao pacote do aplicativo em `android/app/src/main/java/.../`, **ajustando a linha `package` para o pacote real**.
3. Na `MainActivity.java`, antes de `super.onCreate(savedInstanceState)`, chamar `registerPlugin(OryXSystemVolumePlugin.class);` (importar a classe se necessário). Exemplo: `@Override public void onCreate(Bundle savedInstanceState) { registerPlugin(OryXSystemVolumePlugin.class); super.onCreate(savedInstanceState); }`.
4. Rodar `npx cap sync android` e compilar/testar em aparelho físico. O sistema pode limitar alterações de volume conforme configurações de segurança, DND e políticas do fabricante.

Não há pasta Android gerada neste pacote: o plugin Java é um **modelo de integração ainda não compilado**, não uma funcionalidade já validada no APK. No Web/PWA, o navegador não tem permissão para modificar o volume global do celular.
