# Docker Swarm the IOTstack

*Have experimented with Kubernetes - currently more work than it's worth for many apps. Will come back to it.[hence the node names!]*

### Environment:

- 4 Nodes in Swarm
  - kmaster - pi4-2Gb
    - label dworktype=master
    - 120Gb SSD (boot via USB)
    - Glusterfs master
  - knode02 - pi4-4Gb
    - label dworktype=heavy

  - knode03 - pi4-4Gb
    - label dworktype=heavy, dockdata=influxdb
    - local filesystem for influxdb
    - will get SSD for local plus 2nd disk for glusterfs
  - kdock  - pi3-1Gb
    - label dworktype=iot
    - i2c bus connection to android
    - local scripts for gpio
    - "standalone" docker for node-red
  - (will add in kiot pi3/4 1/2Gb)
    - to do: move iot here and return kdock to standard docker node
- 8Gb pi is used for some development and to test some docker builds
- Glusterfs

### Build:

Currently use ansible to build nodes,
  - using current raspbian  (except kdock that is using hypriot)
  - installs docker, creates the swarm, labels.
  - build registry container, keys...
  - add more here...
  - downloads https://github.com/sgtsmall/IOTstack
  - creates directories

install/start portainer from
```docker stack deploy -c portainer-agent-stack.yml portainer```

run this seperately to monitor cluster - might move back into iotstack later

run menu.sh to create  service files.

compose-override.yml mostly contains deploy/placement
```
grafana:
  deploy:
    placement:
      constraints:
        - "node.labels.dworktype==heavy"
telegraf:
  deploy:
    mode: global
    placement:
      constraints: [node.platform.os == linux]
...

networks:
  iotstack_nw: # Exposed by your host.
    name: IOTstack_Net
    driver: overlay
    attachable: true
    ipam:
      driver: default
      config:
      - subnet: 192.16.238.0/24
```

deploy one or more services deliberately to iot server (I use global deployments for dozzle and telegraf) to ensure attachable IOTstack_Net is available on all nodes.

### Issues:

#### Overall, crashes master or worker nodes eventually.
- suspect influxdb needs to be more limited in memory usage.
- diskio write gets too high.
- too much traffic on network for switch? either cloverpi switch or main switch port on microtik.

#### Containers:
- Influxdb initially worked in glusterfs, then started creating NFS file errors. So have moved to local disk.
- plex need to investigate more setup in config?
- openhab crashes/config?
- bkynk_server - java crash /data too big?

#### scripts
- using https://github.com/Paraphraser/IOTstackBackup.git  for backup
