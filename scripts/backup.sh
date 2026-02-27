#!/bin/bash

# Usage:
# ./scripts/backup.sh {TYPE=3} {USER=$(whoami)}
#   Types:
#     1 = Backup with Date
#     2 = Rolling Date
#     3 = Both
#   User:
#     This parameter only becomes active if run as root. This script will default to the current logged in user
#       If this parameter is not supplied when run as root, the script will ask for the username as input
#
#   Backups:
#     You can find the backups in the ./backups/ folder. With rolling being in ./backups/rolling/ and date backups in ./backups/backup/
#     Log files can also be found in the ./backups/logs/ directory.
#
# Examples:
#   ./scripts/backup.sh
#   ./scripts/backup.sh 3
#     Either of these will run both backups.
#
#   ./scripts/backup.sh 2
#     This will only produce a backup in the rollowing folder. It will be called 'backup_XX.tar.gz' where XX is the current day of the week (as an int)
#
#   sudo bash ./scripts/backup.sh 2 pi
#     This will only produce a backup in the rollowing folder and change all the permissions to the 'pi' user.

if [ -d "./menu.sh" ]; then
	echo "./menu.sh file was not found. Ensure that you are running this from IOTstack's directory."
  exit 1
fi

BACKUPTYPE=${1:-"3"}

if [[ "$BACKUPTYPE" -ne "1" && "$BACKUPTYPE" -ne "2" && "$BACKUPTYPE" -ne "3" ]]; then
	echo "Unknown backup type '$BACKUPTYPE', can only be 1, 2 or 3"
  exit 1
fi

if [[ "$EUID" -eq 0 ]]; then
  if [ -z ${2+x} ]; then
    echo "Enter username to chown (change ownership) files to"
    read USER;
  else
    USER=$2
  fi
else
  USER=$(whoami)
fi

# Print to log file or to log file and console?
# 0 = only log
# 1 = console and file
VERBOSE=true
# But we can't do it here thus too many positional args
# changing will broke compatibility
#while getopts "v" OPTION
#do
#  case $OPTION in
#    v) VERBOSE=true
#       ;;
#  esac
#done
#echo "VERBOSE LEVEL: $VERBOSE"

BASEDIR=./backups
TMPDIR=./.tmp
DOW=$(date +%u)
BASEBACKUPFILE="$(date +"%Y-%m-%d_%H%M")"
TMPBACKUPFILE="$TMPDIR/backup/backup_$BASEBACKUPFILE.tar.gz"
BACKUPLIST="$TMPDIR/backup-list_$BASEBACKUPFILE.txt"
LOGFILE="$BASEDIR/logs/backup_$BASEBACKUPFILE.log"
BACKUPFILE="$BASEDIR/backup/backup_$BASEBACKUPFILE.tar.gz"
ROLLING="$BASEDIR/rolling/backup_$DOW.tar.gz"

[ -d ./backups ] || mkdir ./backups
[ -d ./backups/logs ] || mkdir -p ./backups/logs
[ -d ./backups/backup ] || mkdir -p ./backups/backup
[ -d ./backups/rolling ] || mkdir -p ./backups/rolling
[ -d ./.tmp ] || mkdir ./.tmp
[ -d ./.tmp/backup ] || mkdir -p ./.tmp/backup
[ -d ./.tmp/databases_backup ] || mkdir -p ./.tmp/databases_backup

#------------------------------------------------------------------------------
# echo pass params and log to file LOGFILE
# depend to global var VERBOSE
# Example:
# doLog "Something"
#------------------------------------------------------------------------------
doLog(){
  # also we can log every command with timestamp
  MSG=''
  # Check if string is empty print empty line without timestamp
  if [ -z "$*" ]
  then
    MSG=$(echo "$*")
  else
    MSG=$(echo "$(date '+%Y.%m.%dT%H:%M:%S') - ""$*")
  fi
  # with colors code it's looks very ugly
  # taken from: https://stackoverflow.com/a/51141872/660753
  MSG=$(echo "$MSG" | sed 's/\x1B\[[0-9;]\{1,\}[A-Za-z]//g')

  # write to console if VERBOSE is set
  if [ $VERBOSE ]
  then
    # also on the screen lines not looking cool, remove \r symbol
    echo "$MSG" | sed 's/\r/\n/g'
  fi

  # write to LOGFILE
  echo "$MSG" >> "$LOGFILE"
}
#eof func doLog

