# Customisation

## References

* [Merging compose files](https://docs.docker.com/reference/compose-file/merge/)
* [Merging multiple compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)

## IOTstack customisation points

The menu supports a number of customisation points. It is up to you to decide whether to edit an *override* file or its corresponding *primary* file. The pros and cons of using *override* files are:

1. If you stick to *override* files then you are less likely to need to re-apply your customisations if the corresponding tracked file changes on GitHub. It will *usually* be safe to let the menu both "Renovate" and "Upgrade" in situ.

2. The override mechanism is highly effective for adding new settings or replacing existing settings, but slightly more problematic if your goal is to delete an existing setting.

3. You will usually want to preview the effect of your override files by running:

	``` console
	$ ./iotstack-menu.sh build
	$ docker compose config { «service»... }
	```

	The biggest "issue" with the `config` verb is that it re-orders everything and, where a clause can be expressed in either compact or expanded form, always shows the expanded form. It can take some getting used to.

	Note:

	* [IOTstackAliases](https://github.com/Paraphraser/IOTstackAliases) has a `CONFIG` alias for this. 

### structural { #custom-structure }

The structural files are:

```
~/IOTstack/services/
├── docker-compose-header.yml
├── docker-compose-trailer.yml
├── docker-compose.override-header.yml
└── docker-compose.override-trailer.yml
```

You can customise any of those files but, again, the recommendation is to aim for the override files.

#### example

`docker-compose-header.yml` defines two internal bridged networks (`default` and `database`):

``` yaml
---

networks:

  default:
    driver: bridge
    ipam:
      driver: default

  database:
    driver: bridge
    internal: true
    ipam:
      driver: default
```

The above structure leaves the choice of IPv4 subnet ranges up to *Docker*. Suppose you want to use specific subnets. You can edit `docker-compose.override-header.yml` like this:

``` yaml
networks:

  default:
    ipam:
      config:
        - subnet: 172.30.0.0/22

  database:
    ipam:
      config:
        - subnet: 172.30.4.0/22
```

Notice how you have to provide *Docker* with sufficient "path context", such as:

```
networks.default.ipam
```

after which you can include the `config` clause. You do not, however, have to repeat either `driver` clause.

### services { #custom-service }

When you ask the menu to install a service, the result is:

1. A sub-directory named for the service is created in `~/IOTstack/services`; and
2. The service's sub-directory always contains `service.yml` and *may* contain other files.

For example, if you install InfluxDB, you can expect to see the following:

```
~/IOTstack/services/
└── influxdb
    └── service.yml
```

You can:

* customise `service.yml`; or
* create an `override.yml` file alongside `service.yml` to hold your customisations:

	```
	~/IOTstack/services/
	└── influxdb
	    ├── override.yml
	    └── service.yml
	```

* do both.

See the [build process](../Developers/BuildStack-Services.md#build-process) for an explanation of how these files are assembled to create your stack.

#### example

At the time of writing, the first few lines of the `influxdb` service definition look like this:

``` yaml
influxdb:
  container_name: influxdb
  image: "influxdb:1.11"
  restart: unless-stopped
  ...
```

InfluxDB is pinned to version 1.11 because the good folks at InfluxData have never provided a general tag which says "get me the latest release of version 1".

!!! check "Don't pull InfluxDB 2 by mistake"
    If you use the `latest` tag then you will get version 2 and everything will turn to custard.

Suppose you become aware that version 1.12 has been released (which it has) and you decide you want to upgrade. You can either edit the `service.yml` or you can create an `override.yml` with the following content:

``` yaml
influxdb:
  image: "influxdb:1.12"
```

To rebuild your stack and check your work:

``` console
$ ./iotstack-menu.sh build
$ docker compose config influxdb | grep image
    image: influxdb:1.12
```

That last line confirms that v1.12 will be instantiated when you start the container by running:

``` console
$ docker compose up -d influxdb
```

### environment variables { #env-vars }

Historically, "old" menu used environment *files* where this was the typical pattern:

``` yaml
env_file:
  - ./services/«service»/«service».env
```

New menu mostly adopted inline variables in the service definition, expressed using "hyphen-style" syntax:

``` yaml
environment:
  - TZ=${TZ:-Etc/UTC}
```

Over time, "old" menu mostly migrated to this same syntax. With the advent of `iotstack-menu.sh`, a new standard applies. Technically, it's called "yaml mappings" syntax but I'll call it "colon-style" syntax:

``` yaml
environment:
  TZ: ${TZ:-Etc/UTC}
```

The reason why "colon-style" syntax has been adopted as a universal standard for IOTstack service definitions is because it is necessary if you want the override mechanism to work properly.

It's important to realise that **both** `service.yml` **and** `override.yml` **must** use "colon-style" syntax. You **can't** mix and match.

#### reference service definition

Assume a service definition contains the following:

``` yaml
example:
  container_name: example
  image: example/example
  restart: unless-stopped
  ports:
    - "9987:9987"
  environment:
    TZ: ${TZ:-Etc/UTC}
    DEBUG_MODE: true
    MQTT_HOST: mosquitto:1883
  volumes:
    - ./volumes/example/data:/var/lib/data
```

#### adding a new variables

We can infer that `mosquitto:1883` is intended to refer to a Mosquitto broker running in another non-host-mode container on the same machine. Suppose you've enabled authentication on your Mosquitto instance and, from reading *this* container's documentation, you know that you need to define `MQTT_USER` and `MQTT_PASSWORD`.

Using an `override.yml` file:

``` yaml
example:
  environment:
    MQTT_USER: fred
    MQTT_PASSWORD: fred1997
```

#### changing the value of an existing variable

Now suppose you've moved your broker to another host. You need to override the existing value of `MQTT_HOST`. All you do is repeat that key with a different value:

``` yaml
example:
  environment:
    MQTT_USER: fred
    MQTT_PASSWORD: fred1997
    MQTT_HOST: mqtt.home.arpa:1883
```

#### 3. removing an existing variable

You've realised that debug mode is hammering your logs. You've tried changing the value to `false` but that doesn't work. After research, you've realised that the mere presence of `DEBUG_MODE` enables that mode (the value is irrelevant). Now you need to remove that variable. You can use the `!reset null` key for that:

``` yaml
example:
  environment:
    MQTT_USER: fred
    MQTT_PASSWORD: fred1997
    MQTT_HOST: mqtt.home.arpa:1883
    DEBUG_MODE: !reset null
```

#### 4. remove all environment variables

If you need to replace all of the environment variables that are included in a `service.yml`, you can use the `!override` key. Note that you still need at least one environment variable in the list, even if it is a dummy.

``` yaml
example:
  environment: !override
    DUMMY: dummy
```

!!! check "Environment Variables"
    You can pass any environment variables you like into a container. An environment variable will only have any *effect* if a process running within the container actually *supports* that variable.
