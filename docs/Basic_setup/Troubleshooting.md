
## Resources

*   Search github [issues](https://github.com/SensorsIot/IOTstack/issues?q=).

    - Closed issues or pull-requests may also have valuable hints.

*   Ask questions on [IOTStack Discord](https://discord.gg/ZpKHnks). Or report
    how you were able to fix a problem.

*   There are over 40 gists about IOTstack. These address a diverse range of
    topics from small convenience scripts to complete guides. These are
    individual contributions that aren't reviewed.

    You can add your own keywords into the search:
    [https://gist.github.com/search?q=iotstack](https://gist.github.com/search?q=iotstack)

## Needing to use `sudo` to run docker commands

You should never (repeat **never**) use `sudo` to run docker or docker compose commands. Forcing docker to do something with `sudo` almost always creates more problems than it solves. Please see [What is sudo?](https://sensorsiot.github.io/IOTstack/Basic_setup/What-is-sudo/) to understand how `sudo` actually works.

If `docker` or `docker compose` commands *seem* to need elevated privileges, the most likely explanation is incorrect group membership. Please read the [next section](#dockerGroup) about errors involving `docker.sock`. The solution (two `usermod` commands) is the same.

If, however, the current user *is* a member of the `docker` group *but* you still get error responses that *seem* to imply a need for `sudo`, it implies that something fundamental is broken. Rather than resorting to `sudo`, you are better advised to rebuild your system.

## Errors involving `docker.sock` { #dockerGroup }

If you encounter permission errors that mention `/var/run/docker.sock`, the most likely explanation is the current user (usually "pi") not being a member of the "docker" group.

You can check membership with the `groups` command:

``` console
$ groups
pi adm dialout cdrom sudo audio video plugdev games users input render netdev bluetooth lpadmin docker gpio i2c spi
```

In that list, you should expect to see both `bluetooth` and `docker`. If you do not, you can fix the problem like this:

``` console
$ sudo usermod -G docker -a $USER
$ sudo usermod -G bluetooth -a $USER
$ exit
```

The `exit` statement is **required**. You must logout and login again for the two `usermod` commands to take effect. An alternative is to reboot.

## System freezes or SSD problems

You should read this section if you experience any of the following problems:

* Apparent system hangs, particularly if Docker containers were running at the time the system was shutdown or rebooted;
* Much slower than expected performance when reading/writing your SSD; or
* Suspected data-corruption on your SSD.

### Try a USB2 port

Start by shutting down your Pi and moving your SSD to one of the USB2 ports. The slower speed will often alleviate the problem.

Tips:

1. If you don't have sufficient control to issue a shutdown and/or your Pi won't shut down cleanly:

	- remove power
	- move the SSD to a USB2 port
	- apply power again.

2. If you run "headless" and find that the Pi responds to pings but you can't connect via SSH:

	- remove power
	- connect the SSD to a support platform (Linux, macOS, Windows)
	- create a file named "ssh" at the top level of the boot partition
	- eject the SSD from your support platform
	- connect the SSD to a USB2 port on your Pi
	- apply power again.

### Check the `dhcpcd` patch

Next, verify that the [dhcpcd patch](https://sensorsiot.github.io/IOTstack/Basic_setup/#patch-1-restrict-dhcp) is installed. There seems to be a timing component to the deadlock which is why it can be *alleviated*, to some extent, by switching the SSD to a USB2 port.

If the `dhcpcd` patch was not installed but you have just installed it, try returning the SSD to a USB3 port.

### Try a quirks string

If problems persist even when the `dhcpcd` patch is in place, you *may* have an SSD which isn't up to the Raspberry Pi's expectations. Try the following:

1. If your IOTstack is running, take it down.
2. If your SSD is attached to a USB3 port, shut down your Pi, move the SSD to a USB2 port, and apply power.
3. Run the following command:

	``` console
	$ dmesg | grep "\] usb [[:digit:]]-"
	```
 
	In the output, identify your SSD. Example:

	```
	[    1.814248] usb 2-1: new SuperSpeed Gen 1 USB device number 2 using xhci_hcd
	[    1.847688] usb 2-1: New USB device found, idVendor=f0a1, idProduct=f1b2, bcdDevice= 1.00
	[    1.847708] usb 2-1: New USB device strings: Mfr=99, Product=88, SerialNumber=77
	[    1.847723] usb 2-1: Product: Blazing Fast SSD
	[    1.847736] usb 2-1: Manufacturer: Suspect Drives
	```

	In the above output, the second line contains the Vendor and Product codes that you need:

	* `idVendor=f0a1`
	* `idProduct=f1b2`

4. Substitute the values of *«idVendor»* and *«idProduct»* into the following command template:

	``` console
	sed -i.bak '1s/^/usb-storage.quirks=«idVendor»:«idProduct»:u /' "$CMDLINE"
	```

	This is known as a "quirks string". Given the `dmesg` output above, the string would be:

	``` console
	sed -i.bak '1s/^/usb-storage.quirks=f0a1:f1b2:u /' "$CMDLINE"
	```

	Make sure that you keep the <kbd>space</kbd> between the `:u` and `/'`. You risk breaking your system if that <kbd>space</kbd> is not there.

5. Run these commands - the second line is the one you prepared in step 4 using `sudo`:

	``` console
	$ CMDLINE="/boot/firmware/cmdline.txt" && [ -e "$CMDLINE" ] || CMDLINE="/boot/cmdline.txt"
	$ sudo sed -i.bak '1s/^/usb-storage.quirks=f0a1:f1b2:u /' "$CMDLINE"
	```

	The command:

	- makes a backup copy of `cmdline.txt` as `cmdline.txt.bak`
	- inserts the quirks string at the start of `cmdline.txt`.

	You can confirm the result as follows:

	* display the original (baseline reference):

		```
		$ cat "$CMDLINE.bak"
		console=serial0,115200 console=tty1 root=PARTUUID=06c69364-02 rootfstype=ext4 fsck.repair=yes rootwait quiet splash plymouth.ignore-serial-consoles
		```

	* display the modified version:

		```
		$ cat "$CMDLINE"
		usb-storage.quirks=f0a1:f1b2:u console=serial0,115200 console=tty1 root=PARTUUID=06c69364-02 rootfstype=ext4 fsck.repair=yes rootwait quiet splash plymouth.ignore-serial-consoles
		```

6. Shutdown your Pi.
7. Connect your SSD to a USB3 port and apply power.

There is more information about this problem [on the Raspberry Pi forum](https://forums.raspberrypi.com/viewtopic.php?t=245931&sid=66012d5cf824004bbb414cb84874c8a4).

## Getting a clean slate

If you create a mess and can't see how to recover, try proceeding like this:

``` console
$ cd ~/IOTstack
$ docker compose down
$ cd
$ mv IOTstack IOTstack.old
$ git clone https://github.com/SensorsIot/IOTstack.git IOTstack
```

In words:

1. Be in the right directory.
2. Take the stack down.
3. The `cd` command without any arguments changes your working directory to
   your home directory (variously known as `~` or `$HOME` or `/home/pi`).
4. Move your existing IOTstack directory out of the way. If you get a
   permissions problem:

    * Re-try the command with `sudo`; and
    * Read [a word about the `sudo` command](What-is-sudo.md). Needing `sudo`
      in this situation is an example of over-using `sudo`.

5. Check out a clean copy of IOTstack.

Now, you have a clean slate and can start afresh by running the menu:

``` console
$ cd ~/IOTstack
$ ./menu.sh
```

The `IOTstack.old` directory remains available as a reference for as long as
you need it. Once you have no further use for it, you can clean it up via:

``` console
$ cd
$ sudo rm -rf ./IOTstack.old # (1)
```

1. The `sudo` command is needed in this situation because some files and
   folders (eg the "volumes" directory and most of its contents) are owned by
   root.
