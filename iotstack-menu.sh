#!/usr/bin/env bash

# ======================================================================
# Please read the developer guide BEFORE proposing changes! 
# ======================================================================

# ----------------------------------------------------------------------
# running as root leads to inconsistencies - forbid it
# ----------------------------------------------------------------------
#
[ "$EUID" -eq 0 ] && echo "Error: This script should NOT be run using sudo" >&2 && exit 1


# ----------------------------------------------------------------------
# variable construction and definitions. If a variable is exported, it
# means it is also used by a script which is invoked by this script,
# such as a dedicated "configuration script" for a service (eg the list
# of add-on nodes for Node-RED).
# ----------------------------------------------------------------------
#
# the name of this script is
SCRIPT=$(basename "${0}")

# it is assumed to be running locally
LOCALSCRIPT="./${SCRIPT}"

# the absolute path where this script is running is
export PROJECT_DIR=$(dirname "$(realpath "${0}")")

# this must be the same as the working directory
if [ "${PROJECT_DIR}" != "${PWD}" ] ; then
	cat <<-BADWD >&2

		Error: You MUST start ${SCRIPT} from the project directory, like this:

		       \$ cd $(cd "${PROJECT_DIR}" && dirs +0)
		       \$ ${LOCALSCRIPT}

	BADWD
	exit 1
fi

# run mode is either menu or cli; assume cli until proven otherwise
export RUN_MODE=cli


# for debugging of functions etc, do this:
# 1. cd ~/IOTstack
# 2. PROJECT_DIR=$PWD
# 3. copy/paste SQLITE3 down to MENU_LINES

# sqlite3 is required (path discovery avoids any aliases)
SQLITE3="$(which sqlite3)"
[ -z "${SQLITE3}" ] && echo "SQLite3 not installed" >&2 && exit 1

# on Linux, whiptail runs the menu system. The equivalent functionality
# on macOS is the dialog command (brew install dialog).
if [ "$(uname -s)" = "Darwin" ] ; then
	export CLIMENU="$(which dialog)"
	export CLICLEAR="--erase-on-exit"
else
	export CLIMENU="$(which whiptail)"
	export CLICLEAR="--clear"
fi

# the installer script is
INSTALLER_SCRIPT="${PROJECT_DIR}/install.sh"

# standard directories are
export TEMPLATES_DIR="${PROJECT_DIR}/.templates"
export SERVICES_DIR="${PROJECT_DIR}/services"
export SCRIPTS_DIR="${PROJECT_DIR}/scripts"

# compose file
COMPOSE_NAME="docker-compose.yml"
COMPOSE_FILE="${PROJECT_DIR}/${COMPOSE_NAME}"

# override file
OVERRIDE_NAME="docker-compose.override.yml"
OVERRIDE_FILE="${PROJECT_DIR}/${OVERRIDE_NAME}"

# the menu's template files are in .templates/.menu
MENU_TEMPLATES_DIR="${TEMPLATES_DIR}/.menu"

# and it contains these files (which get copied to services)
COMPOSE_HEAD="docker-compose-header.yml"
COMPOSE_TAIL="docker-compose-trailer.yml"
OVERRIDE_HEAD="docker-compose.override-header.yml"
OVERRIDE_TAIL="docker-compose.override-trailer.yml"

# location of database
DB="${SERVICES_DIR}/.menu.db"
DATABASE_WAS_RELOADED=false

# template files
SERVICE_YML="service.yml"
MENU_JSON="menu-config.json"

# service files (optional)
OVERRIDE_YML="override.yml"

# json (template) keys
J_CONFIGURE="configure"
J_DEPENDENCIES="dependencies"
J_DESCRIPTION="description"
J_ENVIRONMENT="environment"
J_INSTALL="install"
J_SERVICE="service"
J_TEMPLATE="template"
J_TRACKED="tracked"
J_VARIABLE="variable"
J_PRESET="preset"
J_FALSE=0
J_TRUE=1

# possible stateIDs for a service
S_UNINSTALLED=0
S_ACTIVE=1
S_INACTIVE=2
S_UNKNOWN=3

# the minimum supported screen dimensions are
export MENU_COLUMNS=80
export MENU_LINES=24


# ======================================================================
# Git utility functions
# ======================================================================

# ----------------------------------------------------------------------
# commitID_for_path
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 path
# Returns:
#    string containing Git commitID for path (or null if the path is
#    not under version control).
#
#
commitID_for_path() {
	git -C "${PROJECT_DIR}" --no-pager log -n 1 --pretty=format:%H -- "${1}"
}


# ======================================================================
# SQL utility functions
# ======================================================================
#
# Please make sure you read the developer guide and fully understand
# the situations where you must use single- vs double-quote marks.
#
# This is really important!! Please don't assume that you know what you
# are doing until you have read the guide.


# ----------------------------------------------------------------------
# version_for_component
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 component
# Returns:
#    commitID associated with the key (or null)
#
version_for_component() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			commitID
		FROM
			components
		WHERE
			component = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# set_version_for_component
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 component
#    $2 new commitID
# Returns:
#    nothing
#
set_version_for_component() {
	${SQLITE3} "${DB}" <<-SQL
		INSERT OR REPLACE INTO
			components (component, commitID)
		VALUES
			('${1}', '${2}')
		;
	SQL
}


# ----------------------------------------------------------------------
# add_record_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 path to JSON file
# Returns:
#    the SQLite return code
#
add_record_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		INSERT INTO services
			(name, config)
		VALUES (
			'${1}',
			json(readfile('${2}'))
		);
	SQL
	return $?
}


# ----------------------------------------------------------------------
# all_active_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of service names where the service is marked active
#
all_active_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		WHERE
			stateID = ${S_ACTIVE}
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_configurable_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of service names where the service is :
#    1. installed (either active or inactive); AND
#    2. has a configuration script defined
#
all_configurable_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		WHERE
			stateID in (${S_ACTIVE}, ${S_INACTIVE})
		AND
			json_extract(config,'$.${J_CONFIGURE}') IS NOT NULL
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_inactive_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of service names where the service is marked inactive
#
all_inactive_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		WHERE
			stateID = ${S_INACTIVE}
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_installed_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of installed service names (active or inactive)
#
all_installed_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		WHERE
			stateID in (${S_ACTIVE}, ${S_INACTIVE})
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of all service names known to the database
#
all_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_uninstalled_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of service names where the service is marked uninstalled
#
all_uninstalled_services() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			name
		FROM
			services
		WHERE
			stateID = ${S_UNINSTALLED}
		ORDER BY
			name
		;
	SQL
}


# ----------------------------------------------------------------------
# all_upgradable_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    ordered list of service names where the service has at least one
#    tracked file which is upgradable
# Note:
#    This can be a fairly expensive operation. It is needed for bash
#    autocompletion to restrict upgrade() to upgradeable services.
#
all_upgradable_services() {

	local ITEMS ITEM SERVICE TNAME SCID CCID CONFIRMED

	# fetch a tuple-list of candidates
	ITEMS=$( \
		${SQLITE3} -separator "»" "${DB}" <<-SQL
			SELECT
				s.name,
				template,
				commitID
			FROM
				services AS s
			JOIN
				tracking AS t
			ON
				s.name = t.name
			WHERE
				stateID in ($S_ACTIVE, $S_INACTIVE)
			ORDER BY
				s.name
			;
		SQL
	)

	for ITEM in $ITEMS ; do

		# crack the tuple
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		SERVICE="${1}" ; TNAME="${2}" ; SCID="${3}"

		# sense that we have already confirmed this service
		[ "${CONFIRMED}" = "${SERVICE}" ] && continue;

		# obtain the CURRENT commit ID for the tracked item (which
		# may be null if the item is no longer managed by Git)
		CCID=$(commitID_for_path "${TEMPLATES_DIR}/${SERVICE}/${TNAME}")

		# is there a commitID mismatch?
		if [ "${CCID}" != "${SCID}" ] ; then

			# yes! treat this candidate as confirmed
			CONFIRMED="${SERVICE}"

			# and return this name
			echo "${SERVICE}"

		fi

	done

}


