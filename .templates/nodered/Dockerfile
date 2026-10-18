# reference argument - omitted defaults to latest
ARG DOCKERHUB_TAG=latest

# Download base image
FROM nodered/node-red:${DOCKERHUB_TAG}

# reference argument - omitted defaults to null
ARG EXTRA_PACKAGES

# default user is node-red - need to be root to install packages
USER root

# install packages
RUN apk add --no-cache eudev-dev ${EXTRA_PACKAGES}

# switch back to default user
USER node-red

# install add-on nodes
ENV ADDON_NODES="/usr/src/node-red/installed-addon-nodes.txt"
COPY installed-addon-nodes.txt "${ADDON_NODES}"

# strip lines starting with # or ;, passing the remainder to npm install
# This MIGHT be an empty list but npm install does not seem to care
RUN npm install $(sed -e '/^[#;]/d' "${ADDON_NODES}")

# recommended
RUN npm rebuild
