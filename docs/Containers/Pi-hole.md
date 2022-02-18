# Pi-hole

Pi-hole is a fantastic utility to reduce ads.

References:

* [PiHole on GitHub](https://github.com/pi-hole/docker-pi-hole)
* [PiHole on Dockerhub](https://hub.docker.com/r/pihole/pihole)

## Environment variables

Environment variables govern much of PiHole's behaviour. If you are running new menu, the variables are inline in `docker-compose.yml`. If you are running old menu, the variables will be in:

```
~/IOTstack/services/pihole/pihole.env
```

> There is nothing about old menu which *requires* the variables to be stored in the `pihole.env` file. You can migrate everything to `docker-compose.yml` if you wish.

## Administrative password

The first time PiHole is launched, it checks for the `WEBPASSWORD` environment variable. If found, the right hand side becomes the administrative password.

You can set the value of `WEBPASSWORD` in the IOTstack menu by:

1. Placing the cursor on top of PiHole.
2. If PiHole is not already selected as a container, press <kbd>space</kbd> to select it.
3. Press the right arrow, and then
4. Choose "PiHole Password Options".

From there, you have the choice of:

* *Use default password for this build*

	Choosing this option results in:

	```yaml
	- WEBPASSWORD=IOtSt4ckP1Hol3
	```

* *Randomise password for this build*

	Choosing this option results in a randomly-generated password which you can find by inspecting your `docker-compose.yml`.

* *Do nothing*

	Choosing this option results in:

	```yaml
	- WEBPASSWORD=%randomAdminPassword%
	```

	which is a valid password string so "%randomAdminPassword%" will become the password.

Regardless of which option you choose, you can always edit your `docker-compose.yml` to change the value of the environment variable. For example:

```yaml
- WEBPASSWORD=mybigsecret
```

It is important to realise that `WEBPASSWORD` only has any effect on the very **first** launch. Once PiHole has been run at least once, the value of `WEBPASSWORD` is ignored and any changes you make will have no effect.

If `WEBPASSWORD` is **not** set on first launch, PiHole defaults to a randomly-generated password which you can discover after the first launch like this:

```bash
$ docker logs pihole | grep random 
```

> Remember, docker logs are ephemeral so you need to run that command before the log disappears!

If you ever need to reset PiHole's admin password to a known value, use the following command:

```bash
docker exec pihole pihole -a -p mybigsecret
```

> replacing "mybigsecret" with your choice of password.

## Other PiHole configuration options

PiHole supports a [long list of environment variables](https://github.com/pi-hole/docker-pi-hole#environment-variables). Most of the variables are straightforward but a few can benefit from some elaboration.

First, understand that there are two basic types of DNS query:

* *forward queries*:

	- question: "what is the IP address of fred.yourdomain.com?"
	- answer: 192.168.1.100

* *reverse queries*:

	- question: "what is the domain name for 192.168.1.100?"
	- answer: fred.yourdomain.com

PiHole has its own built-in DNS server which can answer both kinds of queries. However, the implementation doesn't offer all the features of a full-blown DNS server like BIND9. If you decide to implement a more capable DNS server to work alongside PiHole, you will need to understand the following PiHole environment variables:

* `REV_SERVER=`

	If you configure PiHole's built-in DNS server to be authoritative for your local domain name, `REV_SERVER=false` is appropriate, in which case none of the variables discussed below has any effect.

	Setting `REV_SERVER=true` allows PiHole to forward queries that it can't answer to a local upstream DNS server, typically running inside your network.

* `REV_SERVER_DOMAIN=yourdomain.com` (where yourdomain.com is an example)

	The PiHole documentation says:

	> *"If conditional forwarding is enabled, set the domain of the local network router".*

	The words "if conditional forwarding is enabled" mean "when `REV_SERVER=true`".

	However, this option really has little-to-nothing to do with the "domain of the local network **router**". Your router *may* have an IP address that reverse-resolves to a local domain name (eg gateway.mydomain.com) but this is something most routers are unaware of, even if you have configured your router's DHCP server to inform clients that they should assume a default domain of "yourdomain.com".

	This variable actually tells PiHole the name of your local domain. In other words, it tells PiHole to consider the possibility that an *unqualified* name like "fred" could be the fully-qualified domain name "fred.yourdomain.com".

* `REV_SERVER_TARGET=192.168.1.5` (where 192.168.1.5 is an example):

	The PiHole documentation says:

	> *"If conditional forwarding is enabled, set the IP of the local network router".*

	This option tells PiHole where to direct *forward queries* that it can't answer. In other words, PiHole will send a forward query for fred.yourdomain.com to 192.168.1.5.

	It *may* be appropriate to set `REV_SERVER_TARGET` to the IP address of your router (eg 192.168.1.1) but, unless your router is running as a DNS server (not impossible but uncommon), the router will likely just relay any queries to your ISP's DNS servers (or other well-known DNS servers like 8.8.8.8 or 1.1.1.1 if you have configured those). Those external DNS servers are unlikely to be able to resolve queries for names in your private domain, and won't be able to do anything sensible with reverse queries if your home network uses RFC1918 addressing (which most do: 182.168.x.x being the most common example).

	Forwarding doesn't guarantee that 192.168.1.5 will be able to answer the query. The DNS server at 192.168.1.5 may well relay the query to yet another server. In other words, this environment variable does no more than set the next hop.

	If you are planning on using this option, the target needs to be a DNS server that is authoritative for your local domain and that, pretty much, is going to be a local upstream DNS server inside your home network like another Raspberry Pi running BIND9.

* `REV_SERVER_CIDR=192.168.1.0/24` (where 192.168.1.0/24 is an example)

	The PiHole documentation says:

	> *"If conditional forwarding is enabled, set the reverse DNS zone (e.g. 192.168.0.0/24)".*

	This is correct but it lacks detail.
	
	The string "192.168.1.0/24" defines your local subnet using Classless Inter-Domain Routing (CIDR) notation. Most home subnets use a subnet-mask of 255.255.255.0. If you write that out in binary, it is 24 1-bits followed by 8 0-bits, as in:

	```
	   255  .   255  .   255  .   0
	11111111 11111111 11111111 00000000
	```

	Those 24 one-bits are where the `/24` comes from in `192.168.1.0/24`. When you perform a bitwise logical AND between that subnet mask and 192.168.1.0, the ".0" is removed (conceptually), as in:

	```
	192.168.1.0 AND 255.255.255.0 = 192.168.1
	```

	What it **means** is:

	1. The network *prefix* is "192.168.1".
	2. *This* host on the 192.168.1 network is the reserved address "192.168.1.0". It is better to think of this as "the network prefix followed by all-zero bits in the host portion". It is not common to see the .0 address used in practice - a device either knows its IP address or it doesn't.
	3. The *range* of IP addresses available for allocation to hosts on this subnet is 192.168.1.1 through 192.168.1.254 inclusive.
	4. *All* hosts on the 192.168.1 network (ie broadcast) is the reserved address "192.168.1.255". It is better to think of this as "the network prefix followed by all-one bits in the host portion".

	When you set `REV_SERVER_CIDR=192.168.1.0/24` you are telling PiHole that *reverse queries* for the host range 192.168.1.1 through 192.168.1.254 should be sent to the `REV_SERVER_TARGET=192.168.1.5`.

## Connecting to the PiHole web GUI

Point your browser to:

```
http://«your_ip»:8089/admin
```

where «your_ip» can be:

* The IP address of the Raspberry Pi running PiHole.
* The domain name of the Raspberry Pi running PiHole.
* The multicast DNS name (eg "raspberrypi.local") of the Raspberry Pi running PiHole.

## Using PiHole as your DNS resolver

You can either:

1. Adopt a whole-of-network approach and edit the DNS settings in your router or DHCP server so that all clients are given the IP address of the Raspberry Pi running PiHole.
2. Adopt a case-by-case approach where you instruct particular clients to obtain DNS services from the IP address of the Raspberry Pi running PiHole.
3. Run a DHCP server that is capable of distinguishing between the various clients on your network (ie by MAC address), handing each client an appropriate IP address to use for its DNS services.

Note that using PiHole for clients on your network pretty much **requires** the Raspberry Pi running PiHole to have a fixed IP address. It does not have to be a *static* IP address (in the sense of being hard-coded into the Raspberry Pi). The Raspberry Pi can still obtain its IP address from DHCP at boot time, providing the DHCP server always returns the same IP address (usually referred to as a *static binding*).

Setting up a combination of PiHole (for ad-blocking services), and/or a local upstream DNS resolver (eg BIND9) to be authoritative for a local domain and reverse-resolution for your local IP addresses, and decisions about where each DNS server forwards queries it can't answer (eg your ISP's DNS servers, or Google's 8.8.8.8, or Cloudflare's 1.1.1.1) is a complex topic and depends on your specific needs. If you need help, try asking questions on the [IOTstack Discord channel](https://discord.gg/ZpKHnks).
