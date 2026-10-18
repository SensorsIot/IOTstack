# Node-RED

## References { #references }

- [nodered.org home](https://nodered.org/)
- [GitHub: node-red/node-red-docker](https://github.com/node-red/node-red-docker)
- [DockerHub: nodered/node-red](https://hub.docker.com/r/nodered/node-red)
- [Tutorial: from MQTT to InfluxDB via Node-Red](https://gist.github.com/Paraphraser/c9db25d131dd4c09848ffb353b69038f)

## Significant files { #significant-files }

```
~/IOTstack
├── services
│   └── nodered
│       ├── service.yml 🅐
│       ├── Dockerfile 🅑
│       ├── installed-addon-nodes.txt 🅒
│       └── override.yml 🅓
├── docker-compose.yml 🅔
└── docker-compose.override.yml 🅕
```

## How Node-RED gets built for IOTstack { #iotstackBuild }

### Node-RED source code ([GitHub](https://github.com)) { #gitHubSource }

The source code for Node-RED lives at [GitHub node-red/node-red-docker](https://github.com/node-red/node-red-docker).

### Node-RED images ([DockerHub](https://hub.docker.com)) { #dockerHubImages }

Periodically, the source code is recompiled and pushed to [nodered/node-red](https://hub.docker.com/r/nodered/node-red/tags?page=1&ordering=last_updated) on *DockerHub*. See [Node-RED and `node.js` versions](#containerVersions) for an explanation of the versioning tags associated with images on *DockerHub*.

### IOTstack menu install { #iotstackMenuInstall }

When you install Node-RED using the menu, the following files are copied from the template:

* The service definition <!--A-->&#x1F150;;
* The Dockerfile <!--B-->&#x1F151;; and
* A default list of add-on nodes <!--C-->&#x1F152;.

When you configure Node-RED (either from the menu TUI or the command line), the list of add-on nodes <!--C-->&#x1F152; is updated to reflect your choices. You can also create an override file <!--D-->&#x1F153; to customise the service definition.

Note:

* Do not be concerned if you can't find an add-on node you need in the list. You can also add nodes via Manage Palette once Node-RED is running. See [component management](#componentManagement).

### IOTstack build stack { #iotstackBuildStack }

When you tell the menu to build your stack, the process:

- appends the service definition <!--A-->&#x1F150;; to the compose file <!--E-->&#x1F154;; and
- if present, appends the override file <!--D-->&#x1F153;; to the compose override file <!--F-->&#x1F155;.

### IOTstack first run { #iotstackFirstRun }

On a first install of IOTstack, you are told to do this:

``` console
$ cd ~/IOTstack
$ docker compose up -d
```

docker compose merges <!--E-->&#x1F154; with <!--F-->&#x1F155;, then processes the merged result. When it arrives at the merged `nodered` service definition, it finds <a name="serviceBuildFragment"></a>:

``` yaml linenums="1"
nodered:
  container_name: nodered
  build:
    context: ./services/nodered/.
```

The `build.context` path on the right hand side of line 4 is interpreted like this:

* The leading `.` implies "the absolute path to the project folder (the folder containing the compose file)"; and
* The trailing `.` implies `Dockerfile`.

In other words, the path expands to point to the Dockerfile <!--B-->&#x1F151;. The Dockerfile contains instructions to download a *base* image from [*DockerHub*](https://hub.docker.com) and then apply local customisations such as:

1. The list of add-on nodes <!--C-->&#x1F152;, which is either the initial default set, or the nodes you chose when configuring Node-RED using the menu.

2. Any extra packages, such as:

	``` yaml
	nodered:
	  build:
	    args:
	      - EXTRA_PACKAGES=mosquitto-clients bind-tools tcpdump tree
	```
	
	The above example shows how to specify extra packages via an [override file](../Basic_setup/Custom.md#custom-service) (`override.yml` <!--D-->&#x1F153;).

The result of applying local customisations is a *local* image, which is instantiated to become your running container.

Note:

* During the build you may see warnings and deprecation notices. You may also see messages about "vulnerabilities" along with recommendations to run `npm audit fix`. You should ignore all such messages. There is no need to take any action.

When you run the `docker images` command after Node-RED has been built, you will see something like this:

``` console
$ docker images
IMAGE                    ID            DISK USAGE  CONTENT SIZE  EXTRA
iotstack-nodered:latest  af4e9d96ef11       688MB            0B  U    
```

The image name `iotstack-nodered` is the concatenation of two components:

1. The docker compose *project* name. This is the all-lower-case representation of the name of the folder containing `docker-compose.yml`. In a default clone of IOTstack, the folder name is `IOTstack` so the project name is `iotstack`.
2. The name of the service definition which, for Node-RED is `nodered`.

When you launch Node-RED for the first time, the entire process of downloading a *base* image from Dockerhub, building a *local* image by running your local Dockerfile, and then instantiating that *local* image as your running container, is all completely automatic.

However, *after* that first build, your *local* image is essentially frozen and it needs special action on your part to keep it up-to-date. See [maintaining Node-RED](#maintainNodeRed) and, in particular:

* [Re-building the local image](#rebuildNodeRed) if you change either the list of add-on nodes <!--C-->&#x1F152; or the Dockerfile <!--B-->&#x1F151;; and

* [Upgrading Node-RED](#upgradeNodeRed) if you want to reconstruct your *local* image based on an updated *base* image which has become available on [DockerHub](https://hub.docker.com/r/nodered/node-red/tags).

## Securing Node-RED { #securingNodeRed }

### Setting an encryption key for your credentials { #encryptionKey }

After you install Node-RED, you should set an encryption key. Completing this step will silence the warning you will see when you run:

``` console
$ docker logs nodered
…
---------------------------------------------------------------------
Your flow credentials file is encrypted using a system-generated key.

If the system-generated key is lost for any reason, your credentials
file will not be recoverable, you will have to delete it and re-enter
your credentials.

You should set your own key using the 'credentialSecret' option in
your settings file. Node-RED will then re-encrypt your credentials
file using your chosen key the next time you deploy a change.
---------------------------------------------------------------------
…
```

Setting an encryption key also means that any credentials you create will be *portable*, in the sense that you can backup Node-RED on one machine and restore it on another.

The encryption key can be any string. For example, if you have UUID support installed (`sudo apt install -y uuid-runtime`), you could generate a UUID as your key:

``` console
$ uuidgen
2deb50d4-38f5-4ab3-a97e-d59741802e2d
```

Once you have defined your encryption key, use `sudo` and your favourite text editor to open this file:

```
~/IOTstack/volumes/nodered/data/settings.js
```

Search for `credentialSecret`:

```
    //credentialSecret: "a-secret-key",
```

Un-comment the line and replace `a-secret-key` with your chosen key. Do not remove the comma at the end of the line. The result should look something like this:

```
    credentialSecret: "2deb50d4-38f5-4ab3-a97e-d59741802e2d",
```

Save the file and then restart Node-RED:

``` console
$ cd ~/IOTstack
$ docker compose restart nodered
```

### Setting a username and password for Node-RED { #credentials }

To secure Node-RED you need a password hash. Run the following command, replacing `PASSWORD` with your own password:

``` console
$ docker exec nodered node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 8));" PASSWORD
```

You will get an answer that looks something like this:

```
$2a$08$gTdx7SkckJVCw1U98o4r0O7b8P.gd5/LAPlZI6geg5LRg4AUKuDhS
```

Copy that text to your clipboard, then follow the instructions at [Node-RED User Guide - Securing Node-RED - Username & Password-based authentication](https://nodered.org/docs/user-guide/runtime/securing-node-red#usernamepassword-based-authentication).

## Referring to other containers { #containerNames }

Most examples on the web assume Node-RED and other services in the MING stack (Mosquitto, InfluxDB, Node-RED, Grafana) have been installed natively, rather than in Docker containers. Those examples typically include the loopback address + port syntax, like this:

```
127.0.0.1:«hostPort»
```

The loopback address will not work. This is because Node-RED runs in non-host mode where each container behaves like a self-contained computer. The loopback address means "this container". It does not mean "this computer".

You refer to other containers by using the following syntax:

```
«containerName»:«containerPort»
```

For example, a flow subscribing to an MQTT feed provided by the mosquitto container uses:

```
mosquitto:1883
```

Similarly, if a flow writes to an InfluxDB database maintained by the influxdb container, the flow uses:

```
influxdb:8086
```

Behind the scenes, Docker maintains a table, similar to an `/etc/hosts` file, mapping container names to the IP addresses on the internal bridged network that are assigned, dynamically, by Docker, when it spins up each container.

## Referring to the host { #hostReference }

Sometimes, a Node-RED flow will need to communicate with a service that is running on the same host but which can't be reached using `«containerName»:«containerPort»` syntax. Examples include:

* The service is running in a host-mode container; or
* The service is running natively (ie not in a container).

If you need to reach such a service, use this syntax:

```
host.docker.internal:«hostPort»
```

Here's a contrived example. It's contrived in the sense that I can't think of any obvious reason why you would want to do this, but it would still work. The ESPHome service runs in host mode and binds to host port 6052. If a Node-RED flow needed to communicate with ESPHome, it would use:

```
host.docker.internal:6052
```

## GPIO Access { #accessGPIO }

To communicate with your Raspberry Pi's GPIO you need to do the following:

1. Install dependencies:

	``` console
	$ sudo apt update
	$ sudo apt install pigpio python-pigpio python3-pigpio
	```

	Notes:

	* `pigpio` and `python3-pigpio` are usually installed by default in standard releases of Raspberry Pi OS.
	* Only `pigpio` is actually *required*.
	* The Python packages are *optional*.

2. Install the `node-red-node-pi-gpiod` node. See [component management](#componentManagement). It allows you to connect to multiple Pis from the same Node-RED service.

	Note:

	* Unless you explicitly removed `node-red-node-pi-gpiod` from the default list of add-on nodes set up by the IOTstack menu, it will be installed already.

3. Configure the `pigpdiod` daemon:

	* copy the following text to the clipboard:

		``` ini linenums="1"
		[Unit]
		Requires=default.target
		After=default.target
		[Service]
		ExecStart=
		ExecStart=/usr/bin/pigpiod
		[Install]
		WantedBy=
		WantedBy=default.target
		```

		> Acknowledgement: some of the above from [joan2937/pigpio issue 554](https://github.com/joan2937/pigpio/issues/554#issuecomment-1405364041)

	* execute the following commands:

		``` console
		$ sudo systemctl stop pigpiod
		$ sudo systemctl revert pigpiod
		$ sudo systemctl edit pigpiod
		```

	* follow the on-screen instructions and paste the contents of the clipboard into the blank area between the lines. The final result should be (lines 4…12 are the pasted material):

		``` ini linenums="1"
		### Editing /etc/systemd/system/pigpiod.service.d/override.conf
		### Anything between here and the comment below will become the new contents of the file

		[Unit]
		Requires=default.target
		After=default.target
		[Service]
		ExecStart=
		ExecStart=/usr/bin/pigpiod
		[Install]
		WantedBy=
		WantedBy=default.target

		### Lines below this comment will be discarded

		### /lib/systemd/system/pigpiod.service
		# [Unit]
		# Description=Daemon required to control GPIO pins via pigpio
		# [Service]
		# ExecStart=/usr/bin/pigpiod -l
		# ExecStop=/bin/systemctl kill pigpiod
		# Type=forking
		# [Install]
		# WantedBy=multi-user.target
		```

	* Save your work by pressing:

		- <kbd>control</kbd>+<kbd>O</kbd> (letter O not zero)
		- <kbd>return</kbd>
		- <kbd>control</kbd>+<kbd>X</kbd>

	* Check your work by running:

		``` console
		$ sudo systemctl cat pigpiod
		```

		The expected result is:

		``` ini linenums="1"
		# /lib/systemd/system/pigpiod.service
		[Unit]
		Description=Daemon required to control GPIO pins via pigpio
		[Service]
		ExecStart=/usr/bin/pigpiod -l
		ExecStop=/bin/systemctl kill pigpiod
		Type=forking
		[Install]
		WantedBy=multi-user.target

		# /etc/systemd/system/pigpiod.service.d/override.conf
		[Unit]
		Requires=default.target
		After=default.target
		[Service]
		ExecStart=
		ExecStart=/usr/bin/pigpiod
		[Install]
		WantedBy=
		WantedBy=default.target
		```

		Lines 12…20 should be those you copied to the clipboard at the start of this step. If you do not see the expected result, go back and start from the beginning of this step.

	* Activate the daemon:

		``` console
		$ sudo systemctl enable pigpiod
		$ sudo systemctl start pigpiod
		```

	* Reboot.

	* Check that the daemon is running:

		``` console
		$ sudo systemctl status pigpiod
		```

		Once you have configured `pigpiod` correctly and it has come up after a reboot, you should not need to worry about it again.

		`pigpiod` provides open access to your Raspberry Pi's GPIO via port 8888. Consult the `man` pages if you want to make it more secure. Once you have decided what to do, start over from the beginning of this step, and add your parameters to the line:

		``` ini linenums="6"
		ExecStart=/usr/bin/pigpiod
		```

4. Drag a `pi gpio` node onto the canvas. Configure it according to your needs.

	The `Host` field should be set to `host.docker.internal`

	Don't try to use 127.0.0.1 because that is the loopback address of the Node-RED container.

## Serial Devices { #accessSerial }

### USB devices { #usbSerial }

Node-RED running in a container *can* communicate with serial devices attached to your Raspberry Pi's USB ports. However, it does not work "out of the box". You need to set it up.

Let's make an assumption. A device connected to one of your Raspberry Pi's USB ports presents itself as:

```
/dev/ttyUSB0
```

You have three basic options:

1. You can map the device into the container using that name:

	``` yaml
	devices:
	  - "/dev/ttyUSB0:/dev/ttyUSB0"
	```

	This is simple and effective but it suffers from a few problems:

	* If the device is disconnected while the container is running, there's a good chance the container will crash.
	* docker compose will not start your container if the device is not present when you bring up your stack.
	* You can't guarantee that the device will *always* enumerate as "ttyUSB0". It might come up as "ttyUSB1".

	You can deal with the last problem by using the device's "by-id" path. There's an example of this in the [Zigbee2MQTT](https://sensorsiot.github.io/IOTstack/Containers/Zigbee2MQTT/#identifyAdapter) documentation.

	Options 2 and 3 (below) deal with the first two problems in the sense that:

	* a device disconnection is unlikely to cause the container to crash (the flow might);
	* docker compose will always start the container, irrespective of whether devices are actually attached to your USB ports.

	Options 2 and 3 (below) can't provide a workaround for devices being given different names via enumeration but you can still deal with that by using the device's "by-id" path (as explained above).

2. You can map a *class* of devices:

	* modify the `volumes` clause to add a read-only mapping for `/dev`:

		``` yaml
		volumes:
		  - /dev:/dev:ro
		```

		> The "read-only" flag (`:ro`) prevents the container from doing dangerous things like destroying your Raspberry Pi's SD or SSD. Please don't omit that flag!

	* discover the major number for your device:

		``` console
		$ ls -l /dev/ttyUSB0
		crw-rw---- 1 root dialout 188, 0 Feb 18 15:30 /dev/ttyUSB0
		```

		In the above, the `188, 0` string means the major number for ttyUSB0 is "188" and "0" the minor number.

	* add two device CGroup rules:

		```	 yaml
		device_cgroup_rules:
		  - 'c 1:* rw' # access to devices like /dev/null
		  - 'c 188:* rmw' # change numbers to your device
		```

		In the above:

		* "188" is the major number for ttyUSB0 and you should substitute accordingly if your device has a different major number.

		* the "*" is a wildcard for the minor number.

3. Use the "privileged" flag by adding the following to your Node-RED override file:

	``` yaml
	privileged: true
	```

	Please make sure you read the following references **BEFORE** you select this option:

	* [Privileged vs root](https://www.howtogeek.com/devops/privileged-vs-root-in-docker-whats-the-difference/)
	* [Mind the 'privileged' flag](https://betterprogramming.pub/docker-tips-mind-the-privileged-flag-d6e2ae71bdb4)

### hardware serial port { #piSerial }

Historically, `/dev/ttyAMA0` referred to the Raspberry Pi's serial port. The situation became less straightforward once Pis gained Bluetooth capabilities:

* On Pis *without* Bluetooth hardware:

	- `/dev/ttyAMA0` means the serial port; and
	- `/dev/serial0` is a symlink to `/dev/ttyAMA0`

* On Pis *with* Bluetooth capabilities:

	- `/dev/ttyS0` means the serial port; and
	- `/dev/serial0` is a symlink to `/dev/ttyS0`

	In addition, whether `/dev/ttyS0` (and, therefore, `/dev/serial0`) are present at runtime depends on adding the following line to `config.txt`:

	```
	enable_uart=1
	```

	And, if that isn't sufficiently confusing, the location of `config.txt` depends on the OS version:

	* Bullseye and earlier: `/boot/config.txt`
	* Bookworm and later: `/boot/firmware/config.txt`

Rolling all that together, if you want access to the hardware serial port from Node-RED, you need to:

1. Add `enable_uart=1` to `config.txt`.
2. Reboot.
3. Add a device-mapping to Node-RED's override file:

	``` yaml
	devices:
	  - /dev/serial0:/dev/«internalDevice»
	```

	where `«internalDevice»` is whatever device the add-on node you're using is expecting, such as `ttyAMA0`.

4. Recreate the Node-RED container by running:

	``` console
	$ cd ~/IOTstack
	$ docker compose up -d nodered
	```

### Bluetooth device { #bluetoothSupport }

If you enable the `node-red-contrib-generic-ble` add on node, you will also need to make the following changes:

1. If you are running Bookworm, you will need to use `sudo` to edit this file:

	```
	/boot/firmware/config.txt
	```

	You need to add this line to the end of the file:

	```
	dtparam=krnbt=off
	```

	You then need to reboot. This adds the Bluetooth device to `/dev`.

2. Create or edit the override file <!--D-->&#x1F153;, so that it includes the following content:
	
	``` yaml
	nodered:
	  volumes:
	    - /var/run/dbus/system_bus_socket:/var/run/dbus/system_bus_socket
	  devices:
	    - "/dev/serial1:/dev/serial1"
	    - "/dev/vcio:/dev/vcio"
	    - "/dev/gpiomem:/dev/gpiomem"
	```
	
3. Rebuild your stack, then recreate the Node-RED container:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh build
	$ docker compose up -d nodered
	```

Notes:

* These changes are *specific* to the Raspberry Pi. If you need Bluetooth support on non-Pi hardware, you will need to figure out the details for your chosen platform.
* Historically, `/dev/ttyAMA0` meant the serial interface. Subsequently, it came to mean the Bluetooth interface but only where Bluetooth hardware was present, otherwise it still meant the serial interface.

	On Bookworm and later, if it is present, `/dev/ttyAMA1` means the Bluetooth Interface.

	On Bullseye and later, `/dev/serial1` is a symbolic link pointing to whichever of `/dev/ttyAMA0` or `/dev/ttyAMA1` means the Bluetooth interface. This means that `/dev/serial1` is the most reliable way of referring to the Bluetooth Interface. That's why it appears in the `devices:` clause above.

## Sharing files between Node-RED and the Raspberry Pi { #fileSharing }

Containers run in a sandboxed environment. A process running inside a container can't see the Raspberry Pi's file system. Neither can a process running outside a container access files inside the container.

This presents a problem if you want write to a file outside a container, then read from it inside the container, or vice-versa.

IOTstack containers have been set up with shared volume mappings. Each volume mapping associates a specific directory in the Raspberry Pi file system with a specific directory inside the container. If you write to files in a shared directory (or one of its sub-directories), both the host and the container can see the same sub-directories and files.

Key point:

* Files and directories in the shared volume are persistent between restarts. If you save your data anywhere else inside the container, it will be lost when the container is rebuilt.

The Node-RED service definition in the *Compose* file includes the following:

``` yaml
volumes:
  - ./volumes/nodered/data:/data
```

That decomposes into:

* external path = `./volumes/nodered/data`
* internal path = `/data`

The leading "." on the external path implies "the folder containing the *Compose* file so it actually means:

* external path = `~/IOTstack/volumes/nodered/data`
* internal path = `/data`

If you write to the **internal** path from **inside** the Node-RED container, the Raspberry Pi will see the results at the **external** path, and vice versa. Example:

``` console
$ docker exec -it nodered bash
# echo "The time now is $(date)" >/data/example.txt
# cat /data/example.txt 
The time now is Thu Apr  1 11:25:56 AEDT 2021
# exit
$ cat ~/IOTstack/volumes/nodered/data/example.txt 
The time now is Thu Apr  1 11:25:56 AEDT 2021
$ sudo rm ~/IOTstack/volumes/nodered/data/example.txt
```

In words:

1. Open a shell into the Node-RED container. Two things happen:

	* You are now **inside** the container. Any commands you execute while in this shell are run **inside** the container; and
	* The prompt changes to a "#" indicating that you are running as the "root" user, meaning you don't need `sudo` for anything.

2. Use the `echo` command to create a small file which embeds the current timestamp. The path is in the `/data` directory which is mapped to the Raspberry Pi's file system.
3. Show that the file has been created inside the container.
4. Exit the shell:
	* You can either type the `exit` command and press <kbd>return</kbd>, or press <kbd>Control</kbd>+<kbd>D</kbd>.
	* Exiting the shell drops you out of the container so the "$" prompt returns, indicating that you are **outside** the Node-Red container, running as a non-root user ("pi").
5. Show that the same file can be seen from **outside** the container.
6. Tidy-up by removing the file. You need `sudo` to do that because the persistent storage area at the **external** path is owned by root, and you are running as user "pi".

You can do the same thing from within a Node-RED flow.

![image](./images/nodered-flow-write-persistent-file.png)

The flow comprises:

* An Inject node, wired to a Template node.

	- *When an Inject node's input tab is clicked, it sets the message payload to the number of seconds since 1/1/1970 UTC and triggers the flow.*

* A Template node, wired to both a Debug node and a File node. The template field is set to:

	```
	The time at the moment is {{payload}} seconds since 1/1/1970 UTC !
	```

	- *When this node runs, it replaces `{{payload}}` with the seconds value supplied by the Inject node.*

* A Debug node.

	- *When this node runs, it displays the payload in the debug window on the right hand side of the Node-RED GUI.*

* A File node. The "Filename" field of the node is set to write to the path:

	```
	/data/flow-example.txt
	```

	- *When this node runs, it writes the payload to the specified file. Remember that `/data` is an internal path within the Node-RED container.*

Deploying the flow and clicking on the Inject node results in the debug message shown on the right hand side of the screen shot. The embedded terminal window shows that the same information is accessible from outside the container.

You can reverse this process. Any file you place within the path `~/IOTstack/volumes/nodered/data` can be read by a "File in" node.

## Executing commands outside the Node-RED container { #sshOutside }

A reasonably common requirement in a Node-RED flow is the ability to execute a command on the host system. The standard tool for this is an "exec" node.

An "exec" node works as expected when Node-RED is running as a native service but not when Node-RED is running in a container. That's because the command spawned by the "exec" node runs **inside** the container.

To help you understand the difference, consider this command:

``` console
$ grep "^PRETTY_NAME=" /etc/os-release
```

When you run that command on a Raspberry Pi **outside** container-space, the answer will be something like:

```
PRETTY_NAME="Debian GNU/Linux 11 (bullseye)"
```

If you run the same command **inside** a Node-RED container, the output will reflect the operating system upon which the container is based, such as:

```
PRETTY_NAME="Alpine Linux v3.16"
```

The same thing will happen if a Node-RED "exec" node executes that `grep` command when Node-RED is running in a container. It will see the "Alpine Linux" answer.

Docker doesn't provide any mechanism for a container to execute an arbitrary command **outside** of its container. A workaround is to utilise SSH. This remainder of this section explains how to set up the SSH scaffolding so that "exec" nodes running in a Node-RED container can invoke arbitrary commands **outside** container-space.

### Task Goal { #sshTaskGoal }

Be able to use a Node-RED "exec" node to perform the equivalent of:

``` console
$ ssh host.docker.internal «COMMAND»
```

where `«COMMAND»` is any command known to the target host.

This section uses `host.docker.internal` to refer to the local machine where the Node-RED container is running. See also [referring to the host](#hostReference). In principle you could also use either the host's fully qualified domain name or the IP address of one of its network interfaces but `host.docker.internal` has the advantage of being portable if you need to move Node-RED to another computer.

### Assumptions { #sshAssumptions }

* [SensorsIot/IOTstack](https://github.com/SensorsIot/IOTstack) is installed on your Raspberry Pi.
* The Node-RED container is running.
* The user name of the account on the host where you want Node-RED flows to be able to run commands is "pi". This user name is not mandatory. Simply substitute your own user name wherever you see "pi" in these examples.

These instructions are specific to IOTstack but the underlying concepts should apply to any installation of Node-RED in a Docker container. 

### Executing commands "inside" a container { #dockerExec }

These instructions make frequent use of the ability to run commands "inside" the Node-RED container. For example, suppose you want to execute:

``` console
$ grep "^PRETTY_NAME=" /etc/os-release
```

You have several options:

1. You can do it from the normal Raspberry Pi command line using a Docker command. The basic syntax is:

	``` console
	$ docker exec {-it} «containerName» «command and parameters»
	```

	The actual command you would need would be:

	``` console
	$ docker exec nodered grep "^PRETTY_NAME=" /etc/os-release
	```

	Note:

	* The `-it` flags are *optional*. They mean "interactive" and "allocate pseudo-TTY". Their presence tells Docker that the command may need user interaction, such as entering a password or typing "yes" to a question.

2. You can open a shell into the container, run as many commands as you like inside the container, and then exit. For example:

	``` console
	$ docker exec -it nodered bash
	# grep "^PRETTY_NAME=" /etc/os-release
	# whoami
	# exit
	$
	```

	In words:

	* Run the `bash` shell inside the Node-RED container. You need to be able to interact with the shell to type commands so the `-it` flag is required.
	* The "#" prompt is coming from `bash` running inside the container. It also signals that you are running as the root user inside the container.
	* You run the `grep`, `whoami` and any other commands.
	* You finish with the `exit` command (or <kbd>Control</kbd>+<kbd>D</kbd>).
	* The "$" prompt means you have left the container and are back at the normal Raspberry Pi command line.

3. Run the command from Portainer by selecting the container, then clicking the ">_ console" link. This is identical to opening a shell.

### Step 1: *Generate SSH key-pair for Node-RED* (one time) { #sshStep1 }

Create a key-pair for Node-RED. This is done by executing the `ssh-keygen` command **inside** the container:

``` console
$ docker exec -it nodered ssh-keygen -q -t ed25519 -C "Node-RED container key-pair" -N ""
```

Notes:

* The "ed25519" elliptic curve algorithm is recommended (generally described as quicker and more secure than RSA) but you can use the default RSA algorithm if you prefer.
* Respond to the "Enter file in which to save the key" prompt by pressing <kbd>return</kbd> to accept the default location.
* If `ssh-keygen` displays an "Overwrite (y/n)?" message, it implies that a key-pair already exists. You will need to decide what to do:
	* press <kbd>y</kbd> to overwrite (and lose the old keys)
	* press <kbd>n</kbd> to terminate the command, after which you can investigate why a key-pair already exists.

### Step 2: *Exchange keys with target hosts* (once per target host) { #sshStep2 }

Node-RED's public key needs to be copied to the "pi" user account on the host where you want a Node-RED "exec" node to be able to execute commands. At the same time, the Node-RED container needs to learn the host's public key. The `ssh-copy-id` command does both steps. The command is:

``` console
$ docker exec -it nodered ssh-copy-id pi@host.docker.internal
```

The output will be something similar to the following:

```
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_ed25519.pub"
The authenticity of host 'host.docker.internal (172.17.0.1)' can't be established.
ED25519 key fingerprint is SHA256:gHMlhvArbUPJ807vh5qNEuyRCeNUQQTKEkmDS6qKY6c.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

Respond to the prompt by typing "yes" and pressing <kbd>return</kbd>.

The output continues:

```
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
expr: warning: '^ERROR: ': using '^' as the first character
of a basic regular expression is not portable; it is ignored
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
pi@host.docker.internal's password: 
```
The response may look like it contains errors but those can be ignored. 

Enter the password you use to login as "pi" on the host and press <kbd>return</kbd>.

Normal completion looks similar to this:

```
Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'pi@host.docker.internal'"
and check to make sure that only the key(s) you wanted were added.
```

If you do not see an indication that a key has been added, you may need to retrace your steps.

### Step 3: *Perform the recommended test* { #sshStep3 }

The output above recommends a test. The test needs to be run **inside** the Node-RED container so the syntax is:

``` console
$ docker exec -it nodered ssh pi@host.docker.internal ls -1 /home/pi/IOTstack
```

You should not be prompted for a password. If you are, you may need to retrace your steps.

If everything works as expected, you should see a list of the files in your IOTstack folder.

Assuming success, think about what just happened? You told SSH **inside** the Node-RED container to run the `ls` command **outside** the container on your Raspberry Pi. You broke through the containerisation.

### Understanding what's where and what each file does { #sshWhatsWhere }

#### What files are where { #sshFileLocations }

Six files are relevant to Node-RED's ability to execute commands outside of container-space:

* in `/etc/ssh`:

	- `ssh_host_ed25519_key` is the Raspberry Pi's private host key
	- `ssh_host_ed25519_key.pub` is the Raspberry Pi's public host key

		Those keys were created when your Raspberry Pi was initialised. They are unique to the host.

		Unless you take precautions, those keys will change whenever your Raspberry Pi is rebuilt from scratch and that **will** prevent a Node-RED "exec" node from being able to invoke SSH to call out of the container.

		You can recover by re-running [`ssh-copy-id`](#sshStep2).

* in `~/IOTstack/volumes/nodered/ssh`:

	- `id_ed25519` is the Node-RED container's private key 
	- `id_ed25519.pub` is the Node-RED container's public key

		Those keys were created when you generated the SSH key-pair for Node-RED.

		They are unique to Node-RED but will follow the container in backups and will work on the same machine, or other machines, if you restore the backup.

		It does not matter if the Node-RED container is rebuilt or if a new version of Node-RED comes down from DockerHub. These keys will remain valid until lost or overwritten.

		If you lose or destroy these keys, that **will** prevent a Node-RED "exec" node from being able to invoke SSH to call out of the container.

		You can recover by [generating new keys](#sshStep1) and then re-running [`ssh-copy-id`](#sshStep2).

	- `known_hosts`

		The `known_hosts` file contains a copy of the Raspberry Pi's public host key. It was put there by `ssh-copy-id`.

		If you lose this file or it gets overwritten, invoking SSH inside the container **will** still work but it will re-prompt for authorisation to connect. You will see the prompt if you run commands via `docker exec -it` but not when invoking SSH from an "exec" node.

		Note that authorising the connection at the command line ("Are you sure you want to continue connecting?") will auto-repair the `known_hosts` file.

* in `~/.ssh/`:

	- `authorized_keys`

		That file contains a copy of the Node-RED container's public key. It was put there by `ssh-copy-id`.

		Pay attention to the path. It implies that there is one `authorized_keys` file per user, per target host.

		If you lose this file or it gets overwritten, SSH **will** still work but will ask for the password for "pi". This works when you are running commands from `docker exec -it` but not when invoking SSH from an "exec" node.

		Note that providing the correct password at the command line will auto-repair the `authorized_keys` file.

#### What each file does { #sshFilePurpose }

SSH running **inside** the Node-RED container uses the Node-RED container's private key to provide assurance to SSH running **outside** the container that it (the Node-RED container) is who it claims to be.

SSH running **outside** container-space verifies that assurance by using its copy of the Node-RED container's public key in `authorized_keys`.

SSH running **outside** container-space uses the Raspberry Pi's private host key to provide assurance to SSH running **inside** the Node-RED container that it (the RPi) is who it claims to be.

SSH running **inside** the Node-RED container verifies that assurance by using its copy of the Raspberry Pi's public host key stored in `known_hosts`.

### Config file (optional) { #sshConfig }

You don't **have** to do this step but it will simplify your exec node commands and reduce your maintenance problems if you do.

At this point, SSH commands can be executed from **inside** the container using this syntax:

``` console
# ssh pi@host.docker.internal «COMMAND»
```

A `config` file is needed to achieve the task goal of the simpler syntax:

``` console
# ssh host.docker.internal «COMMAND»
```

The goal is to set up this file:

```
-rw-r--r-- 1 root root ~/IOTstack/volumes/nodered/ssh/config
``` 

The file needs the ownership and permissions shown. There are several ways of going about this and you are free to choose the one that works for you. The method described here creates the file first, then sets correct ownership and permissions, and then moves the file into place.

Start in a directory where you can create a file without needing `sudo`. The IOTstack folder is just as good as anywhere else:

``` console
$ cd ~/IOTstack
$ touch config
```

Select the following text, copy it to the clipboard.

``` sshconfig
host host.docker.internal
  user pi
  IdentitiesOnly yes
  IdentityFile /root/.ssh/id_ed25519
```

Open `~/IOTstack/config` in your favourite text editor and paste the contents of the clipboard. Save the file. Change the config file's ownership and permissions, and move it into the correct directory:

``` console
$ chmod 644 config
$ sudo chown root:root config
$ sudo mv config ./volumes/nodered/ssh
```

#### Re-test with config file in place { #sshConfigTest }

The previous test used this syntax:

``` console
$ docker exec nodered ssh pi@host.docker.internal ls -1 /home/pi/IOTstack
```

Now that the config file is in place, the syntax changes to:

``` console
$ docker exec nodered ssh host.docker.internal ls -1 /home/pi/IOTstack
```

The result should be the same as the earlier test. 

### A test flow { #sshTestFlow }

![node-red-exec-node-ssh-test](./images/nodered-exec-node-ssh-test.jpeg)

In the Node-RED GUI:

1. Click the "+" to create a new, empty flow.
2. Drag the following nodes onto the canvas:
	- One "inject" node
	- Two "exec" nodes
	- Two "debug" nodes
3. Wire the outlet of the "inject" node to the inlet of both "exec" nodes.
4. Wire the uppermost "stdout" outlet of the first "exec" node to the inlet of the first "debug" node.
5. Repeat step 4 with the other "exec" and "debug" node.
6. Open the first "exec" node and:
	- set the "command" field to:

		```
		grep "^PRETTY_NAME=" /etc/os-release
		```
	- turn off the "append msg.payload" checkbox
	- set the timeout to a reasonable value (eg 10 seconds)
	- click "Done".
7. Repeat step 6 with the other "exec" node, with one difference:
	- set the "command" field to:

		```
		ssh host.docker.internal grep "^PRETTY_NAME=" /etc/os-release
		```

8. Click the Deploy button.
9. Set the right hand panel to display debug messages.
10. Click the touch panel of the "inject" node to trigger the flow.
11. Inspect the result in the debug panel. You should see payload differences similar to the following:

	```
	PRETTY_NAME="Alpine Linux v3.16""
	PRETTY_NAME="Debian GNU/Linux 11 (bullseye)"
	```

	The first line is the result of running the command inside the Node-RED container. The second line is the result of running the same command outside the Node-RED container on the Raspberry Pi.

## Maintaining Node-RED { #maintainNodeRed }

### Starting Node-RED { #startNodeRed }

Use these commands to:

1. Start the container; or
2. Re-create the container if you have made a material change to the container's service definition in your *Compose* file.

``` console
$ cd ~/IOTstack
$ docker compose up -d nodered
```

The first time you execute this command, the *base* image of Node-RED is downloaded from DockerHub, and then the *Dockerfile* is run to produce a *local* image. The *local* image is then instantiated to become the running container.


### Stopping Node-RED { #stopNodeRed }

To stop the running container:

``` console
$ cd ~/IOTstack
$ docker compose down nodered
```

!!! note
	* see also [if downing a container doesn't work](../Basic_setup/index.md/#downContainer)

Alternatively, you can stop the entire stack:

``` console
$ cd ~/IOTstack
$ docker compose down
```

### Restarting Node-RED { #restartNodeRed }

The `restart` command sends a signal to the processes running within the container. The container itself does not stop.

``` console
$ cd ~/IOTstack
$ docker compose restart nodered
```

### Re-building the local image { #rebuildNodeRed }

You need to rebuild the *local* image if you do any of the following:

1. Change either of the build arguments (`DOCKERHUB_TAG` or `EXTRA_PACKAGES`) in your override file <!--D-->&#x1F153;, and then rebuild your stack.
2. Use the menu to change your selection of add-on nodes.
3. Make a material change to your Node-RED *Dockerfile*.

To rebuild your *local* image:

``` console
$ cd ~/IOTstack
$ docker compose up --build -d nodered
$ docker system prune -f
```

Think of these commands as "re-running the *Dockerfile*". The only time a *base* image will be downloaded from *DockerHub* is when a *base* image with a tag matching the value of `DOCKERHUB_TAG` can't be found on your Raspberry Pi.

Your existing Node-RED container continues to run while the rebuild proceeds. Once the freshly-built *local* image is ready, the `up` tells docker compose to do a new-for-old swap. There is barely any downtime for your Node-RED service.

### Checking for Node-RED updates { #updateNodeRed }

IOTstack provides a convenience script which can help you work out if a new version of Node-RED is available. You can run it like this:

``` console
$ ~/IOTstack/scripts/nodered_version_check.sh
```

The script is not infallible. It works by comparing the version number in the Node-RED image on your system with a version number stored on GitHub.

GitHub is always updated *before* a new image appears on *DockerHub*. Sometimes there is a delay of weeks between the two events. For that reason, the script should be viewed more like a meteorological forecast than hard fact.

The script assumes that your local image builds as `iotstack-nodered:latest`. If you use different tags, you can pass that information to the script. Example:

``` console
$ ~/IOTstack/scripts/nodered_version_check.sh iotstack-nodered:3.0.2
```

### Upgrading Node-RED { #upgradeNodeRed }

The only way to know, for certain, when an update to Node-RED is available is to check the [nodered/node-red tags page](https://hub.docker.com/r/nodered/node-red/tags?page=1&ordering=last_updated) on *DockerHub*.

Once a new version appears on [*DockerHub*](https://hub.docker.com), you can upgrade Node-RED like this:

``` console
$ cd ~/IOTstack
$ docker compose build --no-cache --pull nodered
$ docker compose up -d nodered
$ docker system prune -f
```

Breaking it down into parts:

* `build` causes the named container to be rebuilt;
* `--no-cache` tells the Dockerfile process that it must not take any shortcuts. It really **must** rebuild the *local image*;
* `--pull` tells the Dockerfile process to actually check with [*DockerHub*](https://hub.docker.com) to see if there is a later version of the *base image* and, if so, to download it before starting the build;
* `nodered` is the named container argument required by the `build` command.

Your existing Node-RED container continues to run while the rebuild proceeds. Once the freshly-built *local* image is ready, the `up` tells docker compose to do a new-for-old swap. There is barely any downtime for your Node-RED service.

The `prune` is the simplest way of cleaning up old images. Sometimes you need to run this twice, the first time to clean up the old *local* image, the second time for the old *base* image. Whether an old *base* image exists depends on the version of docker compose you are using and how your version of docker compose builds local images.


## Node-RED and `node.js` versions { #containerVersions }

### Checking versions { #checkingVersions }

You can use the `npm version` command to check which versions of Node-RED and `node.js` are running in your container:

``` console
$ docker exec nodered npm version
{
  'node-red-docker': '2.2.2',
  npm: '6.14.15',
  ares: '1.18.1',
  brotli: '1.0.9',
  cldr: '37.0',
  http_parser: '2.9.4',
  icu: '67.1',
  llhttp: '2.1.4',
  modules: '72',
  napi: '8',
  nghttp2: '1.41.0',
  node: '12.22.8',
  openssl: '1.1.1m',
  tz: '2019c',
  unicode: '13.0',
  uv: '1.40.0',
  v8: '7.8.279.23-node.56',
  zlib: '1.2.11'
}
```

In the above:

* `'node-red-docker': '2.2.2'` indicates that version 2.2.2 of Node-RED is running. This is the version number you see at the bottom of the main menu when you click on the "hamburger" icon ("≡") at the top, right of the *Node-Red* window in your browser.
* `node: '12.22.8'` indicates that version 12.x of `node.js` is installed.

### Controlling versions { #versionControl }

IOTstack uses a service definition for Node-RED that includes these lines:

``` yaml linenums="3"
    build:
      context: ./services/nodered/.
      args:
      - DOCKERHUB_TAG=latest
```

The value of the `DOCKERHUB_TAG` gives you the ability to control, from your override file <!--D-->&#x1F153;, which versions of Node-RED and `node.js` run within your Node-RED container.

The allowable values of `DOCKERHUB_TAG` can be found on the [*DockerHub* Node-RED tags page](https://hub.docker.com/r/nodered/node-red/tags). The table below contains examples of tags that were available on *DockerHub* at the time of writing (2022-07-06):

tag       | Node-RED version | `node.js` version
----------|------------------|------------------
latest    | 2.2.2            | 14.x
latest-14 | 2.2.2            | 14.x &#x1F4CC;
2.2.2     | 2.2.2 &#x1F4CC;  | 14.x
2.2.2-14  | 2.2.2 &#x1F4CC;  | 14.x &#x1F4CC;

Interpreting the tag:

1. The sub-string to the left of the hyphen determines the version of Node-RED:

	- "latest" means the most up-to-date version, implying that the actual version number can change any time you follow the process to [upgrade Node-RED](#upgradeNodeRed).
	- "2.2.2" pins your container to that specific version of Node-RED, implying that the version number will be frozen until you change the pin.

2. The sub-string to the right of the hyphen determines the version of `node.js`:

	- "-14" refers to `node.js` version 14.x and pins your container to that specific version of `node.js`.
	- If the hyphen and suffix are omitted, it implies that the actual version of `node.js` can change any time you follow the process to [upgrade Node-RED](#upgradeNodeRed).

In short:

* If you pin both sides to specific values (eg "2.2.2-14") then all decisions about when to upgrade and which versions to use are under **your** control; but
* If you use "latest" then all timing and version decisions are under the control of the maintainers of the *DockerHub* images.

IOTstack defaults to "latest". Although this appears to cede control to the maintainers of the *DockerHub* images, in practice it is no different to any other container where you pull its image directly from *DockerHub* using the `latest` tag (irrespective of whether `latest` is explicit or implied by omission).

The `DOCKERHUB_TAG` argument for Node-RED merely gives you the ability to pin to specific versions of Node-RED from within your *Compose* file, in the same way as you can use tags on `image` directives for other containers.

For example, suppose you wanted to pin to Node-RED version 2.2.2 with `node.js` version 12:

1. Edit your *Compose* file so that the `DOCKERHUB_TAG` looks like this:

	``` yaml
	- DOCKERHUB_TAG=2.2.2-12
	``` 

2. Run the [re-building the local Node-RED image](#rebuildNodeRed) commands.

Changing a pinned version and rebuilding *may* result in a new *base* image being downloaded from *DockerHub*.

## Component management { #componentManagement }

### via Dockerfile { #viaDockerfile }

You can install components by using the menu to "configure" Node-RED:

``` console
$ cd ~/IOTstack
$ ./iotstack-menu.sh configure nodered
```

When you change the set of add-on nodes, <!--C-->&#x1F152; is updated. That file is read by the Dockerfile <!--B-->&#x1F151; so applying the changes means you have to [re-build the local Node-RED image](#rebuildNodeRed).

### via Manage Palette { #viaManagePalette }

You can add, remove or update components in Manage Palette. Node-RED will remind you to restart Node-RED and that is something you have to do by hand:

``` console
$ cd ~/IOTstack
$ docker compose restart nodered
```

Note:

* Some users have reported misbehaviour from Node-RED if they do too many iterations of:

	- make a change in Manage Palette
	- restart Node-RED

	It is better to make **all** the changes you intend to make, and only *then* restart Node-RED.

### via `npm` { #viaNPM }

You can also run `npm` inside the container to install any component that could be installed by `npm` in a non-container environment. This is the basic syntax:

``` console
$ cd ~/IOTstack
$ docker exec -w /data nodered npm «command» «arguments…»
$ docker compose restart nodered
```

Examples:

* To add the "find my iphone" node:

	``` console
	$ docker exec -w /data nodered npm install find-my-iphone-node
	$ docker compose restart nodered
	```

* To remove the "find my iphone" node:

	``` console
	$ docker exec -w /data nodered npm uninstall find-my-iphone-node
	$ docker compose restart nodered
	```

Note:

* You **must** include `-w /data` on each command. Any formula you find on the web will not include this. You have to remember to do it yourself!
* Many web examples include the `--save` flag on the `npm` command. That flag is not needed (it is ignored because the behaviour it used to control has been the default since NPM version 5. Node-RED containers have been using NPM version 6 for some time.
* See also the note above about restarting too frequently.
* You can use this approach if you need to force the installation of a specific version (which you don't appear to be able to do in Manage Palette). For example, to install version 4.0.0 of the "moment" node:

	``` console
	$ docker exec -w /data nodered npm install node-red-contrib-moment@4.0.0
	$ docker compose restart nodered
	```

### Comparison of methods { #viaWhich }

In terms of outcome, there is no real difference between the various methods. However, some nodes (eg "node-red-contrib-generic-ble" and "node-red-node-sqlite") **must** be installed by *Dockerfile*. The only way of finding out if a component **must** be installed via *Dockerfile* is to try Manage Palette and find that it doesn't work.

Aside from the exception cases that require *Dockerfile* or where you need to force a specific version, it is quicker to install nodes via Manage Palette and applying updates is a bit easier too. But it's really up to you.

If you're wondering about "backup", nodes installed via:

* *Dockerfile* – implicitly backed up when the *Dockerfile* is backed-up.
* Manage Palette or `npm install` – explicitly backed up when the `~/IOTstack/volumes` directory is backed-up.

Basically, if you're running IOTstack backups then your add-on nodes will be backed-up.

### Component precedence { #componentPrecedence }

Components that are installed via *Dockerfile* wind up at the **internal** path:

```
/usr/src/node-red
```

Components installed via Manage Palette or `docker exec -w /data` wind up at the **internal** path:

```
/data
```

which is the same as the **external** path:

```
~/IOTstack/volumes/nodered/data
```

Because there are two places, this invites the question of what happens if a given component is installed in both? The answer is that components installed in `/data` take precedence.

Or, to put it more simply: in any contest between methods, *Dockerfile* comes last.

### Resolving node duplication { #fixDuplicateNodes }

Sometimes, even when you are 100% certain that **you** didn't do it, a component will turn up in both places. There is probably some logical reason for this but I don't know what it is.

The problem this creates is that a later version of a component installed via *Dockerfile* will be blocked by the presence of an older version of that component installed by a different method.

The `nodered_list_installed_nodes.sh` script helps discover when this situation exists. For example:

``` console
$ nodered_list_installed_nodes.sh 

Fetching list of candidates installed via Dockerfile

Components built into the image (via Dockerfile)
  ACTIVE: node-red-admin
  ACTIVE: node-red-configurable-ping
  ACTIVE: node-red-contrib-boolean-logic
  ACTIVE: node-red-contrib-generic-ble
  ACTIVE: node-red-contrib-influxdb
  ACTIVE: node-red-dashboard
 BLOCKED: node-red-node-email
  ACTIVE: node-red-node-pi-gpiod
  ACTIVE: node-red-node-rbe
  ACTIVE: node-red-node-sqlite
  ACTIVE: node-red-node-tail

Fetching list of candidates installed via Manage Palette or npm

Components in persistent store at
 /home/pi/IOTstack/volumes/nodered/data/node_modules
  node-red-contrib-boolean-logic-ultimate
  node-red-contrib-chartjs
  node-red-node-email
  node-red-contrib-md5
  node-red-contrib-moment
  node-red-contrib-pushsafer
```

Notice how the `node-red-node-email` instance installed in the Dockerfile is being blocked. To fix this problem:

``` console
$ cd ~/IOTstack
$ docker exec -w /data nodered npm uninstall node-red-node-email
$ docker compose restart nodered
```


## Package management { #packageManagement }

As well as providing the Node-RED service, the nodered container is an excellent testbed. Installing the DNS tools, Mosquitto clients and tcpdump will help you to figure out what is going on **inside** container-space.

There are two ways to add extra packages. The first method is to add them to the running container. For example, to add the Mosquitto clients:

``` console
$ docker exec nodered apk add --no-cache mosquitto-clients
```

!!! note
	* The "apk" implies that the Node-RED container is based on Alpine Linux. Keep that in mind when you search for instructions on installing packages.

Packages installed this way will persist until the container is re-created (eg a `down` and `up` of the stack, or a reboot of your Raspberry Pi). This is a good choice if you only want to run a quick experiment.

The second method adds the packages to your *local* image every time you rebuild. Because the packages are in the *local* image, they are always in the running container. For example, to include the Mosquitto clients in every build:

1. Edit your override file <!--D-->&#x1F153; to include the package on the `EXTRA_PACKAGES` argument:

	``` yaml
	- EXTRA_PACKAGES=mosquitto-clients
	```

	Notes:

	1. Use a space to separate package names.
	2. Do **not** encapsulate the list in quote marks.
	3. See [IOTstack first run](#iotstackFirstRun) for another example.

2. Rebuild your *local* image by running the [re-building the local Node-RED image](#rebuildNodeRed) commands.

## Alpine vs Debian { #linuxDistro }

!!! note

	* The information in this section has not been tested for a while. Please treat it as general guidance only and don't assume it will work first time. Also, and this can't be stressed enough, there is **NO RELATIONSHIP** between the Linux distribution running inside a Node-RED container (Alpine being the default) and the Linux distribution running on the host. The host can be a Raspberry Pi running Raspberry Pi OS (a version of Debian customised by the Raspberry Pi Foundation), or Debian, or Ubuntu, or whatever other Linux distribution you chose. Similarly, your hardware may be based on ARM (like the Raspberry Pi) or an Intel X86 chip. In its turn, your host's Linux distribution may be running directly on the bare metal, or may have a hypervisor like Proxmox-VE in between (which is based on Debian). All of that complexity is totally and utterly irrelevant to the choice of Alpine running inside a Docker container, whether that container is Node-RED or Mosquitto or anything else. **NO RELATIONSHIP!**

The first part of IOTstack's default service definition for Node-RED is shown at [IOTstack first run](#serviceBuildFragment). Although it is not immediately obvious, this results in a container which is based on the Alpine Linux distribution. You can confirm this by running:

``` console
$ docker exec nodered grep "PRETTY_NAME" /etc/os-release
PRETTY_NAME="Alpine Linux v3.20"
```

Historically, Node-RED has been distributed on on [Dockerhub](https://hub.docker.com/r/nodered/node-red/tags) as two distinct sets of Node-RED images:

* Those based on the Alpine Linux distribution; and
* Those based on the Debian Linux distribution.

In general, Node-RED images have tracked Alpine releases more consistently than they have Debian. For example, at the time of writing (July 2024):

Image Tag       | Distro | Image OS      | Current
----------------|--------|---------------|--------
`latest`        | Alpine | v3.20         | [v3.20](https://alpinelinux.org/releases/)
`latest-debian` | Debian | 11 (bullseye) | [12 (bookworm)](https://www.debian.org/releases/)

In addition, Node-RED images based on Alpine have offered a greater range of options when it comes to the embedded version of Node.js. At the time of writing:

* image variants based on Alpine Linux include `latest-18`, `latest-20` and `latest-22`, implying a choice of Node.js versions 18, 20 and 22, with version 20 being the default;  while
* the single image variant for Debian Linux is `latest-debian` which comes with Node.js version 20.

Naturally, this situation could change at any time! This information is only here to make the point that, historically, Node-RED images based on Debian have lagged behind Alpine and have only supported a single version of Node.js. This is also the main reason why IOTstack defaults to Alpine images.

However, there may be circumstances where you decide it is appropriate to run a Node-RED image based on Debian. The purpose of this section is not to explore scenarios nor weigh the pros and cons, merely to explain how to adapt your Node-RED service definition to accomplish it. Proceed as follows:

1. Make a copy of your existing Dockerfile:

	``` console
	$ cd ~/IOTstack/services/nodered
	$ cp Dockerfile Debian.Dockerfile
	```

	The reason for making a copy is to preserve your existing (Alpine-aware) Dockerfile so you can easily switch back if you break something.

2. Open `Debian.Dockerfile` in a text editor and make the following changes:

	* Find the line:

		``` Dockerfile linenums="4"
		ARG DOCKERHUB_TAG=latest
		```

		**Replace** that line with:

		``` Dockerfile linenums="4"
		ARG DOCKERHUB_TAG=latest-debian
		```

	* Find the line:

		``` Dockerfile linenums="15"
		RUN apk update && apk add --no-cache eudev-dev ${EXTRA_PACKAGES}
		```

		**Replace** that line with:

		``` Dockerfile linenums="15"
		RUN apt update && apt install -y udev ${EXTRA_PACKAGES}
		```

		`apk` is the Alpine package manager whereas `apt` is the Debian package manager.

	* Save your work.

3. Make a copy of your existing compose file:

	``` console
	$ cd ~/IOTstack
	$ cp docker-compose.yml docker-compose.yml.bak
	```

	The reason for making a copy is to preserve your existing (Alpine-aware) service definition so you can easily switch back if you break something.

4. Open `docker-compose.yml ` in a text editor and make the following changes:

	* Change the Node-RED `build` clause so that it looks like this:

		``` yaml linenums="3"
		    build:
		      context: ./services/nodered/.
		      dockerfile: Debian.Dockerfile
		      args:
		        - DOCKERHUB_TAG=latest-debian
		        - EXTRA_PACKAGES=
		```

		There are two key edits:

		1. **Insert** the `dockerfile` line (as line 5).
		2. **Change** the right hand side of the `DOCKERHUB_TAG` argument from `latest` to `latest-debian` (line 7).

	* If you have any `EXTRA_PACKAGES` specified, you will need to allow for any package-name differences between Alpine and Debian. For example, suppose you are using this list of extra packages with Alpine:

		``` yaml linenums="8"
		- EXTRA_PACKAGES=mosquitto-clients bind-tools tcpdump tree
		```

		The `mosquitto-clients`, `tcpdump` and `tree` packages have the same names in the `apk` (Alpine) package manager as they do in `apt` (Debian) whereas `bind-tools` is named `dnsutils` in the Debian repositories. Thus the extra packages list for a Debian build would need to be:

		``` yaml linenums="8"
		- EXTRA_PACKAGES=mosquitto-clients dnsutils tcpdump tree
		```

	* Save your work.

5. Rebuild Node-RED:

	``` console
	$ cd ~/IOTstack
	$ docker compose build --no-cache --pull nodered
	```

	If the build process reports any errors, go back and check your work.

6. Start the new container:

	``` console
	$ docker compose up -d nodered
	```

7. Check that the new container is running properly and hasn't gone into a restart loop:

	``` console
	$ docker ps -a --format "table {{.Names}}\t{{.RunningFor}}\t{{.Status}}\t{{.Size}}" --filter name=nodered
	NAMES     CREATED          STATUS                    SIZE
	nodered   32 seconds ago   Up 31 seconds (healthy)   0B (virtual 945MB)
	```

	Providing the STATUS column reports "healthy" after roughly 30 seconds of runtime, it is usually safe to assume that the container is behaving normally.

8. Verify the base Linux distribution being used by the container:

	``` console
	$ docker exec nodered grep "PRETTY_NAME" /etc/os-release
	PRETTY_NAME="Debian GNU/Linux 11 (bullseye)"
	```

9. Check your Node-RED and Node.js versions:

	``` console
	$ docker exec nodered npm version --json | jq -r '[.["node-red-docker"],.["node"]] | @tsv'
	4.0.2	20.15.0
	```

	Interpretation - the container is running:

	* Node-RED version 4.0.2, with
	* Node.js version 20.15.0

The actual version numbers you see in the last two steps will depend (obviously) on whatever the good folks who maintain Node-RED thought was appropriate at the time they released whatever `latest-debian` variant is present on DockerHub at the moment when you perform the migration.

Please keep in mind that none of this affects the IOTstack menu. Re-running the menu is likely to revert your Node-RED service definition to be based on Alpine images.
