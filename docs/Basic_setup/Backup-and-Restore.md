# Backing up and restoring IOTstack
This page explains how to use the backup and restore functionality of IOTstack.

## Backup
The backup command can be executed from IOTstack's menu, or from a cronjob.

To ensure that all your data is saved correctly, the stack has to be stopped.
This is mainly due to databases potentially being in a state that could cause
data loss.

There are 2 ways to run backups:

* From the menu: `Backup and Restore` > `Run backup`
* Running the following command: `bash ./scripts/backup.sh`

The command that's run from the command line can also be executed from crontab:

```
0 2 * * * cd /home/pi/IOTstack && /bin/bash ./scripts/backup.sh
```

The current directory of bash must be in IOTstack's directory, to ensure that it can find the relative paths of the files it's meant to back up. In the example above, it's assume that it's inside the `pi` user's home directory.

**Usage:**
``` console
$ ~/IOTstack/scripts/backup.sh {TYPE}
```

**Types:**

1.  Backup with Date. Backup to filename with the date and time the backup was
    started.
2.  Rolling Date. Filename will based on the day of the week (0-6) the backup
    was started.  New backups will overwrite old ones.
3.  Both

You can find the backups in the `~/IOTstack/backups/` folder. With rolling
being in `~/IOTstack/backups/rolling/` and date backups in
`~/IOTstack/backups/backup/`. Log files can also be found in the logs/
directory.

**Examples:**

-   Regular date & timestamped backup into ~/IOTstack/backup/backups:

    `~/IOTstack/scripts/backup.sh 1`

-   Either these commands will produce backups of both types:

    `~/IOTstack/scripts/backup.sh` or<br />
    `~/IOTstack/scripts/backup.sh 3`


-   Produce a backup into ~/IOTstack/backup/rolling/. It will be called
    'backup_XX.tar.gz' where XX is the current day of the week (as an int):

    `~/IOTstack/scripts/backup.sh 2`

-   (expert use) Usually the backup should be executed without sudo using your
    regular user, as this will automatically produce backups with correct
    permissions.  This will only produce a backup in the rolling folder and
    change all the permissions to the 'pi' user:

    `sudo bash ~/IOTstack/scripts/backup.sh 2 pi`

## Restore
There are 2 ways to run a restore:

* From the menu: `Backup and Restore` > `Restore from backup`
* Running the following command: `bash ./scripts/restore.sh`

**Important**: The restore script assumes that the IOTstack directory is fresh, as if it was just cloned. If it is not fresh, errors may occur, or your data may not correctly be restored even if no errors are apparent.

*Note*: It is suggested that you test that your backups can be restored after initially setting up, and anytime you add or remove a service. Major updates to services can also break backups.

**Usage:**
```
./scripts/restore.sh {FILENAME=backup.tar.gz} {noask}
```
The restore script takes 2 arguments:

* Filename: The name of the backup file. The file must be present in the `./backups/` directory, or a subfolder in it. That means it should be moved from `./backups/backup` to `./backups/`, or that you need to specify the `backup` portion of the directory (see examples)
* NoAsk: If a second parameter is present, is acts as setting the no ask flag to true. 

## Pre and post script hooks
The script checks if there are any pre and post back up hooks to execute commands. Both of these files will be included in the backup, and have also been added to the `.gitignore` file, so that they will not be touched when IOTstack updates.

Both of these scripts will be run as root.

