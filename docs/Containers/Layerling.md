# Layerling

Layerling is an open-source 3D modelling tool which, in terms of complexity, sits between Tinkercad and Fusion 360.

You can use a browser to create and edit models for your 3D printer. The engine runs as a container on your IOTstack instance so your private data never leaves your own network (unless you want it to).

## References

* [Docker Hub](https://hub.docker.com/r/henmedia/layerling)
* [GitHub](https://github.com/henmedia/layerling)
* [Documentation](https://layerling.com/guide/index.html)

## Installation

To install and start Layerling:

``` console
$ cd ~/IOTstack
$ ./iotstack-menu.sh install layerling
$ ./iotstack-menu.sh build
$ docker compose up -d layerling
```

You can also run the menu without arguments to install Layerling and build your stack.

## Connecting to the GUI

Layerling uses a web browser interface which, in IOTstack, is reachable on port 3050. For example:

```
http://myhost.home.arpa:3050
```

## Customisation

See also:

* Comments contained in the [sample service definition](https://github.com/henmedia/layerling/blob/main/docker/compose.yml)

* [Building with an AI (MCP)](https://layerling.com/guide/ai-with-mcp.html#a-copy-on-a-nas-or-server) discussion

Customisation is best undertaken using an [override file](../Basic_setup/Custom.md#custom-service) at the path:

```
~/IOTstack/services/layerling/override.yml
```

After you create or edit your override file, you can implement the changes like this:

1. Rebuild your stack:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh build
	```

2. Optionally, pre-flight the results by running:

	``` console
	$ docker compose config layerling
	```

	Find and fix any errors reported by docker compose.

3. Recreate the container with the new overrides:

	``` console
	$ docker compose up -d layerling
	```

## Maintenance

Note:

* At the time of writing (early November 2026), Layerling was undergoing *rapid* development. New images are pushed almost daily.

You can check for image updates by running:

``` console
$ cd ~/IOTstack
$ docker compose pull
```

If Docker downloads a newed image, you can implement it by running:

``` console
$ docker compose up -d layerling
$ docker system prune -f
```

## About the runtime user

Reference:

* [sample service definition](https://github.com/henmedia/layerling/blob/23468557917fdecbb4fe40067fcf1d62e08d2aa6/docker/compose.yml#L35-L37

By default, Layerling runs as user ID 999 (user `nextjs` inside the container). The *sample service definition* suggests the option of specifying an alternative via a `user` clause.

Either approach causes a silent failure which is the result of docker compose initialising the persistent store with root ownership before the container starts to run.

The workaround proposed in the *sample service definition* is to use `sudo` to change ownership on the persistent store. This works but is suboptimal because it is something the user just has to remember to do any time the service is installed on a new host or started from a clean slate.

Given the rapid pace of development, Layerling's developer(s) may well implement the more common pattern for Docker containers:

1. Allow the container to launch as root;
2. Use root privileges available to the entry-point script to enforce correct ownership on the persistent store; and **then**
3. Downgrade the container's runtime privileges, typically by reference to `PUID` and `PGID` environment variables.

In the meantime, the service definition provided with IOTstack defines:

```
user: "0" 
```

The container launches and runs as root and the silent failure does not occur, and models can be stored safely on the server.

