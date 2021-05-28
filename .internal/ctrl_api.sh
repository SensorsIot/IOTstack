#!/bin/bash

CPWD=$(pwd)

if [[ ! "$(basename $CPWD)" == ".internal" ]]; then
  cd .internal/
fi

source ./meta.sh
DNAME=iostack_api
FULL_NAME="$DNAME:$VERSION"

RUN_MODE="production"

if [ "$1" == "stop" ]; then
  echo "docker stop \$(docker images -q --format \"{{.Repository}}:{{.Tag}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
  echo "docker stop \$(docker ps -q --format \"{{.Image}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
  echo "docker stop \$(docker ps -q --format \"{{.ID}} {{.Ports}}\" | grep \"$API_PORT\" | cut -d ' ' -f1)"
  docker stop $(docker ps -q --format "{{.ID}} {{.Ports}}" | grep "$API_PORT" | cut -d ' ' -f1) 2> /dev/null
else
  if [[ $IOTENV == "development" || "$1" == "development" ]]; then
    RUN_MODE="development"
    echo "[Development: '$FULL_NAME'] Stopping container:"
    echo "docker stop \$(docker images -q --format \"{{.Repository}}:{{.Tag}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
    docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2)
    echo "docker stop \$(docker ps -q --format \"{{.Image}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
    docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2)
    echo "docker stop \$(docker ps -q --format \"{{.ID}} {{.Ports}}\" | grep $API_PORT | cut -d ' ' -f1)"
    docker stop $(docker ps -q --format "{{.ID}} {{.Ports}}" | grep "$API_PORT" | cut -d ' ' -f1)
    echo "docker rmi \$FULL_NAME --force"
    docker rmi $FULL_NAME --force
    echo ""
    echo "Rebuilding container:"
    echo "docker build --no-cache -t $FULL_NAME -f ./api.Dockerfile ."
    docker pull node:14 # Docker occasionally fails to pull image when building when it is not cached.
    docker build --no-cache -t $FULL_NAME -f ./api.Dockerfile .
  else
    if [[ "$(docker images -q $FULL_NAME 2> /dev/null)" == "" ]]; then
      echo "Building '$FULL_NAME'"
      echo "This may take 5 to 10 minutes."
      docker pull node:14 # Docker occasionally fails to pull image when building when it is not cached.
      echo ""
      docker build --quiet -t $FULL_NAME -f ./api.Dockerfile .
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

  CORS_LIST=""
  for sepspace in "$(hostname --all-ip-addresses)"; do
    sepspace="$(echo $sepspace | xargs)"
    CORS_LIST="$CORS_LIST $sepspace:$API_PORT "
  done

  if ! docker ps --format '{{.Image}}' | grep -w $FULL_NAME &> /dev/null; then
    if [[ $IOTENV == "development" || "$1" == "development"  ]]; then
      echo "Starting in development watch mode the IOTstack API Server on port: $API_PORT"
      docker run \
        -p $API_PORT:$API_PORT \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/templates,target=/usr/iotstack_api/templates,readonly \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh/id_rsa,target=/root/.ssh/id_rsa,readonly \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/api,target=/usr/iotstack_api \
        --add-host=host.docker.internal:host-gateway \
        -e IOTENV="$RUN_MODE" \
        -e API_PORT="$API_PORT" \
        -e WUI_PORT=$WUI_PORT \
        -e API_INTERFACE="$API_INTERFACE" \
        -e HOSTUSER="$HOSTUSER" \
        -e IOTSTACKPWD="$IOTSTACKPWD" \
        -e CORS="$CORS_LIST" \
        -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
        -e HOSTSSH_PORT="$HOSTSSH_PORT" \
        --restart unless-stopped \
        $FULL_NAME
        
        # --net=host \
        # -p $API_PORT:$API_PORT \
    else
      echo "Starting IOTstack API Server on port: $API_PORT"
      docker run -d \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/templates,target=/usr/iotstack_api/templates,readonly \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds \
        --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh/id_rsa,target=/root/.ssh/id_rsa,readonly \
        --net=host \
        --add-host=host.docker.internal:host-gateway \
        -e IOTENV="$RUN_MODE" \
        -e API_PORT="$API_PORT" \
        -e API_INTERFACE="$API_INTERFACE" \
        -e HOSTUSER="$HOSTUSER" \
        -e IOTSTACKPWD="$IOTSTACKPWD" \
        -e CORS="$CORS_LIST" \
        -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
        -e HOSTSSH_PORT="$HOSTSSH_PORT" \
        --restart unless-stopped \
        $FULL_NAME

      # docker run -p $API_PORT:$API_PORT \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/templates,target=/usr/iotstack_api/templates,readonly \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds,readonly \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh/id_rsa,target=/root/.ssh/id_rsa,readonly \
      #   -e API_PORT="$API_PORT" \
      #   -e API_INTERFACE="$API_INTERFACE" \
      #   -e cors="yourLanIpHere:$WUI_PORT" \
      #   -e HOSTUSER="$HOSTUSER" \
      #   -e IOTSTACKPWD="$IOTSTACKPWD" \
      #   -e CORS="$(CORS_LIST)" \
      #   -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
      #   -e HOSTSSH_PORT="$HOSTSSH_PORT" \
      #   --restart unless-stopped \
      #   $FULL_NAME

      # docker run -p $API_PORT:$API_PORT \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/templates,target=/usr/iotstack_api/templates,readonly \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds,readonly \
      #   --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh/id_rsa,target=/root/.ssh/id_rsa,readonly \
      #   -e API_PORT="$API_PORT" \
      #   -e API_INTERFACE="$API_INTERFACE" \
      #   -e HOSTUSER="$HOSTUSER" \
      #   -e IOTSTACKPWD="$IOTSTACKPWD" \
      #   -e CORS="$(CORS_LIST)" \
      #   -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
      #   -e HOSTSSH_PORT="$HOSTSSH_PORT" \
      #   --restart unless-stopped \
      #   -it $FULL_NAME /bin/bash
    fi
  else
    echo "IOTstack API Server is running. Check port: $API_PORT or run 'docker ps'"
  fi
fi

cd $CPWD