# ----------------------------------------------------------------------
# configuration_script_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    name of configuration script (if it exists) otherwise empty string
#
configuration_script_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			json_extract(config,'$.${J_CONFIGURE}')
		FROM
			services
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# delete_record_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Discussion:
#    deleting a row from the services table causes the delete_service
#    SQL trigger to fire, which removes all associated records from
#    the tracking table.
#
delete_record_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		DELETE FROM
			services
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# dependencies_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    a list of dependencies for the service (auto-installs).
# Returns an empty string if:
#    1. If there are no dependencies.
#
dependencies_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			value
		FROM
			services, json_each(config,'$.${J_DEPENDENCIES}')
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# environment_presets_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    A list of environment variable names and corresponding presets
#    associated with the J_ENVIRONMENT key in the JSON configuration
#    for the service.
# Returns an empty string if:
#    1. No variable names are defined for the service.
#
environment_presets_for_service() {
	${SQLITE3} -separator "»" "${DB}" <<-SQL
		SELECT
			json_extract(value,'$.${J_VARIABLE}'),
			json_extract(value,'$.${J_PRESET}')
		FROM
			services, json_each(config,'$.${J_ENVIRONMENT}')
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# expected_items_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    a list of files that should be in /services/«service» if the
#    service is installed properly. This should always contain at
#    least service.yml.
#
expected_items_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			json_extract(value,'$.${J_SERVICE}')
		FROM
			services, json_each(config,'$.${J_INSTALL}')
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# get_state_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    the state identifier which is expected to be one of the following.
#    0 = S_UNINSTALLED
#    1 = S_ACTIVE
#    2 = S_INACTIVE
#    3 = S_UNKNOWN
# Note:
#    The result is undefined if the services table contains a stateID
#    which is outside the range 0..2. The table does have a CHECK
#    constraint designed to prevent this but nothing is perfect.
#
get_state_for_service() {
	# retrieve service state if possible
	local STATEID=$(
		${SQLITE3} "${DB}" <<-SQL
			SELECT
				stateID
			FROM
				services
			WHERE
				name = '${1}'
			;
		SQL
	)
	# sense service not known
	[ -z "${STATEID}" ] && echo $S_UNKNOWN && return
	# return service stateID
	echo ${STATEID}
}


# ----------------------------------------------------------------------
# installable_items_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    a list of tuples arranged as one line per item to be installed
#
installable_items_for_service() {
	${SQLITE3} -separator "»" "${DB}" <<-SQL
		SELECT
			json_extract(value,'$.${J_TEMPLATE}'),
			json_extract(value,'$.${J_SERVICE}'),
			json_extract(value,'$.${J_TRACKED}')
		FROM
			services, json_each(config,'$.${J_INSTALL}')
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# is_service_properly_installed - tests if all expected items present
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = all expected items are present
#       1 = false = at least one expected item is not present
#
is_service_properly_installed() {
	local SERVICE_DIR="${SERVICES_DIR}/${1}"
	for E in $(expected_items_for_service "${1}") ; do
		[ -f "${SERVICE_DIR}/${E}" ] || return 1
	done
	return 0
}


# ----------------------------------------------------------------------
# is_service_active - tests whether a service is active
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is active
#       1 = false = service is not active
# Notes:
#    A service will only be declared "active" if its stateID is S_ACTIVE.
#    A return code of false doesn't distinguish between uninstalled,
#    inactive or unknown (the latter being the case if the service
#    name is not known to the database).
#
#    In principle, a service can only be marked active if it is also
#    installed but nothing really protects against things like user
#    interference in the services directory.
#
is_service_active() {
	[ $(get_state_for_service "${1}") -eq ${S_ACTIVE} ] && return 0
	return 1
}


# ----------------------------------------------------------------------
# is_service_inactive - tests whether a service is inactive
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is inactive
#       1 = false = service is not inactive
# Notes:
#    A service will only be declared "inactive" if its stateID is
#    S_INACTIVE. A return code of false doesn't distinguish between
#    uninstalled, active or unknown (the latter being the case if the
#    service name is not known to the database).
#
#    In principle, a service can only be marked inactive if it is first
#    installed and then explicitly marked inactive.
#
is_service_inactive() {
	[ $(get_state_for_service "${1}") -eq ${S_INACTIVE} ] && return 0
	return 1
}


# ----------------------------------------------------------------------
# is_service_installed - tests whether a service is active or inactive
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is installed (either active or inactive)
#       1 = false = service is not installed
# Notes:
#    A service will only be declared "installed" if its stateID is
#    either S_ACTIVE or S_INACTIVE. A return code of false doesn't
#    distinguish between uninstalled or unknown (the latter being the
#    case if the service name is not known to the database).
#
#    In principle, a service can only be marked installed if it was
#    actually installed, irrespective of whether it is currently
#    marked active or inactive.
#
is_service_installed() {
	local S=$(get_state_for_service "${1}")
	[ $S -eq ${S_ACTIVE} -o $S -eq ${S_INACTIVE} ] && return 0
	return 1
}


# ----------------------------------------------------------------------
# is_service_uninstalled - tests whether a service is uninstalled
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is uninstalled
#       1 = false = service is not uninstalled
# Notes:
#    A service will only be declared "uninstalled" if its stateID is
#    S_UNINSTALLED. A return code of false doesn't distinguish between
#    installed or unknown (the latter being the case if the service
#    name is not known to the database).
#
is_service_uninstalled() {
	[ $(get_state_for_service "${1}") -eq ${S_UNINSTALLED} ] && return 0
	return 1
}


# ----------------------------------------------------------------------
# is_service_upgradeable - compares as-installed with template
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is upgradable
#       1 = false = service does not require an upgrade
# Discussion:
#     Scans installed (active or unactive) service and returns true
#     if an upgrade is warranted.
#
#     An upgrade is considered "warranted" if at least one tracked item
#     associated with the service name has a different commitID in the
#     tracking database vs that returned by Git for the same item.
#
is_service_upgradeable() {
	# is the service installed (active or inactive does not matter)
	if is_service_installed "${1}" ; then
		# yes! form the path to the template directoru
		local TEMPLATE_DIR="${TEMPLATES_DIR}/${1}"
		# iterate the list of tracked items
		local ITEM CCID FNAME SCID
		for ITEM in $(tracked_items_for_service "${1}") ; do
			# crack the tuple
			IFS="»" ; set -- $ITEM ; unset IFS
			# extract tuple components
			FNAME="${1}" ; SCID="${2}"
			# obtain the CURRENT commit ID for the tracked item (which
			# may be null if the item is no longer managed by Git)
			CCID=$(commitID_for_path "${TEMPLATE_DIR}/${FNAME}")
			# sense that the commit IDs differ (a single mismatch is 
			# sufficient to mark the service as upgradeable)
			[ "${CCID}" != "${SCID}" ] && return 0
		done
	fi
	# otherwise, no update needed
	return 1
}


# ----------------------------------------------------------------------
# is_service_configurable - does record name a configuration script?
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    Boolean (bash return code):
#       0 = true = service is configurable
#       1 = false = service is not configurable
#
is_service_configurable() {
	# fetch script name (if it exists)
	local CONFIG_SH=$(configuration_script_for_service "${1}")
	# sense script defined
	[ -n "${CONFIG_SH}" ] && return 0
	# otherwise not configurable
	return 1
}


# ----------------------------------------------------------------------
# json_for_service - returns json string
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    json string as stored in services table
# Note:
#    it would be preferable to use the json_pretty() function here but
#    that was not added to sqlite3 until 3.46.0. The lags between the
#    SQLite folks doing something, and the distros adopting the updated
#    version are ... severe. For now, the calling function uses jq to
#    handle the pretty-printing.
#
json_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			config
		FROM
			services
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# longest_service_name - returns length of longest service name
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    Length in bytes of longest service name
# Note:
#    This is needed to aid formatting on the status command.
#
longest_service_name() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			max(length(name))
		FROM
			services
		;
	SQL
}


# ----------------------------------------------------------------------
# set_state_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 stateID
# Returns:
#    bash return code from invoking SQLite3
# Notes:
#    1. stateID is expected to be one of:
#         S_UNINSTALLED=0
#         S_ACTIVE=1
#         S_INACTIVE=2
#    2. the services table does have a CHECK constraint designed to
#       enforce the expectation on the stateID.
#    3. If the return code is non-zero then the most likely reasons are:
#       a. service name is not known to the database;
#       b. stateID out of range.
#    4. In practice, the return code is not checked by callers so
#       the only guide will be eyeballs spotting errors on stderr.
#
set_state_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		UPDATE
			services
		SET
			stateID = ${2}
		WHERE
			name = '${1}'
		;
	SQL
	return $?
}


# ----------------------------------------------------------------------
# track_item_for_service
# ----------------------------------------------------------------------
#
# Arguments
#    $1 service name
#    $2 item in template directory
#    $3 Git commitID
# Returns:
#    nothing
# Discussion:
#    Adds or replaces a row in the tracking table
#
track_item_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		INSERT OR REPLACE INTO tracking
			(name, template, commitID)
		VALUES (
			'${1}',
			'${2}',
			'${3}'
		);
	SQL
}


# ----------------------------------------------------------------------
# tracked_items_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    a list of tuples in the form:
#       template»commitID
#    where template is the name of a file in the service's template and
#    the commitID is whatever the Git commitID was for the file when it
#    was added to the tracking table. By inference, if the current
#    commitID differs from the one in the tracking table, the file has
#    changed, so the associated service can be considered updateable.
#
tracked_items_for_service() {
	${SQLITE3} -separator "»" "${DB}" <<-SQL
		SELECT
			template,
			commitID
		FROM
			tracking
		WHERE
			name = '${1}'
		;
	SQL
}


# ----------------------------------------------------------------------
# update_service_json_if_changed
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 path to JSON file
# Returns:
#    SQLite return code
#
update_service_json_if_changed() {
	${SQLITE3} "${DB}" <<-SQL
		UPDATE
			services
		SET
			config = json(readfile('${2}'))
		WHERE
			name = '${1}'
		AND
			config IS NOT json(readfile('${2}'))
		;
	SQL
	return $?
}


# ----------------------------------------------------------------------
# formatted_components_for_services_menu
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    a list of quoted space-separated pairs for all known services.
# Notes:
#    1. Each pair in the list is expressed in the form:
#          'service' 'SC description'
#       where S is the abbreviated service state, and
#             C is either "C" (configurable) or hyphen (otherwise)
#    2. The structure of the list being returned is designed around
#       the needs of whiptail/dialog.
#    3. Description is constrained to $MENU_COLUMNS-$MAX_SERVICE_LEN-10
#       characters (the minimum width of the menu screen, less the
#       maximum width of a service name, less scaffolding overheads).
#
formatted_components_for_services_menu() {
	${SQLITE3} -quote -separator " " "${DB}" <<-SQL
		SELECT
		    name,
		    abbrev ||
		    CASE
		      WHEN json_extract(config,'$.${J_CONFIGURE}') IS NOT NULL THEN 'C'
		      ELSE '–'
		    END
		    || ' ' ||
		    substr(json_extract(config,'$.${J_DESCRIPTION}'),1,$MENU_COLUMNS-$MAX_SERVICE_LEN-10)
		FROM
			services
		JOIN
			status
		ON
			services.stateID = status.stateID
		ORDER BY
			name
		;
	SQL
}


# ======================================================================
# Command helpers
# ======================================================================


# ----------------------------------------------------------------------
# note_database_reloaded - CLI only
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
#
note_database_reloaded() {

	# ask the installer script if it has been updated and should be re-run
	if [ "${DATABASE_WAS_RELOADED}" = "true" ] ; then
		echo "Note: Database was reloaded." >&2
	fi

}


# ----------------------------------------------------------------------
# warn_if_installer_updated - CLI only
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
#
warn_if_installer_updated() {

	# ask the installer script if it has been updated and should be re-run
	if [ "$(${INSTALLER_SCRIPT} should_run_installer)" = "true" ] ; then
		echo "Warning: ${INSTALLER_SCRIPT} needs to be re-run." >&2
	fi

}


# ----------------------------------------------------------------------
# warn_if_needs_renovation - CLI only
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
#
warn_if_needs_renovation() {

	if needs_renovation ; then
		cat <<-RENOVATE >&2
			Warning: headers/footers in ./services need renovation. Recommend running:
			           ${LOCALSCRIPT} renovate
			         then compare any .save files (your versions) with the newer
			         replacements, and re-apply your customisations.
		RENOVATE

	fi

}


