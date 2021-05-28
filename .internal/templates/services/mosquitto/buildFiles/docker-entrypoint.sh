#!/bin/ash
set -e

# Set permissions
user="$(id -u)"
if [ "$user" = '0' -a -d "/mosquitto" ]; then
  rsync -arp --ignore-existing /${MOSQUITTO_IOTSTACK_DEFAULTS}/ "/mosquitto"
  chown -R mosquitto:mosquitto /mosquitto
fi

exec "$@"

