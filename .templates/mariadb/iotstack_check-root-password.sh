#!/bin/sh

# https://github.com/linuxserver/docker-mariadb/issues/163
# assumed installation path is /etc/periodic/15min/iotstack_check-root-password.sh

# marker file
MARKER="/tmp/root-password-checked"

# sense marker already exists
[ -f "${MARKER}" ] && exit 0

# create the marker
touch "${MARKER}"

# sense root password not defined yet.
# (defining the var necessarily causes a recreate)
[ -z "${MYSQL_ROOT_PASSWORD}" ] && exit 0

# can we execute a trivial command as root but WITHOUT a password?
if $(mariadb -u root -e 'quit' &> /dev/null) ; then
   # yes! Set the password now
   mariadb-admin -u root password "${MYSQL_ROOT_PASSWORD}"
   echo "root password was not set - is now set" >"${MARKER}"
else
   echo "root password checked - already set" >"${MARKER}"
fi

exit 0
