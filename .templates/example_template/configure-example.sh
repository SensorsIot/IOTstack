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
SOME_TEMPLATE_FILE="${TEMPLATE_DIR}/someReadOnlyFile.txt"
SOME_SERVICE_FILE="${SERVICE_DIR}/someReadWriteFile.txt"


# ----------------------------------------------------------------------
# verify expected components in place
# ----------------------------------------------------------------------
# if [ ! -r "${SOME_TEMPLATE_FILE}" ] ; then
# 	echo "Error: ${SOME_TEMPLATE_FILE} does not exist, or it exists but is not readable by $USER"
# 	exit 1
# fi
# 
# if [ ! -w "${SOME_SERVICE_FILE}" ] ; then
# 	echo "Error: either ${SOME_SERVICE_FILE} does not exist, or it exists but is not writeable by ${USER}"
# 	exit 1
# fi


# ----------------------------------------------------------------------
# using whiptail so...
# ----------------------------------------------------------------------
#check_screen_dimensions


# ----------------------------------------------------------------------
# processing
# ----------------------------------------------------------------------

# do something useful which may include calling set_dot_env() or
# altering files in the container's SERVICE_DIR