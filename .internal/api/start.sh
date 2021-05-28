#!/bin/bash

echo "API bootstrap script startup"
echo "IOTstack Template Path: "
echo "IOTstack Template Services: $(ls /usr/iotstack_api/templates/services/ | wc -l)"
echo "IOTstack Template Networks: $(ls /usr/iotstack_api/templates/networks/ | wc -l)"
echo "IOTstack Template Scripts: $(ls /usr/iotstack_api/templates/scripts/ | wc -l)"

if [[ $IOTENV == "development" || "$1" = "development" ]]; then
  echo "Starting API in development mode"
  npm run dev
else
  npm start
fi
