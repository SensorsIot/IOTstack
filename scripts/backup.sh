#!/bin/bash
# vim: sw=2

# Usage:
# ./scripts/backup.sh {TYPE}
#   Types:
#     1 = Backup with Date
#     2 = Rolling Date
#     3 = Both
#
#   Backups:
#     You can find the backups in the ./backups/ folder. With rolling being in
#     ./backups/rolling/ and date backups in ./backups/backup/ Log files can
#     also be found in the ./backups/logs/ directory.
#
# Examples:
#   ./scripts/backup.sh
#   ./scripts/backup.sh 3
#     Both of these will run both backups.
#
#   ./scripts/backup.sh 2
#     This will only produce a backup into ~/IOTstack/backup/rolling/. It will
#     be called 'backup_XX.tar.gz' where XX is the current day of the week (as
#     an int)
#
#   sudo bash ./scripts/backup.sh 2 pi
#     This will only produce a backup in the rolling folder and change all
#     the permissions to the 'pi' user. This is for expert use, usually this
#     script should be executed without sudo using your regular user.

# Allow running from everywhere, but change folder to script's IOTstack
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

BACKUPTYPE=${1:-"3"}

if [[ "$BACKUPTYPE" -ne "1" && "$BACKUPTYPE" -ne "2" && "$BACKUPTYPE" -ne "3" ]]; then
	echo "Unknown backup type '$BACKUPTYPE', can only be 1, 2 or 3"
  exit 1
fi

if [[ "$EUID" -eq 0 ]]; then
  if [ -z ${2+x} ]; then
    echo "Error: this script shouldn't be run as root"
    exit 1
  else
    USER=$2
  fi
else
  # re-run script using sudo, to avoid any permission problems
  sudo ${BASH_SOURCE[0]} $BACKUPTYPE ${2:-$(whoami)}
  exit $?
fi

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

touch $LOGFILE
echo ""  > $LOGFILE
echo "### IOTstack backup generator log ###" >> $LOGFILE
echo "Started At: $(date +"%Y-%m-%dT%H-%M-%S")" >> $LOGFILE
echo "Current Directory: $(pwd)" >> $LOGFILE
echo "Backup Type: $BACKUPTYPE" >> $LOGFILE

if [[ "$BACKUPTYPE" -eq "1" || "$BACKUPTYPE" -eq "3" ]]; then
  echo "Backup File: $BACKUPFILE" >> $LOGFILE
fi

if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  echo "Rolling File: $ROLLING" >> $LOGFILE
fi

echo "" >> $BACKUPLIST

echo "Stopping stack to get consistent database backups" >> $LOGFILE
docker-compose stop >> $LOGFILE

if [ -f "./pre_backup.sh" ]; then
  echo "" >> $LOGFILE
  echo "./pre_backup.sh file found, executing:" >> $LOGFILE
  bash ./pre_backup.sh >> $LOGFILE 2>&1
fi

echo "./services/" >> $BACKUPLIST
echo "./volumes/" >> $BACKUPLIST
[ -f "./docker-compose.yml" ] && echo "./docker-compose.yml" >> $BACKUPLIST
[ -f "./docker-compose.override.yml" ] && echo "./docker-compose.override.yml" >> $BACKUPLIST
[ -f "./.env" ] && echo "./.env" >> $BACKUPLIST
[ -f "./compose-override.yml" ] && echo "./compose-override.yml" >> $BACKUPLIST
[ -f "./extra" ] && echo "./extra" >> $BACKUPLIST
[ -f "./.tmp/databases_backup" ] && echo "./.tmp/databases_backup" >> $BACKUPLIST
[ -f "./postbuild.sh" ] && echo "./postbuild.sh" >> $BACKUPLIST
[ -f "./post_backup.sh" ] && echo "./post_backup.sh" >> $BACKUPLIST
[ -f "./pre_backup.sh" ] && echo "./pre_backup.sh" >> $BACKUPLIST

sudo tar -czf $TMPBACKUPFILE -T $BACKUPLIST >> $LOGFILE 2>&1

[ -f "$ROLLING" ] && ROLLINGOVERWRITTEN=1 && rm -rf $ROLLING

sudo chown -R $USER:$(id -g $USER) $TMPDIR/backup* >> $LOGFILE 2>&1

if [[ "$BACKUPTYPE" -eq "1" || "$BACKUPTYPE" -eq "3" ]]; then
  cp $TMPBACKUPFILE $BACKUPFILE
fi
if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  cp $TMPBACKUPFILE $ROLLING
fi

if [[ "$BACKUPTYPE" -eq "2" || "$BACKUPTYPE" -eq "3" ]]; then
  if [[ "$ROLLINGOVERWRITTEN" -eq 1 ]]; then
    echo "Rolling Overwritten: True" >> $LOGFILE
  else
    echo "Rolling Overwritten: False" >> $LOGFILE
  fi
fi

echo "Backup Size (bytes): $(stat --printf="%s" $TMPBACKUPFILE)" >> $LOGFILE
echo "" >> $LOGFILE

echo "Starting stack back up" >> $LOGFILE
docker-compose start

if [ -f "./post_backup.sh" ]; then
  echo "./post_backup.sh file found, executing it at $(date +"%Y-%m-%dT%H-%M-%S")" >> $LOGFILE
  bash ./post_backup.sh $TMPBACKUPFILE 2>&1 >> $LOGFILE
  echo "" > $LOGFILE
fi

echo "Finished At: $(date +"%Y-%m-%dT%H-%M-%S")" >> $LOGFILE
echo "" >> $LOGFILE

if [[ -f "$TMPBACKUPFILE" ]]; then
  echo "Items backed up:" >> $LOGFILE
  cat $BACKUPLIST >> $LOGFILE 2>&1
  echo "" >> $LOGFILE
  echo "Items Excluded:" >> $LOGFILE
  echo " - No items" >> $LOGFILE 2>&1
  rm -rf $BACKUPLIST >> $LOGFILE 2>&1
  rm -rf $TMPBACKUPFILE >> $LOGFILE 2>&1
else
  echo "Something went wrong backing up. The temporary backup file doesn't exist. No temporary files were removed"
  echo "Files: "
  echo "  $BACKUPLIST"
fi

sudo chown -R $USER:$(id -g $USER) "$BASEDIR" >> $LOGFILE 2>&1

echo "" >> $LOGFILE
echo "### End of log ###" >> $LOGFILE
echo "" >> $LOGFILE

cat $LOGFILE
