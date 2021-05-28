# Download base image
FROM eclipse-mosquitto:latest

# Add support tools
RUN apk update && apk add --no-cache rsync tzdata

# where IOTstack template files are stored
ENV MOSQUITTO_IOTSTACK_DEFAULTS="/iotstack_defaults"

# copy template files to image
COPY --chown=mosquitto:mosquitto . /${MOSQUITTO_IOTSTACK_DEFAULTS}

# replace the docker entry-point script
ENV IOTSTACK_ENTRY_POINT="docker-entrypoint.sh"
COPY ${IOTSTACK_ENTRY_POINT} /${IOTSTACK_ENTRY_POINT}
RUN chmod 755 /${IOTSTACK_ENTRY_POINT}
ENV IOTSTACK_ENTRY_POINT=

# IOTstack also declares these paths
VOLUME ["/mosquitto/config", "/mosquitto/pwfile"]

# EOF