# ----------------------------------------------------------------------
# install_item_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 path to template directory
#    $3 source item in template directory
#    $4 path to services directory
#    $5 destination item in services directory
#    $6 rsync options
#    $7 Boolean whether the file should be tracked
#         values are J_FALSE=0, J_TRUE=1
# Returns:
#    nothing
# Discussion:
#    This function copies one item from the service's template folder
#    to its ./services/service folder. This function does double duty
#    for both the original install and any subsequent upgrades. The
#    behavioural difference between install and upgrade is governed by
#    the rsync options:
#        install = "-goprt --ignore-existing"
#        upgrade = "-bcgoprt --suffix=.save"
#    where:
#        -b = make a backup of changed files (goes with --suffix=.save)
#        -c = use checksums to decide if files differ
#        -g = set the group name to match the source
#        -i = itemize changes
#        -o = set the user name to match the source
#        -p = set permissions to match the source
#        -r = recursive
#        -t = preserve modification times
#        -i = itemize changes
#
install_item_for_service() {
	# construct template path
	local T_PATH="${2}/${3}"
	# does the template path exist?
	if [ -e "${T_PATH}" ] ; then
		# yes! copy into place
		eval rsync ${6} "${T_PATH}" "${4}/${5}"
		# should the file be tracked?
		if [ ${7} -eq ${J_TRUE} ] ; then
			# yes! fetch the commit ID of the item just copied
			local SID=$(commitID_for_path "${T_PATH}")
			# if Git is tracking the item then so should we
			[ -n "${SID}" ] && track_item_for_service "${1}" "${3}" "${SID}"
		fi
	else
		echo "Warning: $T_PATH does not exist" >&2
	fi
}


# ----------------------------------------------------------------------
# set_dot_env - add, update ~/${PROJECT_DIR}/.env
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 environment key (eg TZ)
#    $2 any of:
#       * a fixed value (eg "Australia/Sydney")
#       * the value of another environment variable (eg "${HOSTNAME}")
#       * the result of a function call (eg "$(random_password)")
#    $3 update if different (Boolean string, optional, default="false")
# Returns:
#    Exit status:
#      0 if key=value added, or key present and value updated
#      1 if key=value present, or key present but value not updated
# Discussion:
#    1. If the value passed in $2 does not evaluate cleanly (ie bash
#       returns a non-zero exit code) then the unevaluated value is
#       used. For example "${HOSTNAME" would fail for want of a closing
#       brace so the literal "${HOSTNAME" is used. The only indication
#       you get of this error is seeing an unexpected value in .env.
#    2. Checks for presence of key=value, exiting normally if found.
#    3. Checks for presence of key=, appending key=value if not found.
#    4. Updates value if values differ, providing $3="true".
# Notes on sed utility:
#    1. The version of sed which ships with macOS requires an extension
#       to be provided with the -i option. Linux treats the extension as
#       optional. HomeBrew can also install gnu-sed which behaves like
#       Linux sed. On macOS, this function prefers gnu-sed if it is installed
#       but falls back to macOS-supplied sed. The bottom line is that, on
#       macOS where gnu-sed is not installed, you'll get a `.env.bak` file
#       otherwise you won't get a .bak file. While the notion of a .bak file
#       might seem attractive, in practice variables tend to be set in batches
#       to any .bak will only represent the most-recent edit so it isn't
#       particularly useful for audit or rollback.
#    2. The search-and-replace pattern includes a trailing g for global on the
#       off-chance that the same key appears more than once.
#
set_dot_env() {
	local DOT_ENV="${PROJECT_DIR}/.env" ; touch "${DOT_ENV}"
	local VAL="VAL="${2}""
	eval "${VAL}" 2>/dev/null ; [ $? -ne 0 ] && VAL="${2}"
	local KEYVAL="${1}=${VAL}"
	local UPDATE=${3:-false}
	# sense key=value present (exact text, left-aligned)
	[ $(grep -c "^${KEYVAL}\$" "${DOT_ENV}") -gt 0 ] \
		&& return 1
	# sense key not present (append)
	[ $(grep -c -e "^${1}=" "${DOT_ENV}") -eq 0 ] \
		&& echo "${KEYVAL}" >>"${DOT_ENV}" \
		&& return 0
	# key present but value differs. Sense update not required.
	[ "${UPDATE}" = "false" ] && return 1
	# update required. Is this macOS?
	if [ "$(uname -s)" = "Darwin" ] ; then
		# yes! use gnu-sed if it is installed
		[ -n "$(which gsed)" ] \
			&& gsed -i -e "s|^${1}=.*|${KEYVAL}|g" "${DOT_ENV}" \
			&& return 0
		# implied fallback to macOS-supplied sed			
		sed -i.bak -e "s|^${1}=.*|${KEYVAL}|g" "${DOT_ENV}"
		return 0
	fi
	# assume Linux sed
	sed -i -e "s|^${1}=.*|${KEYVAL}|g" "${DOT_ENV}"
	return 0
}

# this function is needed by configuration scripts
export -f set_dot_env


# ----------------------------------------------------------------------
# check_screen_dimensions - ensure sufficient screen real-estate
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Discussion:
#    Checks for at least MENU_COLUMNSxMENU_LINES (80x24) and exits with
#    an appropriate message if those constraints are not met.
# Note:
#    This function is also invoked by template configuration scripts.
#
check_screen_dimensions() {

	if [ $(tput lines) -lt $MENU_LINES -o $(tput cols) -lt $MENU_COLUMNS ] ; then

		cat <<-SCREEN

			Error: Your screen needs a minimum width of $MENU_COLUMNS columns plus
			       at least $MENU_LINES lines. Please adjust the size of your
			       terminal window. Alternatively, use command-line mode.

		SCREEN

		exit 1

	fi

}

# this function is needed by configuration scripts
export -f check_screen_dimensions

# ----------------------------------------------------------------------
# set_timezone_for_project
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effect:
#    copies host timezone to TZ variable in .env
# Note:
#    The mechanism used here should work on both macOS and Linux.
#
set_timezone_for_project() {
	local LOCALTIME=$(realpath "/etc/localtime" 2>/dev/null)
	if [ -n "${LOCALTIME}" ] ; then
		local CITY="$(basename "${LOCALTIME}")"
		local COUNTRY="$(dirname "${LOCALTIME}")"
		COUNTRY="$(basename "${COUNTRY}")"
		set_dot_env "TZ" "${COUNTRY}/${CITY}" true
	else
		set_dot_env "TZ" "Etc/UTC" true
	fi
}


# ======================================================================
# Completion helpers
# ======================================================================


# ----------------------------------------------------------------------
# generate_bashcompletions
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    text of bash completion handler
#
generate_bashcompletions() {

	local FNAME="_$(basename "${SCRIPT}" ".sh")_completions"

	cat <<-COMPLETIONS
	${FNAME}() {

	  # Command syntax:    ${LOCALSCRIPT} verb {argument...}
	  # COMP_WORDS index:  0                  1     2..n
	  
	  # fetch command (typically "${LOCALSCRIPT}")
	  local COMMAND="\${COMP_WORDS[0]}"

	  # assume no valid completions
	  local WORDS=""

	  # do we have the verb already?
	  if [ \${COMP_CWORD} -gt 1 ] ; then
	    # yes! fetch verb-specific completions
	    WORDS="\$(\${COMMAND} completions "\${COMP_WORDS[1]}" \${COMP_CWORD} )"
	  else
	    # no! fetch list of verbs
	    WORDS="\$(\${COMMAND} verbs)"
	  fi

	  COMPREPLY=(\$(compgen -W "\${WORDS}" -- "\${COMP_WORDS[\$COMP_CWORD]}"))

	}

	complete -F ${FNAME} ${LOCALSCRIPT}
	COMPLETIONS

}


# ----------------------------------------------------------------------
# install_completions_command
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    text of command to copy/paste to install completion handler on
#    running system
#
install_completions_command() {

	local PREFIX
	local METHOD="| sudo tee"

	# prefix ordering is:
	# 1. macOS + Apple Silicon + HomeBrew bash
	# 2. macOS + Intel Silicon + HomeBrew bash
	# 3. Linux default
	for PREFIX in "/opt/homebrew/etc" "/usr/local/etc" "/etc" ; do
		# form path to candidate directory
		local COMPLETIONS="${PREFIX}/bash_completion.d"
		# does candidate exist on this system?
		if [ -d "${COMPLETIONS}" ] ; then
			# yes! if it is writeable then we can redirect without sudp
			[ -w "${COMPLETIONS}" ] && METHOD=">"
			# generate the command
			echo "${LOCALSCRIPT} bashcompletions ${METHOD} ${COMPLETIONS}/iotstack_menu_completions"
			# job done
			return
		fi
	done

	# arriving here means no suitable bash_completion.d so just show
	# how to generate completions script
	echo "${LOCALSCRIPT} bashcompletions"

}


# ======================================================================
# Command functions that take a service name as an argument
# ======================================================================

# ----------------------------------------------------------------------
# activate
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Notes:
#    1. Marks the service active in the database.
#    2. Active services are included from the next build.
#
activate() {
	if is_service_inactive "${1}" ; then
		set_state_for_service "${1}" ${S_ACTIVE}
	else
		echo "Warning: ${1} is not inactive" >&2
	fi
}


# ----------------------------------------------------------------------
# configure
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Precondition:
#    service must be installed
# Invokes:
#    configuration script for service (eg Node-RED menu to select
#    a list of add-on nodes).
#
configure() {
	# is the service installed?
	if is_service_installed "${1}" ; then
		# yes! fetch script name if it exists
		local CONFIG_SH=$(configuration_script_for_service "${1}")
		# script name defined?
		if [ -n "${CONFIG_SH}" ] ; then
			# yes! attempt to form path to script
			CONFIG_SH="${TEMPLATES_DIR}/${1}/${CONFIG_SH}"
			# does script exist and is it executable?
			if [ -x "${CONFIG_SH}" ] ; then
				# yes! set up environment and execute it
				SERVICE_NAME="${1}" \
				TEMPLATE_DIR="${TEMPLATES_DIR}/${1}" \
				SERVICE_DIR="${SERVICES_DIR}/${1}" \
				${CONFIG_SH}
				return
			fi
		fi
	fi
	# otherwise the service isn't configurable
	echo "Warning: ${1} is not configurable" >&2
}


# ----------------------------------------------------------------------
# deactivate
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Precondition:
#    service must be active
# Notes:
#    1. Marks the service inactive in the database.
#    2. Inactive services are omitted from the next build.
#
deactivate() {
	if is_service_active "${1}" ; then
		set_state_for_service "${1}" ${S_INACTIVE}
	else
		echo "Warning: ${1} is not active" >&2
	fi
}


