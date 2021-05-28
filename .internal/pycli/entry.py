#!/usr/bin/env python3

# export API_ADDR=localhost:32128 && export HOST_CON_API=localhost:32128 && cd .internal/pycli; nodemon --no-stdin --exec python3 entry.py

import blessed
import yaml
import ruamel.yaml
from deps.host_exec import execSilent
import subprocess
import os
import sys
import traceback

hostUser = os.getenv('HOSTUSER')
iotstackPwd = os.getenv('IOTSTACKPWD')
hostAddress = os.getenv('HOSTSSH_ADDR')
apiAddress = os.getenv('API_ADDR')
wuiAddress = os.getenv('WUI_ADDR')
hostPort = os.getenv('HOSTSSH_PORT')
doRemoteCheck = True # Don't commit if this is False

print('blessed Version:', blessed.__version__)
print('ruamel.yaml Version:', ruamel.yaml.__version__)
print('PyYAML Version:', yaml.__version__)
print('')
print('hostUser: ', hostUser)
print('iotstackPwd: ', iotstackPwd)
print('API Address: ', apiAddress)
print('WUI Address: ', wuiAddress)
print('SSH hostAddress: ', hostAddress)
print('SSH hostPort: ', hostPort)

sshState = ''

for x in sys.argv[1:]:
  if x == '--no-remote':
    doRemoteCheck = False

print('')
if doRemoteCheck:
  try:
    print('Checking connectivity to host...') 
    touchRes = execSilent('touch ./.tmp/rtest.file')
    touchRes = execSilent('echo "exec success" >> ./.tmp/rtest.file')
    readRes = execSilent('cat ./.tmp/rtest.file')
    rmRes = execSilent('rm ./.tmp/rtest.file')
    if readRes == 'exec success':
      sshState = '--ssh'
      print('Connection and remote command execution successful')
    else:
      sshState = '--no-ssh'
      print('Error attempting to execute commands on the host. You may need to regenerate SSH keys by running:')
      print('  ./menu.sh --run-env-setup')
      print('')
      print('Or configure SSH to use correct ports.')
      input("Press Enter to continue to menu...")

  except Exception:
    sshState = '--no-ssh'
    print('Error attempting to execute commands on the host. You may need to regenerate SSH keys by running:')
    print('  ./menu.sh --run-env-setup')
    print('')
    print('Check that SSH is running on your host or configure SSH to use correct ports.')
    print('')
    print('Error reported:')
    print(sys.exc_info())
    traceback.print_exc()
    print('')
    input("Press Enter to continue to menu...")
    print('')
  else:
    print("Skipping remote check")

  print("Loading IOTstack PyCLI menu...")

os.system('python3 menu_main.py {sshState}'.format(sshState=sshState))
