# HDMI-CEC-MQTT-bridge
## References
- [Docker](https://hub.docker.com/r/jonaseck/rpi-cec-mqtt-bridge)
- [Upstream documentation](https://github.com/michaelarnauts/cec-mqtt-bridge/blob/master/README.md)
- [cec-o-matic](http://www.cec-o-matic.com/)

## Configuration
Amend the MQTT settings in the docker-compose.yml file after building the stack, but before running `docker-compose up -d`. 

(You don't need to change or delete the MQTT_USER and MQTT_PASSWORD if you are not using a username and password with your mqtt broker. Please note that the MQTT_BROKER cannot be "localhost").

If you have already run `docker-compose up -d`, simply run `sudo nano ~/IOTstack/docker-compose.yml`, change the mqtt settings and run `docker-compose up -d` again to recreate the cec-mqtt-bridge.
