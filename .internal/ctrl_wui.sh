#!/bin/bash

CPWD=$(pwd)

if [[ ! "$(basename $CPWD)" == ".internal" ]]; then
  cd .internal/
fi

source ./meta.sh
DNAME=iostack_wui
FULL_NAME="$DNAME:$VERSION"

RUN_MODE="production"

if [ "$1" == "stop" ]; then
  echo "docker stop \$(docker images -q --format \"{{.Repository}}:{{.Tag}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
  echo "docker stop \$(docker ps -q --format \"{{.Image}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
  echo "docker stop \$(docker ps -q --format \"{{.ID}} {{.Ports}}\" | grep \"$WUI_PORT\" | cut -d ' ' -f1)"
  docker stop $(docker ps -q --format "{{.ID}} {{.Ports}}" | grep "$WUI_PORT" | cut -d ' ' -f1) 2> /dev/null
else
  if [[ $IOTENV == "development" || "$1" == "development" ]]; then
    RUN_MODE="development"
    echo "[Development: '$FULL_NAME'] Stopping container:"
    echo "docker stop \$(docker images -q --format \"{{.Repository}}:{{.Tag}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
    docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null || docker rmi $FULL_NAME --force 2> /dev/null
    echo "docker stop \$(docker ps -q --format \"{{.Image}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)  || docker rmi $FULL_NAME --force 2> /dev/null"
    docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null || docker rmi $FULL_NAME --force 2> /dev/null
    echo "docker stop \$(docker ps -q --format "{{.ID}} {{.Ports}}" | grep $WUI_PORT | cut -d ' ' -f1) 2> /dev/null"
    docker stop $(docker ps -q --format "{{.ID}} {{.Ports}}" | grep "$WUI_PORT" | cut -d ' ' -f1) 2> /dev/null
    echo ""
    echo "Rebuilding container:"
    echo "docker build --no-cache -t $FULL_NAME -f ./wui/wui.dev.Dockerfile ."
    docker pull node:14 # Docker occasionally fails to pull image when building when it is not cached.
    docker build --no-cache -t $FULL_NAME -f ./wui/wui.dev.Dockerfile .
  else
    if [[ "$(docker images -q $FULL_NAME 2> /dev/null)" == "" ]]; then
      echo "React WUI production build not found."
      echo "Building '$FULL_NAME'"
      echo "This may take 5 to 10 minutes."
      docker pull node:14 # Docker occasionally fails to pull image when building when it is not cached.
      echo ""
      docker build --quiet -t $FULL_NAME -f ./wui.Dockerfile .
      DBR=$?
      if [[ ! $DBR -eq 0 ]]; then
        echo ""
        echo "-----------------------------------"
        echo ""
        echo "Docker build encountered an error when building '$FULL_NAME'."
        echo "If this error is stating that there's no permission to read a file or directory then change the permissions or owner to one that the '$HOSTUSER' user can read."
        echo ""
        echo "Examples:"
        echo "  Update owner:"
        echo "    sudo chown -R $HOSTUSER $IOTSTACKPWD/.internal/"
        echo ""
        echo "  Update permissions:"
        echo "    sudo chmod -R 755 $IOTSTACKPWD/.internal/"
        echo ""
        echo "  Checking owner and permissions:"
        echo "    ls -ahl $IOTSTACKPWD/.internal/"
        echo ""
        echo "-----------------------------------"
        echo ""
        sleep 1
        exit 2
      fi
    else
      echo "Build for '$FULL_NAME' already exists. Skipping..."
    fi
  fi

  if ! docker ps --format '{{.Image}}' | grep -w $FULL_NAME &> /dev/null; then
    if [[ $IOTENV == "development" || "$1" == "development"  ]]; then
      echo "Starting in development watch mode the IOTstack WUI Server"
      docker run -p $WUI_PORT:$WUI_PORT \
        -e IOTENV="$RUN_MODE" \
        -e PORT=$WUI_PORT \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/wui,target=/usr/iotstack_wui \
        --restart unless-stopped $FULL_NAME
    else
      echo "Starting IOTstack WUI Server"
      docker run -d -p $WUI_PORT:$WUI_PORT -e PORT=$WUI_PORT --restart unless-stopped $FULL_NAME
    fi
  else
    echo "IOTstack WUI Server is running"
  fi

  # docker run -d -p $WUI_PORT:$WUI_PORT $FULL_NAME
  # docker run -p $WUI_PORT:$WUI_PORT -e PORT=$WUI_PORT $FULL_NAME

  # docker run -p $WUI_PORT:$WUI_PORT -it $FULL_NAME /bin/bash
fi

cd $CPWD
