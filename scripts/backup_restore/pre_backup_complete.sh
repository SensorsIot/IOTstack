#!/bin/bash

# This script runs any prebackup commands you may need

#docker-compose down
docker stack rm iotstack

if [ -f "./pre_backup.sh" ]; then
  echo "./pre_backup.sh file found, executing:"
  bash ./pre_backup.sh
fi
