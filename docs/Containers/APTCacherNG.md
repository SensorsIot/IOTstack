# APT-cacher-NG

## References

* [DockerHub](https://hub.docker.com/r/mbentley/apt-cacher-ng)
* [Documentation](https://thecoletrain.github.io/APT-Cacher-NG/)

## About

From the documentation:

> APT-Cacher-NG is designed to cache Ubuntu, Debian, and other Linux distributions and packages locally. If you have a homelab, you probably have a lot of VM’s. When one of your machines updates, those updates are stored here. The next machine that is the same or similar can pull from the cache locally instead of going out to the internet again.

## Quick Start { #quickStart }

1. Install the service. For example:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh install apt-cacher-ng
	$ ./iotstack-menu.sh build
	$ docker compose up -d apt-cacher-ng
	```

2. Use a web browser to connect to your Raspberry Pi on port 3142. For example:

	```
	http://raspberrypi.local:3142
	```
	
3. Read the documentation on that page! In particular, the bits about:
	
	1. The file you should create (using `sudo`):

		```
		/etc/apt/apt.conf.d/00aptproxy
		```
		
	2. The template directive:
	
		```
		Acquire::http::Proxy "http://172.30.0.2:3142";
		```
	
		Replace the example IP address (`172.30.0.2`) with a network reference to the host where `apt-cacher-ng` is running in a container. The reference could be:
	
		* The IP address of the host
		* The fully-qualified domain name of the host (providing this has been added to the DNS)
		* The host-name of the host (providing this has been added to `/etc/hosts`)
		* The multicast DNS name of the host (providing mDNS services are running on both the source and destination hosts)

	Remember to do this step on each of your Debian-lineage hosts, **including** the host where `apt-cacher-ng` is running.
	
4. Under "Related links" click "Statistics report and configuration page". That takes you to the statistics page for the `apt-cacher-ng` instance running in the container.

Thereafter, the service pretty much looks after itself. Whenever you do an `apt upgrade` on any host, the cache is checked for the package. If it is not found, it is downloaded from the Internet, otherwise it is served by the container. In other words, the first retrieval of any package is the same as always (fetched from the Internet) but the second and subsequent retrievals come from the cache.
