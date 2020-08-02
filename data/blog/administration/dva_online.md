# D.VA Online!

Hace algún tiempo compré un ratón con el logo de [D.VA](https://overwatch.gamepedia.com/D.Va) de Overwatch.
Así que pensé que sería gracioso hacer que el ordenador gritase lo de "D.VA online!" cada vez que le conecto el ratón.

Lo primero, evidentemente, es conseguir el sonido.
Yo estoy usando un fichero .wav que no recuerdo bien de dónde saqué, pero en la gamepedia [está](https://overwatch.gamepedia.com/File:D.Va_-_D.Va_online.ogg).

Lo primero que hice fue añadir dos reglas a `/etc/udev/rules.d/80-dvamouse.rules`.
En el `idVendor` y `idProduct` tendréis que rellenar con los valores correspondientes al dispositivo que estais conectando.
Lo podéis sacar por ejemplo de `lsusb`.

```
  ACTION=="add", ATTRS{idVendor}=="11ff", ATTRS{idProduct}=="1111", RUN+="/usr/bin/su <my username> -c /path/to/the/script"
  ACTION=="remove", ATTRS{idVendor}=="11ff", ATTRS{idProduct}=="1111", RUN+="/usr/bin/rm /tmp/funcionadva"
```

La idea es correr el script que produce el sonido cada vez que el ratón se conecta (y marcarlo como conectado con un fichero temporal) y eliminar la "marca" cuando se desconecte.

El script es este de aquí:

```bash
run_dva_sound(){ 

    USER=<my username>
    DVAwav=/path/to/dva.wav

    if [[ ! -f /tmp/funcionadva ]]
    then
        /usr/bin/sudo -u ${USER} /usr/bin/paplay --server /run/user/1000/pulse/native ${DVAwav} > /dev/null 2>&1
    fi
    touch /tmp/funcionadva
}

run_dva_sound &
```

¡Importante recordar usar el nombre de usuario y el path hacia el script correcto!
