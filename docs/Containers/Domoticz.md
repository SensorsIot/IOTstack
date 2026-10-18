# Domoticz

## References

- [Domoticz home](https://www.domoticz.com)

	- [User Guide](https://www.domoticz.com/DomoticzManual.pdf) (pdf)

- [GitHub: domoticz/domoticz](https://github.com/domoticz/domoticz)
- [DockerHub: domoticz/domoticz](https://hub.docker.com/r/domoticz/domoticz)

## Invitation

There is no IOTstack documentation for Domoticz.

This is a standing invitation to anyone who is familiar with this container to submit a Pull Request to provide some documentation.

## Environment Variables

* `TZ=${TZ:-Etc/UTC}`

	If `TZ` is defined in `~/IOTstack/.env` then the value there is applied, otherwise the default of `Etc/UTC` is used. You can initialise `.env` like this:
	
	``` console
	$ cd ~/IOTstack
	$ [ $(grep -c "^TZ=" .env) -eq 0 ] && echo "TZ=$(cat /etc/timezone)" >>.env
	```

* `LOG_PATH=/opt/domoticz/userdata/domoticz.log`

	This is disabled by default. If you enable it, Domoticz will write a log to that *internal* path. The path corresponds with the *external* path:
	
	```
	~/IOTstack/volumes/domoticz/domoticz.log
	```

	Note that this log is persistent. In other words, it will survive container restarts. This means you are responsible for pruning it from time to time. The Unix tradition for pruning logs is:
	
	``` console
	$ cd ~/IOTstack/volumes/domoticz/
	$ cat /dev/null | sudo tee domoticz.log
	```
	
	If, instead, you decide to delete the log file, you should stop the container first:
	
	``` console
	$ cd ~/IOTstack
	$ docker compose down domoticz
	$ sudo rm ./volumes/domoticz/domoticz.log
	$ docker compose up -d domoticz
	```

* `EXTRA_CMD_ARG=`

	This is disabled by default. It can be enabled and used to override the default parameters and pass [command-line parameters](https://www.domoticz.com/wiki/Command_line_parameters) of your choosing to Domoticz.

## Devices

The service definition includes an `x-devices:` clause. The `x-` prefix has the same effect as commenting-out the entire clause. If you wish to map an external device into the container:

1. Adjust the left-hand-side of the example path to point to the device as it appears on your Raspberry Pi;
2. Remove the `x-` prefix.
3. Recreate the container:

	```
	$ cd ~/IOTstack
	$ docker compose up -d domoticz
	```

## Migration Notes

1. Older IOTstack service definitions for Domoticz used the `lscr.io/linuxserver/domoticz:latest` image. The current service definition uses the `domoticz/domoticz:stable` image.
2. The location of the persistent store has changed, as has its relationship to the internal path:
	
	service definition | persistent store                 | internal path
	-------------------|----------------------------------|--------------
	older              | ~/IOTstack/volumes/domoticz/data | config
	current            | ~/IOTstack/volumes/domoticz      | /opt/domoticz/userdata

	If you have have been using the older service definition and wish to upgrade to the current service definition, you  can try migrating like this:
	
	``` console
	$ cd ~/IOTstack/volumes
	$ sudo mv domoticz domoticz.old
	$ sudo cp -a domoticz.old/data domoticz
	```

