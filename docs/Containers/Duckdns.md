# Duck DNS

Duckdns is a free public DNS service that provides you with a domain name you
can update to match your dynamic IP-address.

This container automates the process to keep the duckdns.org domain updated
when your IP-address changes.

## Configuration

1. Register an account, add your subdomain and get your token from
[http://www.duckdns.org/](http://www.duckdns.org/).

2. Install the DuckDNS service. For example:

	``` console
	$ cd ~/IOTstack
	$ ./iotstack-menu.sh install duckdns
	```
	
	You can also call `./iotstack-menu.sh` without arguments and do the same thing from menu mode.

3. Use a text editor to create an [override file](../Basic_setup/Custom.md#custom-service) at the following path

	```
	~/IOTstack/services/duckdns/override.yml
	```
	
	This is the template for that file:
	
	``` yaml
	duckdns:
	  environment:
	    TOKEN: «your-duckdns-token»
	    SUBDOMAINS: «your-subdomain»
	```
	
	Replace both `«your-duckdns-token»` and `«your-subdomain»` with the relevant values, then save the file.

4. Rebuild your stack and start the container:

	``` console
	$ ./iotstack-menu.sh build
	$ docker compose up -d duckdns
	```

5. Confirm that at least the initial update is successful:

	``` console
	$ docker compose up -d duckdns
	$ docker compose logs -f duckdns
	...SNIP...
	duckdns    | Sat May 21 11:01:00 UTC 2022: Your IP was updated
	...SNIP...
	```
	
	Press <kbd>control</kbd>+<kbd>c</kbd> to stop following the log.

If there is a problem, check that the resulting effective configuration of `duckdns:` looks OK:

``` console
$ cd ~/IOTstack && docker compose config duckdns
```

### Domain name for the private IP

!!! note inline end "Example public/private IP:s and domains"

    ``` mermaid
    flowchart
    I([Internet])
    G("Router\npublic IP: 52.85.51.71\nsubdomain.duckdns.org")
    R(Raspberry pi\nprivate IP: 192.168.0.100\nprivate_subdomain.duckdns.org)
    I --- |ISP| G --- |LAN| R
    ```

As a public DNS server, Duckdns is not meant to be used for private IPs. It's
recommended that for resolving internal LAN IPs you use the [Pi
Hole](Pi-hole.md) container or run a dedicated DNS server.

That said, it's possible to update a Duckdns subdomain to your private LAN IP.
This may be convenient if you have devices that don't support mDNS (.local) or
don't want to run Pi-hole. This is especially useful if you can't assign a
static IP to your RPi. No changes to your DNS resolver settings are needed.

First, as for the public subdomain, add the domain name to your Duckdns account
by logging in from their homepage. Then add a `PRIVATE_SUBDOMAINS` variable
indicating this subdomain:

``` yaml
version: '3.6'
services:
  duckdns:
    environment:
      TOKEN: ...
      SUBDOMAINS: ...
      PRIVATE_SUBDOMAINS: private_subdomain
```

## References

* uses ukkopahis' [fork](https://github.com/ukkopahis/docker-duckdns) based on
  the linuxserver
  [docker-duckdns](https://github.com/linuxserver/docker-duckdns) container
