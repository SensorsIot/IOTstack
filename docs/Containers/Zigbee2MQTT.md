# Zigbee2MQTT

## References

* [Web Guide](https://www.zigbee2mqtt.io)
* [Supported adapters](https://www.zigbee2mqtt.io/guide/adapters/#recommended)
* [GitHub](https://github.com/Koenkk/zigbee2mqtt)
* [DockerHub](https://hub.docker.com/r/koenkk/zigbee2mqtt/tags)

## Definitions

* *"override file"* means the file at the path:

	```
	~/IOTstack/zigbee2mqtt/override.yml
	```

## Basic process for new users { #basicProcess }

1. Run the IOTstack menu and choose both "Mosquitto" and "Zigbee2MQTT". That adds the service definitions for both of those containers to your *[override file](../Basic_setup/Custom.md#custom-service)*.

2. [Prepare your Zigbee adapter](#prepareAdapter) by flashing its firmware.
3. Follow the steps in [Identify your Zigbee adapter](#identifyAdapter) to work out how your adapter:

	* "mounts" on your Raspberry Pi; or
	* "connects" over your network,

	and edit your *[override file](../Basic_setup/Custom.md#custom-service)* to include that information.

4. The default environment variables assume:

	- You are running Mosquitto and Zigbee2MQTT as IOTstack containers on the same computer;
	- Your adapter mounts via USB; and
	- You want the Zigbee2MQTT web front end to be available on port 8080.

	This is a good basis for getting started. If it sounds like it will meet your needs, you will not need to make any changes. Otherwise, review the [environment variables](#envVars) and make appropriate changes to the service definition in your *[override file](../Basic_setup/Custom.md#custom-service)*.

5. <a name="upStack"></a>Bring up your stack:

	```console
	$ cd ~/IOTstack
	$ docker compose up -d
	```

6. Confirm that the Zigbee2MQTT container appears to be working correctly. You should:

	* [Check container status](#checkStatus) to confirm that the container is running and stable, and is not in a restart loop;
	* [Check the container's log](#checkLog) for any errors, warnings or other evidence of malfunction; and
	* [Check inter-container connectivity](#checkMQTT) by verifying that the Zigbee2MQTT container is publishing MQTT messages to the Mosquitto broker.

7. [Connect to the web front end](#connectGUI) and start adding your Zigbee devices.

## Prepare your Zigbee adapter { #prepareAdapter }

Zigbee adapters usually need to be "flashed" before they can be used by Zigbee2MQTT. To prepare your adatper:

1. Go to the [supported adapters](https://www.zigbee2mqtt.io/guide/adapters/#recommended) page.
2. Find your adapter in the list.
3. Follow the instructions for flashing your adapter.

Note:

* If you can't find your adapter in the list of supported devices, you may not be able to get the Zigbee2MQTT container to connect to it. This kind of problem is outside the scope of IOTstack. You will have to raise the issue with the [Zigbee2MQTT](https://www.zigbee2mqtt.io) project.

## Identify your Zigbee adapter { #identifyAdapter }

* [USB adapters](#identifyUSBAdapter)
* [Remote adapters](#identifyRemoteAdapter)

### USB adapters { #identifyUSBAdapter }

This section covers adapters that connect to your Raspberry Pi via USB.

Many USB Zigbee adapters mount as `/dev/ttyACM0` but this is not true for *all* adapters. In addition, if you have multiple devices connected to your Raspberry Pi that contend for a given device name, there are no guarantees that your Zigbee adapter will *always* be assigned the *same* name each time the device list is enumerated.

For those reasons, it is better to take the time to identify your Zigbee adapter in a manner that will be predictable, unique and reliable:

1. If your Zigbee adapter is connected to your Raspberry Pi, disconnect it.
2. Run the following command (the option is the digit "1"):

	```console
	$ ls -1 /dev/serial/by-id
	```

	The possible response patterns are:

	* An error message:

		```
		ls: cannot access '/dev/serial/by-id': No such file or directory
		```

	* A list of one or more lines where your Zigbee adapter is **not** present. Example:

		```
		usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_f068b8e7e82d4b119c0ee71fa1143ea0-if00-port0
		```

	The actual response (error, or a list of devices) does not matter. You are simply establishing a baseline.

3. Connect your prepared Zigbee adapter to a USB port on your Raspberry Pi.
4. Repeat the same `ls` command from step 2. The response pattern should be different from step 2. The list should now contain your Zigbee adapter. Example:

	```
	usb-Silicon_Labs_CP2102N_USB_to_UART_Bridge_Controller_f068b8e7e82d4b119c0ee71fa1143ea0-if00-port0
	usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00125A00183F06C5-if00
	```

	The second line indicates a CC2531 adapter is attached to the Raspberry Pi.

	If the response pattern does **not** change, it means the Raspberry Pi is unable to see your adapter. The two most common reasons are:

	1. Your adapter was not flashed correctly. Start over at [prepare your Zigbee adapter](#prepareAdapter).
	2. Your adapter does not mount as a serial device. Try repeating steps 2 through 4 with the command:

		```console
		$ ls -1 /dev
		```

		to see if you can discover how your adapter attaches to your Raspberry Pi.

		> One example is the Electrolama zig-a-zig-ah which attaches as `/dev/ttyUSB0`.

5. Use the output from the `ls` command in step 4 to form the absolute path to your Zigbee adapter. Example:

	```
	/dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00125A00183F06C5-if00
	```

6. Check your work like this (the option is the lower-case letter "l"):

	```console
	$ ls -l /dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00125A00183F06C5-if00
	lrwxrwxrwx 1 root root 13 Mar 31 19:49 dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00125A00183F06C5-if00 -> ../../ttyACM0
	```

	What the output is telling you is that the *by-id* path is a symbolic link to `/dev/ttyACM0`. Although this *may* always be true on your Raspberry Pi, the only part that is actually *guaranteed* to be true is the *by-id* path, which is why you should use it.

7. Once you have identified the path to your adapter, you communicate that information to docker compose like this:

	```console
	$ echo ZIGBEE2MQTT_DEVICE_PATH=/dev/serial/by-id/usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00125A00183F06C5-if00 >>~/IOTstack/.env
	```

	Note:

	* if you forget to do this step, docker compose will display the following error message:

		```
		parsing ~/IOTstack/docker-compose.yml: error while interpolating services.zigbee2mqtt.devices.[]: required variable ZIGBEE2MQTT_DEVICE_PATH is missing a value: eg echo ZIGBEE2MQTT_DEVICE_PATH=/dev/ttyACM0 >>~/IOTstack/.env
		```

8. Continue from [bring up your stack](#upStack).

### Remote adapters { #identifyRemoteAdapter }

This section covers adapters that your Raspberry Pi connects to over a network via TCP.

See also:

* [connect to a remote adapter](https://www.zigbee2mqtt.io/advanced/remote-adapter/connect_to_a_remote_adapter.html).

The default service definition provided by IOTstack for Zigbee2MQTT includes this device mapping:

``` yaml
devices:
  - "${ZIGBEE2MQTT_DEVICE_PATH:?eg echo ZIGBEE2MQTT_DEVICE_PATH=/dev/ttyACM0 >>~/IOTstack/.env}:/dev/ttyACM0"
```

The above syntax assumes your Zigbee adapter connects via USB. You should either remove or comment-out both of those lines from your compose file. An alternative approach is to make the `devices` clause inactive by prepending `x-`, like this:

``` yaml
x-devices:
  - "${ZIGBEE2MQTT_DEVICE_PATH:?eg echo ZIGBEE2MQTT_DEVICE_PATH=/dev/ttyACM0 >>~/IOTstack/.env}:/dev/ttyACM0"
```

You tell the container how to find your Zigbee adapter across the network by using an environment variable:

``` yaml
ZIGBEE2MQTT_CONFIG_SERIAL_PORT: tcp://«ipaddr»:«port»
```

Where:

* «ipaddr» is the IP address or domain name where your remote Zigbee adapter is reachable; and
* «port» is the port on which your remote Zigbee adapter is listening.

Example:

``` yaml
ZIGBEE2MQTT_CONFIG_SERIAL_PORT: tcp://192.168.1.5:6638
```

## Configuration { #configTemplate }

When you select Zigbee2MQTT in the IOTstack menu, the following service definition is added to your compose file:

``` yaml linenums="1"
zigbee2mqtt:
  container_name: zigbee2mqtt
  image: koenkk/zigbee2mqtt:latest
  environment:
    TZ: ${TZ:-Etc/UTC}
    ZIGBEE2MQTT_CONFIG_SERIAL_PORT: /dev/ttyACM0
    ZIGBEE2MQTT_CONFIG_SERIAL_ADAPTER: zstack
    ZIGBEE2MQTT_CONFIG_MQTT_SERVER: mqtt://mosquitto:1883
    # only enable the next line for Zigbee2MQTT v1
    # ZIGBEE2MQTT_CONFIG_FRONTEND: true
    ZIGBEE2MQTT_CONFIG_FRONTEND_ENABLED: true
    ZIGBEE2MQTT_CONFIG_ADVANCED_LOG_SYMLINK_CURRENT: true
    # DEBUG: zigbee-herdsman*
  ports:
    - "8080:8080"
  volumes:
    - ./volumes/zigbee2mqtt/data:/app/data
  devices:
    - "${ZIGBEE2MQTT_DEVICE_PATH:?eg echo ZIGBEE2MQTT_DEVICE_PATH=/dev/ttyACM0 >>~/IOTstack/.env}:/dev/ttyACM0"
  restart: unless-stopped
  depends_on:
    - mosquitto
```

### Environment variables { #envVars }

Many first time users of the Zigbee2MQTT container are following guidance which assumes their Zigbee2MQTT service is running *natively* rather than in a *container*.

When you run Zigbee2MQTT *natively* you provide configuration information by editing Zigbee2MQTT's `configuration.yaml` file. Although you *can* edit `configuration.yaml` when Zigbee2MQTT is running in a container, it is a multi-step process and is also a sub-optimal approach. The correct way to provide configuration information to the Zigbee2MQTT container is via environment variables.

**Any** value that can be set in a Zigbee2MQTT [configuration file](#confFile) can also be set using an environment variable.

Please read that last sentence again and notice the emphasis on "Any" because it is really important. When you are running Zigbee2MQTT in a container, you **never** have to resort to editing the `configuration.yaml`.

The [Zigbee2MQTT documentation](https://www.zigbee2mqtt.io/guide/configuration/#environment-variables) explains the syntax. It boils down to these rules:

1. All environment variables start with `ZIGBEE2MQTT_CONFIG_`.
2. Append all-upper-case labels for section and variable names, separated by underscores.
3. Append an `=` followed by the value(s).

For example, if the Zigbee2MQTT `configuration.yaml` example you are following contains these lines:

``` yaml
serial:
  port: /dev/ttyACM0
  adapter: zstack
```

then the equivalent environment variables are:

``` yaml
ZIGBEE2MQTT_CONFIG_SERIAL_PORT: /dev/ttyACM0
ZIGBEE2MQTT_CONFIG_SERIAL_ADAPTER: zstack
```

Note:

* Do **not** use quote marks to enclose the values (right hand sides) of environment variables.

Whenever you change the value of an environment variable, you also need to tell `docker compose` to apply the change:

```console
$ cd ~/IOTstack
$ docker compose up -d zigbee2mqtt
```

The default service definition provided with IOTstack includes the following environment variables:

#### timezone support { #tzSupport }

``` yaml
TZ: ${TZ:-Etc/UTC}
```

This assumes that your system timezone has been copied to `~/IOTstack/.env`, otherwise defaults to `Etc/UTC`.

If you want to set your timezone, you can do it like this:

``` console
$ echo "TZ=Australia/Sydney" >> ~/IOTstack/.env
```

Most (but not yet all) IOTstack containers use this syntax. The idea is that a single value set in `.env` will ensure your containers operate in the same timezone.

#### serial adapter { #serialAdapter }

``` yaml
ZIGBEE2MQTT_CONFIG_SERIAL_PORT: /dev/ttyACM0
```

The default value of `/dev/ttyACM0` works in conjunction with the `devices` clause:

``` yaml
devices:
  - "${ZIGBEE2MQTT_DEVICE_PATH:?eg echo ZIGBEE2MQTT_DEVICE_PATH=/dev/ttyACM0 >>~/IOTstack/.env}:/dev/ttyACM0"
```

Taken together, these assume your Zigbee adapter is connected to a local USB port. If you are using a [remote adapter](#identifyRemoteAdapter) then you should:

1. Change the right hand side of this variable so that it points to your adapter. For example:

	``` yaml
	ZIGBEE2MQTT_CONFIG_SERIAL_PORT: tcp://«ipaddr»:«port»`
	```

2. Remove, comment-out or inactivate the `devices` clause (as explained in [remote adapters](#identifyRemoteAdapter)).

#### adapter type { #adapterType }

``` yaml
ZIGBEE2MQTT_CONFIG_SERIAL_ADAPTER: zstack
```

Identify your adapter from the [official list](https://www.zigbee2mqtt.io/guide/configuration/adapter-settings.html#basic-configuration). At the time of writing, the possible values were `zstack`, `ember`, `deconz`, `zigate` or `zboss`.

#### MQTT server type { #mqttServer }

``` yaml
ZIGBEE2MQTT_CONFIG_MQTT_SERVER: mqtt://mosquitto:1883
```

Typical values for this are:

- `mqtt://mosquitto:1883`

	This is default value supplied with the IOTstack template. It assumes that both Zigbee2MQTT and the Mosquitto broker are running in non-host mode containers on the same Raspberry Pi.

- `mqtt://localhost:1883`

	This would be appropriate if you were to run Zigbee2MQTT in host mode and the Mosquitto broker was running on the same Raspberry Pi.

- `mqtt://«host-or-ip»:1883`

	If the Mosquitto broker is running on a *different* computer, replace `«host-or-ip»` with the IP address or domain name of that other computer. You should also remove or comment-out the following lines from the service definition:

	```yaml
	depends_on:
	  - mosquitto
	```

	The `depends_on` clause ensures that the Mosquitto container starts alongside the Zigbee2MQTT container. That would not be appropriate if Mosquitto was running on a separate computer.

#### front end { #frontEndEnable }

The "front end" is the name given to the Zigbee2MQTT web interface on port 8080. If you want to change the port number where you access the Zigbee2MQTT web interface, see [connecting to the web GUI](#connectGUI).

Zigbee2MQTT version 2 introduced an incompatibility with this setting. The IOTstack template contains the following lines:

``` yaml
# only enable the next line for Zigbee2MQTT v1
# ZIGBEE2MQTT_CONFIG_FRONTEND: true
ZIGBEE2MQTT_CONFIG_FRONTEND_ENABLED: true
```

If you are running Zigbee2MQTT version 1 then the front end will not be enabled unless you uncomment:

``` yaml
ZIGBEE2MQTT_CONFIG_FRONTEND: true
```

Zigbee2MQTT version 1 ignores the following environment variable so you do not need to comment it out:

``` yaml
ZIGBEE2MQTT_CONFIG_FRONTEND_ENABLED: true
```

However, if you have been running Zigbee2MQTT version 1 and you upgrade to version 2 then you **must** either delete or comment-out:

``` yaml
# ZIGBEE2MQTT_CONFIG_FRONTEND: true
```

If you do not do that then the container will go into a restart loop. If you examine the container's log, you will see this error:

```
frontend must be object
```

That error is telling you to comment-out that environment variable.

#### logging { #logSymlink }

``` yaml
ZIGBEE2MQTT_CONFIG_ADVANCED_LOG_SYMLINK_CURRENT: true
```

Defining this variable causes Zigbee2MQTT to create a symlink pointing to the current log **folder** at the path:

```
~/IOTstack/volumes/zigbee2mqtt/data/log/current
```

See [Checking the log](#checkLog) for more information about why this is useful.

#### debugging { #debugging }

``` yaml
DEBUG: zigbee-herdsman*
```

Enabling this variable turns on extended debugging inside the container.

### Configuration file { #confFile }

Zigbee2MQTT creates a default configuration file at the path:

```
~/IOTstack/volumes/zigbee2mqtt/data/configuration.yaml
```

Although you *can* edit the configuration file, the approach recommended for IOTstack is to use [environment variables](#envVars).

If you decide to edit the configuration file:

1. You will need to use `sudo` to edit the file.
2. After you have finished making changes, you need to inform the running container by:

	```console
	$ cd ~/IOTstack
	$ docker compose restart zigbee2mqtt
	```

3. [Check the log](#checkLog) for errors.

Notes:

* If you start Zigbee2MQTT from a clean slate (ie where the configuration file does not exist) **and** your *[override file](../Basic_setup/Custom.md#custom-service)* does not define the [`… MQTT_SERVER`](#mqttServer) environment variable discussed above, the container will go into a restart loop. This happens because the Zigbee2MQTT container defaults to trying to reach the Mosquitto broker at `localhost:1883` instead of `mosquitto:1883`. That usually fails.
* Settings passed via environment variables take precedence over both the defaults and any changes you make subsequently to `configuration.yaml`. The Zigbee2MQTT container does not update `configuration.yaml` to reflect settings passed via environment variables.

## Verifying basic operation

### Checking status { #checkStatus }

```console
$ docker ps | grep -e mosquitto -e zigbee2mqtt
NAMES         CREATED          STATUS
zigbee2mqtt   33 seconds ago   Up 30 seconds
mosquitto     33 seconds ago   Up 31 seconds (healthy)
```

> The above output is filtered down to the relevant columns

You are looking for evidence that the container is restarting (ie the "Status" column only ever shows a low number of seconds when compared with the "Created" column).

### Checking the log { #checkLog }

You can watch the container's log using this command:

```
$ docker logs -f zigbee2mqtt
```

Press <kbd>control</kbd>+<kbd>c</kbd> to terminate the command. An alternative is to observe the following path using commands like `cat` and `tail`:

```
~/IOTstack/volumes/zigbee2mqtt/data/log/current/log.log
```

Note:

* this depends on the [`… LOG_SYMLINK_CURRENT`](#logSymlink) environment variable being set to `true`.

### Checking Mosquitto connectivity { #checkMQTT }

To perform this check, you will need to have the Mosquitto clients installed:

```console
$ sudo apt install -y mosquitto-clients
```

The Mosquitto clients package includes two command-line tools:

* `mosquitto_pub` for publishing MQTT messages to the broker; and
* `mosquitto_sub` for subscribing to MQTT messages distributed by the broker.

	> In IOTstack, the "broker" is usually the Mosquitto container.

Assuming the Mosquitto clients are installed, you can run the following command:

```console
$ mosquitto_sub -v -h "localhost" -t "zigbee2mqtt/#" -F "%I %t %p"
```

One of two things will happen:

* *silence,* indicating that the Zigbee2MQTT container is **not** able to communicate with the Mosquitto container. If this happens, you should [check the Zigbee2MQTT log](#checkLog). 
* *chatter,* proving that the Zigbee2MQTT container **can** communicate with the Mosquitto container.

Terminate the `mosquitto_sub` command with a <kbd>Control</kbd><kbd>c</kbd>.

## Connecting to the web GUI { #connectGUI }

Open a browser, and point it to port 8080 on your Raspberry Pi. For example:

```url
http://raspberrypi.local:8080
```

You should see the Zigbee2MQTT interface.

Notes:

1. The availability of the Zigbee2MQTT UI is governed by an environment variable. If you do not see the UI, check that [`… FRONTEND`](#frontEndEnable) is defined.

2. In the URL above, port 8080 is an **external** port which is exposed via the following port mapping in the Zigbee2MQTT service definition:

	```yaml
	ports:
	  - "8080:8080"
	```

	If you want to reach the Zigbee2MQTT UI via a different port, you should edit the left hand side of that mapping. For example, if you wanted to use port 10080 you would write: 

	```yaml
	ports:
	  - "10080:8080"
	```

	Do not change the *internal* port number on the right hand side of the mapping. To apply changes to the port mapping:

	```console
	$ cd ~/IOTstack
	$ docker compose up -d zigbee2mqtt
	```

## Shell access to the container

To open a shell inside the Zigbee2MQTT container, run:

```console
$ docker exec -it zigbee2mqtt ash
```

!!! note
	* `ash` is **not** a typo!

To close the shell and leave the container, either type "exit" and press <kbd>return</kbd>, or press <kbd>Control</kbd><kbd>d</kbd>.

## Container maintenance

When you become aware of a new version of Zigbee2MQTT on [DockerHub](https://hub.docker.com/r/koenkk/zigbee2mqtt/tags), do the following:

```console
$ cd ~IOTstack
$ docker compose pull zigbee2mqtt
$ docker compose up -d zigbee2mqtt
$ docker system prune
```

In words:

1. Be in the correct directory.
2. The `pull` compares the version on your Raspberry Pi with the latest version on [DockerHub](https://hub.docker.com/r/koenkk/zigbee2mqtt/tags), and downloads any later version.
3. If a newer version is downloaded, the `up` instantiates a new container based on the new image and performs a new-for-old swap. There is barely any downtime.
4. The `prune` cleans up the older image.

You can omit the `zigbee2mqtt` arguments from the `pull` and `up` commands, in which case `docker compose` makes an attempt to pull any available updates for all non-Dockerfile-based images, and then instantiates any new images it has downloaded.

## 2025 v1 to v2 upgrade { #update202501 }

If you have been running Zigbee2MQTT version 1 but do a "pull" from DockerHub you will be upgraded to version 2. The first time you do this, you may encounter the following error:

```
frontend must be object
```

This is caused by a configuration incompatibility between v1 and v2. Although it is not *difficult* to update your service definition to work with v2, if you are in a hurry to get your Zigbee service running again you can revert to v1 by making a temporary alteration to your service definition, like this:

``` yaml
# image: koenkk/zigbee2mqtt:latest
image: koenkk/zigbee2mqtt:1.42.0
```

Then, "up" the container:

``` console
$ cd ~/IOTstack
$ docker compose up -d zigbee2mqtt
```

When you are ready to upgrade to v2, you will need to undo the above change, and you will also need to update your Zigbee2MQTT service definition based on the [template](#configTemplate). In general terms, you will need to do the following:

1. If you have a locally-connected USB adapter then you will need to add:

	``` yaml
	ZIGBEE2MQTT_CONFIG_SERIAL_PORT: /dev/ttyACM0
	```

	If you have a network adapter, you will have that variable defined already so you should not change it.

2. Add:

	``` yaml
	ZIGBEE2MQTT_CONFIG_SERIAL_ADAPTER: zstack
	```

	Then read the explanation about [adapter types](#adapterType) and make a decision on whether `zstack` is the correct choice.

3. The value of `ZIGBEE2MQTT_CONFIG_MQTT_SERVER` will probably be correct so you should not change it.

4. Replace the existing `ZIGBEE2MQTT_CONFIG_FRONTEND` with the following:

	``` yaml 
	# only enable the next line for Zigbee2MQTT v1
	# ZIGBEE2MQTT_CONFIG_FRONTEND: true
	ZIGBEE2MQTT_CONFIG_FRONTEND_ENABLED: true
	```

5. Any other variables you have set will likely be correct so leave those alone.
