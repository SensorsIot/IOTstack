#!/bin/sh
set -e

if [ "${1:0:1}" = '-' ]; then
    set -- chronograf "$@"
fi

if [ "$1" = 'chronograf' ]; then
  export BOLT_PATH=${BOLT_PATH:-/var/lib/chronograf/chronograf-v1.db}
fi

if [ $(id -u) -eq 0 ] ; then
  if [ "${CHRONOGRAF_AS_ROOT}" != "true" ] ; then
    chown -Rc chronograf:chronograf /var/lib/chronograf
    exec su-exec chronograf "$@"
  fi
  chown -Rc root:root /var/lib/chronograf
else
  if [ ! -w /var/lib/chronograf ] ; then
    echo "You need to change ownership on chronograf's persistent store. Run:"
    echo "  sudo chown -R $(id -u):$(id -u) /path/to/persistent/store"
  fi
fi

exec "$@"
