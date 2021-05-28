#!/bin/bash

CPWD=$(pwd)

if [[ ! "$(basename $CPWD)" == ".internal" ]]; then
  cd .internal/
fi

if [ "$1" == "stop" ]; then
  bash ./ctrl_api.sh stop
  bash ./ctrl_wui.sh stop
  bash ./ctrl_pycli.sh stop
else
  bash ./ctrl_api.sh
  bash ./ctrl_wui.sh
  bash ./ctrl_pycli.sh
fi

cd $CPWD
