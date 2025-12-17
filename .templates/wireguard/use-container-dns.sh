#!/bin/bash

# If you are doing ALL of the following:
#
# 1. Running an ad-blocking DNS service (Pi-hole, AdGuardHome
#    or similar) on the same (repeat SAME) host as WireGuard; AND
#
# 2. The host itself does NOT use the ad-blocker for its DNS; AND
#
# 3. You want WireGuard to direct remote clients to the ad-blocker
#    for their DNS,
#
# then this script is what you need.
#
# 1. This script expects to be installed at the path:
#
#     ./volumes/wireguard/custom-cont-init.d/use-container-dns.sh
#
# 2. This script should be owned root:root with mode 755
#
# 3. This scipt relies on the following clause in the WireGuard
#    service definition (in your docker-compose.yml)
#
#      extra_hosts:
#        - "host.docker.internal:host-gateway"
#
# How it works. On first launch, if this script is present in the
# 'custom-cont-init.d' directory, it attempts to resolve the name
# 'host.docker.internal'. If the 'extra_hosts' clause defines that
# name (as above) then the result of the lookup will be the dynamically
# allocated IP address of the 'docker0' network interface. That IP
# address is, effectively, a synonym for "this host". Assuming the
# lookup succeeds, the IP address is used to construct a directive to
# be appended to '/etc/resolvconf.conf'. On a restart, the directive
# will already be present so it is not added twice. If the directive is
# not present, it is appended and 'resolvconf -u' is invoked to rebuild
# '/etc/resolv.conf'.
#
# Omitting either this script or the 'extra_hosts' clause will see
# WireGuard revert to the default behaviour: follow /etc/resolv.conf
# which, in the absence of the actions of this script, means do whatever
# the host does.


# discover the IP address of host.docker.internal
GW="$(getent hosts host.docker.internal | awk '{print $1}')"
# did the name resolve?
if [ -n "$GW" ] ; then
   # yes! form the directive
   RESOLV="name_servers=$GW"
   # is the directive already present?
   if [ $(grep -c "$RESOLV" /etc/resolvconf.conf ) -eq 0 ] ; then
      # no! add it, then apply it
      echo "$RESOLV" >>/etc/resolvconf.conf
      resolvconf -u
   fi
fi

