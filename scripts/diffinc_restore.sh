#!/bin/bash

#restore script for the diffinc_backup.sh script.
#usage: diffinc_restore.sh [-i /absolute/path/to/IOTstack] [filename=[IOTstack]/backups/diffincbackup/backup_*newest*]
#arguments
##-i: will user the user specified IOTstack directory. Otherwise the program will take the parent directory.
##filename: absolute path to the filename to one of the backup files. 

while getopts 'i:' OPTION; do
  case "$OPTION" in
    i)
      IOTSTACK_DIR=$OPTARG
      ;;
    ?)
      echo "Unknown use of the script. Usage: diffinc_restore.sh [-i /absolute/path/to/IOTstack] [filename=[IOTstack]/backups/diffincbackup/backup_*newest*]" >&2
      exit 1
      ;;
  esac
done
shift "$(($OPTIND -1))"

#check if IOTstack_dir was set in the arguments and test directory if (highly likely) correct
if [ -z "${IOTSTACK_DIR+x}" ]; then
  #not set, use parent directory of the script
  IOTSTACK_DIR="$(builtin cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."; pwd)"
fi
if [ ! -f "${IOTSTACK_DIR}/menu.sh" ]; then
  echo "./menu.sh file was not found. $IOTSTACK_DIR does not seem to be an IOTstack directory."
  exit 1
fi

#check backup file, set if not specified
if [ -z "${1+x}" ]; then
  #not set, find in default directory
  BACKUP_DIR="$IOTSTACK_DIR/backups/diffincbackup"
  PRESENT_BACKUPS=($(find "$BACKUP_DIR" -maxdepth 1 -name "backup_base-????-??-??_????_*_*.tar*"))
  if [[ ! -z "$PRESENT_BACKUPS" ]]; then
    #found backup files, find the most recent base backup
    PRESENT_BACKUPS=("${PRESENT_BACKUPS[@]##*/}")
    readarray -t PRESENT_BACKUPS_SORTED < <(printf '%s\0' "${PRESENT_BACKUPS[@]}" | sort -z | xargs -0n1)
    SAMPLE_FILE="${PRESENT_BACKUPS_SORTED[-1]}"
  else
    echo "No backup file provided and no suitable backup file found in $IOTSTACK_DIR/backups/diffinc_backup"
    exit 1
  fi
  
else
  if [ ! -f "$1" ]; then
    echo "ERROR: supplied file $1 does not exist."
    exit 1
  fi
  BACKUP_DIR=${1%/*}
  SAMPLE_FILE="${1##*/}"
  if [[ $SAMPLE_FILE != backup_base-????-??-??_????_*_*.tar* ]]; then
    echo "ERROR: filename of supplied file $SAMPLE_FILENAME is not the correct format."
    exit 1
  fi
fi

#a sample file is found, find and check all associated backups
IFS='._' read -r -a FILENAME_ARR <<< "$SAMPLE_FILE" #splits filename in array delimited by . and _
BACKUP_TIME="${FILENAME_ARR[1]}_${FILENAME_ARR[2]}"
BACKUP_FILE_SET=($(find "$BACKUP_DIR" -maxdepth 1 -name "backup_${BACKUP_TIME}_*_*.tar*"))
#sort to get highest level and reinstate in order
readarray -t BACKUP_FILE_SET_SORTED < <(printf '%s\0' "${BACKUP_FILE_SET[@]##*/}" | sort -z | xargs -0n1)
for BACKUP in ${BACKUP_FILE_SET_SORTED[@]}; do 
  IFS='._' read -ra FILENAME_ARR <<< "$BACKUP" #splits filename in array delimited by . and _
  SERVICES_MULTI+=(${FILENAME_ARR[3]}) #extracts main/nextcloud ect
  LEVELS+=(${FILENAME_ARR[4]}) #extracts backup levels
