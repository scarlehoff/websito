# Comprobar paquetes del AUR

Actualmente soy el _maintainer_ de varios paquetes en el Arch User Repository o AUR:

- VegasFlow: [![AUR](https://img.shields.io/aur/version/python-vegasflow)](https://aur.archlinux.org/packages/python-vegasflow/)
- PineAPPL: [![AUR](https://img.shields.io/aur/version/pineappl)](https://aur.archlinux.org/packages/pineappl)
- PDFFlow: [![AUR](https://img.shields.io/aur/version/python-pdfflow)](https://aur.archlinux.org/packages/python-pdfflow)
- eko: [![AUR](https://img.shields.io/aur/version/python-eko)](https://aur.archlinux.org/packages/python-eko)
- banana-hep: [![AUR](https://img.shields.io/aur/version/python-banana-hep)](https://aur.archlinux.org/packages/python-banana-hep)

Me es por tanto bastante útil tener una serie de scripts y workflows para testear que los paquetes funcionan
correctamente en un sistema limpio.
Comprobar estas cosas no es siempre trivial ya que a veces las instalaciones solo fallan para casos muy concretos
así que no hay una receta universal (a no ser que los paquetes en sí mismos traigan tests, claro!).

La mejor aproximación que he encontrado a tener algo funcional es usar la imagen de docker [archlinux-makepkg](https://hub.docker.com/r/imrehg/archlinux-makepkg/dockerfile)
y usar los siguientes comandos.

Primero nos aseguramos de tener la versión más reciente de Arch y entonces instalamos el paquete.

```bash
docker pull imrehg/archlinux-makepkg
docker run -t -d --name arch_test imrehg/archlinux-makepkg
docker cp PKGBUILD arch_test:/home/builder/PKGBUILD
docker exec -it arch_test bash -c "sudo rm -rf pkg"
docker exec -it arch_test sudo pacman -Syu --noconfirm
docker exec -it arch_test makepkg -si --noconfirm
```

Ahora solo tenemos que copiar cualquier script que usemos para testear el paquete instalado y comprobar que funciona en el
container ``arch_test``.
Una vez hayamos acabado podemos eliminar el contenedor sin problemas.

```bash
docker container stop arch_test
docker container prune
```

### Cosas a tener en cuenta
Ejemplos de fallos al instalar pueden ser, por ejemplo, haber dejado links apuntando
al directorio en el que los paquetes han sido creados, en lugar de a sitios tipo `/usr/`,
así que una vez instalado, es una buena idea para testar borrar todo producto de la instalación.

```bash
docker exec -it arch_test bash -c "sudo rm -rf *"
```

Es también importante no olvidar crear el fichero ``SRCINFO`` ya que este no se genera automáticamente:

```bash
makepkg --printsrcinfo > .SRCINFO
```

