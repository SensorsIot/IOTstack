#!/usr/bin/env python3

HOOK_API_VERSION = 2

issues = {} # Returned issues dict
haltOnErrors = True

# Main wrapper function. Required to make local vars work correctly
def main():
  import os
  import time
  import shutil
  import sys
  
  from deps.consts import servicesDirectory, templatesDirectory, volumesDirectory
  from deps.common_functions import getExternalPorts, getInternalPorts, checkPortConflicts

  global dockerComposeServicesYaml # The loaded memory YAML of all checked services
  global toRun # Switch for which function to run when executed
  global currentServiceName # Name of the current service
  global issues # Returned issues dict
  global haltOnErrors # Turn on to allow erroring
  global hideHelpText # Showing and hiding the help controls text
  global serviceService

  serviceVolume = volumesDirectory + currentServiceName
  serviceService = servicesDirectory + currentServiceName
  serviceTemplate = templatesDirectory + currentServiceName

  try: # If not already set, then set it.
    hideHelpText = hideHelpText
  except:
    hideHelpText = False

  # runtime vars
  portConflicts = []

  # This service will not check anything unless this is set
  # This function is optional, and will run each time the menu is rendered
  def runChecks():
    checkForIssues()
    return []

  # This function is optional, and will run after the docker-compose.yml file is written to disk.
  def postBuild():
    return True

  # This function is optional, and will run just before the build docker-compose.yml code.
  def preBuild():
    # Setup service directory
    if not os.path.exists(serviceVolume):
      os.makedirs(serviceVolume, exist_ok=True)
    os.makedirs(serviceVolume + '/share', exist_ok=True)
    os.makedirs(serviceVolume + '/share/config', exist_ok=True)

    # Files copy
    shutil.copy(r'%s/local.json' % serviceTemplate, r'%s/share/config/local.json' % serviceVolume)
    return True

  # #####################################
  # Supporting functions below
  # #####################################


  def checkForIssues():
    envFileIssues = checkEnvFiles()
    if (len(envFileIssues) > 0):
      issues["envFileIssues"] = envFileIssues

    for (index, serviceName) in enumerate(dockerComposeServicesYaml):
      if not currentServiceName == serviceName: # Skip self
        currentServicePorts = getExternalPorts(currentServiceName, dockerComposeServicesYaml)
        portConflicts = checkPortConflicts(serviceName, currentServicePorts, dockerComposeServicesYaml)
        if (len(portConflicts) > 0):
          issues["portConflicts"] = portConflicts

  def checkEnvFiles():
    envFileIssues = []
    if not os.path.exists(serviceTemplate + '/local.json'):
      envFileIssues.append(serviceTemplate + '/local.json does not exist')
    return envFileIssues


  # #####################################
  # End Supporting functions
  # #####################################

  hook = locals().get(toRun)
  if hook is None:
    raise ValueError("Unknown service hook '%s'" % toRun)
  if haltOnErrors:
    return hook()
  try:
    return hook()
  except Exception:
    return None

def _runHook(context, action):
  """Adapt the service's established implementation to hook API v2."""
  global dockerComposeServicesYaml
  global currentServiceName
  global renderMode
  global toRun

  dockerComposeServicesYaml = context.services
  currentServiceName = context.serviceName
  renderMode = context.renderMode
  toRun = action
  result = main()
  context.services = dockerComposeServicesYaml
  return result


def runChecks(context):
  """Return build issues for the currently selected Compose services."""
  global issues
  issues = {}
  _runHook(context, "runChecks")
  return issues


def preBuild(context):
  """Run this service's pre-build work."""
  return _runHook(context, "preBuild")


def postBuild(context):
  """Run this service's post-build work."""
  return _runHook(context, "postBuild")
