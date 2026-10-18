# Vaultwarden

## About

From the Vaultwarden Wiki:

> Vaultwarden is an unofficial Bitwarden server implementation written in Rust. It is compatible with the official Bitwarden clients, and is ideal for self-hosted deployments where running the official resource-heavy service is undesirable.

## References

- [Wiki](https://github.com/dani-garcia/vaultwarden/wiki)
- [GitHub](https://github.com/dani-garcia/vaultwarden)
- [DockerHub](https://hub.docker.com/r/vaultwarden/server)

## Critical assumption

The service definition for Vaultwarden that is provided by IOTstack (effectively) assumes that you will connect to it via a reverse proxy such as Nginx. Vaultwarden refuses to work without HTTPS so, if you want to use a different approach, you will need to do a deep dive into its documentation and roll your own scheme.

The typical "assumed environment" can be described like this:

1. A domain name system (DNS) structure similar to:

	```
	$ORIGIN home.arpa.
	iot-hub        IN  A      192.168.0.60
	nginx          IN  CNAME  iot-hub.home.arpa.
	vaultwarden    IN  CNAME  iot-hub.home.arpa.
	password       IN  CNAME  nginx.home.arpa.
	```
	
	In words:
	
	1. The default domain is `home.arpa`.
	2. The physical host with the fully-qualified domain name of `iot-hub.home.arpa`:

		* has the IP address 192.168.0.60
		* is running two services (assume docker containers):

			- `nginx`, reachable via `nginx.home.arpa`
			- `vaultwarden`, reachable via `vaultwarden.home.arpa`

	3. The `nginx` service will reverse-proxy `https://password.home.arpa` URLs.

	You don't have to do it this way but using the DNS to describe the relationships is a good documentation habit to get into.
	
2. A proxy host definition such that:

	* URLs including the domain name `password.home.arpa`
	* forward to the `vaultwarden` container on container-port 80.

	The assumption here is that both Nginx and Vaultwarden are running in non-host mode containers, on the same host, and share a common Docker internal bridged network. This is what you get by default with IOTstack with both containers on the same machine.
	
See also the [`DOMAIN`](#vw-domain) variable below and make sure you set it before starting the Vaultwarden container for the first time.

## Environment Parameters

* `TZ`

	Assumes your `.env` defines your local timezone so that all containers which include timezone support inherit a common time zone. Defaults to UTC if `TZ` is undefined.
	
* `DOMAIN` <a name="vw-domain"></a>

	If `VAULTWARDEN_DOMAIN` is not defined in your `.env` file, Vaultwarden will default to `https://password.home.arpa`. This is probably not what you want so you should override this before first launch with the correct URL for your environment. For example, if you decided to keep the `password` prefix but your domain was `mydomain.com`, you would:
	
	``` console
	$ echo "VAULTWARDEN_DOMAIN=https://password.mydomain.com" >> ~/IOTstack.env
	```
	
* `ADMIN_TOKEN`

	See [Configuring administrative access](#admin-config).
	
* `ENABLE_WEBSOCKET`

	Please leave this set to `true`. 

## Accessing the Vaultwarden User Interface { #ui-access }

Vaultwarden needs to be accessed using HTTPS (port 443 is implied). Example:

```
https://password.home.arpa/
```

On first launch you will have to set up an account.

## Accessing the Vaultwarden Administrative Interface { #admin-access }

The administration panel can be reached by appending the `admin` path to the basic URL for [Accessing the Vaultwarden User Interface](#ui-access), as in:

```
https://password.home.arpa/admin
```

The result will either be a password prompt or the message:

```
admin panel is disabled, please configure the 'ADMIN_TOKEN' variable to enable it
```

### Configuring administrative access { #admin-config }

This is a subset of the information at:

* [Wiki: Enabling the admin page](https://github.com/dani-garcia/vaultwarden/wiki/Enabling-admin-page#secure-the-admin_token)

To "configure the 'ADMIN_TOKEN'", do the following:

1. Define the password you want to use to access the administrative interface. This password really is the keys to your kingdom so, ideally, it will be long and complex. You must not lose it so you will need to save it somewhere secure. If you don't have a favourite tool for generating passwords, here are some possibilities:

	* Generating a universally unique identifier:

		``` console
		$ uuidgen`
		ac0228f1-3ef0-49b0-8229-2f6587ffa45a
		```

	* Using OpenSSL's random number facilities:

		``` console
		$ openssl rand -base64 32
 		G69Y5RkmcQ8TWdFKaNJ+86LRgnYBBrGeH7eoo8hzxHg=
		```
	* Using VaultWarden's User Interface: Tools » Generator with length 32:

		```
		k4pI9g8KAkVCqKSZyCrZEsFu668fnhsY
		```

2. Copy your chosen password to your clipboard.	
3. Generate the encrypted version of the password:

	``` console
	$ docker exec -it vaultwarden /vaultwarden hash
	Generate an Argon2id PHC string using the 'bitwarden' preset:

	Password: 
	Confirm Password: 

	ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$wlALX/YDgdq7vo50IuRuYqACzdeKa+M5YbORIGPeS74$AkrlcX9rgeHPw/72ualirJ/8tWuGvUBNsVSfegUcuxg'

	Generation of the Argon2id PHC string took: 679.70525ms
	```
	
	Paste the contents of your clipboard at both the "Password" and confirmation prompts.

4. Select everything from and including `ADMIN_TOKEN` through to and including the single quote mark at the end of the line, and copy that to your clipboard.

5. Paste the contents of the clipboard to the command line and press <kbd>return</kbd>:

	``` console
	$ ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$wlALX/YDgdq7vo50IuRuYqACzdeKa+M5YbORIGPeS74$AkrlcX9rgeHPw/72ualirJ/8tWuGvUBNsVSfegUcuxg'
	```

6. Verify that the previous command worked as expected:

	``` console
	$ echo $ADMIN_TOKEN
	$argon2id$v=19$m=65540,t=3,p=4$wlALX/YDgdq7vo50IuRuYqACzdeKa+M5YbORIGPeS74$AkrlcX9rgeHPw/72ualirJ/8tWuGvUBNsVSfegUcuxg
	```

	The response should be everything between the single quote marks of the original material you copied to the clipboard in step 4.
		
7. Append the token to your 	`.env` file:

	``` console
	$ echo "VAULTWARDEN_ADMIN_TOKEN='${ADMIN_TOKEN}'" >> ~/IOTstack/.env
	```
	
8. Check the result:

	``` console
	$ tail -1 ~/IOTstack/.env
	VAULTWARDEN_ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$wlALX/YDgdq7vo50IuRuYqACzdeKa+M5YbORIGPeS74$AkrlcX9rgeHPw/72ualirJ/8tWuGvUBNsVSfegUcuxg'
	```

	The response should be the key `VAULTWARDEN_ADMIN_TOKEN` with a value wrapped in single quote marks which is the same as generated in step 3.
	
	Why `VAULTWARDEN_ADMIN_TOKEN` rather than `ADMIN_TOKEN`? Because the `.env` file is shared by all service definitions. There is always the possibility that two containers may implement a generic name like `ADMIN_TOKEN`. The IOTstack convention is to prepend the service name to provide namespace separation.
	
9. Recreate the Vaultwarden container:

	``` console
	$ cd ~/IOTstack
	$ docker compose up -d vaultwarden
	```

10. Go to [Accessing the Vaultwarden Administrative Interface](#admin-access). This time you should see the password prompt. Enter the password you defined in step 1.

### Changing your administrative password

It is a fairly safe assumption that you will only follow the steps in [Configuring administrative access](#admin-config) because you want to change a setting.

As soon as you make any change and click the <kbd>Save</kbd> button, the token associated with your administrative password gets saved into a configuration file. The external path to that file is:

```
~/IOTstack/volumes/vaultwarden/data/config.json
```

Thereafter, changing your administrative password is not as simple as merely re-following the same steps you used to create the password in the first place. Presumably, that's a small safeguard against a malefactor who gains access to the host simply providing a new token and restarting the container.

Here's an approach that seems to work:

1. If your browser is logged-in to Vaultwarden's administrative interface, logout.

	Why? Because you are about to re-create the container!

2. Remove the old token from your `.env` file: 

	``` console
	$ sed -i.bak '/^VAULTWARDEN_ADMIN_TOKEN=/d' ~/IOTstack/.env
	```
	
	This creates `~/IOTstack/.env.bak` as a backup so you can revert if necessary.

3. Follow steps 1 thru 9 of [Configuring administrative access](#admin-config).

4. Use your browser to login to Vaultwarden's administrative interface. Use your **old** password when prompted.

5. To provide some context, let's make the assumption that the output from step 8 confirming that your new token had been added to your `.env` file was:

	```
	VAULTWARDEN_ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$WR3pRhu/8Q3c/gnF+EWgrKptYGhCQm55+WMqMpYVMKI$J+TN6JOITaeFWX0x+3UsTjPICZTi5Zg1FWWKQzdrbdU'
	```
	
	Options:
	
	1. **Either** copy everything between but not including the single quote marks to your clipboard.

	2. **Or** repeat step 6 of [Configuring administrative access](#admin-config):

		``` console
		$ echo $ADMIN_TOKEN
		$argon2id$v=19$m=65540,t=3,p=4$WR3pRhu/8Q3c/gnF+EWgrKptYGhCQm55+WMqMpYVMKI$J+TN6JOITaeFWX0x+3UsTjPICZTi5Zg1FWWKQzdrbdU
		```
	
		That gives you the *value* of the token without an associated variable name or surrounding quotes. Select that value (everything from and including `$argon2id` up to and including  `rbdU`) and copy it to your clipboard.

6. Switch to your browser. In the "General settings" tab of Vaultwarden's administrative interface, find the "Admin token/Argon2 PHC" field:

	* Click the <kbd>Show/Hide</kbd> button to reveal the token;
	* Select all of the token text and replace it with the contents of your clipboard.
	* Click the <kbd>Save</kbd> button. Check your work if the dialog indicates failure.
	* Logout

7. Login to Vaultwarden's administrative interface. This time use your **new** password.
