# Build Stack Password Options

IOTstack creates password controls automatically from Compose environment variables. A service author only needs to describe the variable in `service.yml`; do not add password code to `build.py` or create a `passwords.py` file.

## Required passwords

Use Compose required-variable interpolation when the stack must not build without a value:

``` yaml
gitea:
  environment:
    - GITEA__database__PASSWD=${GITEA_DB_PASSWORD:?eg echo GITEA_DB_PASSWORD=userPassword >>~/IOTstack/.env}

gitea_db:
  environment:
    - MYSQL_PASSWORD=${GITEA_DB_PASSWORD:?eg echo GITEA_DB_PASSWORD=userPassword >>~/IOTstack/.env}
```

The build menu will:

- report a short build issue while `GITEA_DB_PASSWORD` is missing;
- add a **Password options** submenu to Gitea;
- offer the documented default (`userPassword`), a custom password, or a generated password; and
- save the selected value in `.env`, where it can be viewed again later.

The text after `:?` should contain `VARIABLE=defaultValue`. This supplies the default shown by the menu while Compose still requires the user to make an explicit choice.

## Optional passwords

Use Compose default-value interpolation if the service may start without an explicit `.env` entry:

``` yaml
deconz:
  environment:
    - DECONZ_VNC_PASSWORD=${DECONZ_VNC_PASSWORD:-IOtSt4ckDec0nZ}
```

The password submenu is still created. Choosing **Use default** writes that default to `.env`; choosing **Generate** creates one cryptographically random value and saves it. Generated passwords are not regenerated during later builds.

An empty default is valid for services where it intentionally means "no password":

``` yaml
pihole6:
  environment:
    FTLCONF_webserver_api_password: ${PIHOLE_ADMIN_PASSWORD:-}
```

The menu labels this choice as **no password** so the result is explicit.

## Multiple services sharing one password

Use the same variable name everywhere the credential must match. It will appear only once in the password submenu:

``` yaml
nextcloud:
  environment:
    - MYSQL_PASSWORD=${NEXTCLOUD_DB_USER_PASSWORD:?eg echo NEXTCLOUD_DB_USER_PASSWORD=IOtSt4ckmySqlDbPw >>~/IOTstack/.env}

nextcloud_db:
  environment:
    - MYSQL_PASSWORD=${NEXTCLOUD_DB_USER_PASSWORD:?eg echo NEXTCLOUD_DB_USER_PASSWORD=IOtSt4ckmySqlDbPw >>~/IOTstack/.env}
```

## Other sensitive settings

Names containing `SECRET`, `TOKEN`, `AUTHORIZATION`, or `API_KEY` are also discovered automatically. They appear as protected service settings, while names containing `PASSWORD` or `PASSWD` are grouped into the Password options submenu.

## Service behavior to check

Some applications read credentials only while initializing an empty data directory. Changing `.env` later may not update the credential stored inside an existing database. Document that behavior for the service and warn users before they change an initialized password.

Do not replace marker strings during `preBuild`, reload password-bearing services from the build cache, or generate a new secret on every build. Those patterns can hide the actual credential and can overwrite a value the user just saved.