touch "$LOGFILE"
doLog ""
doLog "### IOTstack backup generator log ###"
doLog "Started At: $(date +"%Y-%m-%dT%H-%M-%S")"
doLog "Current Directory: $(pwd)"
doLog "Backup Type: $BACKUPTYPE"

if [[ "$BACKUPTYPE" -eq "1" || "$BACKUPTYPE" -eq "3" ]]; then
  doLog "Backup File: $BACKUPFILE"
fi

if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  doLog "Rolling File: $ROLLING"
fi

echo "" >> "$BACKUPLIST"

doLog ""
doLog "Executing pre-backup scripts"
# Output to log file
docker-compose logs --no-color --tail="50" >> "$LOGFILE"
doLog "$(bash ./scripts/backup_restore/pre_backup_complete.sh)"

echo "./services/" >> "$BACKUPLIST"
echo "./volumes/" >> "$BACKUPLIST"
[ -f "./docker-compose.yml" ] && echo "./docker-compose.yml" >> "$BACKUPLIST"
[ -f "./docker-compose.override.yml" ] && echo "./docker-compose.yml" >> "$BACKUPLIST"
[ -f "./compose-override.yml" ] && echo "./compose-override.yml" >> "$BACKUPLIST"
[ -f "./extra" ] && echo "./extra" >> "$BACKUPLIST"
[ -f "./.tmp/databases_backup" ] && echo "./.tmp/databases_backup" >> "$BACKUPLIST"
[ -f "./postbuild.sh" ] && echo "./postbuild.sh" >> "$BACKUPLIST"
[ -f "./post_backup.sh" ] && echo "./post_backup.sh" >> "$BACKUPLIST"
[ -f "./pre_backup.sh" ] && echo "./pre_backup.sh" >> "$BACKUPLIST"

doLog "Create temporary backup archive"
doLog "$(sudo tar -czf "$TMPBACKUPFILE" -T "$BACKUPLIST" 2>&1)"

[ -f "$ROLLING" ] && ROLLINGOVERWRITTEN=1 && rm -rf "$ROLLING"

doLog "$(sudo chown -R "$USER":"$USER" $TMPDIR/backup* 2>&1 )"

doLog "Create persistent backup archive"
if [[ "$BACKUPTYPE" -eq "1" || "$BACKUPTYPE" -eq "3" ]]; then
  cp "$TMPBACKUPFILE" "$BACKUPFILE"
fi
if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  cp "$TMPBACKUPFILE" "$ROLLING"
fi

if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  if [[ "$ROLLINGOVERWRITTEN" -eq 1 ]]; then
    doLog "Rolling Overwritten: True"
  else
    doLog "Rolling Overwritten: False"
  fi
fi

doLog "Backup Size (bytes): $(stat --printf="%s" "$TMPBACKUPFILE")"
doLog ""

doLog "Executing post-backup scripts"
# Output to log file
docker-compose logs --no-color --tail="50" >> "$LOGFILE"
doLog "$(bash ./scripts/backup_restore/post_backup_complete.sh)"
doLog ""

doLog "Finished At: $(date +"%Y-%m-%dT%H-%M-%S")"
doLog ""

if [[ -f "$TMPBACKUPFILE" ]]; then
  doLog "Items backed up:"
  doLog "$(cat "$BACKUPLIST" 2>&1)"
  doLog ""
  doLog "Items Excluded:"
  doLog " - No items"
  doLog "$(rm -rf "$BACKUPLIST" 2>&1)"
  doLog "$(rm -rf "$TMPBACKUPFILE" 2>&1)"
else
  doLog "Something went wrong backing up. The temporary backup file doesn't exist. No temporary files were removed"
  doLog "Files: "
  doLog "  $BACKUPLIST"
fi

doLog ""
doLog "### End of log ###"
doLog ""

# we don't need to print LOGFILE if we are in verbose mode
$VERBOSE != true && cat "$LOGFILE"