done
IFS=" " read -r -a SERVICES <<< "$(tr ' ' '\n' <<< "${SERVICES_MULTI[@]}" | sort -u | tr '\n' ' ')" #will contain main
EXPECTED_FILECOUNT=$(( (${#SERVICES[@]}) * (${LEVELS[-1]} + 1) ))
if [ $EXPECTED_FILECOUNT -ne ${#BACKUP_FILE_SET_SORTED[@]} ]; then
  echo "#################################"
  echo "WARNING! Unexpected number of backup files for base backup $SAMPLE_FILE. Number of services: ${#SERVICES[@]}, highest level: "${LEVELS[0]}", therefore expected $EXPECTED_FILECOUNT files but found ${#PRESENT_BACKUPS_SORTED[@]}. "
  echo "Please check the backups! Found files:"
  printf '%s\n' "${BACKUP_FILE_SET_SORTED[@]}"
  echo "#################################"
else
  echo "Found ${EXPECTED_FILECOUNT} files associated with the backup, files are:"
  printf '%s\n' "${BACKUP_FILE_SET_SORTED[@]}"
fi

#backup validated as far as possible, confirm user intent
echo "Do you wish to continue restoring from backup? Your options: remove current files now (r), move files to ./backup/.old (m) or abort (other key)"
read -p "What to do? " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Rr]$ ]] || [[ $REPLY =~ ^[Mm]$ ]]; then #spicy time
  cd "$IOTSTACK_DIR"
  mkdir -p "$IOTSTACK_DIR/backups/logs/"
  LOGFILE="$IOTSTACK_DIR/backups/logs/$BACKUP_TIME.log"
  echo "Start restore at $(date +"%Y-%m-%d_%H:%M:%S")" > $LOGFILE
  echo "File list: ${PRESENT_BACKUPS_SORTED[@]}" >> $LOGFILE
  
  #run pre-restore script
  if [ -f "./pre_restore.sh" ]; then
    echo "./pre_restore.sh file found, executing:" >> $LOGFILE
    bash ./pre_restore.sh
  fi
  
  #remove/move old directories
  if [[ $REPLY =~ ^[Mm]$ ]]; then
    OLD_DATA_DIR="$IOTSTACK_DIR/backups/.old/$(date +"%Y-%m-%d_%H:%M:%S")"
    mkdir -p "$OLD_DATA_DIR"
    echo "Moving files to $OLD_DATA_DIR. If the script does not finish you can reinstate from there."
  fi
  readarray -t BACKUPED_DIRECTORIES < "./scripts/backup_list.txt"
  for BACKUPED_DIRECTORY in ${BACKUPED_DIRECTORIES[@]}; do
    if [[ $REPLY =~ ^[Mm]$ ]]; then
      [ -f $BACKUPED_DIRECTORY ] || [ -d $BACKUPED_DIRECTORY ] && sudo mv "$BACKUPED_DIRECTORY" "$OLD_DATA_DIR"
    else
      sudo rm -rf "$BACKUPED_DIRECTORY" >> $LOGFILE 2>&1
    fi
  done
  
  #clean slate, now extract all backups (sorted by level and service)
  for BACKUP_FILE in ${BACKUP_FILE_SET_SORTED[@]}; do
    tar --extract --verbose --listed-incremental=/dev/null --file "$BACKUP_DIR/$BACKUP_FILE">> $LOGFILE
    echo "Extracted $BACKUP_FILE"
  done
  
  #run post-restore script
  if [ -f "./post_restore.sh" ]; then
    echo "./post_restore.sh file found, executing:" >> $LOGFILE
    bash ./post_restore.sh
  fi
  
  echo "Finish restore at $(date +"%Y-%m-%d_%H:%M:%S")" >> $LOGFILE
  
  if [[ $REPLY =~ ^[Mm]$ ]]; then
    echo "Check the result. Should the old data (not the backup) be removed? (y/n)?"
    read -p "What to do? " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      sudo rm -rf "$OLD_DATA_DIR"
    else
      echo "Data can be removed manually removed by calling rm -rf $OLD_DATA_DIR"
    fi
  fi
fi



















