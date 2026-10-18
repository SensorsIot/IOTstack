# RTL_433 Docker

Requirements, you will need to have a SDR dongle for you to be able to use RTL. This implementation includes RTL-SDR + SoapySDR.

Make sure you can see your receiver by running `lsusb`

``` console
$ lsusb
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 004: ID 0bda:2838 Realtek Semiconductor Corp. RTL2838 DVB-T
Bus 001 Device 002: ID 2109:3431 VIA Labs, Inc. Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

The menu installs both a `service.yml` and an example `override.yml`. The latter is intended to be [customised](../Basic_setup/Custom.md#custom-service) to your requirements. See:

* [GitHub](https://github.com/hertzg/rtl_433_docker) (has docker compose example)
* [rtl_433 documentation](https://triq.org/rtl_433/) (no docker information)

The example `override.yml` (derived from the GitHub example) sends all detected messages over MQTT to a local Mosquitto instance). Other than that, you are on your own to figure out the parameters you need.

Currently, the container does not filter any packets, you will need to do this in Node-RED. The container publishes to topics with the following syntax:

```
rtl_433/«containerID»/availability
```

Because `«containerID»` changes each time the container starts, you will have to subscribe using a wildcard, as in:

```
rtl_433/+/availability
```