# ----------------------------------------------------------------------
# info
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    list of services and installable items
#
info() {
	${SQLITE3} -column -header "${DB}" <<-SQL
		SELECT
			name AS 'service',
			json_extract(value,'$.${J_TEMPLATE}') AS 'template',
			json_extract(value,'$.${J_SERVICE}') AS 'services',
		    CASE
		      WHEN json_extract(value,'$.${J_TRACKED}') = 1 THEN 'yes'
		      ELSE 'no'
		    END AS 'tracked'
		FROM
			services, json_each(config,'$.${J_INSTALL}')
		ORDER BY
			service, template
		;
	SQL
}


# ----------------------------------------------------------------------
# inspect - convenience to display contents of a service's template
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
#
inspect() {

	# note service
	local SERVICE="${1}"

	# the service's template directory (in .templates) is
	local TEMPLATE_DIR="${TEMPLATES_DIR}/${SERVICE}"

	# display the menu configuration
	echo -e "CONFIGURATION (as stored in database):\n"
	json_for_service "${SERVICE}" | jq --monochrome-output | sed "s/^/  /"

	# iterate the list of items to install
	local ITEM TNAME TPATH SNAME TRACKED
	for ITEM in $(installable_items_for_service "${SERVICE}") ; do

		# crack the tuple (template»service»tracked)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

		# form path to source file
		TPATH="${TEMPLATE_DIR}/${TNAME}"

		# header for component
		echo -n -e "\nCOMPONENT '${TNAME}', installed as '${SNAME}',"
		[ $TRACKED -ne 1 ] && echo -n " not"
		echo -e " tracked:\n"

		# body of component
		if [ -f "${TPATH}" ] ; then
			if [[ "$(file -b "${TPATH}")" == *"ASCII text"* ]] ; then
				sed "s/^/  /" "${TPATH}"
			else
				echo "  (non-text file - not displayed)"
			fi
		else
			echo "  (file not found in ${TEMPLATE_DIR})"
		fi

	done

}


# ----------------------------------------------------------------------
# install
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Notes:
#    1. Installing an already-installed service will "self repair" but
#       will not overwrite pre-existing files. One consequence is that
#       tracked files may actually be out of date but this will not
#       be apparent.
#    2. Resulting service will always be active.
#    3. Installs any dependent services.
#
install() {

	# do NOT check for "uninstalled" - self repair

	# note service
	local SERVICE="${1}"

	# the service's template directory (in .templates) is
	local TEMPLATE_DIR="${TEMPLATES_DIR}/${SERVICE}"

	# the service's working directory (in services) is
	local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"

	# ensure working directory exists
	mkdir -p "${SERVICE_DIR}"

	# rsync --ignore-existing=don't overwrite
	# see install_item_for_service() for discussion of other options
	local OPTS="-goprt --ignore-existing"

	# iterate the list of items to install
	local ITEM TNAME SNAME TRACKED
	for ITEM in $(installable_items_for_service "${SERVICE}") ; do

		# crack the tuple (template»service»tracked)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

		# perform the installation
		install_item_for_service "${SERVICE}" \
			"${TEMPLATE_DIR}" "${TNAME}" \
			"${SERVICE_DIR}" "${SNAME}" \
			"${OPTS}" ${TRACKED}

	done

	# a newly-installed service is always active
	set_state_for_service "${SERVICE}" ${S_ACTIVE}

	# iterate to install any dependencies
	local D
	for D in $(dependencies_for_service "${SERVICE}") ; do
		install "${D}"
	done

}


# ----------------------------------------------------------------------
# repair
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    Synonym for install.
#
repair() {
	install "${1}"
}


# ----------------------------------------------------------------------
# process_environment_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    Iterates environment variable names+presets, calling set_dot_env()
#    for each, with third argument false which means any pre-existing
#    value of the environment variable KEY is not updated.
#
process_environment_for_service() {

	local SERVICE="${1}"
	local ITEM KEY PRESET
	for ITEM in $(environment_presets_for_service "${SERVICE}") ; do

		# crack the tuple (variable»preset)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		KEY="${1}" ; PRESET="${2}"

		# add if not already defined
		set_dot_env "${KEY}" "${PRESET}" false && \
			echo "added ${KEY} to .env"

	done

}


# ----------------------------------------------------------------------
# random_password
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    random password string
# Note:
#    The password string takes the form IOT-.....-....-..... where
#    "IOT" and the hyphens are fixed, while each period represents
#    a random letter or digit. The intention is that passwords matching
#    this pattern should be both reasonably secure but also readily
#    identifiable as having been generated by the menu. This should
#    facilitate user customisation (within the constraints that many
#    container passwords only take effect on first launch).
#
random_password() {
  local A=$(pwgen -Bc 14 1)
  echo "IOT-${A:0:5}-${A:5:4}-${A:9:5}"
}


# ----------------------------------------------------------------------
# reinstall
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Notes:
#    1. Convenience to uninstall then install a service.
#    2. Resulting service will always be active.
#    3. Warns about but does not remove any dependent services. Note
#       that such warnings may flash past in menu mode.
#    4. Behaves like old-menu "pull full service from template"
#
reinstall() {
	uninstall "${1}"
	install "${1}"
}


# ======================================================================
# services
# ======================================================================
#
# Arguments:
#    none
# Returns:
#    nothing
# Discussion:
#    Displays alphabetical list of services arranged in columns in
#    "ls" style.
#
services() {

	${SQLITE3} "${DB}" <<-SQL | column
		SELECT
		    abbrev || ':' || name
		FROM
			services
		JOIN
			status
		ON
			services.stateID = status.stateID
		ORDER BY
			name
		;
	SQL

}


# ----------------------------------------------------------------------
# status
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 false for one-line summary
# Returns:
#    nothing
# Displays:
#    one-line summary of a service.
# Notes:
#    1. intended for CLI mode
#    2. $2 will only be false if "status" is invoked with no arguments.
#       If "status" is invoked with at least one service name then the
#       code-path to this function is via run_command_for_service()
#       which does not support passing another argument, in which case
#       $2 will be null
#
#
status() {

	# note the arguments
	local SERVICE="${1}"
	local MULTILINE="${2:-true}"

	# fetch state and description for service
	local TUPLE=$( \
		${SQLITE3} -separator "»" "${DB}" <<-SQL
			SELECT
				state,
				json_extract(config,'$.${J_DESCRIPTION}'),
				CASE
				  WHEN json_extract(config,'$.${J_CONFIGURE}') IS NOT NULL THEN 'yes'
				  ELSE 'no'
				END
			FROM
				services
			JOIN
				status
			ON
				services.stateID = status.stateID
			WHERE
				name = '${SERVICE}'
		SQL
	)

	local STATUS DESCRIPTION

	# crack the tuple
	IFS="»" ; set -- $TUPLE ; unset IFS

	# extract tuple components
	STATUS="${1}" ; DESCRIPTION="${2}" ; CONFIGURABLE="${3}"

	# multi-line report required?
	if [ "${MULTILINE}" = "false" ] ; then

		# no - one-liner
		printf "%12s: %${MAX_SERVICE_LEN}s %s\n" \
				"${STATUS}" \
				"${SERVICE}" \
				"${DESCRIPTION}"

	else

		# yes! (can only get here if second function argument)
		printf "      Service: %s\n" "${SERVICE}" 
		printf "  Description: %s\n" "${DESCRIPTION}" 
		printf "       Status: %s\n  Upgradeable: " "${STATUS}" 
		is_service_upgradeable "${SERVICE}" && printf "yes" || printf "no"
		printf "\n Configurable: %s\n\n" "${CONFIGURABLE}" 

	fi

}


# ----------------------------------------------------------------------
# uninstall
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Notes:
#    1. Any file that would be installed by install() is checked.
#       If both the template and services files exist then the two
#       are compared. If they compare same, the services file is removed
#       otherwise the services file is renamed. If only the services
#       file exists, that implies an error (a mistmatch between the
#       expectation set by menu-config.json and the file that should
#       exist in the template. Failing safe implies renaming the
#       services file rather than removing it. If the services file
#       does not exist (never installed, this is a second uninstall,
#       manual remove) then no action is required.
#    2. Removes the services subdirectory if empty.
#    3. Resulting service will always be uninstalled.
#    4. Warns about but does not remove any dependent services. Note
#       that such warnings may flash past in menu mode.
#
uninstall() {

	# do NOT check for "installed" - this is an explicit clear-out

	# note service
	local SERVICE="${1}"

	# the service's template directory (in .templates) is
	local TEMPLATE_DIR="${TEMPLATES_DIR}/${SERVICE}"

	# the service's working directory (in services) is
	local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"

	# iterate the list of items to install
	local ITEM TNAME SNAME TRACKED
	for ITEM in $(installable_items_for_service "${SERVICE}") ; do

		# crack the tuple (template»service»tracked)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

		# form paths to template and services
		local T_PATH="${TEMPLATE_DIR}/${TNAME}"
		local S_PATH="${SERVICE_DIR}/${SNAME}"

		# does the services file exist?
		if [ -f "${S_PATH}" ] ; then

			# does the template file exist?
			if [ -f "${T_PATH}" ] ; then

				# both exist. Do they compare same?
				if cmp -s "${T_PATH}" "${S_PATH}" ; then

					# yes! safe to remove destination
					rm "${S_PATH}"

				else

					# no! differ so rename to save
					mv "${S_PATH}" "${S_PATH}.save"

				fi

			else

				# services exists but template doesn't. This might imply
				# an error in the template. Safest course is to rename
				mv "${S_PATH}" "${S_PATH}.save"

			fi

		fi

	done

	# remove directory if now empty
	[ -z "$(ls -A "${SERVICE_DIR}")" ] && rm -rf "${SERVICE_DIR}"

	# iterate for any dependencies
	local D
	for D in $(dependencies_for_service "${SERVICE}") ; do
		echo "Note: ${D} is a dependency of ${SERVICE}" >&2
	done

	# change state to uninstalled
	set_state_for_service "${SERVICE}" ${S_UNINSTALLED}

}


# ----------------------------------------------------------------------
# update - CLI only
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    report of upgrdeable services (if any)
#
update() {

	# fetch list of upgradeable services (if any)
	local SERVICES="$(all_upgradable_services)"
	
	# generate appropriate report
	if [ -n "${SERVICES}" ] ; then
		local SERVICE
		echo "These installed services can be upgraded:"
		for SERVICE in $SERVICES ; do
			echo "  ${SERVICE}"
		done
		[ "${RUN_MODE}" = "menu" ] && echo "Hint: Use the Services menu to upgrade these services."
	else
		echo "All installed services are up-to-date!"
	fi

	# return the services count
	return ${COUNT}

}


