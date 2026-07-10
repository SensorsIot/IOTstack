#!/bin/bash

#This script provides full/differential/incremental backup for IOTstack. It aims to be conservative with disk space by only having minimum overhead (max. 1 differential backup) and to maximize uptime in cases of slow hardware like a Raspberry pi. To increase uptime services can be specified to be backuped in separate files which allows for the other services to be brought up while the separate services are backuped. This is useful if there is e.g. a nextcloud instance running which will take a long time to process.
#usage diffinc_backup.sh [-t type=1] [-i /absolute/path/to/IOTstack] [-c] [-s list,of,services] [-p list,of,paused,services] [-e ./backup/excluded/*/paths] [-u user] [-y scp:path/to/copy/dir] [-z rsync:path/to/sync/dir] [/absolute/path/to/target/directory=[IOTstack]/backups/diffincbackup]
#since many files may not accessible to the user run this script as root
#arguments
##-t: type of backup, 0 full dump, 1 differential backup, 2 incremental backup. If no previous backup is found the script will do a full dump.
##-i: will use a user specified IOTstack directory. If the script is in the original directory [IOTstack]/scripts this option is not needed.
##-c: use compression
##-s: Comma separated list of separately backuped services by name in ./volumes directory. This option is potentially dangerous if you run interdependent services! Hence, if you want to use this option CAREFULLY REVIEW THE USE OF THE -p OPTION! Additionally, if the service name deviates from the volumes directory name you must include the service name in the -p option!
##-p: Comma separated list of services that should be paused during the whole backup time. It is recommended or even necessary to pause interacting services of separately backuped services (e.g. recommended: portainer to prevent the user from accidentally starting a service; necessary: nextcloud database container)
##-e: comma separated list of paths relative to the IOTstack directory always excluded from the backup, e.g. when using the preview app in nextcloud
##-u: user to change ownership to
##-y: Directory to scp the backup files to. Multiple mentions of the option to copy to multiple locations are possible. Make sure the directory exists before running the command and keep in mind that only created/changed files in this run are transferred, and only if the connection holds. If you want to send the files to another machine in a cronjob you need to prevent the password promt. A great tutorial on how to do this can be found here: https://github.com/Paraphraser/IOTstackBackup/blob/master/ssh-tutorial.md
##-z: Directory to rsync the backup target directory to. The usage is identical to scp, but rsync will synchronize the backup directory, not simply send new/changed backup files. This option is especially recommended for incremental backups so in case something goes temporarily wrong all the files are eventually transferred.
##if no target directory path is provided the script will use [IOTstack]/backups/diffincbackup
#
#migrating backups: If you do not want to update the backup you only need to transfer all *.tar* files from the base backup (backup_base-????-??-??_????_*) to the new location, otherwise you also need the .snar files. DO NOT RENAME the files! For a restore you need the files present in a directory with the original filenames to pass consistency checks!

#usage scenarios
##run sudo crontab -e
###situation: small amount of data, weekly update wished, directory is cleaned of old backups regularly --> regular full dumps, best security
####0 2 * * *  /home/[USER]/IOTstack/scripts/diffinc_backup.sh -t -c 0 -u [USER]
###situation: large amount of data initially, especially in nextcloud and influxdb, small changes over time, should be saved on another disk due to size constraint --> differential backup ideal with nextcloud and influxdb backuped separately to keep other services online longer, file count remains low. Additionally activated preview app for nextcloud, those files do not need to be stored (add post-restore script to recompute previews)
####0 2 * * *  /home/[USER]/IOTstack/scripts/diffinc_backup.sh -t 1 -c -s influxdb2,nextcloud -p nextcloud,nextcloud_db,portainer-ce -e ./volumes/nextcloud/html/data/appdata_*/preview -u [USER] [absolute/path/to/another/disk/dir]
####[note: you can actually leave the * in the -e option]
###situation: large amount of data in nextcloud, changes significantly over time. Daily backup wished. A possible compromise is to make differential backups mon-sat and an incremental backup on sun. Additionally, the backups should be synchronized to another computer in the network (if you wish to use this as a template make sure you set up both machines as described in the -y documentation). Every week 2 files will be added to the backup (not counting snar files)
####0 2 * * 1,2,3,4,5,6  /home/[USER]/IOTstack/scripts/diffinc_backup.sh -t 1 -c -s nextcloud -p nextcloud,nextcloud_db,portainer-ce -u [USER] -z user@192.168.0.10:backups/diffinc
####0 2 * * 0  /home/[USER]/IOTstack/scripts/diffinc_backup.sh -t 2 -c -s nextcloud -p nextcloud,nextcloud_db,portainer-ce -u [USER] -z user@192.168.0.10:backups/diffinc


