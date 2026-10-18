# deCONZ

## References
- [Docker](https://hub.docker.com/r/marthoc/deconz)
- [Website](https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/README.md)

## Setup

The service definition shipped with IOTstack contains the following lines:

``` yaml
devices:
  - "${DECONZ_DEVICE_PATH:?eg echo DECONZ_DEVICE_PATH=/dev/ttyUSB0 >>~/IOTstack/.env}:/dev/ttyUSB0"
```

The second line decomposes about the colon separator like this:

* External device: `${DECONZ_DEVICE_PATH:?eg echo DECONZ_DEVICE_PATH=/dev/ttyUSB0 >>~/IOTstack/.env}`
* Internal device: `/dev/ttyUSB0`

In words, the external device is interpreted like this:

* If the environment variable `DECONZ_DEVICE_PATH` is defined in `~/IOTstack/.env` then use that value. For example, if `~/IOTstack/.env` contains:

	```
	DECONZ_DEVICE_PATH=/dev/ttyUSB0
	```
	
	then the whole clause is interpreted as:
	
	``` yaml
	devices:
	  - "/dev/ttyUSB0:/dev/ttyUSB0"
	```

* Otherwise, display a long-winded and not particularly informative message which will have this buried in the middle:

	```
	eg echo DECONZ_DEVICE_PATH=/dev/ttyUSB0 >>~/IOTstack/.env
	```
	
	That's a hint telling you that `DECONZ_DEVICE_PATH` is not defined in `~/IOTstack/.env` and that you should define it by running the command:
	
	``` console
	$ echo DECONZ_DEVICE_PATH=/dev/ttyUSB0 >>~/IOTstack/.env
	```
	
	That command assumes your Conbee/Conbee II/RaspBee attaches to your host as `/dev/ttyUSB0`. If your adapter attaches as a different device, substitute accordingly.

Note that the right hand side (the internal device path) is fixed. It doesn't matter how your Conbee/Conbee II/RaspBee is attached to the host, the **container** will always treat it as being `/dev/ttyUSB0`.

If your Conbee/Conbee II/RaspBee adapter attaches as a different device, you can do any of the following:

1. Edit `~/IOTstack/.env`; or
	
2. Configure the deconz service from the command line by running:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh configure deconz
	```
	
3. Configure deconz service from the menu by running:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh
	```
	Then choose:
	
	* Services
	* deconz
	* Configure
	
There is no difference in the two approaches. All write into the `.env` file.

Whenever you change devices, you need to tell the container to take notice:

``` console
$ cd ~/IOTstack
$ docker compose up -d deconz
```

## Dialout group

Before running `docker compose up -d`, make sure your Linux user is part of the dialout group, which allows the user access to serial devices (i.e. Conbee/Conbee II/RaspBee). If you are not certain, simply add your user to the dialout group by running the following command (username "pi" being used as an example):

```console
$ sudo usermod -a -G dialout pi
```

## Troubleshooting

Your Conbee/Conbee II/RaspBee gateway must be plugged in when the deCONZ Docker container is being brought up. If your gateway is not detected, or no lights can be paired, try moving the device to another usb port. A reboot may help too.

Use a 0.5-1m usb extension cable with ConBee (II) to avoid wifi and bluetooth noise/interference from your Raspberry Pi (recommended by the manufacturer and often the solution to poor performance).

## Accessing the Phoscon UI
The Phoscon UI is available using port 8090 (http://your.local.ip.address:8090/)

## Viewing the deCONZ Zigbee mesh
The Zigbee mesh can be viewed using VNC on port 5901. The default VNC password is "changeme".

## Connecting deCONZ and Node-RED
Install [node-red-contrib-deconz](https://flows.nodered.org/node/node-red-contrib-deconz) via the "Manage palette" menu in Node-RED (if not already installed) and follow these 2 simple steps (also shown in the video below):

Step 1: In the Phoscon UI, Go to Settings > Gateway > Advanced and click "Authenticate app".

Step 2: In Node-RED, open a deCONZ node, select "Add new deonz-server", insert your ip adress and port 8090 and click "Get settings".  Click "Add", "Done" and "Deploy". Your device list will not be updated before deploying.


![installing deCONZ](https://github.com/DIYtechie/resources/blob/master/images/Setup%20deCONZ%20in%20Node-RED.gif?raw=true)
