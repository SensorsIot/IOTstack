# PostgreSQL

## References

- [Docker image](https://hub.docker.com/_/postgres)
- [Postgre SQL Homepage](https://www.postgresql.org/)
- [Postgre SQL docs](https://www.postgresql.org/docs/current/index.html)

## About

PostgreSQL is an SQL server, for those that need an SQL database.

The database is available on port `5432`

## Configuration

The service definition includes the following environment variables:

* `TZ` your timezone. Defaults to `Etc/UTC`
* `POSTGRES_USER`. Initial username. Defaults to `postuser`.
* <a name="postgrespw"></a>`POSTGRES_PASSWORD`. Initial password associated with initial username. Defaults to `IOtSt4ckpostgresDbPw` (`postpassword` for old menu).
* `POSTGRES_DB`. Initial database. Defaults to `postdb`.

You can either edit the environment variables directly or provide your own substitutes by editing `~/IOTstack/.env`. Example:

``` console
$ cat ~/IOTstack/.env
TZ=Australia/Sydney
POSTGRES_PASSWORD=oneTwoThree
```

When the container is brought up:

* `TZ` will have the value `Australia/Sydney` (from `.env`)
* `POSTGRES_PASSWORD` will have the value `oneTwoThree` (from `.env`)
* `POSTGRES_USER` will have the value `postuser` (the default); and
* `POSTGRES_DB` will have the value `postdb` (the default).

The `TZ` variable takes effect every time the container is brought up. The other environment variables only work the first time the container is brought up.

It is highly recommended to select your own password before you launch the container for the first time. See also [Getting a clean slate](#cleanSlate).

## Management

You can interact with the PostgreSQL Relational Database Management System running in the container via its `psql` command. You can invoke `psql` like this:

``` console
$ docker exec -it postgres bash -c 'PGPASSWORD=$POSTGRES_PASSWORD psql $POSTGRES_DB $POSTGRES_USER'
```

> Because of the single quotes (<kbd>'</kbd>) surrounding everything after the `-c`, expansion of the environment variables is deferred until the command is executed *inside* the container.

You can use any of the following methods to exit `psql`:

* Type "\q" and press <kbd>return</kbd>
* Type "exit" and press <kbd>return</kbd>
* Press <kbd>control</kbd>+<kbd>D</kbd>

### password change

Once you have logged into `psql` you can reset the password like this:

``` sql
# ALTER USER «user» WITH PASSWORD '«password»';
```

Replace:

* `«user»` with the username (eg the default username is `postuser`)
* `«password»` with your new password.

Notes:

* Changing the password via the `ALTER` command does **not** update the value of the [`POSTGRES_PASSWORD`](#postgrespw) environment variable. You need to do that by hand.
* Whenever you make a change to a running container's environment variables, the changes will not take effect until you re-create the container by running:

	``` console
	$ cd ~/IOTstack
	$ docker compose up -d postgres
	```

## Postgres v17 to v18 migration  { #v1718migration }

Prior to Postgres v17, the external path to the persistent store holding the database file structures was at:

```
~/IOTstack/volumes/postgres/data
```

Inside the container, that mapped to the following path, which is also where your database files were located:

```
/var/lib/postgresql/data
```

Prior to October 2025, the service definition for Postgres provided with IOTstack contained:

``` yaml
    image: postgres
```

That is a synonym for:

``` yaml
    image: postgres:latest
```

Postgres v18 was released on September 26, 2025. If you are running Postgres v17 and "pull" the latest image from DockerHub after that date, you will get v18. When you try to instantiate the v18 image, you will get this error:

```
Error response from daemon: failed to create task for container: failed
to create shim task: OCI runtime create failed: runc create failed:
unable to start container process: error during container init: error
mounting "/home/pi/IOTstack/volumes/postgres/data" to rootfs at
"/var/lib/postgresql/data": change mount propagation through procfd:
open o_path procfd: open
/var/lib/docker/overlay2/«hex string»/merged/var/lib/postgresql/data:
no such file or directory: unknown
```

### Fixing the immediate problem

To resolve that error and restore access to your database, you need to revert to Postgres v17. Proceed like this:

1. Move into the correct directory:

	``` console
	$ cd ~/IOTstack
	```

2. Stop the (broken) container:

	``` console
	$ docker compose down postgres
	```

3. Use your favourite text editor to open `docker-compose.yml`.

	Find the `image` clause and change it to be:

	``` yaml
	image: postgres:17
	```

	Save your work.

4. Start the container again:

	``` console
	$ docker compose up -d postgres
	```

	The container should start normally and you regain access to your databases.

### Anonymous volume mounts

One side-effect of upgrading a v17 directory structure to v18 is that Docker creates an anonymous volume mount.

Anonymous volume mounts are the result of:

1. A `VOLUME` declaration in the Dockerfile used to create the image; and
2. Launching the container *without* providing a corresponding volume or bind mount mapping.

As such, and depending on the age of your system and your propensity to experiment with Docker containers, you may find that you have multiple anonymous volume mounts of which you were previously unaware.

Anonymous volume mounts persist on your system until you remove them. They are of use to the containers that created them while those containers are running but they are not re-attached when the container is re-created. They simply occupy disk space, indefinately, for no benefit.

Removing an anonymous volume mount is a two-step process:

1. List the anonymous volume mounts:

	``` console
	$ docker volume ls --filter "dangling=true" 
	```

	You can expect to see something like this:

	```
	DRIVER    VOLUME NAME
	local     6c2862fdbc36187c0e858be7d8ebb81c653b796f2158f450136a00e7c8eca62d
	```

	A 64-character hexadecimal string in the `VOLUME NAME` column is the signature of an anonymous volume mount.

	Note:

	* The list may also contain rows where the `VOLUME NAME` is not a 64-character hexadecimal string. Those are *named* volume mounts. By convention, IOTstack does not use named volume mounts so those *may* be the results of previous experiments with Docker containers. If you do not recognise a named volume mount then you can consider removing it along with any anonymous volume mounts.

2. For each anonymous volume mount, remove it by passing the 64-character hexadecimal string. For example:

		``` console
		$ docker volume rm 6c2862fdbc36187c0e858be7d8ebb81c653b796f2158f450136a00e7c8eca62d
		```

### Migrating to v18

When you are ready to migrate to Postgres v18, proceed like this:

1. Move into the correct directory:

	``` console
	$ cd ~/IOTstack
	```

2. Take a backup of your databases:

	``` console
	$ docker exec postgres bash -c 'pg_dumpall -U $POSTGRES_USER | gzip >/backup/postgres_backup.sql.gz'
	```

3. Stop the v17 Postgres container:

	```
	$ docker compose down postgres
	```

4. Use your favourite text editor to open `docker-compose.yml` and make the following changes:

	1. Find the `image` clause and change it to be:

		``` yaml
		image: postgres:18
		```

	2. The first two lines of the `volumes:` clause look like this:

		``` yaml
		volumes:
		  - ./volumes/postgres/data:/var/lib/postgresql/data
		```

		Change the second line to look like this:

		``` yaml
		  - ./volumes/postgres/data:/var/lib/postgresql
		```

	3. Save your work.

4. Carefully (repeat **carefully**) remove the `data` portion of the Postgres container's persistent store:

	``` console
	$ sudo rm -rf ./volumes/postgres/data
	```

	Key point:

	* Do **not** remove `./volumes/postgres` because that will also destroy your backup.

5. Start the container:

	``` console
	$ docker compose up -d postgres
	```

	This will instantiate v18 and create a new, empty database structure.

6. Restore your data:

	```
	$ docker exec postgres bash -c 'gunzip -c /backup/postgres_backup.sql.gz | psql -U $POSTGRES_USER postgres'
	```

After the migration, the external path to the persistent store remains unchanged at:

```
~/IOTstack/volumes/postgres/data
```

Within the container, that path maps to:

```
/var/lib/postgresql
```

However, that path is not where your database files are located. Instead, the files are at the internal path:

```
/var/lib/postgresql/18/docker
```

which maps to the external path:

```
~/IOTstack/volumes/postgres/data/18/docker
```

### Postgres v19 and beyond

I recommend leaving `image: postgres:18` in place. That way, you are unlikely to be surprised when Postgres is upgraded to v19. It *may* be that v19 will silently handle the v18-to-v19 upgrade. On the other hand, you *may* need to adopt the approach shown above:

* Take a backup of your data.
* Down the container.
* Hand-edit your compose file to `image: postgres:19`
* Remove the `data` portion of the persistent store.
* Up the container.
* Restore your data.

## Getting a clean slate { #cleanSlate }

If you need to start over, proceed like this:

``` console
$ cd ~/IOTstack
$ docker-compose down postgres
$ sudo rm -rf ./volumes/postgres
$ docker-compose up -d postgres
```

> see also [if downing a container doesn't work](../Basic_setup/index.md/#downContainer)