# ----------------------------------------------------------------------
# upgrade
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Precondition:
#    service must be upgradeable
# Summary:
#    Scans installed (active or unactive) service and imports changed
#    files from template (old files saved).
#
upgrade() {

	# note arguments
	local SERVICE="${1}"

	# sense service not upgradeable
	if ! is_service_upgradeable "${SERVICE}" ; then
		echo "Warning: ${SERVICE} is not upgradeable" >&2
		return
	fi

	# the service's template directory (in .templates) is
	local TEMPLATE_DIR="${TEMPLATES_DIR}/${SERVICE}"

	# the service's working directory (in services) is
	local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"

	# rsync options - see install_item_for_service() for definitions
	local  UPDATE_OPTS="-bcgoprt --suffix=.save"
	local INSTALL_OPTS="-goprt --ignore-existing"

	UPDATE_OPTS="${UPDATE_OPTS} -i"
	INSTALL_OPTS="${INSTALL_OPTS} -i"

	cat <<-PREPEND
	Upgrade ${SERVICE} summary:
	----------------------------------------------------------------------
	PREPEND

	# iterate the list of items to install
	local ITEM TNAME SNAME TRACKED
	for ITEM in $(installable_items_for_service "${SERVICE}") ; do

		# crack the tuple (template»service»tracked)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

		# is this a tracked file?
		if [ ${TRACKED} -eq ${J_TRUE} ] ; then

			# yes! perform the upgrade
			install_item_for_service "${SERVICE}" \
				"${TEMPLATE_DIR}" "${TNAME}" \
				"${SERVICE_DIR}" "${SNAME}" \
				"${UPDATE_OPTS}" ${TRACKED}

		fi

	done

	cat <<-APPEND
	----------------------------------------------------------------------
	Any files listed above MAY have been replaced. You should:
	1. cd services/${SERVICE}
	2. Compare any .save files (your old versions) with the replacements.
	3. Re-apply any customisations from your .save files while preserving
	   as much new content as possible from the replacements.
	4. Rebuild your stack.
	APPEND

}


# ----------------------------------------------------------------------
# run_command_for_service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 command name
#    $2 service name
#    $3..$n optional arguments
# Returns:
#    nothing
# Precondition:
#    service must be known to IOTstack
# Discussion:
#    Providing the service name is known in the database, will invoke
#    the command (a local function), passing it the service name as
#    the first argument, followed by any number of optional arguments.
#
run_command_for_service() {
	local COMMAND="${1}" ; shift
	if [ $(get_state_for_service "${1}") -ne $S_UNKNOWN ] ; then
		${COMMAND} $@
	else
		echo "Warning: ${1} is not a known service" >&2
	fi
}


# ----------------------------------------------------------------------
# build
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effect:
#    Assembles docker-compose.yml and, optionally,
#    docker-compose.override.yml
# Discussion:
#    Generates into temporary files then, if a temporary file differs
#    from any existing docker-compose.yml / override file, creates a
#    .save file of the older  file and moves the newer file into place.
# Notes:
#    1. The reason for creating WORKSPACE (rather than three temporary
#       files) is so that the compose and override files get the correct
#       names when rsync evaluates and reports on the results.
#    2. The override file MAY be empty. That will occur if there are
#       no customisations anywhere. docker compose does not care about
#       that so we don't try to do anything about it.
#    3. The main loop of this calls is_service_properly_installed() for
#       each service. That function checks whether all of the files that
#       SHOULD be in a service's ./services/«service» folder are in fact
#       present. It is ASSUMED that the list for each service includes
#       service.yml in the J_INSTALL array. Results are undefined if
#       this assumption does not hold.
#
build() {

	# create a temporary directory and define temporary files.
	local WORKSPACE=$(mktemp -d)
	local EFILE="${WORKSPACE}/edits.sed"
	local CFILE="${WORKSPACE}/${COMPOSE_NAME}"
	local OFILE="${WORKSPACE}/${OVERRIDE_NAME}"

	# presume no services and no overrides
	local AL1S=false
	local AL1O=false

	cat <<-PREPEND
	Generating stack:
	----------------------------------------------------------------------
	PREPEND

	# sed editing instructions
	# (single-quotes on 'EDITS' = "no bash $ substitution")
	cat <<-'EDITS' >"${EFILE}"
		# if the last line of the file is blank, remove it
		${/^[[:space:]]*$/d;}
		# for other lines, prepend two spaces (shift right)
		s/^/  /
	EDITS

	# start with the header
	cat "${SERVICES_DIR}/${COMPOSE_HEAD}" >"${CFILE}"
	cat "${SERVICES_DIR}/${OVERRIDE_HEAD}" >"${OFILE}"

	# iterate active services
	local S
	for S in $(all_active_services) ; do
	
		# sense service not installed properly (missing files).
		if ! is_service_properly_installed "${S}" ; then
			cat <<-MISSING
				Warning: ${S} is active but at least one expected file is missing.
				         ${S} will not be included in ${COMPOSE_NAME}.
				         Consider repairing or reinstalling this service.
			MISSING
			continue
		fi

		# service passes check. emit `services:` header if needed
		if [ "${AL1S}" = "false" ] ; then
			echo -e "\nservices:" >>"${CFILE}"
			AL1S=true
		fi

		# a blank line
		echo "" >>"${CFILE}"

		# form the path to the service definition
		local SERVICE_DEF="${SERVICES_DIR}/${S}/${SERVICE_YML}"

		# append the service, shifting right by two
		sed -f "${EFILE}" "${SERVICE_DEF}" >>"${CFILE}"

		# form the path to the (optional) override definition
		local OVERRIDE_DEF="${SERVICES_DIR}/${S}/${OVERRIDE_YML}"

		# does the override exist?
		if [ -f "${OVERRIDE_DEF}" ] ; then

			# yes! emit `services:` header if needed
			if [ "${AL1O}" = "false" ] ; then
				echo -e "\nservices:" >>"${OFILE}"
				AL1O=true
			fi

			# a blank line
			echo "" >>"${OFILE}"

			# yes! append the override, shifting right by two
			sed -f "${EFILE}" "${OVERRIDE_DEF}" >>"${OFILE}"

		fi

		# generate any missing environment presets into .env
		process_environment_for_service "${S}"

	done

	# end with the trailer
	cat "${SERVICES_DIR}/${COMPOSE_TAIL}" >>"${CFILE}"
	cat "${SERVICES_DIR}/${OVERRIDE_TAIL}" >>"${OFILE}"

	# copy files into place
	rsync -bcgopti --suffix=.save "${CFILE}" "${COMPOSE_FILE}"
	rsync -bcgopti --suffix=.save "${OFILE}" "${OVERRIDE_FILE}"

	cat <<-APPEND
	----------------------------------------------------------------------
	You can test the result with:
	   docker compose config {«service» ...}
	You can (re)start your stack or services with
	   docker compose up -d {«service» ...}
	APPEND

	# no longer need the temporary workspace
	rm -rf "${WORKSPACE}"

}


# ----------------------------------------------------------------------
# reload
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Invokes:
#    discover_services()
# Side-effect:
#    Yields MAX_SERVICE_LEN = maximum length of a service name
#
reload() {

	# force discovery
	discover_services

	# re-calculate the maximum length of a service name (global cache)
	MAX_SERVICE_LEN=$(longest_service_name)

	# remember
	DATABASE_WAS_RELOADED=true

}


# ----------------------------------------------------------------------
# renovate - re-import headers and footers
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Precondition:
#    at least one structural file must need renovation
# Note:
#    initialise_headers_and_footers() is always called when the menu
#    starts so every component WILL be defined in the components table.

renovate() {

	# sense does not need renovation
	if ! needs_renovation ; then
		echo "Warning: structural files do not need renovation" >&2
		return
	fi

	local C S D

	cat <<-PREPEND
	Renovation summary:
	----------------------------------------------------------------------
	PREPEND

	# iterate menu templates directory
	for C in $(ls -1 "${MENU_TEMPLATES_DIR}") ; do
		# sense file is not being tracked
		[ -z "$(version_for_component "${C}")" ] && continue
		# being tracked. form source and destination paths
		S="${MENU_TEMPLATES_DIR}/${C}"
		D="${SERVICES_DIR}/${C}"
		# overwrite if different
		rsync -bcgopti --suffix=.save "${S}" "${D}"
		# set current commit ID
		set_version_for_component "${C}" "$(commitID_for_path "${S}")"
	done

	cat <<-APPEND
	----------------------------------------------------------------------
	Any files listed above MAY have been replaced. You should:
	1. cd services
	2. Compare any .save files (your old versions) with the replacements.
	3. Re-apply any customisations from your .save files while preserving
	   as much new content as possible from the replacements.
	4. Rebuild your stack.
	APPEND

}


# ======================================================================
# Initialisation
# ======================================================================

