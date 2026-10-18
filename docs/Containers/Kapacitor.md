# Kapacitor
 
## References

- [*influxdata Kapacitor* documentation](https://docs.influxdata.com/kapacitor/)
- [*GitHub*: influxdata/influxdata-docker/kapacitor](https://github.com/influxdata/influxdata-docker/tree/master/kapacitor)
- [*DockerHub*: influxdata Kapacitor](https://hub.docker.com/_/kapacitor)

## Upgrading Kapacitor

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

### Kapacitor version pinning

If you need to pin to a particular version:

1. Use your favourite text editor to create/edit an [override file](../Basic_setup/Custom.md#custom-service):

	```
	~/IOTstack/services/kapacitor/override.yml
	```

2. Make the content look like this:

	``` yaml
	kapacitor:
	  image: kapacitor:1.5.9
	```
	Note:
	
	* Be cautious about using the `latest` tag. At the time of writing, there was no `linux/arm/v7` architecture support. 

3. Apply the change:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh build 
	$ docker compose up -d kapacitor
	```
