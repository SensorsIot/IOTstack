#!/bin/bash

CPWD=$(pwd)

if [[ ! "$(basename $CPWD)" == ".internal" ]]; then
  cd .internal/
fi

source ./meta.sh
DNAME=iostack_pycli
FULL_NAME="$DNAME:$VERSION"

RUN_MODE="production"

if [ "$1" == "stop" ]; then
  echo "docker stop \$(docker images -q --format \"{{.Repository}}:{{.Tag}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
  echo "docker stop \$(docker ps -q --format \"{{.Image}} {{.ID}}\" | grep \"$DNAME\" | cut -d ' ' -f2)"
  docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null
else
  if [[ $IOTENV == "development" || "$1" = "development" ]]; then
    RUN_MODE="development"
    echo "[Development: '$FULL_NAME'] Stopping container:"
    echo "docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}}" | grep "$DNAME") || docker rmi $FULL_NAME --force"
    docker stop $(docker images -q --format "{{.Repository}}:{{.Tag}}" | grep "$DNAME") 2> /dev/null || docker rmi $FULL_NAME --force 2> /dev/null
    echo "docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) || docker rmi $FULL_NAME --force 2> /dev/null"
    docker stop $(docker ps -q --format "{{.Image}} {{.ID}}" | grep "$DNAME" | cut -d ' ' -f2) 2> /dev/null || docker rmi $FULL_NAME --force 2> /dev/null
    echo ""
    echo "Rebuilding container:"
    echo "docker build --no-cache -t $FULL_NAME -f ./pycli.Dockerfile ."
    docker pull python:3 # Docker occasionally fails to pull image when building when it is not cached.
    docker build --no-cache -t $FULL_NAME -f ./pycli.Dockerfile .
    echo ""
  else
    if [[ "$(docker images -q $FULL_NAME 2> /dev/null)" == "" ]]; then
      echo "Building '$FULL_NAME'"
      echo "This may take 5 to 10 minutes."
      docker pull python:3 # Docker occasionally fails to pull image when building when it is not cached.
      echo ""
      docker build --quiet -t $FULL_NAME -f ./pycli.Dockerfile .
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
    echo "Starting IOTstack PyCLI instance"

    docker run \
      --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds,readonly \
      --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh/id_rsa,target=/root/.ssh/id_rsa,readonly \
      --net=host \
      --add-host=host.docker.internal:host-gateway \
      -e IOTENV="$RUN_MODE" \
      -e HOSTUSER="$HOSTUSER" \
      -e IOTSTACKPWD="$IOTSTACKPWD" \
      -e API_ADDR="$PYCLI_CON_API" \
      -e HOST_CON_API="$PYCLI_HOST_CON_API" \
      -e WUI_ADDR="$PYCLI_CON_WUI" \
      -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
      -e HOSTSSH_PORT="$HOSTSSH_PORT" \
      --restart no \
       -it $FULL_NAME
    # docker run -d \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh,target=/root/.ssh,readonly \
    #   -e HOSTUSER="$HOSTUSER" \
    #   -e IOTSTACKPWD="$IOTSTACKPWD" \
    #   --restart no \
    #   $FULL_NAME

    # docker run  \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds,readonly \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh,target=/root/.ssh,readonly \
    #   -e cors="yourLanIpHere:32777" \
    #   -e HOSTUSER="$HOSTUSER" \
    #   -e IOTSTACKPWD="$IOTSTACKPWD" \
    #   --restart no \
    #   $FULL_NAME

    # docker run \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/saved_builds,target=/usr/iotstack_api/builds,readonly \
    #   --mount type=bind,source="$IOTSTACKPWD"/.internal/.ssh,target=/root/.ssh,readonly \
    #   -e IOTENV="$RUN_MODE" \
    #   -e HOSTUSER="$HOSTUSER" \
    #   -e IOTSTACKPWD="$IOTSTACKPWD" \
    #   -e API_ADDR="$PYCLI_CON_API" \
    #   -e WUI_ADDR="$PYCLI_CON_WUI" \
    #   -e HOSTSSH_ADDR="$HOSTSSH_ADDR" \
    #   -e HOSTSSH_PORT="$HOSTSSH_PORT" \
    #   --restart no \
    #   -it $FULL_NAME /bin/bash
  else
    echo "IOTstack CLI is running. Check with 'docker ps'."
  fi
fi

cd $CPWD
