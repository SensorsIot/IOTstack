#!/usr/bin/python3
# -*- coding: utf-8 -*-

HOOK_API_VERSION = 2

issues = {} # Returned issues dict
haltOnErrors = True

import os
import sys

global templatesDirectory
global currentServiceName # Name of the current service
global generateRandomString

from deps.consts import templatesDirectory
from deps.common_functions import generateRandomString


# Main wrapper function. Required to make local vars work correctly
def main():

	global toRun # Switch for which function to run when executed
	global issues # Returned issues dict
	global haltOnErrors # Turn on to allow erroring

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
		return True

  # #####################################
  # Supporting functions below
  # #####################################

	def doCustomSetup() :

		import os
		import re
		import subprocess
		from os.path import exists

		def copyUdevRulesFile(templates,rules) :

			# the expected location of the rules file in the template is the absolute path ...
			SOURCE_PATH = templates + '/' + currentServiceName + '/' + rules

			# the rules file should be installed at the following absolute path...
			TARGET_PATH = '/etc/udev/rules.d' + '/' + rules

			# does the target already exist?
			if not exists(TARGET_PATH) :

				# no! does the source path exist?
				if exists(SOURCE_PATH) :

					# yes! we should copy the source to the target
					subprocess.call(['sudo', 'cp', SOURCE_PATH, TARGET_PATH])

					# sudo cp sets root ownership but not necessarily correct mode
					subprocess.call(['sudo', 'chmod', '644', TARGET_PATH])

		def setEnvironment (path, key, value) :

			# assume the variable should be written
			shouldWrite = True

			# does the target file already exist?
			if exists(path) :

				# yes! open the file so we can search it
				env_file = open(path, 'r+')

				# prepare to read by lines
				env_data = env_file.readlines()

				# we are searching for...
				expression = '^' + key + '='

				# search by line
				for line in env_data:
					if re.search(expression, line) :
						shouldWrite = False
						break

			else :
	
				# no! create the file
				env_file = open(path, 'w')
	
			# should the variable be written?
			if shouldWrite :
				print(key + '=' + value, file=env_file)

			# done with the environment file
			env_file.close()

		copyUdevRulesFile(
			os.path.realpath(templatesDirectory),
			'88-tty-iotstack-' + currentServiceName + '.rules'
		)

		# the environment file is located at ...
		DOT_ENV_PATH = os.path.realpath('.') + '/.env'

		# check/set environment variables
		setEnvironment(DOT_ENV_PATH,'ESPHOME_USERNAME',currentServiceName)
		setEnvironment(DOT_ENV_PATH,'ESPHOME_PASSWORD',generateRandomString())


	def checkForIssues():
		doCustomSetup() # done here because is called least-frequently
		return True

	hook = locals().get(toRun)
	if hook is None:
	  raise ValueError("Unknown service hook '%s'" % toRun)
	if haltOnErrors:
	  hook()
	else:
	  try:
	    hook()
	  except Exception:
	    pass

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
  main()
  context.services = dockerComposeServicesYaml


def runChecks(context):
  """Return build issues for the currently selected Compose services."""
  global issues
  issues = {}
  _runHook(context, "runChecks")
  return issues


def preBuild(context):
  """Run this service's pre-build work."""
  _runHook(context, "preBuild")


def postBuild(context):
  """Run this service's post-build work."""
  _runHook(context, "postBuild")
