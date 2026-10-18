# Homebridge

## References 

* [GitHub home](https://github.com/oznu/docker-homebridge)
* [Configuration Guide](https://github.com/oznu/docker-homebridge/wiki/Homebridge-on-Raspberry-Pi)
* [DockerHub](https://hub.docker.com/r/oznu/homebridge)

## Configuration

Homebridge documentation has a comprehensive [configuration guide](https://github.com/oznu/docker-homebridge/wiki/Homebridge-on-Raspberry-Pi) which you are encouraged to read.

Homebridge is configured using environment variables. We recommend using an [override file](../Basic_setup/Custom.md#custom-service) for this purpose:

```
~/IOTstack/services/homebridge/override.yml
```

Once you have created or made any changes to the override file, implement the changes like this:

``` console
$ cd ~/IOTstack
$ ./iotstack_menu build
$ docker-compose up -d homebridge
```

### Web Interface

By default, the web UI for Homebridge can be found on `"your_ip":8581`. You can change the port by adjusting the environment variable. For example, to use port 8582:


``` yaml
homebridge:
  environment:
    HOMEBRIDGE_CONFIG_UI_PORT: 8582
```

After you have implemented that change (as above), the UI will be reachable on `"your_ip":8582`

### Enabling "avahi"

"avahi", "multicast DNS", "Rendezvous", "Bonjour" and "ZeroConf" are synonyms.

Current Homebridge images disable avahi services by default. The Homebridge container runs in "host mode" which means it can participate in multicast traffic flows. If you have a plugin that requires avahi, it can enabled by setting the environment variable:

``` yaml
homebridge:
  environment:
    ENABLE_AVAHI: 1
```

