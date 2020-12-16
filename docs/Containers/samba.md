
# What is Samba?

Since 1992, Samba has provided secure, stable and fast file and print services
for all clients using the SMB/CIFS protocol, such as all versions of DOS and
Windows, OS/2, Linux and many others.

This image can be used to share IOTStack filesystem to be able to acces configs 
and container files over network file share.

## Setup


 * `CHARMAP` - Configure character mapping
   "<from:to>" character mappings separated by ','
 
 * `GENERIC` - Configure a generic section option (See NOTE3 below)
   Provide generic section option for smb.conf
                    required arg: "<section>" - IE: "share"
                    required arg: "<parameter>" - IE: "log level = 2"
                    
 * `GLOBAL` - Configure a global option (See NOTE3 below)
   Provide global option for smb.conf
                    required arg: "<parameter>" - IE: "log level = 2"

 * `IMPORT` - Import a smbpassword file
   "<path>" Import smbpassword
                    required arg: "<path>" - full file path in container

 * `NMBD` - Start the 'nmbd' daemon to advertise the shares
 
 * `PERMISSIONS` - Set ownership and permissions on the shares. IMPRTANT!!!
   It can cause problems in image, so use it carefully!
 
 * `RECYCLE` - Disable recycle bin for shares

 * `SHARE` - Setup a share (See NOTE3 below)
   "<name;/path>[;browse;readonly;guest;users;admins;writelist;comment]"
                    Configure a share
                    required arg: "<name>;</path>"
                    <name> is how it's called for clients
                    <path> path to share
                    NOTE: for the default values, just leave blank
                    [browsable] default:'yes' or 'no'
                    [readonly] default:'yes' or 'no'
                    [guest] allowed default:'yes' or 'no'
                    NOTE: for user lists below, usernames are separated by ','
                    [users] allowed default:'all' or list of allowed users
                    [admins] allowed default:'none' or list of admin users
                    [writelist] list of users that can write to a RO share
                    [comment] description of share

 * `SMB` - Disable SMB2 minimum version

 * `USER` - Setup a user (See NOTE3 below)
   "<username;password>[;ID;group;GID]"       Add a user
                    required arg: "<username>;<passwd>"
                    <username> for user
                    <password> for user
                    [ID] for user
                    [group] for user
                    [GID] for group 

 * `WIDELINKS` - Allow access wide symbolic links
 
 * `WORKGROUP` - Set workgroup
   "<workgroup>"       Configure the workgroup (domain) samba should use
                       required arg: "<workgroup>"
 
 * `USERID` - Set the UID for the samba server's default user (1000 - pi)
 
 * `GROUPID` - Set the GID for the samba server's default user (1000 - pi)
 
 * `INCLUDE` - Add an include option at the end of the smb.conf
                    required arg: "<include file path>"
                    <include file path> in the container, e.g. a bind mount

**NOTE**: if you enable nmbd (via `-n` or the `NMBD` environment variable), you
will also want to expose port 137 and 138 with `-p 137:137/udp -p 138:138/udp`.

**NOTE2**: there are reports that `-n` and `NMBD` only work if you have the
container configured to use the hosts network stack.

**NOTE3**: optionally supports additional variables starting with the same name,
IE `SHARE` also will work for `SHARE2`, `SHARE3`... `SHAREx`, etc.


# Troubleshooting

* You get the error `Access is denied` (or similar) on the client and/or see
`change_to_user_internal: chdir_current_service() failed!` in the container
logs.

Set the `PERMISSIONS` environment variable.


If changing the permissions of your files is not possible in your setup you
can instead set the environment variables `USERID` and `GROUPID` to the
values of the owner of your files.

* Attempting to connect with the `smbclient` commandline tool. By default samba
still tries to use SMB1, which is depriciated and has security issues. This
container defaults to SMB2, which for no decernable reason even though it's
supported is disabled by default so run the command as `smbclient -m SMB3`, then
any other options you would specify.

[More info](https://github.com/dperson/samba)
