#!/usr/bin/env python3


issues = {} # Returned issues dict
haltOnErrors = True

# Main wrapper function. Required to make local vars work correctly
def main():
  import os
  import time
  import sys
  
  from deps.consts import servicesDirectory, templatesDirectory
  from deps.common_functions import getExternalPorts, getInternalPorts, checkPortConflicts

  global dockerComposeServicesYaml # The loaded memory YAML of all checked services
  global toRun # Switch for which function to run when executed
  global currentServiceName # Name of the current service
  global issues # Returned issues dict
  global haltOnErrors # Turn on to allow erroring
  global hideHelpText # Showing and hiding the help controls text
  global serviceService

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
    return []

  # This function is optional, and will run after the docker-compose.yml file is written to disk.
  def postBuild():
    return True

  # This function is optional, and will run just before the build docker-compose.yml code.
  def preBuild():
    return True

  # #####################################
  # Supporting functions below
  # #####################################

  # None

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
