#!/bin/bash

# Used for knowing when an update has occured
export VERSION="v0.0.1"

# Used for the interal docker menu instances to know where IOTstack is installed
export IOTSTACKPWD="${IOTSTACK_IOTSTACKPWD:-$(cd .. && pwd)}"

# Used for the interal docker menu instances to know which user to set permissions for, and for SSH connections
export HOSTUSER="${IOTSTACK_HOSTUSER:-$(whoami)}"

# For menu CLI and API containers to connect to
export HOSTSSH_ADDR="${IOTSTACK_HOSTSSH_ADDR:-"host.docker.internal"}"

# SSH port
export HOSTSSH_PORT="${IOTSTACK_HOSTSSH_PORT:-22}"

# For the host to know how to connect to itself (or a remote host)
export HOST_CON_IP="${IOTSTACK_HOST_CON_IP:-"localhost"}"

# API Port
export API_PORT="${IOTSTACK_API_PORT:-32128}"

# WUI Port
export WUI_PORT="${IOTSTACK_WUI_PORT:-32777}"

# Listen interface for API. 0.0.0.0 is all interfaces
export API_INTERFACE="${IOTSTACK_API_INTERFACE:-0.0.0.0}"

# Host and port for the docker CLI to know where the API is running
export PYCLI_CON_API="${IOTSTACK_PYCLI_CON_API:-"$HOSTSSH_ADDR:$API_PORT"}"

# Host and port for the docker CLI to know where the API is running when executing commands via SSH
export PYCLI_HOST_CON_API="${IOTSTACK_HOST_CON_IP:-"$HOST_CON_IP:$API_PORT"}"

# Host and port for the docker CLI to know where the WUI is running
export PYCLI_CON_WUI="${IOTSTACK_PYCLI_CON_WUI:-"$HOST_CON_IP:$WUI_PORT"}"

# If this is set, menu containers will run in developer mode.
# export IOTENV="development"

# If this is set, before install.sh is initially run, the installer will switch to the branch specified here immediately after cloning.
# export IOTSTACK_INSTALL_BRANCH="experimental"
