#!/bin/bash
set -e

PUID=${PUID:-5050}
PGID=${PGID:-0}

# were we launched as root with defaults available?
if [ "$(id -u)" = "0" -a -d "/pgadmin4-cache" ]; then

	echo "IOTstack self-repair running"

	# yes! ensure that the working directory exists
	# (should be created by volumes clause)
	mkdir -p "/pgadmin4"

	# populate runtime directory from the defaults
	rsync -arp --ignore-existing "/pgadmin4-cache/" "/pgadmin4"

	# ensure servers.json file exists
	[ -f "/pgadmin4/servers.json" ] || echo "{}" >"/pgadmin4/servers.json"

	# enforce correct ownership on directory
	chown -R "${PUID}":"${PGID}" "/pgadmin4"

fi

# launch the normal entrypoint
exec "/entrypoint.sh" $@
