#!/bin/bash

# Minimum Software Versions
REQ_DOCKER_VERSION=18.2.0

# Required to generate and install a ssh key so menu containers can securely execute commands on host
AUTH_KEYS_FILE=~/.ssh/authorized_keys
CONTAINER_KEYS_FILE=./.internal/.ssh/id_rsa

function command_exists() {
  command -v "$@" > /dev/null 2>&1
}

function minimum_version_check() {
  # Usage: minimum_version_check required_version current_major current_minor current_build
  # Example: minimum_version_check "1.2.3" 1 2 3
  REQ_MIN_VERSION_MAJOR=$(echo "$1"| cut -d' ' -f 2 | cut -d'.' -f 1)
  REQ_MIN_VERSION_MINOR=$(echo "$1"| cut -d' ' -f 2 | cut -d'.' -f 2)
  REQ_MIN_VERSION_BUILD=$(echo "$1"| cut -d' ' -f 2 | cut -d'.' -f 3)

  CURR_VERSION_MAJOR=$2
  CURR_VERSION_MINOR=$3
  CURR_VERSION_BUILD=$4
  
  VERSION_GOOD="Unknown"

  if [ -z "$CURR_VERSION_MAJOR" ]; then
    echo "$VERSION_GOOD"
    return 1
  fi

  if [ -z "$CURR_VERSION_MINOR" ]; then
    echo "$VERSION_GOOD"
    return 1
  fi

  if [ -z "$CURR_VERSION_BUILD" ]; then
    echo "$VERSION_GOOD"
    return 1
  fi

  if [ "${CURR_VERSION_MAJOR}" -ge $REQ_MIN_VERSION_MAJOR ]; then
    VERSION_GOOD="true"
    echo "$VERSION_GOOD"
    return 0
  else
    VERSION_GOOD="false"
  fi

  if [ "${CURR_VERSION_MAJOR}" -ge $REQ_MIN_VERSION_MAJOR ] && \
    [ "${CURR_VERSION_MINOR}" -ge $REQ_MIN_VERSION_MINOR ]; then
    VERSION_GOOD="true"
    echo "$VERSION_GOOD"
    return 0
  else
    VERSION_GOOD="false"
  fi

  if [ "${CURR_VERSION_MAJOR}" -ge $REQ_MIN_VERSION_MAJOR ] && \
    [ "${CURR_VERSION_MINOR}" -ge $REQ_MIN_VERSION_MINOR ] && \
    [ "${CURR_VERSION_BUILD}" -ge $REQ_MIN_VERSION_BUILD ]; then
    VERSION_GOOD="true"
    echo "$VERSION_GOOD"
    return 0
  else
    VERSION_GOOD="false"
  fi

  echo "$VERSION_GOOD"
}

function user_in_group()
{
  if grep -q $1 /etc/group ; then
    if id -nGz "$USER" | grep -qzxF "$1";  then
        echo "true"
    else
        echo "false"
    fi
  else
    echo "notgroup"
  fi
}

function install_docker() {
  if command_exists docker; then
    echo "Docker already installed" >&1
  else
    echo "Install Docker" >&1
    curl -fsSL https://get.docker.com | sh
    sudo -E usermod -aG docker $USER
  fi

  if command_exists docker-compose; then
    echo "docker-compose already installed" >&1
  else
    echo "Install docker-compose" >&1
    sudo -E apt install -y docker-compose
  fi

  echo "" >&1
  echo "You should now restart your system" >&1
}