#check if script is already running. Useful since it may be called automatically by cron.
if pidof -o $$ -x "$0" > /dev/null; then 
  echo "Process already running"
  exit 1
fi
#exec {LOCK_FD}>/var/lock/IOTstack_diffinc_backup || exit 1 #cleanest version, but doesn't work well with multiple users
#flock -n "$LOCK_FD" || { echo "ERROR: Backup script already running. Exiting." >&2; exit 1; }

COMPRESSION=false
TYPE=1 #defaults to differential backup, seems most sensible to me
SCP_PATHS=()
RSYNC_PATHS=()

while getopts 'i:ct:s:p:e:u:y:z:' OPTION; do
  case "$OPTION" in
    i)
      IOTSTACK_DIR="$OPTARG"
      ;;
    c)
      COMPRESSION=true
      ;;
    t)
      case "$OPTARG" in
        0|1|2) 
          TYPE=$OPTARG
          ;;
        ?)
          echo "Error: unknown backup type"
          exit 1
          ;;
      esac
      ;;
    s)
      IFS=',' read -ra SEPARATE_SERVICES <<< "$OPTARG"
      ####trust the user they don't put in weird stuff?
      ;;
    p)
      IFS=',' read -ra STOPPED_SERVICES <<< "$OPTARG"
      ####trust the user they don't put in weird stuff?
      ;;
    e)
      IFS=',' read -ra EXCLUDED_PATHS <<< "$OPTARG"
      ####trust the user they don't put in weird stuff?
      ;;
    u)
      USER="$OPTARG"
      if ! id "$USER" &>/dev/null; then
        echo "ERROR: Cannot find user to hand files over."
        exit 1
      fi
      ;;
    y)
      SCP_PATHS+=("$OPTARG")
      ;;
    z)
      RSYNC_PATHS+=("$OPTARG")
      ;;
    ?)
      echo "usage diffinc_backup.sh [-t type=1] [-i /absolute/path/to/IOTstack] [-c] [-s list,of,services] [-p list,of,paused,services] [-e ./backup/excluded/*/paths] [-u user] [-y scp:path/to/copy/dir] [-z rsync:path/to/sync/dir] [/absolute/path/to/target/directory=[IOTstack]/backups/diffincbackup]" >&2
      exit 1
      ;;
  esac
done
shift "$(($OPTIND -1))"



##check inputs

#check if IOTstack_dir was set in the arguments and test directory if (highly likely) correct
if [ -z "${IOTSTACK_DIR+x}" ]; then
  #not set, use parent directory of the script
  IOTSTACK_DIR="$(builtin cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."; pwd)"
fi
if [ ! -f "${IOTSTACK_DIR}/menu.sh" ]; then
  echo "./menu.sh file was not found. $IOTSTACK_DIR does not seem to be an IOTstack directory."
  exit 1
fi

#check of target directory was set and is valid
TARGET_DIR="${IOTSTACK_DIR}/backups/diffincbackup"
mkdir -p $TARGET_DIR #create default dir just in case
if [ ! -z "${USER+x}" ]; then
    chown $USER:$USER "$TARGET_DIR"
  fi
if [ ! -z "${1+x}" ]; then
  #set, use the user directory
  TARGET_DIR=$1
fi
if [ ! -d "${TARGET_DIR}" ]; then
  echo "Backup target directory ${TARGET_DIR} does not exist."
  exit 1
