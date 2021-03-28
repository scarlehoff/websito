# Background task usando notificaciones push desde firebase

Un problema común en el desarrollo móvil es el de mandar tareas en background,
en general los sistemas operativos ponen muchas limitaciones (así se evitan gastos de
batería inútil) y ciertos _vendors_ restringen todavía más.

Tras darle muchas vueltas no conseguía nada que funcionase infinitamente, así que al
final he decidido tomar un camino bastante más _hacky_ (pero que mucha gente recomienda).

### Usar notificacines push para despertar al dispositivo.

Para esto he decidido usar la librería [react-native-push-notification](https://github.com/zo0r/react-native-push-notification) pues es muy fácil de usar, junto a [firebase](https://firebase.google.com/).

Para empezar simplemente instalamos [react-native-push-notification](https://github.com/zo0r/react-native-push-notification)
siguiendo el readme al pie de la letra. Al final añadiremos un par de cositas extras.

El segundo paso es crear un nuevo proyecto (android) en firebase.
Una vez hecho tendremos un `google-services.json` que debemos poner en `android/app` tal
y como explica la documentación de [react-native-push-notification](https://github.com/zo0r/react-native-push-notification#if-you-use-remote-notifications).

Perfecto, ahora para comprobar que funciona simplemente metemos el [`PushNotification.configure`](https://github.com/zo0r/react-native-push-notification#usage) en `index.js` como se explica en el readme.
Hecho esto podemos probar a enviar una notificación desde firebase y la deberíamos recibir en nuestro dispositivo. Perfecto.

El truco que vamos a usar para correr acciones en background es el método `onNotification`,
cada vez que recibimos una notificación `onNotification` es llamado, a no ser que la notificación
especifique cómo debe ser mostrada.
Entonces pues necesitamos mandar notificaciones vacías, así el sistema no sabrá como mostrarlas
y delegará en `onNotification`.
Para hacer esto necesitamos el server token de firebase y cualquier cosa que nos permita enviar
requests (por simplicidad aquí voy a usar curl):

```bash
curl --insecure --header "Authorization: key=<meter server key aqui>" --header "Content-Type:application/json" -d "{\"notification\":{},\"to\":\"/topics/all\"}" https://fcm.googleapis.com/fcm/send
```

¡Perfecto!
Sin embargo, si probamos a hacerlo, veremos que a nuestro dispositivo no llega nada.
En efecto, esta notificación se manda tan solo a los dispositivos definidos en el `to`,
aquí debemos meter o el id del dispositivo (si queremos personalizar las notificaciones
para cada dispositivo) o meter un topic (tema en firebase en español) al cual estén suscritos
todos los dispositivos a los que queremos enviar la notificación.

En mi caso quiero que todos los dispositivos se despierten a la misma hora, así que digo a firebase
de mandar una notificación a `topics/all`, y luego suscribo a todos los devices que quieren correr
la tarea en background al tema `all` con:

```js
  ...
  onRegister: function (token) {
    PushNotification.subscribeToTopic("all");
  },
  ...
```

Como último apunte, ya que estamos mandando notificaciones vacías,
es una buena idea configurar un [canal por defecto](https://github.com/zo0r/react-native-push-notification#channel-management-android) para las notificaciones que vienen
desde firebase.

¡Una vez hecho esto ya podemos mandar tareas en background a nuestro dispositivo
con la seguridad de que el dispositivo será despertado justo cuando nosotros queremos!

```js
  ...
  onNotification: function (notification) {
    // do background task here
    // we could even pop up a custom notification here with the data we got!
    return;
  },
  ...
```
