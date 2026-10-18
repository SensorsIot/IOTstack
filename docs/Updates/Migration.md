# Migration

## Auto-migration { #auto-migration }

If the internal database does not exist when you launch the menu, the database is:

* Created (ie the schema is defined); and
* Populated from the collection of `menu-config.json` files in the *templates* directory.

At that point, all services are marked "uninstalled" in the database.

If a compose file exists, it implies one of two things, either:

* the menu has run before and the internal database was deleted subsequently; or
* an older menu system created the compose file.

In either case, the menu calls:

``` console
$ docker compose config --services
```

That command merges the compose and override files (if the latter exists) and returns a list of services that would be instantiated in response to a:

``` console
$ docker compose up -d
```

The menu iterates the resulting list of *instantiable* services. If a service is known to IOTstack, it is [migrated](#service-migration) and marked active.

Next, the menu iterates the first-level sub-directories of the *services* directory. If the name of such a sub-directory matches the name of a service known to IOTstack then it implies that a service with that name was installed at some point in the lifecycle of this clone of IOTstack. One of two things will be true. Either:

1. The service was instantiable in your compose file, in which case it will already have been [migrated](#service-migration) and marked active; or

2. It wasn't instantiable in your compose file, in which case the service is [migrated](#service-migration) and marked inactive.

There are subtle weaknesses in this approach which arise if you have:

* added service definitions to your compose file which aren't known to IOTstack (ie there is no template); or

* created your own sub-directories inside the *services* directory:

	- a directory named for a service known to IOTstack but which was not actually created by any version of the menu; or

	- a directory where the name has embedded spaces (eg "this has spaces"). This will be evaluated as three separate directories ("this", "has" and "spaces"), where each word may or may not match the name of a service known to IOTstack.

Nothing stops you from fixing problems of this kind by adding your own templates, or structuring the *services* directory such that the menu does not misinterpret your intentions.

### service migration { #service-migration }

When [auto-migration](#auto-migration) migrates a service, the list of installable items is iterated in the same was as if the service was being installed. There are always three possibilities for each installable item:

1. These conditions hold:

	* the source file is *trackable*; and
	* the destination file exists; and
	* the source and destination files compare same.

	In this situation, the Git commitID of the source file is written into the tracking table as-is. No copying occurs.
	
2. These conditions hold (the first two are the same as above):

	* the source file is *trackable*; and
	* the destination file exists; and
	* the source and destination files compare different.

	In this situation, the Git commitID of the source file is prefixed with "migrate-" before being written into the tracking table. This sentinel causes a subsequent "Update" command to report the service as upgradable. No copying occurs until you upgrade the service.
	
3. In all other situations:

	* if the destination file does not exist, it is installed; and
	* if the item is *trackable*, the Git commitID for the source file is written into the tracking table as-is.

Migrating a service does not install any dependent services. This is on the assumption that those would also be caught by the migration strategy. You can always fix this by reinstalling the service.

## Manual migration { #user-migration }

[Auto-migration](#auto-migration) can only do so much. The problem for the menu is that it can't fully reverse-engineer the complete state of any pre-existing stack and then map everything onto the structures for `iotstack-menu.sh`. Accordingly, after running the menu for the first time, your system will be in the following state:

1. Your original *compose* and (potentially) *override* files will be as they were before you ran the menu. This situation will persist until you tell the menu to `build` your stack, after which your original compose and override files may be renamed with a `.save` extension.

	> If you make changes and run `build` a second time, you risk losing your original *compose* and *override* files so you may want to take the precaution of making backup copies.

2. Your *services* directory will be structured according to `iotstack-menu.sh` conventions. A migration will not overwrite any pre-existing files of the same name (eg `service.yml`) but the service may be marked upgradeable. If you "Upgrade" a service, older files will be renamed `.save` and newer files will be installed.

3. Because of point 2, any given file in the *services* directory may or may not be the same as the service definition in your compose file. There is no substitute for a visual comparison of each service definition from your compose file with its counterpart in the *services* directory. This is also the moment where you should seriously consider placing your customisations in an `override.yml` file.

After starting the menu for the first time, it is incumbent upon you check the result, thoroughly, before building your compose file and starting your stack.

In particular, you should run the "Update" command to see if the menu has found anything that needs to be upgraded. Then, upgrade each such service.

Next, check the *services* directory for `.save` files. Carefully consider each difference, decide whether it is necessary to translate a difference into a customisation, and whether to implement the customisation by editing the relevant primary or override file.

For Node-RED, you should make a note of the add-on nodes you have selected in previous versions of the menu, then configure Node-RED to install those same add-ons. Similar comments apply to other services which are marked "configurable" via the menu.

## network change

Circa June 2022, IOTstack began using the name `iotstack-nextcloud` to describe a private data-communications network between the NextCloud service and its backend Relational Database Management System (MariaDB).

The reason "nextcloud" was adopted as a network name in the first place had everything to do with that service being the first service+database pairing to use a private network for inter-container database communications, than any real consideration as to how this pattern might be applied to future pairings.

Given two or more front-end services, each of which uses a private database back-end running in a separate container, your choices boil down to:

1. Don't bother with a private network;
2. Define a private network with a standard name which all service+database pairs implement; or
3. Define a private network with a unique name per service+database pairing.

In the "real world", by which I mean where distinct hosts are interconnected by physical switches and wire/fibre connections, it often makes sense to implement a high-speed private back-end subnet, expanding to multiple private back-end subnets as scaling requirements dictate. So-called smart switches and VLANs are perfect for this kind of thing.

In the virtual world of the kind implemented by IOTstack, however, everything is typically running on a single host as part of the same Docker stack. It's an all-software environment. Software implements the internal bridged networks. Software makes all the unicast and non-unicast forwarding decisions. Whether it's doing that for a single virtual network or a ton of virtual networks really does not amount to a hill of beans. The capacity limits are those imposed by the host's CPU and RAM, not external networking hardware. All option 3 achieves is to add complexity for zero benefit.

Accordingly, for the purposes of IOTstack, either not bothering at all with a private network, or using a single standard name is equally appropriate, albeit that you may get slightly better database security from not exposing database engines to services that have no business using them. Given that the pattern of a single standard name is established, there is no compelling reason to do away with that in favour of either of the other two options.

However, it is clear from Discord posts that using "nextcloud" as the network name when the user isn't actually running the NextCloud service can be a bit confusing. That's why this implementation of the menu adopts the generic and somewhat more descriptive network name of "database".

