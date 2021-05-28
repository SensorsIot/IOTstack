#!/bin/bash

# Minimum Software Versions
REQ_DOCKER_VERSION=18.2.0

# Required to generate and install a ssh key so menu containers can securely execute commands on host
AUTH_KEYS_FILE=~/.ssh/authorized_keys
CONTAINER_KEYS_FILE=./.internal/.ssh/id_rsa
REBOOT_REQ="false"
HAS_ERROR="false"

sys_arch=$(uname -m)

while test $# -gt 0
do
  case "$1" in
      --no-ask) NOASKCONFIRM="true"
          ;;
      --*) echo "bad option $1"
          ;;
  esac
  shift
done

echo "IOTstack Installation"
echo "Running as '$(whoami)' in '$(pwd)'"
if [ "$EUID" -eq "0" ]; then
  echo "Please do not run as root"
  exit
fi

if [ -f "./menu.sh" ]; then
  echo "'./menu.sh' file detected, will not reclone. Is IOTstack already installed in this directory?"
fi

echo "Please enter sudo password if prompted to do so."
echo ""

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

function user_in_group() {
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
  DOCKERREBOOT="false"
  if command_exists docker; then
    echo "Docker already installed" >&1
  else
    echo "Install Docker:" >&1
    echo "curl -fsSL https://get.docker.com | sh" >&1
    curl -fsSL https://get.docker.com | sh
    sudo -E usermod -aG docker $USER
    DOCKERREBOOT="true"
  fi

  if command_exists docker-compose; then
    echo "docker-compose already installed" >&1
  else
    echo "Install docker-compose" >&1
    sudo -E apt install -y docker-compose
    DOCKERREBOOT="true"
  fi

  if [[ "$DOCKERREBOOT" == "true" ]]; then
    REBOOT_REQ="true"
    echo "" >&1
    echo "You should restart your system after IOTstack is installed" >&1
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

function check_ssh_state() {
  echo "" >&1
  echo "Check SSH state" >&1
  printf "Checking Container keys...  " >&1
  if [[ "$(check_container_ssh)" == "false" ]]; then
    HAS_ERROR="true"
    echo " --- Something went wrong with SSH key installation --- " >&1
    echo "SSH keys for containers do not exist. the menu containers will not be able to execute commands on your host." >&1
    echo "To regenerate these keys, run:" >&1
    echo "  bash ./menu.sh --run-env-setup" >&1
  else
    echo "Keys file found." >&1
      printf "Checking Host Authorised keys...  " >&1
      if [[ "$(check_host_ssh_keys)" == "false" ]]; then
        HAS_ERROR="true"
        echo " --- Something went wrong with SSH key installation --- " >&1
        echo "SSH key for menu containers not found in authorized_keys file" >&1
        echo "To regenerate and install keys, run:" >&1
        echo "  bash ./menu.sh --run-env-setup" >&1
      else
        echo "Key found in authorized_keys file." >&1
      fi
  fi
}

function do_group_setup() {
  echo "" >&1
  echo "User group setup" >&1
  GROUPCHANGE="false"
  if [[ ! "$(user_in_group bluetooth)" == "notgroup" ]] && [[ ! "$(user_in_group bluetooth)" == "true" ]]; then
    echo "User is NOT in 'bluetooth' group. Adding:" >&1
    echo "sudo usermod -G bluetooth -a $USER" >&1
    sudo -E usermod -G "bluetooth" -a $USER
    GROUPCHANGE="true"
  else
    echo "User already in bluetooth group" >&1
  fi

  if [ ! "$(user_in_group docker)" == "true" ]; then
    echo "User is NOT in 'docker' group. Adding:" >&1
    echo "sudo usermod -G docker -a $USER" >&1
    sudo -E usermod -G "docker" -a $USER
    GROUPCHANGE="true"
  else
    echo "User already in docker group" >&1
  fi

  if [[ "$GROUPCHANGE" == "true" ]]; then
    REBOOT_REQ="true"
    echo "" >&1
    echo "Rebooting or logging off is advised." >&1
  fi
}

function do_env_setup() {
  echo "" >&1
  echo "Host environment and dependency installation" >&1
  sudo -E apt update
  echo "Installing dependencies: git, wget, unzip, jq, netcat, screen" >&1
  sudo -E apt install git wget unzip jq netcat screen -y
  if [ ! $? -eq 0 ]; then
    HAS_ERROR="true"
    echo "" >&1
    echo "Dependency install failed. Aborting installation" >&1
    exit 1
  fi
}

function do_iotstack_setup() {
  echo "" >&1
  echo "IOTstack setup" >&1
  if [ -f "./menu.sh" ]; then
    echo "'./menu.sh' file detected, will not reclone." >&1
  else
    echo "IOTstack will be cloned into $(pwd)/IOTstack" >&1
    git clone https://github.com/SensorsIot/IOTstack.git

    if [[ $? -eq 0 ]]; then
      echo "IOTstack cloned" >&1
    else
      echo "Error cloning IOTstack" >&1
    fi

    cd IOTstack
    IOTCDRS=$?
    echo "Current Dir: $(pwd)" >&1
    if [[ $IOTCDRS -eq 0 ]]; then
      echo "IOTstack directory found" >&1
    else
      HAS_ERROR="true"
      echo "Could not find IOTstack directory" >&1
      exit 5
    fi

    if [[ -n "$IOTSTACK_INSTALL_BRANCH" ]]; then
      echo "Attempting to switch to install branch: '$IOTSTACK_INSTALL_BRANCH'" >&1
      git checkout $IOTSTACK_INSTALL_BRANCH
    fi
  fi
}

function generate_container_ssh() {
  cat /dev/null | ssh-keygen -q -N "" -f $CONTAINER_KEYS_FILE
}

function install_ssh_keys() {
  echo "" >&1
  echo "Install SSH Keys" >&1
  touch $AUTH_KEYS_FILE
  if [ -f "$CONTAINER_KEYS_FILE" ]; then
    NEW_KEY="$(cat $CONTAINER_KEYS_FILE.pub)"
    if grep -Fxq "$NEW_KEY" $AUTH_KEYS_FILE ; then
      echo "Key already exists in '$AUTH_KEYS_FILE' Skipping..." >&1
    else
      echo "$NEW_KEY" >> $AUTH_KEYS_FILE
      echo "cat $CONTAINER_KEYS_FILE.pub >> $AUTH_KEYS_FILE" >&1
      echo "Key added." >&1
    fi
  fi
}

function ssh_management() {
  if [[ "$SSH_KEY_INSTALL" == "true" ]]; then
    generate_container_ssh
    install_ssh_keys
    check_ssh_state
  elif [[ "$SSH_KEY_INSTALL" == "false" ]]; then
    echo "Skipping container SSH key install" >&1
  else
    echo "" >&1
    echo "IOTstack runs its menu and API inside docker containers. In order for these containers to be able to execute commands on your host, SSH keys are required to be generated and installed." >&1
    echo "These keys never leave your host and are only consumed by the menu containers. You can set these up yourself later, either manually or by running ./menu.sh --run-env-setup" >&1
    echo "See the documentation in the github for more information." >&1
    echo "In the future, setting the environment variable 'SSH_KEY_INSTALL' to 'true' or 'false' will skip this prompt" >&1
    echo " " >&1
    echo " "
    read -p "Generate and Install the SSH keys? [y/n] " -n 1 -r < /dev/tty
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      generate_container_ssh
      install_ssh_keys
      check_ssh_state
    else
      echo "Skipping container SSH key install" >&1
    fi
  fi
}

# Entry point
do_env_setup
do_iotstack_setup
ssh_management
install_docker
do_group_setup

touch .installed

if [[ "$HAS_ERROR" == "true" ]]; then
  echo ""
  echo "--------"
  echo ""
  echo "An error occured installing IOTstack. Please review the output above."
  echo "If you have just installed the OS, try giving the your system 30 minutes to complete setup and try installing IOTstack again."
  read -n 1 -s -r -p "Press any key to continue"
else
  echo "IOTstack setup completed"
fi

if [[ "$REBOOT_REQ" == "true" ]]; then
  if [[ "$NOASKCONFIRM" == "true" ]]; then
    echo "Rebooting..."
    sudo reboot
  else
    echo ""
    echo "You need to reboot your system to ensure IOTstack runs correctly."
    if (whiptail --title "Reboot Required" --yesno "A restart is required to ensure IOTstack runs correctly.\n\nAfter reboot start IOTstack by running:\n  ./menu.sh\n\nFrom the IOTstack directory:\n  $(pwd)\n\nReboot now?" 20 78); then
      echo "Rebooting..."
      sleep 1
      sudo reboot
    fi
  fi
fi

echo ""
echo "Start IOTstack by running in IOTstack's directory:"
echo "  ./menu.sh"
