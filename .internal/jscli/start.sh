#!/bin/bash

echo "JSCLI bootstrap script startup"

if [[ $IOTENV == "development" || "$1" = "development" ]]; then
  echo "Starting JSCLI in development mode"
  npm run dev
else
  npm start
fi
