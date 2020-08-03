# Usando react-native testeando en Android

Evidentemente, es necesario instalar tanto react-native como Android Studio y el sdk de Android.
Yo estoy usando la versión 4.2 pero si el mundo es un lugar justo seguirá funcionando en el futuro.

Una vez está todo instalado, debemos asegurarnos de que las diferentes herramientas están disponibles
en el `PATH`.

```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Puede ser necesario hacer `unset JAVA_HOME` para asegurarnos de que no está apuntando al sitio equivocado
(o hacerlo apuntar a la versión que te instale android-studio).

### Emulando con android studio

Una vez todo es accesible desde el `PATH` debemos aceptar la licencia...

```
  sdkmanager --licences
```

Ahora debemos abrir Android-Studio para configurar el emulador, que se encuentra en Configure > AVD Manager para preparar uno.
Una vez pulsamos el botón play el emulador empezará a correr y cuando corremos `npx react-native run-android` nuestra app
empezará a correr en el emulador.

### Testeando en un device

Para mi gusto es más útil (y satisfactorio) debuggear usando un teléfono de verdad.
Para esto es tan simple como conectar el teléfono al ordenador (nos aseguramos que está conectado: `adb devices`,
deberíamos ver al menos un device).

Si no aparece puede ser necesario añadir una udev rule para el teléfono.
Con lsusb podemos buscar el ID de nuestro teléfono, por ejemplo:

```
  Bus 001 Device 003: ID 1111:eeee Samsung Electronics Co., Ltd Galaxy series, misc. (MTP mode)
```

y añadimos una rule por ejemplo en `/etc/udev/rules.d/51-android-usb.rules`:

```udev
  SUBSYSTEM=="usb", ATTR{idVendor}=="1111", MODE="0666", GROUP="plugdev"
```
