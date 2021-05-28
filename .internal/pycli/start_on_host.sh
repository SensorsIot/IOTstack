#!/bin/bash

# This is for starting the script on the host environment. It is primarily used for development and troubleshooting. It is advised to not use it for other purposes.
# npm module 'nodemon' is required for this to run.

source ../meta.sh

API_ADDR=localhost:32128
HOST_CON_API=localhost:32128
cd .internal; cd pycli; nodemon --no-stdin --exec python3 entry.py
