#!/usr/bin/env python3

"""Optional build hooks for a service template.

Copy this file with the example template, then delete any hooks your service
does not need. IOTstack discovers the functions by name.
"""

HOOK_API_VERSION = 2


def runChecks(context):
  """Return build issues as a dictionary. An empty dictionary means pass."""
  from deps.common_functions import checkPortConflicts, getExternalPorts

  issues = {}
  currentPorts = getExternalPorts(context.serviceName, context.services)
  conflicts = []
  for serviceName in context.services:
    if serviceName != context.serviceName:
      conflicts.extend(checkPortConflicts(serviceName, currentPorts, context.services))

  if conflicts:
    issues["portConflicts"] = conflicts
  return issues


def runOptionsMenu(context):
  """Example option: change the service's first published port."""
  from deps.common_functions import enterPortNumberWithWhiptail, getExternalPorts, getInternalPorts

  externalPorts = getExternalPorts(context.serviceName, context.services)
  internalPorts = getInternalPorts(context.serviceName, context.services)
  if not externalPorts or not internalPorts:
    return

  newPort = enterPortNumberWithWhiptail(
    context.terminal,
    context.services,
    context.serviceName,
    [7, 0],
    externalPorts[0],
  )
  if newPort != -1:
    context.services[context.serviceName]["ports"][0] = "%s:%s" % (
      newPort,
      internalPorts[0],
    )


def preBuild(context):
  """Optional: prepare files or update context.services before output."""
  return None


def postBuild(context):
  """Optional: perform work after docker-compose.yml has been written."""
  return None
