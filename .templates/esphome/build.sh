#!/usr/bin/env bash

# should not run as root
[ "$EUID" -eq 0 ] && echo "This script should NOT be run using sudo" && exit 1

# assumes (like all build.sh scripts) that the working directory is
# the docker-compose project directory (typically ~/IOTstack)
PROJECT="$PWD"

# sanity check
[ ! -d "$PROJECT/.templates" ] && echo "This script should be run from ~/IOTstack" && exit 1

# where is this script is running? The expected answer is:
#   «projectDirectory»/.templates/esphome 
WHERE="$(dirname "$(realpath "$0")")"

# the service name is implied from the last part of the template path
SERVICE=$(basename "$WHERE")

# the rules file name is
RULES_FILE="88-tty-iotstack-${SERVICE}.rules"

# the original rules file is here
SOURCE_PATH="$WHERE/$RULES_FILE"

# the path to install the file is here
TARGET_PATH="/etc/udev/rules.d/$RULES_FILE"

if [ ! -f "$TARGET_PATH" ] ; then
	if [ -f "$SOURCE_PATH" ] ; then
		sudo cp "$SOURCE_PATH" "$TARGET_PATH"
		sudo chmod 644 "$TARGET_PATH"
	fi
fi

# define the path to the environment file
ENV_FILE="$PROJECT/.env"

# ensure the file exists
touch "$ENV_FILE"

# $1 = key
# $2 = value
setEnvironment() {
	if [ $(grep -c "^$1=" "$ENV_FILE") -eq 0 ] ; then
		echo "$1=$2" >>"$ENV_FILE"
	fi
}

# generate random password
PASSWORD=$(< /dev/urandom tr -dc A-Z-a-z-0-9 | head -c ${1:-16})

# conditionally set variables
setEnvironment "ESPHOME_USERNAME" "$SERVICE"
setEnvironment "ESPHOME_PASSWORD" "$PASSWORD"