### Pre-backup script hook
The pre-backup hook script is executed before any compression happens and before anything is written to the temporary backup manifest file (`./.tmp/backup-list_{{NAME}}.txt`). It can be used to prepare any services (such as databases that IOTstack isn't aware of) for backing up.

To use it, simple create the `~/IOTstack/pre_backup.sh` file. It will be executed next time a backup runs.

### Post-backup script hook { #post-backup }
The post-backup hook script is executed after the backup tarball file has been
written to disk and the stack has been started back up. Any output will be
included in the backup log file.

To use it, simple create the `~/IOTstack/post_backup.sh` file. It will be
executed after the next time a backup runs. It will be provided the backup
.tar.gz as its first argument.

This is useful for triggering transfer of the backup to a cloud or another
server, see below for possible third party integrations as to what is possible.

### Post restore script hook
The post restore hook script is executed after all files have been extracted and written to disk. It can be used to apply permissions that your custom services may require.

To use it, simple create a `./post_restore.sh` file in IOTstack's main directory. It will be executed after a restore happens.

## Third party integration
This section explains how you could backup your files to different
integrations. Actual initiation of the transfer of the backup has to be done
using the [post backup](#post-backup) hook described above.

### IOTstackBackup

[IOTstackBackup](https://github.com/Paraphraser/IOTstackBackup) is a project
aiming to provide a sophisticated all-in-on solution: on-line backups of
databases and configurable transfers to remotes without writing your own
scripts.

### Dropbox
Dropbox-Uploader is a great utility to easily upload data from your Pi to the cloud. https://magpi.raspberrypi.org/articles/dropbox-raspberry-pi. It can be installed from the Menu under Backups.

#### Troubleshoot: Token added incorrectly or install aborted at the token screen

Run `~/Dropbox-Uploader/dropbox_uploader.sh unlink` and if you have added it key then it will prompt you to confirm its removal. If no key was found it will ask you for a new key.

Confirm by running `~/Dropbox-Uploader/dropbox_uploader.sh` it should ask you for your key if you removed it or show you the following prompt if it has the key:

``` console
 $ ~/Dropbox-Uploader/dropbox_uploader.sh
Dropbox Uploader v1.0
Andrea Fabrizi - andrea.fabrizi@gmail.com

Usage: /home/pi/Dropbox-Uploader/dropbox_uploader.sh [PARAMETERS] COMMAND...

Commands:
	 upload   <LOCAL_FILE/DIR ...>  <REMOTE_FILE/DIR>
	 download <REMOTE_FILE/DIR> [LOCAL_FILE/DIR]
	 delete   <REMOTE_FILE/DIR>
	 move     <REMOTE_FILE/DIR> <REMOTE_FILE/DIR>
	 copy     <REMOTE_FILE/DIR> <REMOTE_FILE/DIR>
	 mkdir    <REMOTE_DIR>
....

```

Ensure you **are not** running as sudo as this will store your api in the /root directory as `/root/.dropbox_uploader`

If you ran the command with sudo the remove the old token file if it exists with either `sudo rm /root/.dropbox_uploader` or `sudo ~/Dropbox-Uploader/dropbox_uploader.sh unlink`



### Google Drive
rclone is a program uploading to Google Drive. Install it from the menu then
see [here](
https://medium.com/@artur.klauser/mounting-google-drive-on-raspberry-pi-f5002c7095c2)
for these sections:

* Getting a Google Drive Client ID
* Setting up the Rclone Configuration

Note: When naming the service in `rclone config` ensure to call it "gdrive"

**The Auto-mounting instructions for the drive in the link don't work on Rasbian**. Auto-mounting of the drive isn't necessary for the backup script.

If you want your Google Drive to mount on every boot then follow the instructions at the bottom of the wiki page

#### Auto-mounting Google Drive

To enable rclone to mount on boot you will need to make a user service. Run the following commands

``` console
$ mkdir -p ~/.config/systemd/user
$ nano ~/.config/systemd/user/gdrive.service
```
Copy the following code into the editor, save and exit

```
[Unit]
Description=rclone: Remote FUSE filesystem for cloud storage
Documentation=man:rclone(1)

[Service]
Type=notify
ExecStartPre=/bin/mkdir -p %h/mnt/gdrive
ExecStart= \
  /usr/bin/rclone mount \
  --fast-list \
  --vfs-cache-mode writes \
  gdrive: %h/mnt/gdrive

[Install]
WantedBy=default.target
```
enable it to start on boot with: (no sudo)
``` console
$ systemctl --user enable gdrive.service
```
start with
``` console
$ systemctl --user start gdrive.service
```
if you no longer want it to start on boot then type:
``` console
$ systemctl --user disable gdrive.service
```
