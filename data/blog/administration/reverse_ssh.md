# Tunnel SSH inverso

La idea de un túnel ssh es que si, por ejemplo, tenemos permitido el accesso desde máquina A
a máquina B, pero no desde máquina B a máquina A (imaginemos que hay una máquina de login C en el medio que por lo que sea está rota) podamos todavía acceder a máquina A.

Es decir, para acceder a máquina B desde máquina A, podemos simplemente hacer
```bash
~$ ssh b_machine
```

Pero sin embargo, para acceder a máquina A
```bash
~$ ssh c_login_machine
<login in c_login_machine>
Welcome to Login Machine C!
you@login_c:~$ ssh a_machine
```

Queremos pues una manera de saltarnos ese paso si, por ejemplo, `c_login_machine` está caída.

Esto es realmente fácil y de hecho he ya preparado varios scripts para activar
túneles allá donde el [pybliotecario](https://github.com/scarlehoff/pybliotecario)
está corriendo.

La idea es abrir un tunel ssh inverso con el siguiente comando en machine a!

```bash
you@machine_a:~$ ssh -R 41234:localhost:22 b_machine -Nf
```

Donde `-R` le dice que es un puerto inverso, `Nf` nos devuelve a la shell (no es necesario, pero es útil para scripting), el puerto 41234 es el que usarás luego desde `machine_b` para conectarte y el puerto 22 es el puerto que se usa para conectarse en `machine_a`.

Una vez hecho esto, nos volvemos a machine b y podemos hacer:

```bash
you@machine_b:~$ ssh localhost -p 41234
```

Easy peasy!

Obviamente si para entrar en `machine_a` tienes "necesidades especiales" siempre puedes añadir una entrada a tu `~/.ssh/config`, por ejemplo:

```config
  Host tunnelToA
      Hostname localhost
      User specialUser
      Port 41234
      StrictHostKeyChecking False
```
