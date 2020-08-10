# Reducir el bloatware

La mayoría de los paquetes los he sacado de [este tutorial](https://forum.xda-developers.com/galaxy-note-9/how-to/note-9-debloat-bash-script-t3907659) donde se han dado el trabajo de hacer una lista con todo el bloatware de los Samsung.

Estos comandos son pues específicos para la gama Galaxy de Samsung,
pero debería ser posible encontrar los servicios equivalentes para otros teléfonos Android.

Los comandos necesarios para deshabilitar o habilitar una app en un móvil Android son:

```bash
  adb shell pm disable-user --user 0 com.app.loquesea
  adb shell pm enable com.app.loquesea
```

También podemos desinstalar paquetes, pero es 

```bash
  adb shell pm uninstall -k --user 0 <package name>
```


## Reducir la cantidad de elementos en el menú compartir

Por ejemplo, el menú compartir de Android está lleno de elementos más o menos inútiles que hacen que,
cada vez que uno intenta compartir un archivo, foto, etc, las cosas cambien de orden
y gran parte de la pantalla esté ocupada por herramientas -a mi parecer- inútiles.


```bash
  adb shell pm disable-user --user 0 com.samsung.android.app.simplesharing
  adb shell pm disable-user --user 0 com.samsung.android.smartmirroring
  adb shell pm disable-user --user 0 com.samsung.android.app.sharelive
  adb shell pm disable-user --user 0 com.samsung.android.aware.service
```

Y para activarlos de nuevo hay que correr los mismos 

```bash
  adb shell pm enable com.samsung.android.simplesharing
  adb shell pm enable com.samsung.android.smartmirroring
  adb shell pm enable com.samsung.android.app.sharelive
  adb shell pm enable com.samsung.android.aware.service
```

## Game services

```bash
  adb shell pm disable-user --user 0 com.enhance.game.service
  adb shell pm disable-user --user 0 com.samsung.android.game.gamehome
```

## Samsung stuff

El autocompletado de Samsung functiona solo usando Samsung Internet (que no uso) así que no hay problema en desactivarlo.

```bash
  adb shell pm disable-user --user 0 com.samsung.android.samsungpassautofill
```

Lo mismo el Link Sharing, es útil entre cuentas Samsung, inútil para mí.

```bash
  adb shell pm disable-user --user 0 com.samsung.android.app.simplesharing
```

Los mensajes de Samsung tampoco los utilizo, por lo que no necesito escribir en ellos.

```bash
  adb shell pm disable-user --user 0 com.samsung.android.service.livedrawing
```

Bixby es algo bastante molesto que es fácil desactivar.

```bash
  # This one seems to reactivate itself... so we might uninstall
  adb shell pm disable-user --user 0 com.samsung.android.app.spage
  adb shell pm disable-user --user 0 com.samsung.android.bixby.service
  adb shell pm disable-user --user 0 com.samsung.android.bixby.agent
  adb shell pm disable-user --user 0 com.samsung.android.bixby.agent.dummy
  adb shell pm disable-user --user 0 com.samsung.android.bixby.wakeup
  adb shell pm disable-user --user 0 com.samsung.android.visionintelligence
```

La LED Cover no funciona asï que mejor no tenerla habilitada, la verdad.

```bash
  adb shell pm disable-user --user 0 com.sec.android.cover.ledcover
  adb shell pm disable-user --user 0 com.samsung.android.app.ledcoverdream
```


## Google and Android

Duo no lo uso nunca, por lo que es mejor desahibilitarlo.

```bash
  adb shell pm disable-user --user 0 com.google.android.apps.tachyon
```
