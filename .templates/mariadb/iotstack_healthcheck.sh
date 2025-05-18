#!/usr/bin/env sh

# set a default for the port
# (refer https://mariadb.com/kb/en/mariadb-environment-variables/ )
HEALTHCHECK_PORT="${MYSQL_TCP_PORT:-3306}"

# the expected response is?
EXPECTED="mysqld is alive"

# handle root password presence/absence
unset ARGUMENT
if [ -n "${MYSQL_ROOT_PASSWORD}" ] ; then
   if ! $(mariadb -u root -e 'quit' &> /dev/null) ; then
      ARGUMENT="-p${MYSQL_ROOT_PASSWORD}"
   fi
fi

# run the check
if [ -n "$(which mariadb-admin)" ] ; then
   RESPONSE=$(mariadb-admin ping ${ARGUMENT})
else
   RESPONSE=$(mysqladmin ping ${ARGUMENT})
fi

# did the ping succeed?
if [ $? -eq 0 ] ; then

   # yes! is the response as expected?
   if [ "$RESPONSE" = "$EXPECTED" ] ; then

      # yes! this could still be a false positive so probe the port
      if nc -w 1 localhost $HEALTHCHECK_PORT >/dev/null 2>&1; then

         # port responding - that defines healthy
         exit 0

      fi

   fi

fi

# otherwise the check fails
exit 1