# ----------------------------------------------------------------------
# discover_services
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effect:
#    Populates the SQLite3 database
#
discover_services() {

	local NUM_TEMPLATES=0
	local P SERVICE RC

	# load ordered services into array (which may be empty)
	local KNOWN_SERVICES=($(all_services))

	# scan the templates directory looking for service.yml files
	for P in $(find "${TEMPLATES_DIR}" -name "${SERVICE_YML}" -type "f") ; do

		# the service name is the directory name
		SERVICE="$(basename "$(dirname "${P}")")"

		# can SERVICE be used to re-assemble the path?
		if [ -f "${TEMPLATES_DIR}/${SERVICE}/${SERVICE_YML}" ] ; then

			# yes! the path to the per-service JSON configuration file is
			local CONFIG="${TEMPLATES_DIR}/${SERVICE}/${MENU_JSON}"

			# does the configuration file exist?
			if [ ! -f "${CONFIG}" ] ; then
				# no! create placeholder json (just installs service.yml)
				cat <<-CONFIG >"${CONFIG}"
				{
				   "${J_CONFIGURE}": null,
				   "${J_DEPENDENCIES}": [],
				   "${J_DESCRIPTION}": "${SERVICE}",
				   "${J_ENVIRONMENT}": [],
				   "${J_INSTALL}": [
				     { "${J_TEMPLATE}": "service.yml", "${J_SERVICE}": "service.yml", "${J_TRACKED}": true }
				   ],
				   "${J_SERVICE}": "${SERVICE}"
				}
				CONFIG
				# report
				echo "Note: created $CONFIG" >&2
			fi

			# is this service already known?
			if [[ ${KNOWN_SERVICES[@]} =~ "${SERVICE}" ]] ; then

				# yes! treat this as a potential update of the JSON
				update_service_json_if_changed "${SERVICE}" "${CONFIG}"

			else

				# no! add a whole new row
				add_record_for_service "${SERVICE}" "${CONFIG}"

			fi

			# save the return code from update/add
			RC=$?

			# bump template count on success, otherwise moan
			if [ $RC -eq 0 ] ; then
				((NUM_TEMPLATES++))
			else
				echo "Problem importing $SERVICE into database (SQLite error $RC)" >&2
			fi

		else

			# no! this implies something like a directory name with
			# an embedded space (essentially a user error)
			cat <<-NAME

				Error: $P is a partial path.

					   This may be caused by an invalid service name. Docker service
					   names must start with a letter or digit, followed by letters,
					   digits, periods, hyphens or underscores.

			NAME

			exit 1

		fi

	done

	# reload known services
	local KNOWN_SERVICES=($(all_services))

	# does the database know about exactly the same number of templates?
	if [ ${#KNOWN_SERVICES[@]} -ne ${NUM_TEMPLATES} ] ; then

		# no! so that means a template has disappeared. iterate the database view
		for SERVICE in ${KNOWN_SERVICES[*]} ; do

			# can the service be used to discover the path to its service.yml?
			if [ ! -f "${TEMPLATES_DIR}/${SERVICE}/${SERVICE_YML}" ] ; then

				# no! so this service should be removed from the database
				delete_record_for_service "${SERVICE}"

			fi

		done

	fi

}


# ----------------------------------------------------------------------
# migrate
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 target state (either S_ACTIVE or S_INACTIVE)
# Returns:
#    nothing
# Notes:
#    This function is called by auto_migration() which is called when
#    the internal database has only just been created.
#
#    This function iterates the installable_items_for_service. For
#    each installable item, there are three possibilities:
#
#     a. Source+Destination files exist                        AND
#        Source file is trackable and has a non-null commitID  AND
#        Source+Destination files compare same.
#        -> The commitID is written into the tracking table as-is.
#
#     b. Same first two criteria as "a" but files compare different.
#        -> The commitID is prefixed with "migrate-" before being
#           written into the tracking table. Subsequently, an
#           "Update" command will report the service as upgradable.
#
#     c. Everything else.
#        -> Calls install_item_for_service
#
#    The resulting service will be marked according to $2.
#
#    Does NOT install any dependent services on the assumption
#    those would also be caught by the migration.
#
migrate() {

	# note service and target state
	local SERVICE="${1}"
	local STATE=${2:-${S_ACTIVE}}

	# the service's template directory (in .templates) is
	local TEMPLATE_DIR="${TEMPLATES_DIR}/${SERVICE}"

	# the service's working directory (in services) is
	local SERVICE_DIR="${SERVICES_DIR}/${SERVICE}"

	# ensure working directory exists (probably superfluous)
	mkdir -p "${SERVICE_DIR}"

	# rsync --ignore-existing=don't overwrite
	# see install_item_for_service() for discussion of other options
	local OPTS="-goprt --ignore-existing"

	# iterate the list of items to install
	local ITEM TNAME SNAME TRACKED
	for ITEM in $(installable_items_for_service "${SERVICE}") ; do

		# crack the tuple (template»service»tracked)
		IFS="»" ; set -- $ITEM ; unset IFS

		# extract tuple components
		TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

		# construct source and destination paths
		local T_PATH="${TEMPLATE_DIR}/${TNAME}"
		local S_PATH="${SERVICE_DIR}/${SNAME}"

		# do the source and destination both exist already?
		if [ -f "${T_PATH}" -a -f "${S_PATH}" ] ; then

			# yes! fetch the commit ID for the source (may be null)
			local SID=$(commitID_for_path "${T_PATH}")

			# can and should the source file be tracked?
			if [ -n "${SID}" -a ${TRACKED} -eq ${J_TRUE} ] ; then

				# yes! are the two files already the same?
				if cmp -s "${T_PATH}" "${S_PATH}" ; then
				
					# yes! no copy needed so commit ID is valid
					track_item_for_service \
						"${SERVICE}" \
						"${TNAME}" \
						"${SID}"

				else

					# no! don't overwrite. Mark the commitID so the
					# service will become an upgrade candidate
					track_item_for_service \
						"${SERVICE}" \
						"${TNAME}" \
						"migrate-${SID}"

				fi

				# we are done with this file - this iteration of the
				# for-loop is complete
				continue

			fi

		fi

		# notice the "continue" above which short-circuits the for-loop
		# Will only arrive here if either/both files do not exist, or
		# if both files exist but the source file can't be tracked
		install_item_for_service "${SERVICE}" \
			"${TEMPLATE_DIR}" "${TNAME}" \
			"${SERVICE_DIR}" "${SNAME}" \
			"${OPTS}" ${TRACKED}

	done

	# make service active
	set_state_for_service "${SERVICE}" ${STATE}

}


# ----------------------------------------------------------------------
# auto_migration
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Explanation:
#    This function is invoked by initialise_database(). It is called
#    when the internal database has only just been created (ie did not
#    exist when the menu was launched). This function is called right
#    after a call to discover_services(). Thus, the starting position
#    for this function is all known services are marked S_UNINSTALLED.
#
#    Please see ./docs/Updates/Migration.md for more information
#
auto_migration() {

	local P SERVICES SERVICE STATE

	# sense the compose file does not exist
	[ -f "${COMPOSE_FILE}" ] || return

	# fetch the list of active services in the existing project
	# (SERVICES will be null if "docker compose" not available)
	SERVICES=$(docker compose \
		--project-directory "${PROJECT_DIR}" \
		config --services 2>/dev/null)

	# iterate the active services
	for SERVICE in ${SERVICES} ; do

		# fetch the state for this service
		STATE=$(get_state_for_service "${SERVICE}")

		# is this service known to IOTstack?
		if [ ${STATE} -ne ${S_UNKNOWN} ] ; then

			# perform migration if service is not installed already
			[ ${STATE} -eq ${S_UNINSTALLED} ] \
			&& migrate "${SERVICE}" ${S_ACTIVE}

		fi

	done

	# find all the top level sub-directories in the services directory
	# "wrong-uns" like a directory named "this has spaces" will be
	# treated as "this" "has" "spaces" but, most of the time, those
	# won't match known services; ditto "foreigners" like "old_stuff".
	# However, where a "faulty" match ocurrs, worst case is an inactive
	# service of that name.
	for P in $(find "${SERVICES_DIR}"/* -maxdepth 0 -name "*" -type d ) ; do

		# Acquire the putative service name from the directory name
		SERVICE="$(basename "${P}")"

		# fetch the state for this service
		STATE=$(get_state_for_service "${SERVICE}")

		# is this service known to IOTstack?
		if [ ${STATE} -ne ${S_UNKNOWN} ] ; then

			# perform migration if service is not installed already
			[ ${STATE} -eq ${S_UNINSTALLED} ] \
			&& migrate "${SERVICE}" ${S_INACTIVE}

		fi

	done

}


# ----------------------------------------------------------------------
# initialise_database
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effects:
#    creates/populates the SQLite3 database
# Note:
#    The SQL is designed to be runnable irrespective of whether it is
#    handed a new (empty) or existing database. However, there is no
#    guarantee that the function will succeed if the schema changes.
#    Sometimes you may have to either delete the database and start
#    over or make manual adjustments.
#
#    Invokes discover_services if it was handed an empty database upon
#    entry to this function.
#
initialise_database() {

	# sense database already exists
	[ -f "${DB}" ] ; local EXISTS=$?

	${SQLITE3} "${DB}" <<-SCHEMA

		/* structural components table (of commit IDs) */
		CREATE TABLE IF NOT EXISTS components (
		  component TEXT     PRIMARY KEY,
		  commitID  TEXT     NOT NULL
		);

		/* services table */
		CREATE TABLE IF NOT EXISTS services (
		  name      TEXT     PRIMARY KEY,
		  stateID   INTEGER  NOT NULL
		                     DEFAULT  ${S_UNINSTALLED}
		                     CHECK    (stateID in (${S_UNINSTALLED},${S_ACTIVE},${S_INACTIVE})),
		  config    TEXT     NOT NULL
		);

		/* lookup table for translating stateID to human-readable forms */
		CREATE TABLE IF NOT EXISTS status (
		  stateID   INTEGER  PRIMARY KEY
		                     CHECK    (stateID in (${S_UNINSTALLED},${S_ACTIVE},${S_INACTIVE},${S_UNKNOWN})),
		  abbrev    TEXT     NOT NULL,
		  state     TEXT     NOT NULL
		);

		/* table for tracking items that Git knows about and where a change implies a service "update" */
		CREATE TABLE IF NOT EXISTS tracking (
		  name      TEXT     NOT NULL,
		  template  TEXT     NOT NULL,
		  commitID  TEXT     NOT NULL,
		  UNIQUE(name,template) ON CONFLICT REPLACE
		);

		/* if a service is deleted, all its tracked items should go away */
		CREATE TRIGGER IF NOT EXISTS delete_service AFTER DELETE ON services
		BEGIN
		  DELETE FROM tracking WHERE tracking.name = OLD.name;
		END;

		/* if a service's JSON changes AND that removes a tracked item, the tracked item should go away too */
		CREATE TRIGGER IF NOT EXISTS update_config AFTER UPDATE OF config ON services
		BEGIN
		  DELETE FROM
		    tracking
		  WHERE
		    tracking.name = OLD.name
		  AND NOT
		    tracking.template IN (
		      SELECT
		        json_extract(value,'$.${J_TEMPLATE}') AS 'templates'
		      FROM
		        services, json_each(config,'$.${J_INSTALL}')
		      WHERE
		        name = OLD.name
		      AND
		        json_extract(value,'$.${J_TRACKED}') = ${J_TRUE}
		    )
		  ;
		END;

		/* seed structural components table */
		INSERT OR IGNORE INTO components VALUES (
		  'menu', '$(commitID_for_path "${PROJECT_DIR}/${SCRIPT}")'
		);
		INSERT OR IGNORE INTO components VALUES (
		  'templates', '$(commitID_for_path "${TEMPLATES_DIR}")'
		);

		/* populate stateID lookup table */
		INSERT OR IGNORE INTO status VALUES (${S_UNINSTALLED}, '–', 'uninstalled');
		INSERT OR IGNORE INTO status VALUES (${S_ACTIVE}, 'A', 'active');
		INSERT OR IGNORE INTO status VALUES (${S_INACTIVE}, 'I', 'inactive');
		INSERT OR IGNORE INTO status VALUES (${S_UNKNOWN}, 'U', 'unknown');

	SCHEMA

	# fetch SQLite3 exit code
	local SCHEMAERR=$?

	# did schema creation occur successfully?
	if [ ${SCHEMAERR} -eq 0 ] ; then

		# yes! was the database was just created?
		if [ ${EXISTS} -ne 0 ] ; then

			# yes! perform service discovery
			discover_services

			# and then attempt auto-migration
			auto_migration

		fi

	else

		# no! moan and exit
		cat <<-SQLERROR

			Error: The SQLite3 database at the following path may be damaged:

			          ${DB}

			       You should consider either removing that file or moving it aside
			       for later analysis. The database will be re-created from scratch
			       the next time you start the menu.

			       The only thing to be aware of is that any services which are
			       currently marked inactive will become active. You will need to
			       deactivate each such service by hand.

			       The exit code returned by SQLite3 was ${SCHEMAERR}. SQLite3's
			       exit codes are documented at https://sqlite.org/rescode.html

		SQLERROR

		exit ${SCHEMAERR}

	fi

}


# ----------------------------------------------------------------------
# initialise_headers_and_footers
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effects:
#    copies headers and trailers from .templates/.menu to services
# Note:
#    this uses brute force. It would probably be better to have another
#    json file defining all four files, two tracked, two untracked
#    but this will do for now.
#
initialise_headers_and_footers() {

	local C S D CID

	# the tracked files
	for C in "${COMPOSE_HEAD}" "${COMPOSE_TAIL}" ; do
		# form source and destination paths
		S="${MENU_TEMPLATES_DIR}/${C}"
		D="${SERVICES_DIR}/${C}"
		# fetch commitID for source file
		CID=$(commitID_for_path "${S}")
		# does the destination file exist?
		if [ -f "${D}" ] ; then
			# yes! set a commitID if one is not set already
			if [ -z "$(version_for_component "${C}")" ] ; then
				set_version_for_component "${C}" "${CID}"
			fi
		else
			# no! copy into place
			rsync -gopt "${S}" "${D}"
			# set current commit ID
			set_version_for_component "${C}" "${CID}"
		fi
	done

	# the untracked files
	for C in "${OVERRIDE_HEAD}" "${OVERRIDE_TAIL}" ; do
		# form source and destination paths
		S="${MENU_TEMPLATES_DIR}/${C}"
		D="${SERVICES_DIR}/${C}"
		# does the destination file exist?
		if [ ! -f "${D}" ] ; then
			# no! copy into place
			rsync -gopt "${S}" "${D}"
		fi
	done

}


# ----------------------------------------------------------------------
# needs_renovation
# ----------------------------------------------------------------------
#
# Arguments:
#    none
# Returns:
#    Boolean (bash return code):
#       0 = true = service is active
#       1 = false = service is not active
# Note:
#    initialise_headers_and_footers() is always called when the menu
#    starts so every tracked component WILL be defined in the
#    components table.
#
needs_renovation() {

	local C SCID GCID

	# iterate menu templates directory
	for C in $(ls -1 "${MENU_TEMPLATES_DIR}") ; do
		# fetch commitID from database
		SCID=$(version_for_component "${C}")
		# sense file is not being tracked
		[ -z "${SCID}" ] && continue
		# fetch commitID for source file from Git
		GCID=$(commitID_for_path "${MENU_TEMPLATES_DIR}/${C}")
		# indicate "renovation required" (ie true) if IDs differ
		[ "${SCID}" != "${GCID}" ] && return 0
	done

	# no differences found, return false
	return 1

}


# ======================================================================
# ======================================================================
#                           MAIN CODE
# ======================================================================
# ======================================================================


# ----------------------------------------------------------------------
# the installer script MUST exist
# ----------------------------------------------------------------------

if [ ! -f "${INSTALLER_SCRIPT}" ] ; then
	echo "error: $INSTALLER_SCRIPT does not exist (suggest re-clone IOTstack from GitHub)" >&2
	exit 1
fi


# ----------------------------------------------------------------------
# the templates directory MUST exist
# ----------------------------------------------------------------------
if [ ! -d "${TEMPLATES_DIR}" ] ; then
	echo "error: $TEMPLATES_DIR does not exist (suggest re-clone IOTstack from GitHub)" >&2
	exit 1
fi


# ----------------------------------------------------------------------
# the scripts directory MUST exist and is prepended to the search path
# ----------------------------------------------------------------------
if [ ! -d "${SCRIPTS_DIR}" ] ; then
	echo "error: $SCRIPTS_DIR does not exist (suggest re-clone IOTstack from GitHub)" >&2
	exit 1
fi

export PATH="${SCRIPTS_DIR}:${PATH}"


# ----------------------------------------------------------------------
# copy the current machine timezone to the project timezone
# ----------------------------------------------------------------------

set_timezone_for_project


# ----------------------------------------------------------------------
# ensure services directory exists
# ----------------------------------------------------------------------

mkdir -p "${SERVICES_DIR}"


# ----------------------------------------------------------------------
# database initialisation and population
# ----------------------------------------------------------------------

# initialise the database if it does not exist
initialise_database

# calculate the maximum length of a service name (global cache)
MAX_SERVICE_LEN=$(longest_service_name)


# ----------------------------------------------------------------------
# set up headers and footers
# ----------------------------------------------------------------------

initialise_headers_and_footers


# ----------------------------------------------------------------------
# auto-sense significant structural changes
# ----------------------------------------------------------------------

# fetch the commitID for the menu
CID="$(commitID_for_path "${PROJECT_DIR}/${SCRIPT}")"

# has the commitID changed?
if [ "$(version_for_component "menu")" != "${CID}" ] ; then

	# yes! for now this is just a hook
	# echo "commitID for menu has changed"

	# here, do anything in future that makes sense if the menu updates

	# update the saved commitID for menu
	set_version_for_component "menu" "${CID}"

fi


# fetch the commitID for the templates directory
CID="$(commitID_for_path "${TEMPLATES_DIR}")"

# has the commitID changed?
if [ "$(version_for_component "templates")" != "${CID}" ] ; then

	# yes! perform service discovery
	reload

	# update the saved commitID for templates
	set_version_for_component "templates" "${CID}"

fi


# ======================================================================
# Command-line processing
# ======================================================================
#
# any arguments passed on command-line?
if [ $# -gt 0 ] ; then

	# yes! assume first argument is command verb
	COMMAND="${1}"; shift

	# vector on command verb
	case "${COMMAND}" in

		# verbs - returns list of verbs for bash auto-completion.
		# This is an internal command. It is not documented and has
		# no usage. The list expressly omits auto-completion-related
		# commands present in this case statement so DO NOT ADD THEM!
		# Please keep list in alphabetical order
		"verbs" )
			cat <<-VERBS
				activate
				build
				configure
				deactivate
				help
				info
				inspect
				install
				reinstall
				reload
				renovate
				repair
				services
				status
				uninstall
				update
				upgrade
			VERBS
			exit 0
		;;

		# completions - returns list of services (if any) for associated verb
		# This is an internal command. It is not documented and has
		# no usage.
		#   $1 is the current verb and
		#   $2 is the completion word count
		"completions" )
			case "${1}" in

				"activate" )
					all_inactive_services
				;;

				"configure" )
					if [ $2 -eq 2 ] ; then
						all_configurable_services
					else
						echo ""
					fi
				;;

				"deactivate" )
					all_active_services
				;;

				"inspect" ) ;&
				"install" ) ;&
				"repair" ) ;&
				"status" )
					all_services
				;;

				"reinstall" ) ;&
				"uninstall" )
					all_installed_services
				;;

				"upgrade" )
					all_upgradable_services
				;;

				# build, help, info, reload, renovate, services, update
				# take no arguments
				*)
					echo ""
				;;

			esac
			exit 0
		;;

		# internal command - usage but omitted from verbs list
		"bashcompletions" )
			if [ $# -ne 0 ] ; then
				echo "Usage: ${LOCALSCRIPT} ${COMMAND}" >&2
				exit 1
			fi
			generate_bashcompletions
			exit 0
		;;

		# exactly one service as an argument
		"configure" ) ;&
		"inspect" )
			if [ $# -ne 1 ] ; then
				echo "Usage: ${LOCALSCRIPT} ${COMMAND} «service»" >&2
				exit 1
			fi
			run_command_for_service ${COMMAND} "${1}"
		;;

		# at least one service as an argument
		"activate" ) ;&
		"deactivate" ) ;&
		"install" ) ;&
		"reinstall" ) ;&
		"repair" ) ;&
		"uninstall" ) ;&
		"upgrade" )
			if [ $# -lt 1 ] ; then
				echo "Usage: ${LOCALSCRIPT} ${COMMAND} «service» {«service»...}" >&2
				exit 1
			fi
			while [ $# -gt 0 ] ; do
				run_command_for_service ${COMMAND} "${1}"
				shift
			done
		;;

		# zero or more services as an argument; zero implies all
		"status" )
			if [ $# -eq 0 ] ; then
				for S in $(all_services) ; do
					${COMMAND} "${S}" false
				done
			else
				while [ $# -gt 0 ] ; do
					run_command_for_service ${COMMAND} "${1}"
					shift
				done
			fi
		;;

		# no arguments
		"build" ) ;&
		"info" ) ;&
		"reload" ) ;&
		"renovate" ) ;&
		"services" ) ;&
		"update" )
			if [ $# -gt 0 ] ; then
				echo "Usage: ${LOCALSCRIPT} ${COMMAND}" >&2
				exit 1
			fi
			${COMMAND}
		;;

		*)
			cat <<-HELP

				Help:

				  ${LOCALSCRIPT}
				    with no arguments runs the menu

				  ${LOCALSCRIPT} activate «service» {«service»...}
				    activates at least one inactive service

				  ${LOCALSCRIPT} build
				    generates your stack (compose and override) files

				  ${LOCALSCRIPT} configure «service»
				    configures an installed, configurable service

				  ${LOCALSCRIPT} deactivate «service» {«service»...}
				    deactivates at least one active service

				  ${LOCALSCRIPT} info
				    summarises available services and installable items

				  ${LOCALSCRIPT} inspect «service»
				    displays contents of service template

				  ${LOCALSCRIPT} install «service» {«service»...}
				    installs at least one service from its template (even if already installed)

				  ${LOCALSCRIPT} reinstall «service» {«service»...}
				    a shortcut for uninstall followed by install

				  ${LOCALSCRIPT} reload
				    performs service discovery (eg if you have added a new template)

				  ${LOCALSCRIPT} renovate
				    updates header and trailer files in services directory

				  ${LOCALSCRIPT} repair «service» {«service»...}
				    this is a synonym for install (will replace any missing files)

				  ${LOCALSCRIPT} services
				    displays list of services with prefixes "-:" (uninstalled),
				    "A:" (active), "I:" (inactive) or "U:" (internal error).

				  ${LOCALSCRIPT} status {«service»...}
				    displays status for the services named in arguments
				    omitting the arguments implies all known services

				  ${LOCALSCRIPT} uninstall «service» {«service»...}
				    removes at least one installed service

				  ${LOCALSCRIPT} update
				    checks whether installed services need upgrading

				  ${LOCALSCRIPT} upgrade «service» {«service»...}
				    performs upgrade on at least one installed service

				  --------------

				  $(install_completions_command)
				    can be used to install bash auto-completion handler (logout needed)

			HELP
		;;

	esac

	# report if database was reloaded
	note_database_reloaded

	# warn if the installer should be re-run
	warn_if_installer_updated

	# warn if renovations required
	warn_if_needs_renovation

	# normal exit (ie does not fall through to the menu)
	exit 0

