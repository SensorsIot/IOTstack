# Gitea

Gitea is a self-hosted software development service similar to GitHub, Bitbucket and GitLab. The IOTstack implementation runs as a pair of containers using a MariaDB database as the back-end.

## references { #references }

* [Gitea Home](https://about.gitea.com)
* [Gitea on Dockerhub](https://hub.docker.com/r/gitea/gitea)
* [Gitea documentation](https://docs.gitea.com)
* [GitHub](https://github.com/go-gitea/gitea)

## environment variables  { #envVars }

Environment variables need to be set in several stages:

1. **Before** you start the container for the first time, you should define the following environment variables. If you make a mistake or change your mind later, the best course of action is to start over from a [clean slate](#cleanSlate):

	* `GITEA_DB_NAME` is the name of the database that Gitea (the service) will use to store its information in MariaDB. Example:

		``` console
		echo "GITEA_DB_NAME=gitea" >>~/IOTstack.env
		```

		If omitted, defaults to "gitea".

	* 	`GITEA_DB_USER` is the name of the user that Gitea (the service) will use to authenticate with MariaDB. Example:

		``` console
		echo "GITEA_DB_USER=gitea" >>~/IOTstack.env
		```

		If omitted, defaults to "gitea".

	* `GITEA_DB_PASSWORD` is the password associated with the above user. Example:

		``` console
		$ echo "GITEA_DB_PASSWORD=$(uuidgen)" >>~/IOTstack.env
		```

		If omitted, the container will not start.

	* `GITEA_DB_ROOT_PASSWORD` is the administative password for the MariaDB service. Keep in mind that the `gitea_db` service is dedicated to Gitea. You can run other MariaDB instances in parallel. They will not interfere with each other and neither will they share data or credentials. Example:

		``` console
		$ echo "GITEA_DB_ROOT_PASSWORD=$(uuidgen)" >>~/IOTstack.env
		```

		If omitted, the container will not start.

	You (the human user) will **never** need to know the username and passwords set here. You will not need to use these values in practice.

2. **After** you have set the environment variables listed above, start the container:

	``` console
	$ cd ~/IOTstack
	$ docker compose up -d gitea
	```

	If this is the first time you have launched Gitea, docker compose will also build and run the `gitea_db` service.

	You can expect to see the following warnings:

	```
	WARN[0000] The "GITEA_SECRET_KEY" variable is not set. Defaulting to a blank string. 
	WARN[0000] The "GITEA_INTERNAL_TOKEN" variable is not set. Defaulting to a blank string. 
	```

	Those are reminders to execute these commands:

	``` console
	$ echo "GITEA_SECRET_KEY=$(docker exec gitea gitea generate secret SECRET_KEY)" >>~/IOTstack/.env
	$ echo "GITEA_INTERNAL_TOKEN=$(docker exec gitea gitea generate secret INTERNAL_TOKEN)" >>~/IOTstack/.env
	```

	After that command has run, start the container again:

	``` console
	$ docker compose up -d gitea
	```

	The warning message will go away.

	See [Managing Deployments With Environment Variables](https://docs.gitea.com/installation/install-with-docker#managing-deployments-with-environment-variables) for more information.

3. The `GITEA_ROOT_URL` environment variable should be set to the URL that the **user** uses to reach the Gitea service. If you use a proxy host such as Nginx then this would be the URL you present to the proxy. For example:

	``` console
	$ echo "GITEA_ROOT_URL=https://gitea.my.domain.com" >>~/IOTstack.env
	```

	Alternatively, if you connect directly to the host on which the service is running, the URL will be that of the host plus the external port of the Gitea container. For example:

	``` console
	$ echo "GITEA_ROOT_URL=http://host.my.domain.com:7920" >>~/IOTstack.env
	```

	If omitted, defaults to null in which case the container will make a best-efforts determination (which is unlikely to be correct). You will also see this warning:

	```
	WARN[0000] The "GITEA_ROOT_URL" variable is not set. Defaulting to a blank string.
	```

	You can change this variable whenever you like. Simply edit the value in `~/IOTstack/.env` and apply the change by running:

	``` console
	$ docker compose up -d gitea
	```

	See [Gitea Server](https://docs.gitea.com/next/administration/config-cheat-sheet#server-server) for more information.

4. By default, Gitea expects to communicate using the HTTP protocol. If you want Gitea to switch to HTTPS, you need to do the following:

	- Generate a self-signed certificate:

		``` console
		$ docker exec gitea bash -c 'cd /data/git ; gitea cert --host gitea --ca'
		```

	- Uncomment the following environment variables in the service definition:

		``` yaml
		environment:
		...
		# - GITEA__server__KEY_FILE=/data/git/key.pem
		# - GITEA__server__CERT_FILE=/data/git/cert.pem
		```

		These variables tell Gitea where to find the X.509 certificate and matching private key that were generated in the first step.

	- swap the comments on the `test` lines in the `healthcheck` clause:

		``` yaml
		healthcheck:
		  test: ["CMD-SHELL", "curl -sf4 -o /dev/null http://gitea:3000"]
		# test: ["CMD-SHELL", "curl -sf4 --cacert $$GITEA__server__CERT_FILE -o /dev/null https://gitea:3000"]
		```

		In other words, the final result should look like this:

		``` yaml
		healthcheck:
		# test: ["CMD-SHELL", "curl -sf4 -o /dev/null http://gitea:3000"]
		  test: ["CMD-SHELL", "curl -sf4 --cacert $$GITEA__server__CERT_FILE -o /dev/null https://gitea:3000"]
		```

	- Tell Gitea to enable HTTPS:

		``` console
		$ echo "GITEA_WEB_PROTOCOL=https" >>~/IOTstack/.env
		```

	- Recreate the container:

		``` console
		$ cd ~/IOTstack
		$ docker compose up -d gitea
		```

	If everything has gone according to plan, Gitea will be expecting HTTPS traffic and will perform SSL authentication using the key and certificate generated in the first step.

	Notes:

	* The certificate has a one-year lifetime. It can be regenerated at any time by re-running the command provided earlier. You could, for example, embed it in a `cron` job, like this:

		``` crontab
		5  0  1  1,7  *  docker exec gitea bash -c 'cd /data/git ; gitea cert --host gitea --ca' >/dev/null 2>&1
		```

		In words, run the command "at five minutes after midnight on the first of January and the first of July".

	* Gitea also supports LetsEncrypt. See [using ACME with Let's Encrypt](https://docs.gitea.com/administration/https-setup#using-acme-default-lets-encrypt).

## default ports

The IOTstack implementation listens on the following ports:

* 7920 the Gitea graphical user interface 
* 2222 the SSH passthrough service

## getting started

Use your browser to connect to the Gitea service, either:

* directly:

	```
	http://«host»:7920
	```

	where `«host»` is:

	- an IP address (eg 192.168.1.10)
	- a hostname (eg `iot-hub`
	- a domain name (eg `iot-hub.my.domain.com`)
	- a multicast domain name (eg `iot-hub.local`)

* indirectly, via a reverse proxy:

	```
	https://gitea.my.domain.com
	```

	This assumes that the reverse proxy redirects the *indirect* form (using HTTPS) to one of the *direct* forms (using either HTTP or HTTPS).

Click on the <kbd>Register</kbd> button to create an account for yourself.

After that, please rely on the [Gitea documentation](https://docs.gitea.com).

## launch times

When you start the `gitea` service, docker compose auto-starts the `gitea_db` service (a MariaDB aka MySQL implementation). The database service can take some time to start and that, in turn, affects the availability of the `gitea` service.

The time it takes for the `gitea` service to become fully available depends on your hardware (CPU speed, RAM, SD/HD/SSD). As an example, the `gitea` service takes about 30 seconds to become available on a 4GB Raspberry Pi 4 with SSD.

You may get strange error messages if you attempt to connect to `gitea` while it is still coming up.

The moral is: be patient!

## starting over from a clean slate  { #cleanSlate }

Proceed as follows:

``` console
$ cd ~/IOTstack
$ docker compose down gitea gitea_db
$ sudo rm -rf ./volumes/gitea
$ docker compose up -d gitea
```

## container maintenance

You can maintain the Gitea container with normal `pull` commands:

``` console
$ cd ~/IOTstack
$ docker compose pull gitea
$ docker compose up -d gitea
$ docker system prune -f
```

The Gitea_DB container needs special handling:

``` console
$ cd ~/IOTstack
$ docker-compose build --no-cache --pull gitea_db
$ docker compose up -d gitea_db
$ docker system prune -f
```

## migrating existing repositories

The simplest approach to migrating an existing repository into Gitea is:

1. Start with an existing clone of the repository you want to migrate;
2. Convert the existing clone to a "bare" repository;
3. Copy the "bare" repository into Gitea's persistent store; and
4. Use the Gitea GUI to adopt it.

### existing clone

Let's assume you have an existing clone of a repository named "my-project" at the path:

```
~/my-repos/my-project
```

### convert to bare

To convert that existing clone to a "bare" repository:

``` console
$ mkdir ~/bare
$ cd ~/bare
$ git clone --bare ~/my-repos/my-project
```

The result will be a folder at the path:

```
~/bare/my-project.git
```

Note:

* If you already have a "bare" repository stored somewhere then the only thing you are likely to need to do is to rename the directory to have the `.git` extension.

The bare clone will probably have inherited the remote URL(s) that were associated with the original cloning process. Those don't actually cause any harm but they can be confusing so it is a good idea to get rid of them:

```
$ cd my-project.git
$ git remote -v
origin	«pathOrURLTo»/my-project (fetch)
origin	«pathOrURLTo»/my-project (push)
$ git remote remove origin
```

This example only had one remote ("origin"). Some projects have multiple remotes (eg "upstream") so keep executing the `git remote remove «remote»` command until all remotes have been removed.

### copy to Gitea's persistent store

Assuming you have been doing all this work on a computer which is **not** where Gitea is running, the next step is to move the `my-project.git` folder onto the host where Gitea is running. How you do that is up to you. For example:

* the `scp -r` command <sup>†</sup>;
* the `sftp` command plus the `put -r` command <sup>†</sup>;
* file-sharing protocols such as SAMBA or SSHFS; or
* "sneaker-net" via a thumb drive.

	> <sup>†</sup> in each case, the `-r` (recursive) is needed to copy the directory and its contents

On the host where Gitea is running, I'm going to assume that the bare repository is at:

```
~/my-project.git
```

Move into the Gitea persistent store:

```
$ cd ~/IOTstack/volumes/gitea/data/git/repositories/«user»/
```

where `«user»` is your username as known to Gitea.

Move the bare repository into this scope:

```
$ mv ~/my-project.git .
```

Note:

* There has been no mention thus far of ownership and permissions. That's because the Gitea container runs as userID 1000. Inside the container, that's the username "git". Outside the container, userID 1000 is the first user defined on the Linux system and is the account that the majority of Linux users login under. You will only have to be concerned about ownership and permissions if you depart from this norm. 

### adopt the repository

Go to the Gitea GUI and login to your account. From the main menu, choose "Settings".

In the left hand panel, click "Repositories". If all has gone well, `my-project` will be present in the list, associated with <kbd>Adopt Files</kbd> and <kbd>Delete</kbd> buttons. Click <kbd>Adopt Files</kbd>, then click <kbd>Yes</kbd> to adopt pre-existing files.

The end result is a private repository. If you want it to be public, click on the name of the newly-adopted repository in the list, then click <kbd>Settings</kbd>. Scroll to the bottom of the page into the "Danger Zone" and click <kbd>Make Public</kbd> followed by <kbd>Yes</kbd>.

