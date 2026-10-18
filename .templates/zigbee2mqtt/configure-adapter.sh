#!/usr/bin/env bash

# ======================================================================
# Read the developer guide BEFORE proposing changes to this script! 
# ======================================================================
#
# environment variables which can be assumed:
#
#   CLIMENU (eg /usr/bin/whiptail or /usr/local/bin/dialog)
#   CLICLEAR (eg --clear or --erase-on-exit)
#   PROJECT_DIR (eg ~/IOTstack)
#   TEMPLATES_DIR (eg ~/IOTstack/.templates)
#   SERVICES_DIR (eg ~/IOTstack/services)
#   SERVICE_NAME (eg nodered)
#   TEMPLATE_DIR (eg ~/IOTstack/.templates/nodered)
#   SERVICE_DIR (eg ~/IOTstack/services/nodered)
#   RUN_MODE (either cli or menu)
#   MENU_COLUMNS (don't exceed 80)
#   MENU_LINES (don't exceed 24)
#
# also has access to these iotstack-menu functions:
#
#   set_dot_env "key" "value" bool
#   check_screen_dimensions
#
# ----------------------------------------------------------------------

# standard protective check - must NOT run as root
[ "$EUID" -eq 0 ] && echo "This script should NOT be run using sudo" && exit 1

# should be invoked by the menu - check expected function
[ "$(type -t check_screen_dimensions)" != "function" ] && echo "This script should be run from the menu" && exit 1


# ----------------------------------------------------------------------
# using whiptail so...
# ----------------------------------------------------------------------
check_screen_dimensions


# ----------------------------------------------------------------------
# processing
# ----------------------------------------------------------------------

# try to discover list of serial ports
CANDIDATES=$(ls -1 /dev/ttyUSB? /dev/ttyACM? /dev/ttyAMA? /dev/serial? /dev/ttyS? 2>/dev/null)

# try to discover the current device
eval $(grep "^ZIGBEE2MQTT_DEVICE_PATH=" .env)

# construct a list of options and active selections for whiptail
OPTIONS=""
for C in ${CANDIDATES} ; do
	OPTIONS="${OPTIONS} ${C}"
	if [[ ${ZIGBEE2MQTT_DEVICE_PATH} =~ "${C}" ]] ; then
		OPTIONS="${OPTIONS} ON"
	else
		OPTIONS="${OPTIONS} OFF"
	fi
done

# present the menu
SELECTION=$(${CLIMENU} \
	${CLICLEAR} \
	--noitem \
	--separate-output \
	--fb \
	--title "Zigbee2MQTT Adapter" \
	--radiolist "Select device" \
	$MENU_LINES $MENU_COLUMNS 16 ${OPTIONS} \
	3>&1 1>&2 2>&3 \
) ; RC=$?

# did the user press OK and is the selection non-empty?
if [ $RC -eq 0 -a -n "${SELECTION}" ] ; then

	# update ~/IOTstack/.env
	set_dot_env "ZIGBEE2MQTT_DEVICE_PATH" "${SELECTION}" true

fi
