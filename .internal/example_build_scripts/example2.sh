#!/bin/bash

# Before running, ensure install.sh has run successfully, and the menu containers (specifically the API container) have been built and are running.
# They can be started by running ./menu.sh

echo "This will generate a build and echo out the command that's required to install it."
echo "Checkout the 'IOTstack.postman_collection.json' file for all API calls."
echo ""
echo "Services: plex, pihole, wireguard"
read -n 1 -s -r -p "Press any key to continue"
echo ""
echo ""

API_HOST=localhost:32128

HAS_ERROR="false"

# Generate build
CBRES=$(curl -s \
  -d '{"buildOptions":{"selectedServices":["plex","pihole","wireguard"],"configurations":{"services":{"wireguard":{"volumes":["./services/wireguard/config:/config","/lib/modules:/lib/modules"],"networks":{},"networkMode":"unchanged","loggingEnabled":true,"environment":["PUID=1000","PGID=1000","TZ=Etc/UTC","SERVERURL={$wireguardDuckDns}","SERVERPORT=19942","PEERS=1","PEERDNS=auto","INTERNAL_SUBNET=100.64.0.0/24"]},"plex":{"volumes":["./volumes/plex/config:/config","./volumes/plex/transcode:/transcode"],"networks":{},"networkMode":"unchanged","loggingEnabled":true,"environment":["PUID=1000","PGID=1000","VERSION=docker"]},"pihole":{"volumes":["./volumes/pihole/etc-pihole/:/etc/pihole/","./volumes/pihole/etc-dnsmasq.d/:/etc/dnsmasq.d/"],"networks":{"iotstack_nw":true,"vpn_nw":true},"networkMode":"unchanged","loggingEnabled":true,"environment":["TZ=Etc/UTC","WEBPASSWORD=password","DNS1=8.8.8.8","DNS2=8.8.4.4","INTERFACE=eth0"]}},"networks":{},"meta":{}}}}' \
  -H "Content-Type: application/json" \
  -X POST http://$API_HOST/build/save)

if [[ $? -eq 0 ]]; then
  BUILD=$(echo $CBRES | jq -r '.build') # Extract build name from API response

  echo ""
  echo "Build '$BUILD' created."
else
  HAS_ERROR="true"
fi

# Contact the API again to get the installer bootstrap code
# using the build number to help automate the installation selection

CIRES=$(curl -s \
  -d "{\"options\":{\"build\":\"$BUILD\",\"nofluff\":true}}" \
  -H "Content-Type: application/json" \
  -X POST http://$API_HOST/templates/scripts/bootstrap)

# Show output
if [[ $? -eq 0 && "$HAS_ERROR" == "false" ]]; then
  echo ""
  echo "Running the install script command below will replace your current IOTstack"
  echo ""
  echo "Build can be deleted by calling:"
  echo "  curl -s -X POST http://$API_HOST/build/delete/$BUILD"
  echo ""
  echo "Install script is:"
  echo "$CIRES"
else
  HAS_ERROR="true"
fi

if [[ "$HAS_ERROR" == "true" ]]; then
  echo "Something went wrong. Check that the API is running."
  echo "API host being used: $API_HOST"
  echo "You can start the API manually with:"
  echo "  bash .internal/ctrl_api.sh"
fi