fi

# ======================================================================
# Menu processing (in the absence of command line arguments)
# ======================================================================

RUN_MODE=menu

# ----------------------------------------------------------------------
# unimplemented menu selection dialog handler
# ----------------------------------------------------------------------
#
# $1 selection
#
unimplemented() {
	# display message (8 < $MENU_LINES)
	${CLIMENU} \
		--title "Not Implemented" \
		--msgbox "Sorry, \"$1\" is not implemented" \
		8 $MENU_COLUMNS
}


# ======================================================================
# Service manipulation helpers
# ======================================================================
#
# ----------------------------------------------------------------------
# Activate a service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
#    $2 path to configuration script - ignored
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Activate() {
	activate "${1}"
}


# ----------------------------------------------------------------------
# Configure a service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Configure() {
	configure "${1}"
}


# ----------------------------------------------------------------------
# Deactivate a service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Deactivate() {
	deactivate "${1}"
}


# ----------------------------------------------------------------------
# Install a service - Repair() is a synonym
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Install() {
	install "${1}"
}

Repair() {
	install "${1}"
}


# ----------------------------------------------------------------------
# Reinstall a service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Reinstall() {
	reinstall "${1}"
}


# ----------------------------------------------------------------------
# Uninstall a service
# ----------------------------------------------------------------------
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Uninstall() {
	uninstall "${1}"
}


