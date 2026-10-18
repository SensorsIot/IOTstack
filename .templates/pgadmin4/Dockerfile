# reference argument - omitted defaults to latest
ARG DOCKERHUB_TAG=latest

# Download base image
FROM dpage/pgadmin4:${DOCKERHUB_TAG}

# needed for modifications
USER root

# Add support tool
RUN apk update && apk add --no-cache rsync

# make a backup copy of /pgadmin4
RUN cp -a /pgadmin4 /pgadmin4-cache

# add a custom entry-point script
COPY iotstack-entrypoint.sh /iotstack-entrypoint.sh
RUN chmod 755 /iotstack-entrypoint.sh

# starting point - self-repair (if ever needed) and launch
ENTRYPOINT ["/iotstack-entrypoint.sh"]

# Do NOT restore USER 5050! /iotstack-entrypoint.sh depends on root
# privileges to be able to repair /pgadmin4 and enforce correct
# ownership throughout, after which /entrypoint.sh downgrades
# privileges at runtime anyway.

# EOF
