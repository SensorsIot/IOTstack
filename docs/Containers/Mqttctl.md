# mqttctl

[mqttctl](https://github.com/Slyke/mqttctl) provides a browser UI for managing its own Mosquitto broker: users, roles, ACLs, broker configuration, snapshots, audit history and MQTT exploration.

Selecting **mqttctl** installs the UI, a broker-agent containing Mosquitto, and a one-shot initializer. The initializer runs inside the mqttctl image using its bundled Node.js; no host Node.js installation is required. Both application images are pinned to `v0.0.8-264ca1e6585c`. No MCP service or MCP configuration is included.

The pinned images support **linux/amd64** and **linux/arm64**. Raspberry Pi requires a **64-bit operating system**; 32-bit ARM is not included. Docker selects the matching image automatically.

## Getting started

Select **mqttctl** in the services menu, then build and start the stack. The equivalent commands are:

```console
$ ./iotstack-menu.sh install mqttctl
$ ./iotstack-menu.sh build
$ docker compose up -d mqttctl
```

Build adds these settings to `.env` if they are not already present:

* `MQTTCTL_PUBLIC_URL`: the host's first IP address with port 3002 (hostname fallback). Open this exact URL in your browser. Set it to your preferred reachable hostname or IP if the detected address is unsuitable.
* `MQTTCTL_ADMIN_PASSWORD`: a generated password for the initial **admin** web account.

You can set your own initial password in `.env` **before the first startup**:

```dotenv
MQTTCTL_ADMIN_PASSWORD='your-long-unique-password'
MQTTCTL_PUBLIC_URL=http://192.168.1.50:3002
```

Single-quote passwords containing `$` so Compose does not interpolate them. Protect `.env` because it contains credentials.

Once the app database exists, manage web users and passwords in mqttctl. Changing the bootstrap password in `.env` does **not** reset an existing account. Broker credentials are separate: create MQTT clients and assign roles in mqttctl's DynSec UI, then configure your devices with those credentials. Anonymous MQTT is disabled.

The initializer generates independent broker-admin, broker-agent API and session secrets. The broker image generates its CA and TLS certificates. The UI waits for the broker-agent health check, connects using verified TLS, and bootstraps DynSec roles.

## Ports and other IOTstack services

| Endpoint | Default host port | Override in `.env` |
| --- | --- | --- |
| Web UI | 3002 | `MQTTCTL_HTTP_PORT` |
| MQTT | 1884 | `MQTTCTL_MQTT_PORT` |
| MQTT over TLS | 8884 | `MQTTCTL_MQTTS_PORT` |
| MQTT over WebSockets | 9002 | `MQTTCTL_WS_PORT` |

If you change the web port, also update `MQTTCTL_PUBLIC_URL`. The URL must match the browser origin (scheme, hostname and port) because mqttctl checks it on requests. After changes, run `docker compose up -d mqttctl` again.

The existing **mosquitto** service remains available. Selecting both displays a warning but is allowed. Their default host ports are distinct, and their users, retained messages and configuration are independent. No data or clients are migrated automatically.

Containers in this stack connect to `mqttctl-broker-agent:1883`; devices outside Docker use `<IOTstack-host>:1884`. Existing integrations pointing to `mosquitto:1883` continue to use the old broker until you change their settings. To use mqttctl alone on standard host port 1883, stop/deactivate Mosquitto and set `MQTTCTL_MQTT_PORT=1883`.

The broker-agent's management API is not published to the host. Only public certificates are shared with the UI. Certificates initially cover the internal service name and localhost. For external MQTT TLS clients, configure certificates covering your actual hostname/IP and trust the CA; see [mqttctl TLS documentation](https://github.com/Slyke/mqttctl/blob/master/docs/CERTS.md). HTTP and plain MQTT defaults are intended for a trusted local network.

## Persistence and customization

All runtime state is under `./volumes/mqttctl/`:

* `app-data`: SQLite database.
* `app-config`: application configuration and generated secrets.
* `agent-config`: broker-agent configuration.
* `broker-config`: editable Mosquitto configuration and private TLS material.
* `broker-data`: DynSec users/roles and retained MQTT data.
* `public-certs`: public certificates shared with the UI.

Initialization preserves existing secrets and broker configuration across rebuilds and container recreation. It synchronizes only the application's public URL from `.env`. Do not delete the secrets to reset a password; the initializer refuses to replace missing secrets when existing application or broker state is detected.

Back up the whole `volumes/mqttctl` directory and `.env` with the services stopped for a consistent database backup. Restore them together. Generated private files are restricted to their container users, so host-level backup may require elevated access.

## Integration test

From a development checkout with Docker and the menu's dependencies installed:

```console
$ python3 tests/test_mqttctl.py
```

This uses a temporary project and random localhost ports, checks install/build and dual-broker warnings, starts the pinned images, verifies MQTT authentication and recreation, and removes its containers afterward.