# ======================================================================
# Upgrade - upgrade a service
# ======================================================================
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Note:
#    invokes CLI command to do the work
#
Upgrade() {

	# create a temporary file
	local UFILE=$(mktemp)

	# perform the upgrade
	upgrade "${1}" >>"${UFILE}"

	# build display
	${CLIMENU} \
		--fb \
		--scrolltext \
		--title "Upgrade ${1}" \
		--textbox "${UFILE}" \
		20 $MENU_COLUMNS

	# no longer need the temporary file
	rm -f "${UFILE}"

}


# ======================================================================
# Service Control - Menu
# ======================================================================
#
# Arguments:
#    $1 service name
# Returns:
#    nothing
# Discussion:
#    Presents valid options (eg Install, Uninstall) to user to
#    alter the state of the selected service.
#
Service_Control() {

	local SERVICE="${1}"
	local OPTIONS=""
	local CONFIG_SH=""
	local SELECTION RC

	# prepare command (16 < $MENU_LINES)
	local COMMAND=( \
		"${CLIMENU}" \
		"--fb" \
		"--title" "'Control ${SERVICE}'" \
		"--ok-button" "'Select'" \
		"--cancel-button" "'Return'" \
		"--menu" "'${SERVICE}'" \
		16 $MENU_COLUMNS 7 \
	)

	# construct a list of options for whiptail. The double-up of commands
	# and descriptions is a result of a behavioural difference between
	# whiptail on Linux and dialog on macOS.
	if is_service_installed "${SERVICE}" ; then

		# inactive can be activated
		is_service_inactive "${SERVICE}" \
			&& COMMAND+=("'Activate'" "'make service active'")
		
		# configuration is a possibility
		is_service_configurable "${SERVICE}" \
			&& COMMAND+=("'Configure'" "'show service configuration menu'")

		# active can be deactivated
		is_service_active "${SERVICE}" \
			&& COMMAND+=("'Deactivate'" "'make service inactive'")

		# un- or re-installation always available
		COMMAND+=("'Reinstall'" "'remove then re-install service'")

		# installed - can always be repaired (synonym for Install)
		COMMAND+=("'Repair'" "'replace any missing files from template'")

		# can always be uninstalled
		COMMAND+=("'Uninstall'" "'remove service completely'")

		# upgrade is a possibility
		is_service_upgradeable "${SERVICE}" \
			&& COMMAND+=("'Upgrade'" "'upgrade service to match template'")

	else

		# not installed - available to be installed
		COMMAND+=("'Install'" "'install service from template'")

	fi

	# present the menu and wait for the selection
	SELECTION=$(eval ${COMMAND[*]} 3>&1 1>&2 2>&3) ; RC=$?

	# implement decision
	if [ ${RC} -eq 0 ] ; then
		declare -F "${SELECTION}" &>/dev/null \
		&& "${SELECTION}" "${SERVICE}" \
		|| unimplemented "${SELECTION}"
	fi

}


# ======================================================================
# Service Selection - Menu
# ======================================================================
#
# Arguments:
#    none
# Returns:
#    nothing
# Discussion:
#    Present list of services in a menu, allowing for selection
#    and subsequent invocation of Service_Control().
#
Services() {

	# fixed portion of menu
	local FIXED=( \
		"${CLIMENU}" \
		"--fb" \
		"--title" "'IOTstack Services'" \
		"--ok-button" "'Select'" \
		"--cancel-button" "'Return'" \
		"--menu" "'Services A)ctive I)nactive C)onfigurable'" \
		$MENU_LINES $MENU_COLUMNS 14 \
	)

	# iterate services menu until return (or escape)
	while true ; do

		# assemble whiptail command
		local COMMAND=( \
			${FIXED[*]} \
			$(formatted_components_for_services_menu) \
		)

		# present the menu and wait for the selection
		local SELECTION RC
		SELECTION=$(eval ${COMMAND[*]} 3>&1 1>&2 2>&3) ; RC=$?

		# implement decision
		if [ ${RC} -eq 0 ] ; then
			Service_Control "${SELECTION}"
		else
			break;
		fi

	done

}

# ======================================================================
# Build Stack - with completion dialog
# ======================================================================
#
# Arguments:
#    none
# Returns:
#    nothing
# Side-effects:
#    same as for build() function
#
Build() {

	# create a temporary file
	local UFILE=$(mktemp)

	# invoke command-line build command
	build >>"${UFILE}"

	# build display
	${CLIMENU} \
		--fb \
		--scrolltext \
		--title "Build" \
		--textbox "${UFILE}" \
		20 $MENU_COLUMNS

	# no longer need the temporary file
	rm -f "${UFILE}"

}


# ======================================================================
# Renovate - re-copy headers+trailers to services directory
# ======================================================================
#
# Arguments:
#    none
# Returns:
#    nothing
#
Renovate() {

	# create a temporary file
	local UFILE=$(mktemp)

	# perform the renovation
	renovate >>"${UFILE}"

	# build display
	${CLIMENU} \
		--fb \
		--scrolltext \
		--title "Renovate" \
		--textbox "${UFILE}" \
		20 $MENU_COLUMNS

	# no longer need the temporary file
	rm -f "${UFILE}"

}


# ======================================================================
# Update - menu
# ======================================================================
#
# Arguments:
#    none
# Returns:
#    nothing
#
Update() {

	# create a temporary file
	local UFILE=$(mktemp)

	# generate report into file
	update >"${UFILE}"

	# build display
	${CLIMENU} \
		--fb \
		--scrolltext \
		--title "Update" \
		--textbox "${UFILE}" \
		16 $MENU_COLUMNS

	# no longer need the temporary file
	rm -f "${UFILE}"

}


# ======================================================================
# Menu environment check then clear the screen to avoid confusing
# flashes between menus and the command line.
# ======================================================================

check_screen_dimensions

clear

# ======================================================================
# Installer update check
# ======================================================================

# ask the installer script if it has been updated and should be re-run
if [ "$(${INSTALLER_SCRIPT} should_run_installer)" = "true" ] ; then

	# yes! seek permission to do that from the user (7 < $MENU_LINES)
	"${CLIMENU}" \
		"--title" "Installer Update" \
		"--yesno" "The IOTstack installer has been updated. Re-run it now?" \
		7 $MENU_COLUMNS 3>&1 1>&2 2>&3 ; RC=$?

	# did the user agree?
	if [ ${RC} -eq 0 ] ; then

		# yes! run the installer without arguments
		${INSTALLER_SCRIPT}

	fi

fi


# ======================================================================
# Main Menu
# ======================================================================

main_menu() {

	local SELECTION RC

	# fixed portion of menu
	local COMMAND=( \
		"${CLIMENU}" \
		${CLICLEAR} \
		--fb \
		--title "'IOTstack Main Menu'" \
		--ok-button "Select" \
		--cancel-button "Exit" \
		--menu "Options" \
		16 $MENU_COLUMNS 6 \
		"'Services'" "'install, remove or configure services'" \
		"'Build'" "'generate compose and override files'" \
	)

	# renovation required?
	needs_renovation \
		&& COMMAND+=("'Renovate'" "'update structural components'")

	# update
	COMMAND+=("'Update'" "'check installed services'")

	# present the menu and wait for the selection
	SELECTION=$(eval ${COMMAND[*]} 3>&1 1>&2 2>&3) ; RC=$?

	# implement decision
	case ${RC} in

		# selection made - run the command
		0)	declare -F "${SELECTION}" &>/dev/null \
			&& "${SELECTION}" \
			|| unimplemented "${SELECTION}"
		;;

		# normal menu exit
		1)	clear ; exit 0 ;;

		# unexpected return code
		*)	exit ${RC} ;;

	esac

}

# iterate main menu until explicit exit
while true ; do main_menu ; done

exit 0
