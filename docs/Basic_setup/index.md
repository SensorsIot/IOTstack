# Getting Started

## About IOTstack { #conventions }

IOTstack is not a *system.* It is a set of *conventions* for assembling arbitrary collections of Docker containers into something that has a reasonable chance of working out-of-the-box. The three most important conventions are:

1. If a container needs information to persist across restarts (and most containers do) then the container's *persistent store* will be found at:

	```
	~/IOTstack/volumes/«container»
	```

	Most example *service definitions* found on the web have a scattergun approach to this problem. IOTstack imposes order on this chaos.

2. Network port conflicts have been sorted out in advance.

	> Sometimes this is not possible. For example, Pi-hole and AdGuardHome both offer Domain Name System services. The DNS relies on port 53. You can't have two containers claiming port 53 so the only way to avoid this is to pick *either* Pi-hole *or* AdGuardHome.

3. Where multiple containers are needed to implement a single user-facing service, the IOTstack service definition will include everything needed. A good example is NextCloud which relies on MariaDB. IOTstack implements "NextCloud_DB" as a private instance of MariaDB which is only available to NextCloud. This strategy ensures that you are able to run your own separate MariaDB container without any risk of interference with your NextCloud service. 

## Requirements

IOTstack makes the following assumptions:

1. Your hardware is capable of running Debian or one of its derivatives. Examples that are known to work include:

	- a Raspberry Pi (typically a 3B+ or later; 2GB RAM should probably be considered the bare minimum)

		> The Raspberry Pi Zero W2 has been tested with IOTstack. It works but the 512MB RAM means you should not try to run too many containers concurrently.

	- Orange Pi Win/Plus [see also issue 375](https://github.com/SensorsIot/IOTstack/issues/375)
	- an Intel-based Mac running macOS plus Parallels with a Debian guest.
	- an Intel-based platform running Proxmox-VE with a Debian guest.

2. Your host or guest system is running a reasonably-recent version of Debian or an operating system which is downstream of Debian in the Linux family tree, such as Raspberry Pi OS (aka "Raspbian") or Ubuntu.

	IOTstack is known to work in 32-bit mode but not all containers have images on DockerHub that support 32-bit mode. If you are setting up a new system from scratch, you should choose a 64-bit option.

	IOTstack was known to work with Buster but it has not been tested recently. Bullseye is known to work but if you are setting up a new system from scratch, you should choose Bookworm or Trixie.

	Please don't waste your own time trying Linux distributions from outside the Debian family tree. They are unlikely to work.

3. You are logged-in as the default user (ie not root). In most cases, this is the user with ID=1000 and is what you get by default on either a Raspberry Pi OS or Debian installation.

	This assumption is not really an IOTstack requirement as such. However, many containers assume UID=1000 exists and you are less likely to encounter issues if this assumption holds.

Please don't read these assumptions as saying that IOTstack will not run on other hardware, other operating systems, or as a different user. It is just that IOTstack gets most of its testing under these conditions. The further you get from these implicit assumptions, the more your mileage may vary.

### Raspberry Pi notes

#### Power

Docker containers under sustained load can push a Pi&nbsp;4 to 2–3A and a Pi&nbsp;5 to 3–5A depending on connected peripherals (USB drives, HATs, NVMe). An underpowered supply causes random crashes and SD card corruption. Use the [Raspberry Pi Power Supply Calculator](https://raspberry.tips/en/raspberry-pi-power-supply-calculator-how-many-watts-does-my-project-need) to estimate the wattage your specific setup needs.

However, please note that not all *power*-related problems can be traced to the power *supply* (the wall-wart converting AC mains power to 5VDC). Sometimes, your Raspberry&nbsp;Pi itself has an onboard regulator which struggles under the load being placed on it. Please see [Checking your Raspberry&nbsp;Pi's view of its power supply](https://gist.github.com/Paraphraser/17fb6320d0e896c6446fb886e1207c7e) if you suspect this might be happening to you.

#### Storage

SD cards wear out faster under continuous Docker log writes. An SSD (USB or NVMe HAT) is strongly recommended for production use. If you run on an SD card, this [lifespan calculator](https://raspberry.tips/en/calculate-raspberry-pi-sd-card-lifespan-test-now) estimates how long it will last, based on your workload.

## git clone vs zip download { #clone-vs-zip }

The installation methods described in this document result in a *clone* of the GitHub repository being placed on your system.

One of the design goals of `iotstack-menu.sh` is to give changes made on GitHub some chance of making it into your running stack. To achieve that goal, the menu makes heavy use of the commit&nbsp;IDs that Git maintains in each distributed clone.

Some people prefer to download GitHub repositories as `.zip` files. That's your choice but `iotstack-menu.sh` simply will not work properly if you do that.

## New installation

You have two choices:

1. If you have an **existing** system and you want to add IOTstack to it, then the [add-on](#addonInstall) method is your best choice.
2. If you are setting up a **new** system from scratch, then [PiBuilder](#pibuilderInstall) is probably your best choice. You can, however, also use the [add-on](#addonInstall) method in a green-fields installation.

### add-on method { #addonInstall }

This method assumes an **existing** system rather than a green-fields installation. The script uses the principle of least interference. It only installs the bare minimum of prerequisites and, with the exception of adding some boot time options to your Raspberry Pi (but not any other kind of hardware), makes no attempt to tailor your system.

To use this method:

1. Install `curl`:

	``` console
	$ sudo apt install -y curl
	```

2. Run the following command:

	``` console
	$ curl -fsSL https://raw.githubusercontent.com/SensorsIot/IOTstack/master/install.sh | bash
	```

The `install.sh` script is *designed* to be run multiple times. If the script discovers a problem, it will explain how to fix that problem and, assuming you follow the instructions, you can safely re-run the script. You can repeat this process until the script completes normally.

### PiBuilder method { #pibuilderInstall }

Compared with the [add-on method](#addonInstall), PiBuilder is far more comprehensive. PiBuilder:

1. Does everything the [add-on method](#addonInstall) does.
2. Adds support packages and debugging tools that have proven useful in the IOTstack context.
3. Installs all required system patches (see next section).
4. In addition to cloning IOTstack (this repository), PiBuilder also clones:

	* [IOTstackBackup](https://github.com/Paraphraser/IOTstackBackup) which is an alternative to the backup script supplied with IOTstack but does not require your stack to be taken down to perform backups; and
	* [IOTstackAliases](https://github.com/Paraphraser/IOTstackAliases) which provides shortcuts for common IOTstack operations.

5. Performs extra tailoring intended to deliver a rock-solid platform for IOTstack.

PiBuilder does, however, assume a **green fields** system rather than an existing installation. Although the PiBuilder scripts will *probably* work on an existing system, that scenario has never been tested so it's entirely at your own risk. 

PiBuilder actually has two specific use-cases:

1. A first-time build of a system to run IOTstack; and
2. The ability to create your own customised version of PiBuilder so that you can quickly rebuild your Raspberry Pi or Proxmox guest after a disaster. Combined with IOTstackBackup, you can go from bare metal to a running system with data restored in about half an hour.

## Required system patches

You can skip this section if you used [PiBuilder](https://github.com/Paraphraser/PiBuilder) to construct your system. That's because PiBuilder installs all necessary patches automatically.

If you used the [add-on method](#addonInstall), you should consider applying these patches by hand.

### patch 1 – restrict DHCP

This patch is only really needed if Network Manager is inactive. You can check that with:

``` console
$ systemctl is-active NetworkManager
```

If the response is "inactive" then run the following commands:

``` console
$ sudo bash -c '[ $(egrep -c "^allowinterfaces eth\*,wlan\*" /etc/dhcpcd.conf) -eq 0 ] && echo "allowinterfaces eth*,wlan*" >> /etc/dhcpcd.conf'
```

This patch prevents the `dhcpcd` daemon from trying to allocate IP addresses to Docker's `docker0` and `veth` interfaces. Docker assigns the IP addresses itself and `dhcpcd` trying to get in on the act can lead to a deadlock condition which can freeze your Pi.

See [Issue 219](https://github.com/SensorsIot/IOTstack/issues/219) and [Issue 253](https://github.com/SensorsIot/IOTstack/issues/253) for more information.

### patch 2 – update libseccomp2

This patch is **ONLY** for Raspbian Buster. Do **NOT** install this patch if you are running Raspbian Bullseye or later.

1.  check your OS release

    Run the following command:

    ``` console
    $ grep "PRETTY_NAME" /etc/os-release
    PRETTY_NAME="Raspbian GNU/Linux 10 (buster)"
    ```

    If you see the word "buster", proceed to step 2. Otherwise, skip this patch.

2.  if you are indeed running "buster"

    Without this patch on Buster, Docker images will fail if:

    * the image is based on Alpine and the image's maintainer updates to [Alpine 3.13](https://wiki.alpinelinux.org/wiki/Release_Notes_for_Alpine_3.13.0#time64_requirement); and/or
    * an image's maintainer updates to a library that depends on 64-bit values for *Unix epoch time* (the so-called Y2038 problem).

    To install the patch:

    ``` console
    $ sudo apt-key adv --keyserver hkps://keyserver.ubuntu.com:443 --recv-keys 04EE7237B7D453EC 648ACFD622F3D138
    $ echo "deb http://httpredir.debian.org/debian buster-backports main contrib non-free" | sudo tee -a "/etc/apt/sources.list.d/debian-backports.list"
    $ sudo apt update
    $ sudo apt install libseccomp2 -t buster-backports
    ```

### patch 3 - kernel control groups

Kernel control groups need to be enabled in order to monitor container specific
usage. This makes commands like `docker stats` fully work. Also needed for full
monitoring of docker resource usage by the telegraf container.

Enable by running (takes effect after reboot):

``` console
$ CMDLINE="/boot/firmware/cmdline.txt" && [ -e "$CMDLINE" ] || CMDLINE="/boot/cmdline.txt"
$ echo $(cat "$CMDLINE") cgroup_memory=1 cgroup_enable=memory | sudo tee "$CMDLINE"
$ sudo reboot
```

## the IOTstack menu { #iotstackMenu}

The menu is used to construct your `docker-compose.yml` and `docker-compose.override.yml` files. Those files are read by `docker compose` which issues the instructions necessary for starting your stack.

The menu is a great way to get started quickly but it is only an aid. It is a good idea to study the files generated by the menu to see how everything is put together.

Once you understand what the menu does (and, more importantly, what it doesn't do), you will realise that the real power of IOTstack lies not in its menu system but resides in its [conventions](#conventions).

### menu item: Build Stack { #buildStack}

To create your first `docker-compose.yml`, begin by setting your working directory correctly:

``` console
$ cd ~/IOTstack
```

Then you have two choices:

* Menu mode:

	1. Start the menu in menu mode

		```
		$ ./iotstack-menu.sh
		```

	2. Go into the "Services" menu.

	3. For each service you wish to install:

		- place the cursor on the service's name in the list and press <kbd>enter</kbd>
		- choose "Install".

	4. When you have finished selecting services, choose "Return" which will take you back to the main menu.
	5. Choose "Build" from the main menu, then choose "Ok".
	6. Choose "Exit".
	7. Start your stack by running:

		``` console
		$ docker compose up -d
		```

* Command-line mode:

	Here is an example installing four services:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh install mosquitto influxdb nodered grafana
	$ ./iotstack-menu.sh build
	$ docker compose up -d
	```

The best advice we can give is "start small". Limit yourself to the core containers you actually need (eg Mosquitto, Node-RED, InfluxDB, Grafana, Portainer). You can always add more containers later. Some users have gone overboard with their initial selections and have run into what seem to be Raspberry Pi OS limitations.

The first time you run `up` your stack Docker will download all the images from DockerHub. How long this takes will depend on how many containers you selected and the speed of your internet connection.

Some containers also need to be built locally. Node-RED is an example. Depending on the Node-RED nodes you select, building the image can also take a very long time. This is especially true if you select the SQLite node.

Be patient (and, if you selected the SQLite node, ignore the huge number of warnings).

## useful commands: docker & docker compose

Handy rules:

* `docker` commands can be executed from anywhere, but
* `docker compose` commands need to be executed from within `~/IOTstack`

### starting your IOTstack

To start the stack:

``` console
$ cd ~/IOTstack
$ docker compose up -d
```

Once the stack has been brought up, it will stay up until you take it down. This includes shutdowns and reboots of your Raspberry Pi. If you do not want the stack to start automatically after a reboot, you need to down the stack before you issue the reboot command.

#### logging journald errors

If you get docker logging error like:

```
Cannot create container for service [service name here]: unknown log opt 'max-file' for journald log driver
```

1. Run the command:

	``` console
	$ sudo nano /etc/docker/daemon.json
	```

2. change:

	``` json
	"log-driver": "journald",
	```

	to:

	``` json
	"log-driver": "json-file",
	```

Logging limits were added to prevent Docker using up lots of RAM if log2ram is enabled, or SD cards being filled with log data and degraded from unnecessary IO. See [Docker Logging configurations](https://docs.docker.com/config/containers/logging/configure/)

You can also turn logging off or set it to use another option for any service by using the IOTstack `docker-compose-override.yml` file mentioned at [IOTstack/Custom](Custom.md).

Another approach is to change `daemon.json` to be like this:

``` json
{
  "log-driver": "local",
  "log-opts": {
    "max-size": "1m"
  }
}
```

The `local` driver is specifically designed to prevent disk exhaustion. Limiting log size to one megabyte also helps, particularly if you only have a limited amount of storage.

If you are familiar with system logging where it is best practice to retain logs spanning days or weeks, you may feel that one megabyte is unreasonably small. However, before you rush to increase the limit, consider that each container is the equivalent of a small computer dedicated to a single task. By their very nature, containers tend to either work as expected or fail outright. That, in turn, means that it is usually only recent container logs showing failures as they happen that are actually useful for diagnosing problems.

### starting an individual container

To start a particular container:

``` console
$ cd ~/IOTstack
$ docker compose up -d «container»
```

### stopping your IOTstack

Stopping aka "downing" the stack stops and deletes all containers, and removes the internal network:

``` console
$ cd ~/IOTstack
$ docker compose down
```

To stop the stack without removing containers, run:

``` console
$ cd ~/IOTstack
$ docker compose stop
```

To resume a stopped stack, run:

``` console
$ cd ~/IOTstack
$ docker compose start
```

### stopping an individual container

`stop` can also be used to stop individual containers, like this:

``` console
$ cd ~/IOTstack
$ docker compose stop «container»
```

This puts the container in a kind of suspended animation. You can resume the container with

``` console
$ cd ~/IOTstack
$ docker compose start «container»
```

You can also `down` a container:

``` console
$ cd ~/IOTstack
$ docker compose down «container»
```

<a name="downContainer"></a>Note:

* If the `down` command returns an error suggesting that you can't use it to down a container, it actually means that you have an obsolete version of `docker compose`. You should upgrade your system.

### checking container status

You can check the status of containers with:

``` console
$ docker ps
```

or

``` console
$ cd ~/IOTstack
$ docker compose ps
```

### viewing container logs

You can inspect the logs of most containers like this:

``` console
$ docker logs «container»
```

for example:

``` console
$ docker logs nodered
```

You can also follow a container's log as new entries are added by using the `-f` flag:

``` console
$ docker logs -f nodered
```

Terminate with a Control+C. Note that restarting a container will also terminate a followed log.

### restarting a container

You can restart a container in several ways:

``` console
$ cd ~/IOTstack
$ docker compose restart «container»
```

This kind of restart is the least-powerful form of restart. A good way to think of it is:

 * only the *processes* running within the container are restarted;
 * any [ephemeral data](#ephemeralData) created by the container *before* it was restarted is still available *after* the container is restarted.

If you change a `docker-compose.yml` setting for a container and/or an environment variable file referenced by `docker-compose.yml` then a `restart` is usually not enough to bring the change into effect. You need to make `docker compose` notice the change:

``` console
$ cd ~/IOTstack
$ docker compose up -d «container»
```

Alternatively, to force a container to be recreated from its image:

``` console
$ cd ~/IOTstack
$ docker compose up -d --force-recreate «container»
```

Either approach re-creates the container by making a fresh copy from its image. Any [ephemeral data](#ephemeralData) created by the container *before* the `up` command is executed is lost.

See also [updating images and containers](../Updates/index.md#maint-images) if you need to force `docker compose` to notice a change to a Dockerfile.

## ephemeral data { #ephemeralData }

The perspective of a process running inside a container is that it is like any other process running inside a computer: it can read from and write to any path for which it has permission.

If and only if a path *inside* a container is mapped to a path *outside* a container is the data written by a process running inside the container preserved across container re-creations. This kind of data is known as [persistent data](#persistentData).

All (**all**) other data written by a process running inside the container is *ephemeral* data. This kind of data is lost whenever the container is taken down. 

## persistent data { #persistentData }

Docker allows a container's designer to map folders inside a container to a folder on your disk (SD, SSD, HD). This is done with the "volumes" key in `docker-compose.yml`. Consider the following snippet for Node-RED:

```yaml
volumes:
  - ./volumes/nodered/data:/data
```

This type of volume is a [Docker bind-mount](https://docs.docker.com/storage/bind-mounts/), where the
container's internal path is directly linked to the external path. All file-system operations, reads and writes, are mapped to directly to the files and folders at the external path.

You read the mapping as two paths, separated by a colon. The:

* external path is `./volumes/nodered/data`
* internal path is `/data`

In this context, the leading "." means "the folder containing`docker-compose.yml`", so the external path is actually:

* `~/IOTstack/volumes/nodered/data`

### deleting persistent data

If you need a "clean slate" for a container, you can delete its persistent store. Using InfluxDB as an example:

``` console
$ cd ~/IOTstack
$ docker compose down influxdb
$ sudo rm -rf ./volumes/influxdb
$ docker compose up -d influxdb
```

When `docker compose` tries to bring up InfluxDB, it will notice this volume mapping in `docker-compose.yml`:

```yaml
    volumes:
      - ./volumes/influxdb/data:/var/lib/influxdb
```

and check to see whether `./volumes/influxdb/data` is present. Finding it not there, it does the equivalent of:

``` console
$ sudo mkdir -p ./volumes/influxdb/data
```

When InfluxDB starts, it sees that the folder on right-hand-side of the volumes mapping (`/var/lib/influxdb`) is empty and initialises new databases.

This is how **most** containers behave. There are exceptions so it's always a good idea to keep a backup.
