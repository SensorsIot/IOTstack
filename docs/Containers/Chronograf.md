# Chronograf
 
## References

- [*influxdata Chronograf* documentation](https://docs.influxdata.com/chronograf/)
- [*GitHub*: influxdata/influxdata-docker/chronograf](https://github.com/influxdata/influxdata-docker/tree/master/chronograf)
- [*DockerHub*: influxdata Chronograf](https://hub.docker.com/_/chronograf)

## InfluxDB and Kapacitor integration

The service definition provided with IOTstack assumes dependencies on both InfluxDB and Kapacitor.

## Upgrading Chronograf

You can update the container via:

``` console
$ cd ~/IOTstack
$ docker compose pull
$ docker compose up -d
$ docker system prune -f
```

In words:

* `docker compose pull` downloads any newer images;
* `docker compose up -d` causes any newly-downloaded images to be instantiated as containers (replacing the old containers); and
* the `prune` gets rid of the outdated images.

### Chronograf version pinning

If you need to pin to a particular version:

1. Set your working directory:

	``` console
	$ cd ~/IOTstack
	```

2. Use your favourite text editor to open/create an [override file](../Basic_setup/Custom.md#custom-service) at the following path:

	```
	./services/chronograf/override.yml
	```

3. Make the content of that file look like this:

	``` yaml
	chronograf:
	  image: chronograf:1.10
	```
	
	Save the file.

4. Rebuild your stack, and start the container:

	``` console
	$ ./iotstack_menu.sh build
	$ docker compose up -d chronograf
	```
