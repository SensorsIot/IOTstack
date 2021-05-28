# Developer information:


## Starting menu services in developer mode:

### API:
```
bash ./.internal/ctrl_api.sh development
```

## WUI:
```
bash ./.internal/ctrl_wui.sh development
```

## CLI:
For auto restart (runs on host and requires nodemon):
```
export API_ADDR=localhost:32128 && export HOST_CON_API=localhost:32128 && cd .internal/pycli; nodemon --no-stdin --exec python3 entry.py
```

Inside docker:
```
bash ./.internal/ctrl_pycli.sh development
```

## Enviroment Variable settings:
These are set in `./.internal/meta.sh`

You can set your own values by running

```
export NAME_OF_VAR=VALUE_YOU_WANT_SET
```

Eg:

```
export API_ADDR=localhost:32128
```

You will need to restart the containers for the changes to take effect.

### IOTSTACK_IOTSTACKPWD
Used for the interal docker menu instances to know where IOTstack is installed

* Default: `$(pwd)`
* Internal Variable: `IOTSTACKPWD`


### IOTSTACK_HOSTUSER
Used for the internal docker menu instances to know which user to set permissions for, and for SSH connections

* Default: `$(whoami)`
* Internal Variable: `HOSTUSER`


### IOTSTACK_HOSTSSH_ADDR
Used for the interal docker menu instances to know which user to set permissions for, and for SSH connections

* Default: `"host.docker.internal"`
* Internal Variable: `HOSTSSH_ADDR`


### IOTSTACK_HOSTSSH_PORT
SSH port for menus to use to connect to host.

* Default: `22`
* Internal Variable: `HOSTSSH_PORT`


### IOTSTACK_HOST_CON_IP
For the host to know how to connect to itself (or a remote host). Used for testing connectivity to services.

* Default: `"localhost"`
* Internal Variable: `HOST_CON_IP`


### IOTSTACK_API_PORT
API Port

* Default: `32128`
* Internal Variable: `API_PORT`


### IOTSTACK_WUI_PORT
WUI Port

* Default: `32777`
* Internal Variable: `WUI_PORT`


### IOTSTACK_API_INTERFACE
Listen interface for API. 0.0.0.0 is all interfaces

* Default: `0.0.0.0`
* Internal Variable: `API_INTERFACE`


### IOTSTACK_PYCLI_CON_API
Host and port for the docker CLI to know where the API is running

* Default: `"$HOSTSSH_ADDR:$API_PORT"`
* Internal Variable: `PYCLI_CON_API`


### IOTSTACK_HOST_CON_IP
Host and port for the docker CLI to know where the API is running when executing commands via SSH

* Default: `"$HOST_CON_IP:$API_PORT"`
* Internal Variable: `PYCLI_HOST_CON_API`


### IOTSTACK_PYCLI_CON_WUI
Host and port for the docker CLI to know where the WUI is running

* Default: `"$HOST_CON_IP:$WUI_PORT"`
* Internal Variable: `PYCLI_CON_WUI`

