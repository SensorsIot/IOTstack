#!/usr/bin/env python3

import os
import subprocess

from deps.consts import templatesDirectory


HOOK_API_VERSION = 2
UDEV_RULES_FILE = "88-tty-iotstack-esphome.rules"
UDEV_RULES_DIRECTORY = "/etc/udev/rules.d"


def runChecks(context):
  return {}


def preBuild(context):
  sourcePath = os.path.realpath(os.path.join(
    templatesDirectory,
    context.serviceName,
    UDEV_RULES_FILE,
  ))
  targetPath = os.path.join(UDEV_RULES_DIRECTORY, UDEV_RULES_FILE)

  if os.path.exists(targetPath):
    return True
  if not os.path.exists(sourcePath):
    print("ESPHome udev rules file is missing: %s" % sourcePath)
    return False

  try:
    result = subprocess.run([
      "sudo", "install", "-m", "0644", sourcePath, targetPath,
    ])
  except OSError as err:
    print("Unable to install ESPHome udev rules: %s" % err)
    return False
  if result.returncode != 0:
    print("Unable to install ESPHome udev rules (exit status %s)." % result.returncode)
    return False
  return True


def postBuild(context):
  return True
