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
# identify components of interest (respect the convention that anything
# in TEMPLATE_DIR should be considered read-only)
# ----------------------------------------------------------------------
SUPPORTED_ADDONS="${TEMPLATE_DIR}/supported-addon-nodes.txt"
INSTALLED_ADDONS="${SERVICE_DIR}/installed-addon-nodes.txt"


# ----------------------------------------------------------------------
# verify expected components in place
# ----------------------------------------------------------------------
if [ ! -r "${SUPPORTED_ADDONS}" ] ; then
	echo "Error: ${SUPPORTED_ADDONS} does not exist, or it exists but is not readable by $USER"
	exit 1
fi

if [ ! -w "${INSTALLED_ADDONS}" ] ; then
	echo "Error: either ${INSTALLED_ADDONS} does not exist, or it exists but is not writeable by ${USER}"
	exit 1
fi


# ----------------------------------------------------------------------
# using whiptail so...
# ----------------------------------------------------------------------
check_screen_dimensions


# ----------------------------------------------------------------------
# processing
# ----------------------------------------------------------------------

# load list of supported add-on nodes
SUPPORTED=$(sed -e '/^[#;]/d' "${SUPPORTED_ADDONS}" | sort)

# load list of add-on nodes that are currently installed
INSTALLED="$(sed -e '/^[#;]/d' "${INSTALLED_ADDONS}")"

# construct a list of options and active selections for whiptail
OPTIONS=""
for S in ${SUPPORTED} ; do
	OPTIONS="${OPTIONS} ${S}"
	if [[ ${INSTALLED} =~ "${S}" ]] ; then
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
	--title "Node-RED Add-on Nodes" \
	--checklist "Add-on Nodes" \
	$MENU_LINES $MENU_COLUMNS 16 ${OPTIONS} \
	3>&1 1>&2 2>&3 \
) ; RC=$?

# did the user press OK?
if [ $RC -eq 0 ] ; then

	# yes! initialise the new list of active nodes (which, potentially,
	# is an empty list, if the user does not want any add-ons)
	echo "# selection updated $(date)" >"${INSTALLED_ADDONS}"

	# iterate to append
	for NODE in ${SELECTION} ; do
		echo ${NODE} >>"${INSTALLED_ADDONS}"
	done

fi
