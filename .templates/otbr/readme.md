# OTBR (Open Thread Border Router)

The container will fail to show the WUI until IPv6 is enabled on the RPi. You can do so by running the following commands:
```
$ sudo modprobe ip6_tables
$ sudo modprobe ip6table_filter
```

Save between reboots:
```
$ echo "ip6_tables" | sudo tee -a /etc/modules
$ echo "ip6table_filter" | sudo tee -a /etc/modules
```

Open docker config `sudo nano /etc/docker/daemon.json`:
```
{
  "ipv6": true,
  "fixed-cidr-v6": "2001:db8:1::/64"
}
```

Then:
```
$ sudo systemctl restart docker
```

I have this successfully working with a MakerDiary nrf52840 USB Thread radio node. It requires custom firmware flashed on it.

You can flash the USB card with the `openthread/environment:latest` docker image. You only need to flash the firmware once to the USB radio, it has ran on every device I've tested running OTBR: baremetal, Docker, IOTstack, and Kubernetes (containerd).

Run the following commands in the `openthread/environment` docker instance:
```
$ git clone https://github.com/openthread/ot-nrf528xx.git
$ cd ot-nrf528xx/
$ git submodule update --init
$ ./script/build nrf52840 USB_trans -DOT_BOOTLOADER=USB
```

After this, it depends on the type of nRF52840 you're using. If you are using a MakerDiary, mount it as a drive and drag the UF2 file into it, after converting it to a .hex file, and then a UF2 file:
```
$ arm-none-eabi-objcopy -O ihex build/bin/ot-cli-ftd ot-cli-ftd.hex
$ pip install --pre -U git+https://github.com/makerdiary/uf2utils.git@main
$ uf2conv -f 0xADA52840 -c -b 0x1000 -o build/bin/ot-cli-ftd.uf2 build/bin/ot-cli-ftd
```

Since I run Zigbee and zwave on the same device, I mounted the nRF52840 this way `compose-override.yml`:
```
services:
  otbr:
    volumes:
    - ./volumes/otbr/data:/var/lib/otbr
    - ./volumes/otbr/wpantund:/etc/wpantund.conf
    - ./volumes/otbr/config:/etc/otbr
    - /dev/serial/by-id/usb-Nordic_Semiconductor_nRF528xx_OpenThread_Device_XXXXXXXXXXX-if00:/dev/ttyACM0
```

Note the device serial number has been replaced with Xs. You can find yours by running:
```
ls -ahl /dev
```

You need to have flashed it with the OTBR firmware before running this command, as it will have a different name if running the stock firmware.

Links:
* https://openthread.io/guides/border-router/docker (OTBR running in docker)
* https://openthread.io/guides/build/index.md (Radio/Node/RCP binary compile and firmware flashing)
* https://openthread.io/guides/border-router/raspberry-pi (Running on RPi 3+ bare-metal)