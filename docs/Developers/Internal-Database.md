# Internal Database

The "internal database" is managed by SQLite. The primary reference for the SQLite3 Relational Database Management System (RDBMS) is:

* [www.sqlite.org](https://www.sqlite.org)

If you want to understand this design choice, please see [why SQLite?](#sqlite-vs-jq)

## database location

The internal database is located at:

```
~/IOTstack/services/.menu.db
```

The database is created automatically if it is not present when the menu launches.

## database repair

If you suspect a problem with the internal database (eg you have made a change to a JSON file and the database is out of sync), try running:

``` console
$ ./iotstack-menu reload
```

It is also safe to remove the internal database. It will be recreated the next time the menu runs.

## tables

### components table { #theory-db-components }

| component   | commitID   |
|-------------|------------|
| «component» | «commitID» |

This table tracks structural changes:

* The `menu` component refers to `./iotstack-menu.sh`. This is the menu tracking changes to itself. At present, this is implemented but behaves as a no-op reserved for future expansion.

* The `templates` component refers to the *templates* directory as a whole. Any changes within this directory will show up as a change of commit&nbsp;ID and trigger a database reload. The associated `«commitID»` is updated whenever the internal database is reloaded.

* The names of the tracked structural files (header and trailer). Any change on GitHub that affects a structural file will show up as a change of commit&nbsp;ID, and that will cause the menu to recommend a *renovation*.

### services table { #theory-db-services }

| name      | stateID   | config             |
|-----------|-----------|--------------------|
| «service» | «stateID» | «menu-config.json» |

* `«service»` is the name of the service (eg `nodered`)
* `«stateID»` has the same definition as the `stateID` column in the `status` table (below)
* `«menu-config.json»` is the raw contents of the service's `menu-config.json` as a text string.

### status table { #theory-db-status }

This is an internal lookup table which should be treated as read-only. It is used in JOIN operations. The literal contents are:

| stateID | abbrev | state       |
|:-------:|:------:|-------------|
|0        |  –     | uninstalled |
|1        |  A     | active      |
|2        |  I     | inactive    |
|3        |  U     | unknown     |

### tracking table { #theory-db-tracking }

This table tracks changes to files within a service's template. Only files associated with installed services (active or inactive) are tracked. If Git reports a different commit&nbsp;ID for a file than the one stored in the internal database, the menu concludes that the service is a candidate for being upgraded. The `«commitID»` is updated each time the associated file is copied from the service's template into its *services* sub-directory.

| name      | template | commitID   |
|-----------|----------|------------|
| «service» | «file»   | «commitID» |

* `«service»` is the name of the service (eg `nodered`)
* `«file»` is the name of a file within the service's template directory
* `«commitID»` is the Git commit&nbsp;ID of `«file»` when the file was last copied.

Note:

* `«service»`+`«file»` has a UNIQUE constraint. In other tables the left-most column is the primary key.

## quoting strings { #quoting-strings }

The menu is a `bash` script where calls to SQLite are embedded in `bash` functions. As a result, you will see a both single and double quote marks.

The basic rules are that SQLite requires string literals to be enclosed in single quotes, whereas `bash` will peer inside and interpolate within double-quoted strings but will leave single-quoted strings alone.

Consider this function:

``` bash
version_for_component() {
	${SQLITE3} "${DB}" <<-SQL
		SELECT
			commitID
		FROM
			components
		WHERE
			component = '${1}'
		;
	SQL
}
```

The "heredoc" (`<<-`) section is evaluated by `bash`, which sees:

``` bash
${SQLITE3} "${DB}" <<-SQL
	«body»
SQL
```

The double quotes on `"${DB}"` allow `bash` to peer inside and replace `${DB}` with the path to the internal database. The quotes are protective against embedded spaces in the path.

The *absence* of quotes around the `SQL` *heredoc delimiter* means `bash` can also peer inside the `«body»` where it (mostly) completely ignores quotes. It will replace `${1}` with the *component* argument while leaving the surrounding single quotes in place. When the completed `«body»` is passed to SQLite3, it will see the single quotes surrounding the literal string and be happy.

Most of the time you can simply follow this pattern of double
quotes outside `«body»`, single quotes inside. But there are exceptions. Here are two opposing examples:

``` bash
add_record_for_service() {
	${SQLITE3} "${DB}" <<-SQL
		INSERT INTO services
			(name, config)
		VALUES (
			'${1}',
			json(readfile('${2}'))
		);
	SQL
	return $?
}
```

That follows the rules given above. Single quotes are used because both `json()` and `readfile()` are SQLite functions. On the other hand, the excerpt below comes from ` initialise_database()`:

``` bash
initialise_database() {

	# sense database already exists
	[ -f "${DB}" ] ; local EXISTS=$?

	${SQLITE3} "${DB}" <<-SCHEMA

		...

		/* seed structural components table */
		INSERT OR IGNORE INTO components VALUES (
		  'menu', '$(commitID_for_path "${PROJECT_DIR}/${SCRIPT}")'
		);

		...

	SCHEMA

	...

}
```

In this case, the interesting line is:

``` bash
'menu', '$(commitID_for_path "${PROJECT_DIR}/${SCRIPT}")'
```

The `$(«expression»)` construction is processed by `bash`. The `${PROJECT_DIR}/${SCRIPT}` argument is enclosed in double quotes so that the path can be expanded by `bash`, then passed to `commitID_for_path()` which is a `bash` function.

The result of the `$(«expression»)` construction is a literal string which needs to be passed to SQLite, so the whole thing is encapsulated in single quotes.

It makes sense once you get the hang of it. But here's the problem any wary developer needs to consider. Older versions of SQLite mostly allow either single or double quotes to wrap literal strings. It is only recent versions that are strict about single quotes. Thus, if you change anything, please test it on the most-recent release of SQLite. PiBuilder has a [helper script](https://github.com/Paraphraser/PiBuilder/blob/master/boot/scripts/helpers/install_sqlite.sh) which will allow you to install the current release of SQLite3 in parallel with whatever version was supplied via `apt`. At the time of writing:

* the `apt` version on Bookworm was 3.40.1 2022-12-28;
* the `apt` version on Trixie was 3.46.1 2024-08-13; and
* the latest release was 3.51.2 2026-01-09.

## interesting query functions

These functions are "interesting" because of their *structure*, not because of what they do.

### queries returning simple values

#### query returning a single value

Example function: `configuration_script_for_service()`

This function takes takes the service name as an argument and returns either the name of the configuration script, or a null string if no configuration script is defined for the service.

The result can be used directly:

``` bash
if [ -n "$(configuration_script_for_service "example")" ] ; then
	echo "example is configurable"
fi
```

#### query returning a list of values

Example function: `all_services()`

This function takes no arguments and returns an ordered list of service names that are known to the database. The result can be used directly:

``` bash
for S in $(all_services) ; do
	echo "$S"
done
```

If the result is empty, the `for` loop is skipped.

### queries returning tuples

For the menu, a *tuple* is an ordered series of values separated using the "»" character (Unicode U+00BB aka *right guillemet*).

The tuple structure is used for efficiency because it avoids running multiple queries to fetch related values.

#### query returning a single tuple

Example function: `status()`

This function takes the service name as an argument and returns a single tuple:

```
STATUS»DESCRIPTION»CONFIGURABLE
```

where:

* `STATUS` is one of {"uninstalled", "active", "inactive"}

* `DESCRIPTION` is the [descriptive text](./Add-Service.md#json_description) for the service; and

* `CONFIGURABLE` is one of {"yes", "no"}.

To make use of a tuple, `bash` needs to split it into its component fields. The pattern is:

``` bash
# crack the tuple
IFS="»" ; set -- $ITEM ; unset IFS

# extract tuple components
STATUS="${1}" ; DESCRIPTION="${2}" ; CONFIGURABLE="${3}"

# do something with the components ...
```

#### query returning a list of tuples

Example function: `installable_items_for_service()`

This function takes the service name as an argument and returns a list of tuples, arranged as one tuple per item to be installed.

Consider the following directory structure for an example service:

```
└── .templates
    └── example
        ├── menu-config.json
        └── service.yml
```

We can assume that that structure was created when IOTstack was cloned from GitHub. Next, assume that [`menu-config.json`](./Add-Service.md#json_install) contains:

``` json
"install": [
   { "template": "service.yml", "service": "service.yml", "tracked": true }
],
```

Invoking this function for the "example" service returns:

```
service.yml»service.yml»1
```

It is better to think of that data structure using its JSON labels:

```
TEMPLATE»SERVICE»TRACKED
```

where:

* `TEMPLATE` is a field containing the name of the file, relative to the service's template directory:

	```
	./.templates/example/service.yml
	```

* `SERVICE` is a field containing the name of the file, relative to the service's services directory:

	```
	./services/example/service.yml
	```
	
* `TRACKED` is a field containing a (traditional) Boolean concept where `0` (false) means "not tracked" and `1` (true) means "tracked".

To make use of a tuple, `bash` needs to split it into its component fields. The pattern is:

``` bash
# fetch the list of tuples
ITEMS=$(installable_items_for_service "example")

# iterate the list of tuples
for ITEM in $ITEMS ; do

	# crack the tuple
	IFS="»" ; set -- $ITEM ; unset IFS

	# extract tuple components
	TNAME="${1}" ; SNAME="${2}" ; TRACKED=${3}

	# do things with the extracted fields ...

done
```

If `ITEMS` is a null string, the `for` loop is skipped.

## why SQLite? { #sqlite-vs-jq }

The astute reader may be asking the question:

> If the internal database is just storing the JSON as TEXT, why bother with SQLite? Why not just use `jq`?

Answer: performance! The first incarnation of this menu used `jq` but it proved to be horrendously ***slow*** on Debian systems. Consider the following test scenarios:

1. A `bash` script which uses SQLite3 to create and populate a database containing the contents of a single `menu-config.json` file, then runs iterations of a (`bash`) for-loop where each iteration executes:

	``` console
	$ sqlite3 db "SELECT json_extract(config,'$.description') FROM services WHERE service = 'example';"
	```

2. A `bash` script running iterations of a (`bash`) for-loop where each iteration executes:

	``` console
	$ jq -r .description <menu-config.json
	```

Test 1 incurs the small overhead of creating the database but it stores the JSON "as is" (ie it is not pre-parsed by SQLite in some way). Test 2 does not have any pre-loop overheads. Test 1 needs to open the database on each iteration whereas Test 2 needs to open the JSON file on each iteration. Other than that, both tests are fetching the same value from the same JSON on each iteration. All other things being equal, these two tests should consume approximately the same compute resources.

IOTstack currently has about 60 service definitions so 60 iterations of each for-loop approximates the workload that is required to load the list of services for display in the Services menu.

On a Raspberry Pi 4 running Bookworm, the results were:

|Test | Engine         | milliseconds |
|:---:|:---------------|-------------:|
|1    | sqlite3 3.50.2 |          346 |
|2    | jq-1.6         |        6,321 |

This is neither a typo nor a joke. It is a fair apples-v-apples test. It takes `jq` 6&nbsp;**seconds** vs <!--1third-->&#x2153; of a second for `sqlite3` to perform the same task. That's a ratio of around 18:1. It's a little better on a Pi5 (130&nbsp;ms vs 2&nbsp;seconds) but still around 18:1.

Why is `jq` so slow? Research suggest's there's a two-part problem:

* The intrinsic slowness appears to have been the result of a change introduced in `jq` v1.6, and which is discussed in [issue 1826](https://github.com/jqlang/jq/issues/1826); plus

* It seems that nobody in the `jq` distribution chain has taken responsibility for submitting later releases of the `jq` binary to the `apt` repositories. The `apk` repositories for Alpine etc are up-to-date so it isn't clear why Debian-lineage distros are missing out.

In other words, pre-Trixie Debian systems seem to be stuck with `jq` version 1.6 which was released on 2018-11-02. Trixie fares slightly better with version 1.7 which was released on 2023-09-07. At the time of writing, v1.8.1 is the latest version of `jq` and was released on 2025-07-01. It is, of course, possible to install later versions manually. Repeating the second test:

|Test | Engine         | milliseconds |
|:---:|:---------------|-------------:|
|2    | jq-1.7         |          484 |
|2    | jq-1.8.1       |          422 |

If Debian had been getting v1.8.1 by default, I doubt that I would ever have considered refactoring the code around SQLite. Now that it's done, I'm not going back. While this may be my SQL experience speaking, I actually find the current approach easier to understand.

