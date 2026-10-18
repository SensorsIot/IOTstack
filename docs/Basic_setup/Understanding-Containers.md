# What is Docker?

In simple terms, Docker is a software platform that simplifies the process of building, running, managing and distributing applications. It does this by virtualizing the operating system of the computer upon which Docker is running.

## The Problems

### multiple versions

Let’s say you have three different Python-based applications that you plan to host on a single server, which could either be a physical or a virtual machine. Each of these applications makes use of a different version of Python, as well as the associated libraries and dependencies, differ from one application to another. Since we cannot have different versions of Python installed on the same machine, this prevents us from hosting all three applications on the same computer.

### upgrades and rollbacks

Let's say you have one version of a package (eg Python) installed but you upgrade to a later version, which then does not work. If the package is installed natively (eg `apt install`) you *may* be able to downgrade but your success will depend on whether the upgrade broke something. Worst case, you wind up needing to rebuild your system. 

## The Solutions

With Docker, each version of an application is packaged in its own image. Each image is instantiated as a separate container so you can have your three different Python-based applications running side by side.

If you upgrade a container to a later image and it doesn't work, you just fall back to the earlier known-good image.

## Docker Terminology

Docker Images and Docker Containers are the two essential things that you will come across daily while working with Docker.

In simple terms:

* a Docker *image* is a like a snap-frozen version of a small independent computer running a single service. The image contains the application, and all the dependencies required for Docker to run that application.

* a Docker *container* is a running instance of a Docker *image*.

## What is Docker Compose?

Docker Compose provides a way to orchestrate multiple containers that work together. Docker compose is a simple yet powerful tool that is used to run multiple containers as a single stack. For example, suppose you have an application which requires MQTT as a communication service between IOT devices and OpenHAB as a Smarthome application service. You can describe the arrangement in a single file (`docker-compose.yml`). Docker Compose will then instantiate both containers and wire-up all the necessary network connectivity.

## What is IOTstack?

IOTstack, together with its templates and menu system, generates `docker-compose.yml` files.

## How Docker Compose Works

* Uses [YAML](https://yaml.org/about/) files to configure application services:

	- `docker-compose.yaml`; and, optionally
	- `docker-compose.override.yml`

* Can start all the services with a single command:

	- `docker compose up -d`

* Can stop all the service with a single command:

	- `docker compose down`

## How are the containers connected

By default, Docker creates an "internal bridged network" to which all containers are connected automatically when a stack is brought "up".

??? note "*Bridging* vs *Switching*"
	* "Bridging" and "switching" are synonyms. Bridges operate at Layer Two of the OSI model, and have the purpose of reducing the total amount of network traffic in a broadcast domain (aka "subnet") by subdividing the network into *segments*. The term *switching* was created for marketing. It was invented to distinguish between bridges implemented in software vs those implemented in silicon. Docker networking is a software implementation, therefore "bridging" (or, more formally, "transparent bridging") is the correct term. 
 
Containers connected to the same internal bridged network can refer to each other via container name. For example, an OpenHAB container can refer to the Mosquitto container as `mosquitto:1883`. Unicast traffic between the two containers is delivered point-to-point and is highly efficient.

## How the container are connected to host machine

### Volumes

At runtime, processes running within a container have full freedom to read from and write to any part of the container's file system, subject only to normal Unix permission constraints. However, any changes a container makes during its lifetime are lost when the container is taken "down". The next time the container is brought "up", it starts over with a fresh copy of the file system inherited from its image.

To be able to persist parts of a container's file system (or "state") across a series of "up" and "down" events, *volumes* can be used to share data with the host. The collection of volumes that a container shares with a host is known as the container's persistent store. One of IOTstack's conventions is that each container's persistent store is one or more sub-directories of the path:

```
~/IOTstack/volumes/«container»/
```

### Ports

Generally, containers need to be reachable from the outside world. For example OpenHAB has a web frontend that needs to be accessible. Docker containers can work in two modes: host mode, and non-host mode.

In host mode, processes running within a container bind to the host's network ports.

In non-host mode, the binding is with the container's network ports. Then, providing `docker-compose.yml` contains the necessary instructions, Docker sets up Network Address Translation (NAT) to map between container ports and host ports.

Two processes (whether running natively or in a container) can't bind to the same host port. Resolving competing demands for ports works like this. If a container is running in host mode, changing a port it uses is accomplished via environment variable, or configuration file, or (worst case) recompiling the process. In non-host mode, changing the host port a container's port maps to is accomplished by changing the instructions in `docker-compose.yml`.

Irrespective of whether you install services natively or in containers, or whether your containers run in host- or non-host mode, running a collection of services on the same host necessarily involves making choices about port numbers. In the classic IoT "MING" stack, for example, Mosquitto and InfluxDB do not have web front ends, whereas Node-RED defaults to port 1880 while Grafana defaults to port 3000. If remembering port numbers or setting up bookmarks are not your thing, you can try setting up a reverse proxy service such as Nginx, to direct domain names like "grafana.home.arpa" to "grafana:3000". 

## How does Proxmox-VE fit into all this?

Docker supports running multiple (containerized) services within a single host. Proxmox-VE is also a virtualizing system where each virtual host is called a *guest*. Proxmox-VE supports running multiple guests on a single physical computer.

Taken together, given a physical computer running Proxmox-VE, you can run multiple guests in parallel, where each guest can be running multiple Docker containers. From a networking perspective:

* Proxmox-VE running on the physical computer has a unique MAC and IP address (typically allocated via DHCP) via which you reach Proxmox services to start and stop guests;
* Proxmox-VE allocates each guest a unique MAC address, so each guest has its own IP address (also typically allocated via DHCP);
* All of the containers running on a guest share the guest's IP address; and
* Each container is reached via its guest's IP address plus the host (guest) ports to which the container is bound. 

## References

* [Docker Simplified: A Hands-On Guide for Absolute Beginners](https://www.freecodecamp.org/news/docker-simplified-96639a35ff36/)
* [What is a reverse proxy?](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/)
* [Understanding Volumes in Docker](https://blog.container-solutions.com/understanding-volumes-docker)

