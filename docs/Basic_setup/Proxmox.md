# Proxmox virtual machine

IOTstack should run in a Proxmox virtual machine rather than an LXC container. A virtual machine avoids complications with Docker nesting and makes hardware passthrough easier to manage.

## Recommended virtual machine settings

Use the following settings when creating the virtual machine:

| Setting | Recommended value |
| --- | --- |
| Name | `iotstack` |
| Installation media | Debian 12 (Bookworm) 64-bit netinst ISO |
| Guest OS type | Linux, kernel 6.x |
| Machine | `q35` |
| BIOS | OVMF (UEFI), with an EFI disk |
| QEMU Guest Agent | Enabled |
| TPM | None |
| Disk controller | VirtIO SCSI Single |
| Disk | 64 GB minimum; 100 GB recommended |
| CPU type | `host` |
| CPU allocation | 2 cores minimum; 4 cores recommended |
| Memory | 4 GB minimum; 8 GB recommended |
| Network bridge | `vmbr0` |
| Network device | VirtIO |

For the virtual disk, enable discard and IO thread. Enable SSD emulation when the underlying Proxmox storage is SSD-backed. Disabling memory ballooning gives Docker containers and databases a predictable amount of memory.

Give the guest a stable address using either a DHCP reservation or static network configuration. Enable **Start at boot** after confirming that the installation works correctly.

## Debian installation

Create a normal, non-root user during installation. IOTstack and many of its containers expect the first user to have UID 1000. Select **SSH server** and **standard system utilities**; a desktop environment is not required. Guided partitioning with one ext4 filesystem is sufficient for a typical installation.

After Debian starts, update it and install the Proxmox guest agent:

``` console
$ sudo apt update
$ sudo apt full-upgrade -y
$ sudo apt install -y curl qemu-guest-agent
$ sudo systemctl enable --now qemu-guest-agent
```

Run the IOTstack installer as the normal user, without `sudo`:

``` console
$ curl -fsSL https://raw.githubusercontent.com/SensorsIot/IOTstack/master/install.sh | bash
```

## USB devices

Services that use a physical USB device require that device to be passed through from Proxmox to the virtual machine. Configure USB passthrough before attempting to use such a service. Device-specific passthrough instructions are outside the scope of this guide.
