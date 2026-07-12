# Build Stack Services

This page explains how to add a service to the build stack.

## Smallest possible service

A service normally needs only one file:

- `service.yml` contains the Docker Compose service definition.
- `build.py` is optional and is only needed for custom checks, an interactive service-specific menu, or build-time file preparation.

Create a directory under `.templates`. Its name must match a root service key in `service.yml`:

``` yaml
adminer:
  container_name: adminer
  image: adminer
  restart: unless-stopped
  ports:
    - "9080:8080"
```

For example, this definition belongs in `.templates/adminer/service.yml`.

The easiest starting point is to copy `.templates/example_template`, rename the directory and YAML file, then delete `build.py` if no hooks are needed.

## Environment settings and passwords

Compose interpolation automatically creates build issues and settings screens. No Python menu code is needed.

A required value uses `:?`:

``` yaml
environment:
  - PASSWORD=${MY_SERVICE_PASSWORD:?eg echo MY_SERVICE_PASSWORD=ChangeMe >>~/IOTstack/.env}
```

An optional value with a default uses `:-`:

``` yaml
environment:
  - PASSWORD=${MY_SERVICE_PASSWORD:-ChangeMe}
```

Names containing `PASSWORD` or `PASSWD` appear in the shared Password options submenu. The user can keep the documented default, enter a value, or generate and save a random password. Names containing `SECRET`, `TOKEN`, `AUTHORIZATION`, or `API_KEY` are also exposed as protected service settings.

See [Build Stack Password Options](./BuildStack-RandomPassword.md) for complete examples.

## Optional hook file

A hook file is an ordinary Python module. Add only the functions the service needs:

``` python
def runChecks(context):
  return {}

def runOptionsMenu(context):
  return None

def preBuild(context):
  return None

def postBuild(context):
  return None
```

There is no registration dictionary, dynamic execution, injected globals, class, or decorator. IOTstack imports the module and discovers these function names.

### Hook context

Every function receives one context object:

- `context.serviceName` is the selected template name.
- `context.services` is the in-memory Compose services mapping.
- `context.renderMode` is the terminal character mode.
- `context.terminal` is the active Blessed terminal.

Hooks may update `context.services` in place. `runChecks(context)` must return a dictionary; return `{}` when there are no issues.

Return `False` from `preBuild` or `postBuild` when required work fails. The build will stop instead of writing a misleading success result.

## Calling a Bash helper

A Python hook can run a Bash script without using shell interpolation:

``` python
#!/usr/bin/env python3

import os
import subprocess

from deps.consts import templatesDirectory

def runChecks(context):
  return {}

def preBuild(context):
  scriptPath = os.path.join(
    templatesDirectory,
    context.serviceName,
    "build.sh",
  )
  result = subprocess.run(["bash", scriptPath])
  if result.returncode != 0:
    print("%s build helper failed." % context.serviceName)
    return False
  return True

def postBuild(context):
  return True
```

Keep checks read-only. File creation, privileged commands, and other mutations belong in `preBuild` or `postBuild`, not `runChecks`.

Do not generate hidden credentials in a hook. Declare them in `service.yml` so the shared settings menu saves them in `.env`.

## Templates with companion services

A template may define multiple Compose services. The directory name must still match one root key:

``` yaml
myapp:
  image: example/myapp

myapp_db:
  image: mariadb
```

Selecting `myapp` loads both services. Deselecting it removes both, and saved settings for both are restored the next time the build menu opens.

## Validation

Before submitting a pull request, run:

``` console
python3 -m unittest discover -v
docker-compose config -q
```

All bundled `build.py` files are inspected by the regression tests, including hook availability and return contracts.
