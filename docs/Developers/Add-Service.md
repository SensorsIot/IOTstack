# Defining a new service

## getting started

If you have not already done so:

1. Create an account on GitHub;
2. Fork the IOTstack repository under your own name; and
3. Clone your fork onto your local system.

A service requires at least two files:

* `service.yml` - contains data for docker compose
* `menu-config.json` - contains logic for the menu system.

Suppose you want to add a new service to IOTstack. To begin:

``` console
$ cd ~/IOTstack
$ mkdir -p .templates/«name»
$ touch .templates/«name»/service.yml
$ ./iotstack-menu.sh reload
```

That gives you the basic framework. You have an empty `service.yml` while the `reload` command will have created the shell of a `menu-config.json` for you.

Developer tip:

* Any time you edit a `menu-config.json` you also need to reload the internal database.

## json files { #theory-json }

JSON files underpin the menu. For a newly-defined service, the menu creates a shell structure like this:

``` json
{
   "configure": null,
   "dependencies": [],
   "description": "«name»",
   "environment": [],
   "install": [
     { "template": "service.yml", "service": "service.yml", "tracked": true }
   ],
   "service": "«name»"
}
```

**Important Warning:**

* In the above, the left (`«`) and right (`»`) guillemets surrounding `«name»` are intended to convey the meaning "replace this entire field with the name of the container". Example:

	``` json
   "service": "nodered"
	```

* The character `»` (Unicode U+00BB aka *right guillemet*) is **reserved**. It must **not** appear in any JSON field. The menu's behaviour becomes undefined if this rule is violated. 

This structure is a JSON dictionary containing the following keys:

* `"configure":` <a name="json_configure"></a>

	is either `null` or a string naming a runnable script which must exist in the service's sub-directory of the *templates* directory. Any non-null value implies that the container is "configurable". The examples provided are all `bash` scripts but there is nothing stopping you from using other scripting languages.

* `"dependencies":` <a name="json_dependencies"></a>

	is either an empty array (`[]`) or an array of strings which are the names of other services which should be installed at the same time. This can be used in conjunction with `depends_on:` clauses in service definitions.

* `"description":` <a name="json_description"></a>

	is a string which should be a succinct hint explaining the purpose of the container. At runtime, the length of a description is constrained to the screen width, minus the length of the longest-named service, minus 10 characters.

