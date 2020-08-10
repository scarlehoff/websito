# Reducir la cantidad de elementos en el menú compartir

El menú compartir de Android está lleno de elementos más o menos inútiles que hacen que,
cada vez que uno intenta compartir un archivo, foto, etc, las cosas cambien de orden
y gran parte de la pantalla esté ocupada por herramientas -a mi parecer- inútiles.

Estos comandos son específicos para la gama Galaxy de Samsung,
pero debería ser posible encontrar los servicios equivalentes para otros teléfonos Android.

```bash
  adb shell pm disable-user --user 0 com.samsung.android.app.simplesharing
  adb shell pm disable-user --user 0 com.samsung.android.smartmirroring
  adb shell pm disable-user --user 0 com.samsung.android.app.sharelive
  adb shell pm disable-user --user 0 com.samsung.android.awarae.service
```

Y para activarlos de nuevo:

```bash
  adb shell pm enable com.samsung.android.simplesharing
  adb shell pm enable com.samsung.android.smartmirroring
  adb shell pm enable com.samsung.android.app.sharelive
  adb shell pm enable com.samsung.android.awarae.service
```
