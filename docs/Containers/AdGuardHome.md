# AdGuard Home

## References

* [AdGuard Home GitHub](https://github.com/AdguardTeam/AdGuardHome)
* [AdGuard Home DockerHub](https://hub.docker.com/r/adguard/adguardhome)
* [AdGuard Home Wiki](https://adguard-dns.io/kb/adguard-home/overview/)

## Either *AdGuard Home* or *PiHole*, but not both

AdGuard Home and PiHole perform similar functions. They use the same ports so you can **not** run both at the same time. You must choose one or the other.

## Service Definition { #serviceDef }

This is the service definition that gets added to your `docker-compose.yml` when you choose AdGuard Home.

``` yaml linenums="1"
adguardhome:
  container_name: adguardhome
  image: adguard/adguardhome
  restart: unless-stopped
  environment:
    - TZ=${TZ:-Etc/UTC}
  x-network_mode: host  # see IOTstack documentation
  ports:
    - "53:53/tcp"       # regular DNS
    - "53:53/udp"       # regular DNS
    - "3001:3000/tcp"   # only active until port 8089 becomes active
    - "8089:8089/tcp"   # regular administrative interface
  # - "443:443/tcp"     # HTTPS/DNS-over-HTTPS
  # - "784:784/udp"     # DNS-over-QUIC
  # - "853:853/tcp"     # DNS-over-TLS
  # - "5443:5443/tcp"   # DNSCrypt
  # - "5443:5443/udp"   # DNSCrypt
  # - "6060:6060/tcp"   # debugging profiles
  # - "67:67/udp"       # DHCP service (host mode)
  # - "68:68/tcp"       # DHCP service (host mode)
  # - "68:68/udp"       # DHCP service (host mode)
  volumes:
    - ./volumes/adguardhome/workdir:/opt/adguardhome/work
    - ./volumes/adguardhome/confdir:/opt/adguardhome/conf
```

## Quick Start { #quickStart }

When you first install AdGuard Home:

1. Use a web browser to connect to your Raspberry Pi on port 3001. For example:

	```
	http://raspberrypi.local:3001
	```
	
	See also [About port 3001](#about3001).

2. Click <kbd>Get Started</kbd>&nbsp;.
3. At Step 2/5:

	- change the port number of the administrative interface to 8089;
	- leave other settings at their defaults; and
	- click <kbd>Next</kbd>&nbsp;.

4. Enter a username and password and click <kbd>Next</kbd>&nbsp;.

	If you prefer to run AdGuardHome without any login credentials you can [set that up later](#nopassword) but, for now, you must choose a username and reasonably strong password.

5. Read the "Step 4/5" panel and click <kbd>Next</kbd>&nbsp;.
6. Click <kbd>Open Dashboard</kbd>&nbsp;. This redirects to port 8089.
7. After the initial setup, you connect to AdGuard Home via port 8089:

	```
	http://raspberrypi.local:8089
	```

	See also [About port 8089](#about8089).

## About port 3001 { #about3001 }

Port 3001 (external, 3000 internal) is only used during [Quick Start](#quickStart) procedure. Once port 8089 becomes active, port 3001 ceases to be active. However, you need to keep port 3001 *reserved* even though it is only ever used to set up port 8089.

If you make a mess of things and need to go back to the point where port 3001 is active, you must start from a [Clean slate](#cleanSlate).

## About port 8089 { #about8089 }

Port 8089 (external and internal) is the administrative user interface for AdGuard Home running under IOTstack.

Port 8089 is not active until you have completed the [Quick Start](#quickStart) procedure. You must start by connecting to port 3001.

Because of AdGuard Home limitations, you must take special precautions if you decide to change the administrative interface to a different port number:

1. The internal and external ports **must** be the same (see line 12 in the [service definition](#serviceDef). For example, to use port 9999 instead of port 8089, change the service definition like this:

	``` yaml linenums="12"
	    - "9999:9999/tcp"   # regular administrative interface
	```

2. You must start from a [Clean slate](#cleanSlate). 

3. When you repeat the [Quick Start](#quickStart) procedure, substitute your new Admin Web Interface port (eg "9999") where you see "8089".

## Clean slate { #cleanSlate }

To start over from a clean slate, proceed like this:

``` console
$ cd ~/IOTstack
$ docker-compose down adguardhome
$ sudo rm -rf ./volumes/adguardhome
$ docker-compose up -d adguardhome
```

The container will go into "first run" mode and port 3001 will become active. You can then follow the [Quick Start](#quickStart) procedure.

## About Host Mode

If you want to run AdGuard Home as your DHCP server, you need to put the container into "host mode". The line numbers in this section refer to those in the [service definition](#serviceDef) above.

You need to make two changes:

1. Remove the `x-` prefix from line 7 so that it looks like:

	``` yaml linenums="7"
	  network_mode: host    # see IOTstack documentation
	```
	
	Removing the `x-` prefix has the effect of activating the `network_mode:` clause.
	
2. Add an `x-` prefix to line 8 so that it looks like:

	```  yaml linenums="8"
	  x-ports:
	```

	Inserting the `x-` prefix has the effect of deactivating the entire `ports:` clause.

Save your work. To apply the changes:

```
$ cd ~/IOTstack
$ docker-compose up -d adguardhome
```

When you run the container in host mode, **all** of the *internal* (right hand side) ports listed in the [`ports:` clause](#serviceDef) become active. If you are running *other* services on your host that are already bound to one or more of those ports, Docker will refuse to start the container. It is up to you to resolve those port conflicts.

Note:

* It is not really a good idea to offer DHCP services from a container. This is because containers generally start far too late in a boot process to be useful. If you want to use AdGuard Home for DHCP, you should probably consider a native installation.

## Passwordless administration { #nopassword }

In many home networks, requirements for strong login credentials on every service can be overkill. If it's appropriate for your situation you can choose to run AdGuardHome "passwordless" like this:

1. Use `sudo` to open the following file in a text editor:

	```
	~/IOTstack/volumes/adguardhome/confdir/AdGuardHome.yaml
	```
	
	For example:
	
	``` console
	$ cd ~/IOTstack
	$ sudo vi ./volumes/adguardhome/confdir/AdGuardHome.yaml
	```

2. Find these lines:

	``` yaml
	users:
	  - name: «username»
	    password: «hashCode»
	```
	
3. Replace those three lines with this single line:

	``` yaml
	users: []
	```

4. Save your work.
5. Restart the container:

	``` console
	$ docker-compose restart adguardhome
	```