function docker_check() {
  DOCKER_GOOD="fail"

  if command_exists docker; then
    echo "Docker is installed" >&1
    DOCKER_VERSION=$(docker version -f "{{.Server.Version}}" 2>&1)

    if [[ "$DOCKER_VERSION" == *"Cannot connect to the Docker daemon"* ]]; then
      echo "Error getting docker version. Error when connecting to docker daemon. Check that docker is running." >&1
      if (whiptail --title "Docker and Docker-Compose" --yesno "Error getting docker version. Error when connecting to docker daemon. Check that docker is running.\n\nCommand: docker version -f \"{{.Server.Version}}\"\n\nExit?" 20 78 >&1); then
        exit 1
      fi
    elif [[ "$DOCKER_VERSION" == *" permission denied"* ]]; then
      echo "Error getting docker version. Received permission denied error. Try running with: ./menu.sh --run-env-setup" >&1
      if (whiptail --title "Docker and Docker-Compose" --yesno "Error getting docker version. Received permission denied error.\n\nTry rerunning the menu with: ./menu.sh --run-env-setup\n\nExit?" 20 78 >&1); then
        exit 1
      fi
    fi

    if [[ -z "$DOCKER_VERSION" ]]; then
      echo "Error getting docker version. Error when running docker command. Check that docker is installed correctly." >&1
    fi
    
    DOCKER_VERSION_MAJOR=$(echo "$DOCKER_VERSION"| cut -d'.' -f 1)
    DOCKER_VERSION_MINOR=$(echo "$DOCKER_VERSION"| cut -d'.' -f 2)

    DOCKER_VERSION_BUILD=$(echo "$DOCKER_VERSION"| cut -d'.' -f 3)
    DOCKER_VERSION_BUILD=$(echo "$DOCKER_VERSION_BUILD"| cut -f1 -d"-")

    if [[ "$(minimum_version_check $REQ_DOCKER_VERSION $DOCKER_VERSION_MAJOR $DOCKER_VERSION_MINOR $DOCKER_VERSION_BUILD )" == "true" ]]; then
      [ -f .ignore_docker_outofdate ] && rm .ignore_docker_outofdate
      DOCKER_GOOD="true"
      echo "Docker version $DOCKER_VERSION >= $REQ_DOCKER_VERSION. Docker is good to go." >&1
    else
      DOCKER_GOOD="outdated"
      if [ ! -f .ignore_docker_outofdate ]; then
        if (whiptail --title "Docker and Docker-Compose Version Issue" --yesno "Docker version is currently $DOCKER_VERSION which is less than $REQ_DOCKER_VERSION consider upgrading or you may experience issues. You will not be prompted again. You can manually upgrade by typing:\n  sudo apt upgrade docker docker-compose\n\nAttempt to upgrade now?" 20 78 >&1); then
          update_docker
        else
          touch .ignore_docker_outofdate
        fi
      fi
    fi
  fi

  if command_exists docker-compose; then
    COMPOSE_GOOD="pass"
    echo "docker-compose is installed" >&1
  fi

  echo $DOCKER_GOOD
}

function group_setup() {
  echo "Setting up groups:"  >&1
  if [[ ! "$(user_in_group bluetooth)" == "notgroup" ]] && [[ ! "$(user_in_group bluetooth)" == "true" ]]; then
    echo "User is NOT in 'bluetooth' group. Adding:" >&1
    echo "sudo usermod -G bluetooth -a $USER" >&1
    sudo -E usermod -G "bluetooth" -a $USER
  fi

  if [ ! "$(user_in_group docker)" == "true" ]; then
    echo "User is NOT in 'docker' group. Adding:" >&1
    echo "sudo usermod -G docker -a $USER" >&1
    sudo -E usermod -G "docker" -a $USER
  fi

  echo "" >&1
  echo "Rebooting or logging off is advised." >&1
}

function group_check() {
  echo "Setting up groups:" >&1
  NEED_GROUP_SETUP="false"
  if [[ ! "$(user_in_group bluetooth)" == "notgroup" ]] && [[ ! "$(user_in_group bluetooth)" == "true" ]]; then
    NEED_GROUP_SETUP="fail"
    echo "User is NOT in 'bluetooth' group." >&1
  fi

  if [ ! "$(user_in_group docker)" == "true" ]; then
    NEED_GROUP_SETUP="fail"
    echo "User is NOT in 'docker' group." >&1
  fi
  
  echo $NEED_GROUP_SETUP
}

function do_env_setup() {
  sudo -E apt-get install git wget unzip -y
}

function generate_container_ssh() {
  cat /dev/null | ssh-keygen -q -N "" -f $CONTAINER_KEYS_FILE > /dev/null
}

function install_ssh_keys() {
  touch $AUTH_KEYS_FILE
  if [ -f "$CONTAINER_KEYS_FILE" ]; then
    NEW_KEY="$(cat $CONTAINER_KEYS_FILE.pub)"
    if grep -Fxq "$NEW_KEY" $AUTH_KEYS_FILE ; then
      echo "Key already exists in '$AUTH_KEYS_FILE' Skipping..." >&1
    else
      echo "$NEW_KEY" >> $AUTH_KEYS_FILE
      echo "'$NEW_KEY' >> $AUTH_KEYS_FILE" >&1
      echo "Key added." >&1
    fi
  else
    echo "Something went wrong. Couldn't access container keys file '$CONTAINER_KEYS_FILE'" >&1
  fi
}

function check_container_ssh() {
  KEYS_EXIST="false"
  if [[ -f "$CONTAINER_KEYS_FILE" && -f "$CONTAINER_KEYS_FILE.pub" ]]; then
    KEYS_EXIST="true"
  fi

  echo $KEYS_EXIST
}

function check_host_ssh_keys() {
  KEY_EXISTS="false"
  grep -f "$CONTAINER_KEYS_FILE.pub" $AUTH_KEYS_FILE
  GRES=$?
  if [[ $GRES -eq 0 ]]; then
    KEY_EXISTS="true"
  fi

  echo $KEY_EXISTS
}

function do_iotstack_setup() {
  git clone https://github.com/SensorsIot/IOTstack.git
  cd IOTstack

  if [ $? -eq 0 ]; then
    echo "IOTstack cloned" >&1
  else
    echo "Could not find IOTstack directory" >&1
    exit 5
  fi
}