* `"environment":` <a name="environment-vars"></a>

	is an array of zero or more dictionaries with the following syntax:

	``` json
	{
		"variable": "«KEY»",
		"preset": "«VALUE»"
	}
	```
	
	If `«KEY»` is not defined in the `.env` file, `«VALUE»` is **evaluated**, and the result of the evaluation is written into the `.env` file. Here are three common patterns:
	
	* A fixed value:

		``` json
		{"variable": "A", "preset": "FIXED"}
		```
	
	* Lookup of an existing environment variable

		``` json
		{"variable": "B", "preset": "${HOSTNAME}"}
		```

	* 	Generation of a random password:

		``` json
		{"variable": "C", "preset": "$(random_password)"}
		```

	Those would result in `.env` containing entries similar to the following:
	
	```
	A=FIXED
	B=iot-hub
	C=IOT-zohp3-pohm-ioch4
	```
	
	Although the `random_password()` function is intrinsic to the menu, there is no reason why the `$(function)` pattern can't be used to invoke any command. You are, however, responsible for the validity of the result.
	
	If the `eval` built-in returns an error when `«VALUE»` is being evaluated, the unevaluated value of `«VALUE»` is written into `.env`. Example:
	
	``` json
	{
		"variable": "D",
		"preset": "$(random_password"
	}
	```

	The missing closing parenthesis would result in an error, and `.env` would contain:
	
	```
	D=$(random_password
	```
	
	That is the **only** indication you get that an error has occurred.

	See also [environment variable passwords](#password-vars).

* `"install":` <a name="json_install"></a>

	is an array containing at least one dictionary. Each dictionary contains the following keys:

	* `"template":`

		is a string containing the name of a file in the service's sub-directory of the *templates* directory.

	* `"service":`

		is a string containing the name of the file in the service's sub-directory in the *services* directory. The named `"template"` file is copied to the named `"service"` file when a service is installed.

	* `"tracked":` <a name="json-tracked-flag"></a>

		is a Boolean indicating whether the file should be tracked. In other words, if the commit&nbsp;ID of the named `"template"` file changes, the menu infers that the corresponding named `"service"` file needs to be updated.

* `"service":`

	is a string which is expected to be the name by which the service is known. It should be the same as the name of the service's sub-directory in the *templates* directory. This is a sanity check.

## `service.yml` { #theory-service }

### service definitions { #theory-service-defs }

The most common approach is to find an existing `docker-compose.yml` example somewhere on the Internet and adapt it. 

The basic structure of any IOTstack service definition is:

``` yaml linenums="1"
«name»:
  container_name: «name»
  image: «registryReference»
  restart: unless-stopped
  environment:
    TZ: ${TZ:-Etc/UTC}
  ports:
    - "«externalPort»:«internalPort»"
  volumes:
    - ./volumes/«name»/«path»:«internalPath»
```

Key points:

* No blank lines either before or after, or within the body of the service definition.

* You can add comments using the `#` lead-in but you should not assume they will be seen by your users. The documentation is where you should put information you want your users to see.

* The service name (line 1) is left-aligned, while subsequent lines are indented by increments of two spaces (not tabs).

* The service name (line 1), container name (line 2) and the name of the top-level folder within `./volumes` (line 10) should be the same.

* Ideally, the registry reference should be to either a `:latest` tag or no tag at all. In other words, please do not pin to a specific version without a good reason. If users of your container wants to pin to particular versions, leave those decisions to them.

### environment variables

If the container does not need any environment variables, omit the `environment:` clause entirely.

If you need to define environment variables then please use *yaml mappings* syntax rather than *hyphen-style* syntax. Example:

| hyphen style (obsolete) | yaml mapping (recommended) |
|:-----------------------:|:---------------------------|
| `- TZ=${TZ:-Etc/UTC}`   | `TZ: ${TZ:-Etc/UTC}`       |

The reason for using *yaml mappings* is because it has full support for *removing* environment variables using an override file. For this to work, **both** the `service.yml` and the `override.yml` have to employ "yaml mappings". If the example you are following defines environment variables using *hyphen-style* syntax, please convert to *yaml mappings*.

!!! note
	* If you are following an example that maps either `/etc/localtime` or `/etc/timezone` into the container, please try using `TZ` instead. If it doesn't work, the most likely explanation is that the container's designer did not include the `tzdata` package. Brute-force mapping of files in `/etc` is not a good substitute.

#### passwords { #password-vars }

This section applies to passwords that need to be set up via environment variables. If the *service* has something like a graphical front-end which asks the user to register an account and provide a password, then you can ignore the rest of this section.

The standard syntax for providing a password to a container is to use an environment variable:

``` yaml
environment:
  «CEV»: ${«IEV»:?eg echo «IEV»=«SDP» >>~/IOTstack/.env}
```

where:

* `«CEV»` is the environment variable that the **container** expects
* `«IEV»` is either the same as `«CEV»` or is a name which is unique to the service and serves to separate the name space from that of other containers
* `«SDP»` is a recognisably *silly* default value for the password like "myPassword".

Example (for Gitea):

``` yaml
environment:
  GITEA__database__PASSWD: ${GITEA_DB_PASSWORD:?eg echo GITEA_DB_PASSWORD=userPassword >>~/IOTstack/.env}
```

In this case, there is no particular reason why `«IEV»` differs from `«CEV»`, save that the latter is error-prone unless the user uses copy/paste. But here's an example where where `«IEV»` and `«CEV»` **need** to be different:

``` yaml
environment:
  MYSQL_PASSWORD: ${NEXTCLOUD_DB_USER_PASSWORD:?eg echo NEXTCLOUD_DB_USER_PASSWORD=%randomMySqlPassword% >>~/IOTstack/.env}
```

The problem here is that MySQL is the back-end database for several services. When you run multiple such services, you will not have **one** instance of MySQL serving several front-ends. You will have multiple instances of MySQL, each serving a **single** partner front-end. Each instance of MySQL expects to be provided with a value of `MYSQL_PASSWORD` whereas the user may want different passwords for each service-pairing. In this example, `NEXTCLOUD_DB_USER_PASSWORD` provides that name-space separation.

Finally, remember that each `«IEV»` should also be mentioned in the [`"environment":`](#environment-vars) array of the service's `menu-config.json` so that the menu will auto-generate a random password at build time. For example:

``` json
"environment": [
	{
		"variable": "NEXTCLOUD_DB_USER_PASSWORD",
		"preset": "$(random_password)"
	},
],
```

In this context, the preset value of `$(random_password)` is evaluated, by the menu, and generates a random password.

### ports

You should work out which network ports are claimed by processes running within the container. This is not always well-documented so you may need to do some research. For each port, set up an appropriate mapping:

``` yaml
ports:
  - "«externalPort»:«internalPort»"
  ...
```
 
Please make sure that you do not use any external ports that are already claimed by other IOTstack containers. IOTstack works on first-come, first served. Later containers **must** yield to earlier containers. There is a helper script which you can run like this:

``` console
$ cd ~/IOTstack
$ ./scripts/default_ports_md_generator.sh >list.md
```

The resulting `list.md` will contain an up-to-date list of ports. Unfortunately, this list is not *completely* reliable because not all service definitions correctly define all ports they use.

Documentation tip:

* The file [`./docs/Basic_setup/Default-configs.md`](../Basic_setup/Default-Configs.md) is produced by the generator so running the following command will tell you whether you need to make alterations to that file as part of your documentation efforts:

	``` console
	$ diff ./docs/Basic_setup/Default-configs.md list.md
	```

### host mode

If the container needs to run in host mode, change `ports:` to be `x-ports:`. This has the effect of deactivating the ports clause while leaving in place the documentation of the ports used by the container.

On the subject of host mode, please do not automatically implement host mode just because the example you are following does. Please figure out if host mode is actually **necessary**.

There is a fair bit of misunderstanding about what host mode does and does not do. Consider a process running within a container that binds to a network port:

* in host mode, the binding is with the **host's** port.

* in non-host mode, the binding is with the **container's** port. Then, Docker sets up a Network Address Translation (NAT) mapping between the host and container ports.

That's all there is to host mode. The *consequences* of choosing host mode are:

1. You can't have more than one container claiming the same host port. If two host-mode containers need the same port, you will need to figure out how to change the container's configuration so that it uses a different port. Non-host mode gives you the same ability without the hassle of figuring out how to configure containers.

2. A container in host mode **can** see non-unicast traffic reaching the host. Non-host mode containers, **can't**. If a container needs to receive broadcast frames or participate in a multicast group then host-mode is your only choice.

	Pi-hole is a good example of a container which only *needs* to run in host mode *if* you also want it to act as your DHCP server. If you only need Pi-hole as a local DNS server and ad-blocker, it should be run in non-host mode.

### volumes

Docker (as distinct from IOTstack) supports two kinds of persistent store: *bind* mounts and *volume* mounts.

IOTstack uses *bind* mounts exclusively. Please do not propose a new container that relies on *volume* mounts.

??? note "Docker *bind* mounts vs *volume* mounts"
	* For reasons that are not clear, there seems to be some conventional wisdom floating about that Docker *volume* mounts are somehow "better" than Docker *bind* mounts. They aren't! For starters, Docker *volume* mounts are a right pain in the posterior for backup and restore. That alone should be sufficient for any prudent designer of a service definition to avoid them like the proverbial plague.

After you launch your container for the first time, check to see whether it has created any volume mounts:

``` console
$ docker volume ls
```

If the list is non-empty it likely means you have missed a volume mapping in your `volumes:` clause. You can usually track these down by finding the container's Dockerfile and looking for `VOLUME` declarations.

You can remove unwanted volumes using the command:

``` console
$ docker volume rm «name»
```

### privileged flag

If the example you are following uses the `privileged: true` clause, figure out why it needs that and try to come up with a workaround. The `privileged` flag is dangerous and breaks containment.

### dependencies

In most cases a `service.yml` file instantiates a single container. However, where a container will not actually work unless another container is running, you should consider including the following clause in your service definition:

``` yaml
  depends_on:
    - «otherContainer»
```

If you do this, also consider adding the `«otherContainer»` to the [`"dependencies":`](#json_dependencies) list. The menu will ensure that the dependent container is installed when you install the depending container.

There are also cases where a service comprises two (or more) cooperating containers. The best example is NextCloud which has a user-facing front-end plus a private MariaDB back-end. In that situation:

* the `service.yml` should include service definitions for all required containers;
* the depending container (eg `nextcloud`) should have a `depends_on:` clause for the dependent container (`nextcloud_db`); but
* the [`"dependencies":`](#json_dependencies) list should **not** mention the dependent container because installation of both containers is implicit in the fact that `service.yml` contains service definitions for both containers.

## configuration script { #theory-configscript }

If the service needs a configuration script, you can start like this:

``` console
$ cd ~/IOTstack/.templates
$ cp example_template/configure-example.sh «name»/configure-«name».sh
```

The name of the destination script can be anything you like but should preferably start with `configure-` so its purpose is readily apparent. Once you have settled on a name for your script, remember to replace the `null` associated with the [`"configure":`](#json_configure) keyword with the double-quoted name of your script. This is only the **file** name, not the path name! For example:

``` json
   "configure": "configure-my-service.sh",
```

The job of a configuration script is to write information into the service's *services* directory and/or `.env`. For example, for Node-RED, the configuration script creates a menu containing a list of supported add-on nodes, and then writes user selections to:

```
~/IOTstack/services/nodered/installed-addon-nodes.txt
```

That file is an input to the Dockerfile when the Node-RED container is rebuilt.

Please study the example script (and the configuration scripts for Deconz, Node-RED and Zigbee2MQTT) before you pick up your coding pencil. Please observe how the existing containers with configuration scripts also provide sensible defaults which will at least allow containers to build and start, without forcing the user to run the configuration script. This is the preferred pattern.