fi

####handle duplicate separate services and paused services?



##check and prepare backup file in the directory context

LOGFILE="$TARGET_DIR/backup.log"
echo "" >> $LOGFILE
echo "" >> $LOGFILE
echo "##############################backup start##############################" >> $LOGFILE
echo "Start at $(date +"%Y-%m-%d_%H:%M:%S")" >> $LOGFILE
echo "IOTstack directory $IOTSTACK_DIR" >> $LOGFILE
echo "Target directory $TARGET_DIR" >> $LOGFILE

#backup file naming convention "backup_base-YYYY-MM-DD_mmss_[main/nextcloud/ect]_[level].tar[.gz]"
#check if a backup is present
PRESENT_BACKUPS=($(find $TARGET_DIR -maxdepth 1 -name "backup_base-????-??-??_????_*_*.tar*"))
if [[ ! -z "$PRESENT_BACKUPS" && $TYPE -ne 0 ]]; then
  #found backup files
  echo "Previous backup files found in the directory, will attach to it." >> $LOGFILE
  PRESENT_BACKUPS=("${PRESENT_BACKUPS[@]##*/}")
  #sorts by base date first, then by separate service, then by level
  readarray -t PRESENT_BACKUPS_SORTED < <(printf '%s\0' "${PRESENT_BACKUPS[@]}" | sort -z | xargs -0n1)
  #read most recent base backup date and level
  IFS='._' read -r -a FILENAME_ARR <<< "${PRESENT_BACKUPS_SORTED[-1]}" #splits filename in array delimited by . and _
  BACKUP_TIME_MAX="${FILENAME_ARR[1]}_${FILENAME_ARR[2]}"
  LEVEL_MAX=${FILENAME_ARR[4]} #the last filename in the list should also contain the highest backup level
  #now that we know the most recent base backup demove all other base backups from the list
  for i in ${!PRESENT_BACKUPS_SORTED[@]};do
    if [[ "${PRESENT_BACKUPS_SORTED[$i]}" != "backup_$BACKUP_TIME_MAX"* ]]; then
      unset PRESENT_BACKUPS_SORTED[$i] #snar check for old files not relevant
      continue
    fi 
    #check if all snar files are present
    ####may be too strict? Would, however, allow for revertion to any level in future
    if [ ! -f "$TARGET_DIR/${PRESENT_BACKUPS_SORTED[i]%%.*}.snar" ]; then
      echo "ERROR: could not find corresponding snar file to ${PRESENT_BACKUPS_SORTED[i]}" | tee -a $LOGFILE
      exit 1
    fi
  done
  
  #extract split files/separate services and levels
  BACKUPS_SPLITS=()
  LEVELS=()
  for BACKUP in ${PRESENT_BACKUPS_SORTED[@]}; do 
    IFS='._' read -ra FILENAME_ARR <<< "$BACKUP" #splits filename in array delimited by . and _
    BACKUPS_SPLITS+=(${FILENAME_ARR[3]}) #extracts main/nextcloud ect
    LEVELS+=(${FILENAME_ARR[4]}) #extracts backup levels
  done
  
  #create separate service list from filenames and override potentially user supplied one
  SEPARATE_SERVICES_FILES_TMP=()
  SEPARATE_SERVICES_FILES=()
  IFS=" " read -r -a SEPARATE_SERVICES_FILES_TMP <<< "$(tr ' ' '\n' <<< "${BACKUPS_SPLITS[@]}" | sort -u | tr '\n' ' ')"
  for SERVICE_TMP in ${SEPARATE_SERVICES_FILES_TMP[@]}; do
    if [[ ${SERVICE_TMP} != "main" ]]; then
      SEPARATE_SERVICES_FILES+=(${SERVICE_TMP})
    fi
  done
  echo "" >> $LOGFILE
  echo -e "overriding user supplied separate service list \n${SEPARATE_SERVICES[@]}\n->\n${SEPARATE_SERVICES_FILES[@]}" >> $LOGFILE
  echo "" >> $LOGFILE
  SEPARATE_SERVICES=(${SEPARATE_SERVICES_FILES[@]})


  #make sanity check on backups, # of files must be #services * (max level+1)
  EXPECTED_FILECOUNT=$(( (${#SEPARATE_SERVICES[@]} + 1) * ($LEVEL_MAX +1) )) #separate_services does not include main
  if [ $EXPECTED_FILECOUNT -ne ${#PRESENT_BACKUPS_SORTED[@]} ]; then
    echo "ERROR: unexpected number of backup files, see log for details."
    echo "ERROR: unexpected number of backup files for base backup $BACKUP_TIME_MAX. Number of separate services: ${#SEPARATE_SERVICES[@]}, highest level: $LEVEL_MAX, therefore expected $EXPECTED_FILECOUNT files but found ${#PRESENT_BACKUPS_SORTED[@]}. Please check the backups! Found files: ${PRESENT_BACKUPS[@]}" | tee -a $LOGFILE
    exit 1
  fi
  
  #set backup file data
  NEW_BACKUP_DATE=$BACKUP_TIME_MAX
  if [ $TYPE -eq 1 ]; then
    if [ $LEVEL_MAX -eq 0 ]; then
      NEW_BACKUP_LEVEL=1
    else
      NEW_BACKUP_LEVEL=$LEVEL_MAX
    fi
  else
    NEW_BACKUP_LEVEL=$(($LEVEL_MAX + 1))
  fi
  

else
  #no backup files or create new level 0 backup
  echo "Will create a new base-backup." >> $LOGFILE
  NEW_BACKUP_DATE="base-$(date +"%Y-%m-%d_%H%M")"
  NEW_BACKUP_LEVEL=0
fi

##all checks complete, prepare backup and run pre-backup script

BACKUP_LIST="$TARGET_DIR/backuplist.txt"
cd $IOTSTACK_DIR

if [ -f "./pre_backup.sh" ]; then
  echo "./pre_backup.sh file found, executing:"
  bash ./pre_backup.sh
fi

echo "" > $BACKUP_LIST
readarray -t BACKUP_DIRECTORIES < "./scripts/backup_list.txt"
for BACKUP_DIRECTORY in ${BACKUP_DIRECTORIES[@]}; do
  if [ -f $BACKUP_DIRECTORY ] || [ -d $BACKUP_DIRECTORY ]; then
    echo "$BACKUP_DIRECTORY" >> $BACKUP_LIST
  fi
done

#file ending and flags
FILE_ENDING="tar"
FLAGS="--create --verbose"
if $COMPRESSION; then
  FILE_ENDING+=".gz"
  FLAGS+=" --gzip"
fi

#prepare possibly excluded paths
EXCLUDED_PATHS_SERVICES=("${SEPARATE_SERVICES[@]/#/./volumes/}")
#EXCLUDED_PATHS_SERVICES=( "${EXCLUDED_PATHS_SERVICES[@]/%//}" )
for VOLUME_PATH in ${EXCLUDED_PATHS_SERVICES[@]}; do
  #check existance since we don't want orphan files in the backup
  if [[ ! -d "$VOLUME_PATH" ]]; then
    echo "ERROR: Could not find volume path $VOLUME_PATH" | tee -a $LOGFILE
    exit 1
  fi
done
EXCLUDED_PATHS_COMBINED=( "${EXCLUDED_PATHS_SERVICES[@]}" "${EXCLUDED_PATHS[@]}" )




##finally backup time!

#bring the whole stack down for the main backup
docker-compose stop

TOTAL_SERVICES=("main" "${SEPARATE_SERVICES[@]}")

SCP_FILES=() #List of files to SCP to the target

for i in ${!TOTAL_SERVICES[@]}; do
  FILENAME="$TARGET_DIR/backup_"$NEW_BACKUP_DATE"_"${TOTAL_SERVICES[$i]}"_"$NEW_BACKUP_LEVEL"."$FILE_ENDING
  SNARNAME="$TARGET_DIR/backup_"$NEW_BACKUP_DATE"_"${TOTAL_SERVICES[$i]}"_"$NEW_BACKUP_LEVEL".snar"
  SCP_FILES+=("$FILENAME") #SNAR files are not necessary for restore
  echo "Creating backup file $FILENAME" >> $LOGFILE
  if [[ $NEW_BACKUP_LEVEL -ge 1 ]]; then
    cp "$TARGET_DIR/backup_"$NEW_BACKUP_DATE"_"${TOTAL_SERVICES[$i]}"_"$((NEW_BACKUP_LEVEL - 1))".snar" $SNARNAME".tmp"
  fi
  
  if [[ ${TOTAL_SERVICES[$i]} == "main" ]]; then
    tar --exclude-from <(for j in ${EXCLUDED_PATHS_COMBINED[@]}; do echo $j; done) --listed-incremental="$SNARNAME.tmp" $FLAGS "--file=$FILENAME.tmp" -T $BACKUP_LIST >> $LOGFILE 2>>$LOGFILE #does not seem to work with --exclude
    #bring up main part of the stack
    docker-compose up -d
    docker-compose stop "${SEPARATE_SERVICES[@]}" "${STOPPED_SERVICES[@]}"
  else
    #backup a separately backuped service. ####Appending does not work with compressed and seems to not update snar file for uncompressed, so another file is needed
    tar --exclude-from <(for j in ${EXCLUDED_PATHS[@]}; do echo $j; done) --listed-incremental=${SNARNAME}".tmp" ${FLAGS} "--file=${FILENAME}.tmp" "./volumes/"${TOTAL_SERVICES[$i]} >> $LOGFILE 2>>$LOGFILE
    if [[ ! " ${STOPPED_SERVICES[*]} " =~ " ${TOTAL_SERVICES[$i]} " ]]; then
      #user must be careful to put interdependent services in this list into -p
      docker-compose up -d "${TOTAL_SERVICES[$i]}"
    fi
  fi
  
  #backup successful, rename and potentially override to final file
  mv "$SNARNAME.tmp" $SNARNAME
  mv "$FILENAME.tmp" $FILENAME
  if [ ! -z "${USER+x}" ]; then
    chown $USER:$USER "$SNARNAME"
    chown $USER:$USER "$FILENAME"
    chown $USER:$USER "$TARGET_DIR/backup.log"
  fi
  echo "Successfully backuped $FILENAME" | tee -a $LOGFILE
done

if [ -f "./post_backup.sh" ]; then
  echo "./post_backup.sh file found, executing:"
  bash ./post_backup.sh
fi

docker-compose up -d

echo "All containers started at $(date +"%Y-%m-%d_%H:%M:%S")" >> $LOGFILE

##clean up files

rm $BACKUP_LIST

##Send backup files off
if [ "${#SCP_PATHS[@]}" -gt 0 ]; then
  echo "Sending backup files via SCP to: ${SCP_PATHS[@]}" | tee -a $LOGFILE
  for SCP_PATH in "${SCP_PATHS[@]}"; do
    #transfer every backup file created/changed to the new destination
    for SCP_FILE in "${SCP_FILES[@]}"; do
      scp "$SCP_FILE" "$SCP_PATH"
    done
    echo "Finished sending to ${SCP_PATH} at $(date +"%Y-%m-%d_%H:%M:%S")" | tee -a $LOGFILE
  done
fi

if [ ${#RSYNC_PATHS[@]} -gt 0 ]; then
  echo "Sending backup files via RSYNC to: ${RSYNC_PATHS[@]}" | tee -a $LOGFILE
  for RSYNC_PATH in "${RSYNC_PATHS[@]}"; do
    rsync -vrt --delete --exclude "${LOGFILE##*/}" --exclude "*.snar" "$TARGET_DIR/" "$RSYNC_PATH"
  done
fi

echo "Finished at $(date +"%Y-%m-%d_%H:%M:%S")" >> $LOGFILE
echo "########################################################################" >> $LOGFILE


















