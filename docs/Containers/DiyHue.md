# DIY hue
* [website](https://diyhue.org/getting-started/)

## About

diyHue is a utility to contol the lights in your home

## Setup

Before you start diyHue you will need to get your IP and MAC addresses. Run `ip addr` in the terminal

![image](https://user-images.githubusercontent.com/46672225/69816794-c2c24400-1201-11ea-9d97-e8e03b98d9f4.png)

Enter these values into your `.env` file, like this:

``` console
$ cd ~/IOTstack
$ echo "DIYHUE_IP_ADDRESS=192.168.88.88" >>.env
$ echo "DIYHUE_MAC_ADDRESS=dc:a6:32:xx:xx:xx" >>.env
```

The default username and password it `Hue` and `Hue` respectively 

## Usage

The web interface is available on port 8070
