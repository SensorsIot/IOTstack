# Tailscale

From the Tailscale home page:

> The best<sup>†</sup> secure connectivity platform for the AI era
> 
> A Zero Trust identity-based connectivity platform that replaces your legacy VPN, SASE, and PAM and connects remote teams, multi-cloud environments, CI/CD pipelines, Edge & IoT devices, and AI workloads.

† "best" is *their* claim.

## References

* [Tailscale home](https://tailscale.com/)

	* [Documentation (Docker)](https://tailscale.com/docs/features/containers/docker)

* [GitHub (source)](https://github.com/tailscale/tailscale)
* [DockerHub (image)](https://hub.docker.com/r/tailscale/tailscale)

## Caution

The service definition supplied with IOTstack is derived from the [DockerHub readme](https://hub.docker.com/r/tailscale/tailscale). At the time of writing (June 2026), the container appears to start properly but whether it actually works is unknown. Running:

``` console
$ docker logs -f tailscale
```

produces a pile of log entries, with something like this towards the end:

```
To authenticate, visit:

	https://login.tailscale.com/a/db8d9ff013daa
```

The container waits for 60 seconds then exits with the message like this:

```
boot: 2026/06/07 00:36:11 Sending SIGTERM to tailscaled
boot: 2026/06/07 00:36:11 failed to auth tailscale: failed to auth tailscale: tailscale up failed: signal: killed
```

Then the container restarts (thereby terminating the log) and subsequent inspection of the log will reveal a new URL.

Presumably, you get 60 seconds within which to "do something" with the most-recent URL in order to establish connectivity.

## Environment variables

The service definition supplied with IOTstack includes all environment variables mentioned on the [DockerHub readme](https://hub.docker.com/r/tailscale/tailscale).

Most environment variables have been commented-out and represent placeholders if practical use of the container suggests they are required.

Based on a cursory reading of the documentation, the following environment variables have been made active:

* `TS_AUTHKEY: ${TAILSCALE_AUTHKEY:-}`

	From [DockerHub](https://hub.docker.com/r/tailscale/tailscale):
	
	> We recommend you use an [auth key⁠](https://tailscale.com/kb/1085/auth-keys/) for an [ephemeral node⁠](https://tailscale.com/kb/1111/ephemeral-nodes/) when using Tailscale in a container, which can be accomplished by passing in a `TS_AUTHKEY` environment variable:
	
	If you need to define such a key, you can do it like this:
	
	``` console
	$ cd ~/IOTstack
	$ echo "TAILSCALE_AUTHKEY=«yourAuthKey»" >> .env
	$ docker compose up -d tailscale
	```
	
	In words:
	
	1. Be in the right directory.
	2. Append the key to `.env`.
	3. Recreate the container.

	If you do not set a value for this variable, it defaults to an empty string.

* `TS_STATE_DIR: /var/lib/tailscale`

	The location of the persistent store. IOTstack establishes bind mount for the persistent store at `/var/lib`, and the daemon creates the `tailscale` sub-directory.

* `TS_USERSPACE: ${TAILSCALE_USERSPACE:-0}`

	Sets the default value of `TS_USERSPACE` to zero which implies "false" and disables user-space networking in favour of kernel networking. If you want to "route" traffic, it seems likely that you will need kernel networking.
	
	If you want to enable user-space networking:
	
	``` console
	$ cd ~/IOTstack
	$ echo "TAILSCALE_USERSPACE=1" >> .env
	$ docker compose up -d tailscale
	```

### No timezone support

At the time of writing, the container's designer had not included `tzdata` in the build so there is no support for the `TZ` environment variable. All log entries are in UTC.

## Waiting for documentation

Sorry but, from here, you are on your own.

If you manage to get Tailscale working under IOTstack and can explain the setup, configuration and usage steps, please consider submitting a pull request to expand this documentation.
