#!/bin/bash

# Before running, ensure install.sh has run successfully, and the menu containers (specifically the API container) have been built and are running.
# They can be started by running ./menu.sh

echo "This will generate a build and echo out the command that's required to install it."
echo "Checkout the 'IOTstack.postman_collection.json' file for all API calls."
echo ""
echo "Services: mosquitto, nodered, influxdb, grafana"
read -n 1 -s -r -p "Press any key to continue"
echo ""
echo ""

API_HOST=localhost:32128

HAS_ERROR="false"

# Generate build
CBRES=$(curl -s \
  -d '{"buildOptions":{"selectedServices":["mosquitto","nodered","influxdb","grafana"],"configurations":{"services":{"nodered":{"devices":["/dev/ttyAMA0:/dev/ttyAMA0","/dev/vcio:/dev/vcio","/dev/gpiomem:/dev/gpiomem"],"addonsList":["node-red-node-pi-gpiod","node-red-contrib-influxdb","node-red-contrib-boolean-logic","node-red-node-rbe","node-red-dashboard"],"loggingEnabled":true,"networks":{"iotstack_nw":true},"networkMode":"unchanged"}},"networks":{},"meta":{}}}}' \
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