# Jellyfin

## References


* [GitHub](https://github.com/jellyfin/jellyfin-vue)
* [DockerHub](https://hub.docker.com/r/jellyfin/jellyfin)
* [Documentation](https://jellyfin.org/docs/)

## About

From the documentation:

> Jellyfin is a Free Software Media System that puts you in control of managing and streaming your media. It is an alternative to the proprietary Emby and Plex, to provide media from a dedicated server to end-user devices via multiple apps. Jellyfin is descended from Emby's 3.5.2 release and ported to the .NET Core framework to enable full cross-platform support. There are no strings attached, no premium licenses or features, and no hidden agendas: just a team who want to build something better and work together to achieve it. We welcome anyone who is interested in joining us in our quest!

## Quick Start { #quickStart }

1. Install the service. For example:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh install jellyfin
	$ ./iotstack-menu.sh build
	$ docker compose up -d jellyfin
	```

2. Use a web browser to connect to your Raspberry Pi on port 8096. For example:

	```
	http://raspberrypi.local:8096
	```
	
3. Work through the setup steps.
