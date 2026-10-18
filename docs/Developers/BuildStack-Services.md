# Build Stack Services system

This page explains how the build stack system works for developers.

## References

* [Defining a new service](./Add-Service.md)

## installation

When the user "installs" a service, the menu:

1. Creates `~/IOTstack/services/«service»` (if it does not exist); then
2. Copies files from the service's template into that sub-directory.

At minimum, the service's `service.yml` is copied. For some services (eg Node-RED) other files are copied too but this is the exception rather than the rule. Exactly what gets copied is governed by the contents of the [`"install":` array](./Add-Service.md#json_install) in the service's `menu-config.json`.

## preconditions

There are two preconditions for the build system to consider a service to be "properly installed":

1. The service must be marked active in the internal database; and

2. All files defined in the [`"install":` array](./Add-Service.md#json_install) must exist in the service's sub-directory of `~/IOTstack/services`.

If the service is marked active but the second precondition is not met, the menu advises the user to repair or reinstall the service.
 
## build process { #build-process }

The goal of the build process is to create two files:

```
~/IOTstack
├── docker-compose.yml
└── docker-compose.override.yml
```

* `docker-compose.yml` is the concatenation of:

	1. `~/IOTstack/services/docker-compose-header.yml`;

	2. all `~/IOTstack/services/*/service.yml` files, providing each such service is properly installed; and

	3. `~/IOTstack/services/docker-compose-trailer.yml`.

* `docker-compose.override.yml` is the concatenation of:

	1. `~/IOTstack/services/docker-compose.override-header.yml`;

	2. all `~/IOTstack/services/*/override.yml` files, providing each such service is properly installed: and

	3. `~/IOTstack/services/docker-compose.override-trailer.yml`.

The concatenation process takes each header file "as is", appends its own `services:` section heading, then right-shifts the contents of `service.yml` and `override.yml` files by two leading spaces, finishing with the trailer file. The process is *reasonably* robust but it assumes the source files contain valid YAML.

!!! note
	* If any input file contains mal-formed YAML then *docker&nbsp;compose* will complain when you try to start your stack.

If either newly-generated file differs from an existing file of the same name, the existing file is renamed with a `.save` extension. In other words, there is always the potential for a `build` to yield four files:

```
~/IOTstack
├── docker-compose.yml
├── docker-compose.yml.save
├── docker-compose.override.yml
└── docker-compose.override.yml.save
```

The `.save` files help you to answer the "what changed?" question. You can run:

``` console
$ diff -y docker-compose.yml.save docker-compose.yml
$ diff -y docker-compose.override.yml.save docker-compose.override.yml
```

You can pre-flight the results of a build by running:

``` console
$ docker compose config
```

If you have just changed a particular service, you can restrict the pre-flighting to just that service:

``` console
$ docker compose config «service»
```

*docker&nbsp;compose* merges your `docker-compose.yml` and `docker-compose.override.yml` files, then displays the merged result.

When you run:

``` console
$ docker compose up -d
```

*docker&nbsp;compose* merges your `docker-compose.yml` and `docker-compose.override.yml` files, then processes the merged result to instantiate your stack.

### special cases { #build-process-special }

If you do not have at least one active service then *docker&nbsp;compose* will complain that no service is selected.

If you do not take advantage of any customisation points, your `docker-compose.override.yml` will be an empty file. This does not affect *docker&nbsp;compose*.

### password generation { #password-generation }

As well as assembling the compose and override files, the build process generates random passwords. Auto-generated passwords are written to `~/IOTstack/.env` and always start with the letters "IOT" followed by 14 random characters arranged in a 5-4-5 pattern. For example:

```
YE_OLDE_PASSWORD=IOT-aigh9-yooW-oh4ah
```

This helps you to identify auto-generated passwords so you can replace them with values you choose. 

In some cases (particularly databases) passwords are only applied when you first spin-up the container. Subsequent password changes applied via environment variables are either ignored or cause havoc. To put this another way, if you intend to replace a randomly-generated password, it is best to do it **before** you "up" the container for the first time.

See also [passwords](./Add-Service.md#password-vars).
