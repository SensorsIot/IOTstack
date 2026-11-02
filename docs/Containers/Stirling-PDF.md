# Stirling-PDF

Stirling&nbsp;PDF is a private, open-source editor and processor for Portable Document Files (PDFs).

You can use any browser to read, edit and automate your PDFs. The engine runs as a container on your IOTstack instance so your private data never leaves your own network (unless you want it to).

Providing you have the requisite SSL certificates and keys, you can also use Stirling&nbsp;PDF to digitally-sign and verify PDFs.

## References

* [Docker Hub](https://hub.docker.com/r/stirlingtools/stirling-pdf)
* [GitHub](https://github.com/Stirling-Tools/Stirling-PDF)
* [Documentation](https://docs.stirlingpdf.com/)

## Installation

You can either use the menu to select and install `stirling-pdf`, and then rebuild your stack, or you can run: 

``` console
$ cd ~/IOTstack
$ ./iotstack-menu.sh install stirling-pdf
$ ./iotstack-menu.sh build
```

## Credentials

The service definition supplied with IOTstack defines administrator credentials using the following environment variables:

* `STIRLING_PDF_USERNAME`
* `STIRLING_PDF_PASSWORD`

It is important to realise that these variables only have effect on first launch.

The default value for the username is "admin" but you can adjust this if you wish. Here is an example:

``` console
$ echo "STIRLING_PDF_USERNAME=maestro" >>~/IOTstack/.env
```

The menu generates a strong random password which is written into:

```
~/IOTstack/.env
```

You can edit that file to adjust the initial password value. Use the Stirling&nbsp;PDF GUI if you wish to change the password after first launch.

## First launch

1. Either start the container:

	``` console
	$ docker compose up -d stirling-pdf
	```

2. Or start the entire stack

	``` console
	$ docker compose up -d
	```

## Customisation

Customisation is best undertaken using an [override file](../Basic_setup/Custom.md#custom-service) at the path:

```
~/IOTstack/services/stirling-pdf/override.yml
```
### options

#### disabling security

Security is enabled by default. With security enabled, you first login as the administrator and then set about creating users and, if necessary, groups.

If you disable security, Stirling&nbsp;PDF effectively runs in guest mode.

To disable security, do this in your override file:

``` yaml
stirling-pdf:
  environment:
    SECURITY_ENABLELOGIN: false
```

#### "fat" version

IOTstack pulls the `latest` image by default. There is also a so-called "fat" image which includes advanced HTML & eBook tooling. To use the "fat" image, do this in your override file:

``` yaml
stirling-pdf:
  image: stirlingtools/stirling-pdf:latest-fat
```

#### other settings

Any of Stirling&nbsp;PDF's [configuration options](https://docs.stirlingpdf.com/Server/Configuration/) can be set via an environment variable. This implies that you can add other environment variables to your override file.

### implementation

After you create or edit your override file, you can implement the changes like this:

1. Rebuild your stack:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh build
	```

2. Optionally, pre-flight the results by running:

	``` console
	$ docker compose config stirling-pdf
	```

	Find and fix any errors reported by docker compose.

3. Recreate the container with the new overrides:

	``` console
	$ docker compose up -d stirling-pdf
	```

## Connecting to the GUI

Note:

* Stirling&nbsp;PDF can take a **significant** amount of time to get started (it's hardware-dependent). Please don't assume the container is broken if you don't get an instant response. You need to be patient! Once running, however, is fast enough for practical use on a Raspberry Pi 4.

Stirling&nbsp;PDF uses a web browser interface which, in IOTstack, is reachable on port 8090. For example:

```
http://myhost.home.arpa:8090
```

## Maintenance

You can check for image updates by running:

``` console
$ cd ~/IOTstack
$ docker compose pull
```

If Docker downloads a newed image, you can implement it by running:

``` console
$ docker compose up -d stirling-pdf
$ docker system prune -f
```
