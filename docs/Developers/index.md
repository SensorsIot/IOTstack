# Developers

## References

* [Build Stack Services](BuildStack-Services.md)
* [Default network ports and modes](../Basic_setup/Default-Configs.md)
* [IOTstack issues](https://github.com/SensorsIot/IOTstack/issues)

## Basic code structure

1. A check to ensure the script has not been launched using `sudo`. This is a common user mistake and it creates chaos so the situation is best avoided.

2. Another common problem is caused by trying to invoke the menu with other than `./iotstack-menu.sh` syntax so this is checked too.

3. A whole series of variable definitions which are, essentially, constants.

4. Git utility function(s). Only one at the moment which fetches the commitID for a path under Git control.

5. SQLite utility functions. See [Internal Database](./Internal-Database.md) for more information.

6. Command helper functions.

7. Code-completion helper functions.

8. Functions which implement command-line commands. For example the `activate` command invokes the `activate()` function, the `deactivate` command the `deactivate()` function, and so on. Note that both commands and function names are lower case.

9. Initialisation code:

	- `discover_services()`
	- `migrate()` and `auto_migration()`
	- `initialise_database()` - schema definition
	- `initialise_headers_and_footers()` - structural
	- `needs_renovation()`

10. Main code which performs command-line processing (including `bash` completion) in the presence of  arguments, otherwise falling through to TUI menu mode.

11. TUI menu mode code where functions which implement verbs are defined using a leading upper-case letter. For example, the "Activate" menu command invokes the `Activate()` function. In many cases, a capitalised function simply invokes the lower-case function of the same name, passing it the service name. For example:

	``` bash
	Activate() {
		activate "${1}"
	}
	```

These code divisions are not necessarily absolute. In some cases, a function was placed where it seemed to fit best at the time.

### exported variables and functions

Where an environment variable or function is associated with the `export` command, this is a strong indication that the variable/function is being made available to a configuration script.

### configuration scripts

See the example script at:

```
~/IOTstack/.templates/example_template/configure-example.sh
```

At the time of writing, the following containers had configuration scripts which may also be worth studying:

* Deconz
* Node-RED
* Zigbee2MQTT

## Debugging

### Inline development

To set up your environment for debugging functions and code snippets:

1. Be in your IOTstack development directory. For example:

	``` console
	$ cd ~/IOTstack
	```
	
2. Define this as your project directory

	``` console
	$ PROJECT_DIR=$PWD
	```
	
3. Select all the lines of text in `iotstack-menu.sh` from `SQLITE3=` down to `export MENU_LINES=24`, copy those to the clipboard, then paste the clipboard inline in your terminal window.

After that, you can edit/copy/paste functions and other lines of code and have a reasonable chance that they will work "as is".

### log file

You need to treat both `stdout` and `stderr` as reserved file handles. If you start writing debugging messages to either, you are likely to wind up breaking menus.

The solution is a dedicated logging file. For example:

```
echo "got to here" >>debug.log
```

Don't forget to remove those lines before creating a pull request.

## Beware linters bearing false gifts

As you examine `iotstack-menu.sh` you may **think** you have identified dead code. For example, the only place the `activate()` function is called is from the  `Activate()` function, and the latter does not seem to be called at all.

That is because all such invocations are dynamic and command-driven. In other words, when the user types:

```
$ ./iotstack-menu.sh activate
```

it is the **existence** of the `activate()` function which determines that the `activate` verb is valid. Similarly, when a Services menu contains the "Activate" command, that command's ability to be executed depends on whether the `Activate()` function exists.

In short, please don't assume that your eyeballs, a linter, or even an AI analysis tool is correct when flagging something as "dead" code. The code may be very much alive!

## Defining a new service

* See [Defining a new service](./Add-Service.md)

## Contributing

We welcome pull-requests.

For larger contributions, please open an issue describing your idea. It may provide valuable discussion and feedback. It also prevents the unfortunate case of two persons working on the same thing. There's no need to wait for any approval.

!!! check "Development guidelines"
    * It-just-works - use good defaults that will work well for a first time user
    * Keep-it-simple - try to keep stuff beginner-friendly and don't go too
      deep into advanced topics

## Writing documentation

!!! tip inline end
    For simple changes you can straight-up just use the edit link available on
    every documentation page. It's the pen-icon to the right of the top
    heading. Write your changes, check the preview-tab everything looks as
    expected and submit as proposed changes.

Documentation is written as markdown, processed using `mkdocs` ([docs](https://www.mkdocs.org/user-guide/writing-your-docs/#writing-your-docs)) and the Material theme ([docs](https://squidfunk.github.io/mkdocs-material/reference/)). The Material theme is not just styling, but provides additional syntax extensions.

To test your local changes while writing them and before making a pull-request, you can start a local `mkdocs` server. You have two options:

* If the host where `mkdocs` is running has a GUI capable of running a browser:

	1. Run the commands:

		``` console
		$ cd ~/IOTstack
		$ mkdocs serve -a localhost:7999 &
		```

	2. Open [http://localhost:7999/](http://localhost:7999/) in a browser running on the **same** machine.

	3. When you are done, terminate the mkdocs process:

		``` console
		$ kill %1
		```

* If the host where `mkdocs` is running is **not** capable of running a browser:

	1. Run the commands:

		``` console
		$ cd ~/IOTstack
		$ mkdocs serve -a 0.0.0.0:7999 &
		```

	2. From a browser on another machine, open a URL in the form:

		```
		http://«hostOrIP»:7999/
		```

		where `«hostOrIP»` is one of:

		* the IP address of the host where `mkdocs` is running; or
		* the fully-qualified domain name of that host; or
		* the multicast domain name of that host.

	3. When you are done, terminate the mkdocs process:

		``` console
		$ kill %1
		```

In either case, you should pay attention to any error messages displayed by `mkdocs`. The port number 7999 has been chosen because it does not currently conflict with any IOTstack service which may also be running on the same machine. If you are developing a new service, please try to avoid 7999.

## Other checks

1. Do not require user to edit config files in order to get a service running. Well-designed containers start "out of the box" and apply configuration settings passed via environment variables.

	A container that only supports "config files" (thereby requiring the user to set up the config file before first launch) is pretty much the hallmark of a design that could benefit from more work. If you are trying to add such a container, please study the IOTstack implementation of Mosquitto for an example of how to augment an existing image so that it *will* start "out of the box".

2. Ensure that your service can be backed up and restored without errors or data loss. See also [IOTstackBackup](https://github.com/Paraphraser/IOTstackBackup).

3. Push the changes to your fork. Create a cross repo PR for the mods to review. We may request additional changes from you.

## Commit message

```
service_name: Add/Fix/Change feature or bug summary

Optional longer description of the commit. What is changed and why it
is changed. Wrap at 72 characters.

* You can use markdown formating as this will automatically be the
  description of your pull-request.
* End by adding any issues this commit fixes, one per line:

Fixes #1234
Fixes #4567
```

1.  The first line is a short description. Keep it short, aim for 50
    characters. This is like the subject of an email. It shouldn't try to fully
    or uniquely describe what the commit does. More importantly it should aim
    to inform *why* this commit was made.

    `service_name` - service or project-part being changed, e.g. influxdb,
    grafana, docs. Documentation changes should use the the name of the
    service. Use `docs` if it's changes to general documentation. If all else
    fails, use the folder-name of the file you are changing. Use lowercase.

    `Add/Fix/Change` - what type of an change this commit is. Capitalized.

    `feature or bug summary` - free very short text giving an idea of why/what.

2. Empty line.

3. A longer description of what and why. Wrapped to 72 characters.

    Use [github issue linking](
    https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)
    to automatically close issues when the pull-request of this commit is
    merged.

For tips on how to use git, see [Git Setup](Git-Setup.md).

## Follow up

If your new service is approved and merged then congratulations! Please watch the Issues page on github over the next few days and weeks to see if any users have questions or issues with your new service.
