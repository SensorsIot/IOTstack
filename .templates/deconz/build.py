#!/usr/bin/env python3

HOOK_API_VERSION = 2

issues = {} # Returned issues dict
haltOnErrors = True

# Main wrapper function. Required to make local vars work correctly
def main():
  import os
  import ruamel.yaml
  import signal
  import sys
  from blessed import Terminal
  
  from deps.chars import specialChars, commonTopBorder, commonBottomBorder, commonEmptyLine
  from deps.consts import servicesDirectory, buildSettingsFileName
  from deps.common_functions import getExternalPorts, getInternalPorts, checkPortConflicts, enterPortNumberWithWhiptail

  yaml = ruamel.yaml.YAML()
  yaml.preserve_quotes = True

  global dockerComposeServicesYaml # The loaded memory YAML of all checked services
  global toRun # Switch for which function to run when executed
  global currentServiceName # Name of the current service
  global issues # Returned issues dict
  global haltOnErrors # Turn on to allow erroring
  global hideHelpText # Showing and hiding the help controls text
  global serviceService
  global hasRebuiltHardwareSelection

  serviceService = servicesDirectory + currentServiceName
  buildSettings = serviceService + buildSettingsFileName

  hasRebuiltHardwareSelection = False
  
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
    global dockerComposeServicesYaml
    if not os.path.exists(buildSettings):
      print("DeConz hardware is not configured. Select hardware from Options before building.")
      return False

    try:
      with open(buildSettings) as hardwareSettingsFile:
        hardwareSettings = yaml.load(hardwareSettingsFile)
      dockerComposeServicesYaml[currentServiceName]["devices"] = hardwareSettings["hardware"]
    except (OSError, KeyError, TypeError) as err:
      print("Error setting DeConz hardware: %s" % err)
      return False
    return True

  # #####################################
  # Supporting functions below
  # #####################################

  def checkForIssues():
    fileIssues = checkFiles()
    if (len(fileIssues) > 0):
      issues["fileIssues"] = fileIssues
    for (index, serviceName) in enumerate(dockerComposeServicesYaml):
      if not currentServiceName == serviceName: # Skip self
        currentServicePorts = getExternalPorts(currentServiceName, dockerComposeServicesYaml)
        portConflicts = checkPortConflicts(serviceName, currentServicePorts, dockerComposeServicesYaml)
        if (len(portConflicts) > 0):
          issues["portConflicts"] = portConflicts

  def checkFiles():
    fileIssues = []
    if not os.path.exists("{serviceDir}{buildSettings}".format(serviceDir=serviceService, buildSettings=buildSettingsFileName)):
      fileIssues.append(serviceService + '/build_settings.yml does not exist. Select hardware in options to fix.')
    return fileIssues

  # #####################################
  # End Supporting functions
  # #####################################

  ############################
  # Menu Logic
  ############################

  global currentMenuItemIndex
  global selectionInProgress
  global menuNavigateDirection
  global needsRender

  selectionInProgress = True
  currentMenuItemIndex = 0
  menuNavigateDirection = 0
  needsRender = 1
  term = Terminal()
  hotzoneLocation = [((term.height // 16) + 6), 0]

  def goBack():
    global selectionInProgress
    global needsRender
    selectionInProgress = False
    needsRender = 1
    return True

  def selectDeconzHardware():
    global needsRender
    global hasRebuiltHardwareSelection
    deconzSelectHardwareFilePath = "./.templates/deconz/select_hw.py"
    with open(deconzSelectHardwareFilePath, "rb") as pythonDynamicImportFile:
      code = compile(pythonDynamicImportFile.read(), deconzSelectHardwareFilePath, "exec")
    # execGlobals = globals()
    # execLocals = locals()
    execGlobals = {
      "currentServiceName": currentServiceName,
      "renderMode": renderMode
    }
    execLocals = {}
    screenActive = False
    exec(code, execGlobals, execLocals)
    signal.signal(signal.SIGWINCH, onResize)
    try:
      hasRebuiltHardwareSelection = execGlobals["hasRebuiltHardwareSelection"]
    except:
      hasRebuiltHardwareSelection = False
    screenActive = True
    needsRender = 1

  def enterPortNumberExec():
    # global term
    global needsRender
    global dockerComposeServicesYaml
    externalPort = getExternalPorts(currentServiceName, dockerComposeServicesYaml)[0]
    internalPort = getInternalPorts(currentServiceName, dockerComposeServicesYaml)[0]
    newPortNumber = enterPortNumberWithWhiptail(term, dockerComposeServicesYaml, currentServiceName, hotzoneLocation, externalPort)

    if newPortNumber > 0:
      dockerComposeServicesYaml[currentServiceName]["ports"][0] = "{newExtPort}:{oldIntPort}".format(
        newExtPort = newPortNumber,
        oldIntPort = internalPort
      )
      createMenu()
    needsRender = 1

  def onResize(sig, action):
    global deconzBuildOptions
    global currentMenuItemIndex
    mainRender(1, deconzBuildOptions, currentMenuItemIndex)

  deconzBuildOptions = []

  def createMenu():
    global deconzBuildOptions
    global serviceService
    try:
      deconzBuildOptions = []
      portNumber = getExternalPorts(currentServiceName, dockerComposeServicesYaml)[0]
      deconzBuildOptions.append([
        "Change external WUI Port Number from: {port}".format(port=portNumber),
        enterPortNumberExec
      ])
    except: # Error getting port
      pass

    
    if os.path.exists("{buildSettings}".format(buildSettings=buildSettings)):
      deconzBuildOptions.insert(0, ["Change selected hardware", selectDeconzHardware])
    else:
      deconzBuildOptions.insert(0, ["Select hardware", selectDeconzHardware])

    deconzBuildOptions.append(["Go back", goBack])

  def runOptionsMenu():
    originalSignalHandler = signal.getsignal(signal.SIGWINCH)
    signal.signal(signal.SIGWINCH, onResize)
    try:
      createMenu()
      menuEntryPoint()
      return True
    finally:
      signal.signal(signal.SIGWINCH, originalSignalHandler)

  def renderHotZone(term, menu, selection, hotzoneLocation):
    lineLengthAtTextStart = 71
    print(term.move(hotzoneLocation[0], hotzoneLocation[1]), end="")
    for (index, menuItem) in enumerate(menu):
      toPrint = ""
      if index == selection:
        toPrint += ('{bv} -> {t.blue_on_green} {title} {t.normal} <-'.format(t=term, title=menuItem[0], bv=specialChars[renderMode]["borderVertical"]))
      else:
        toPrint += ('{bv}    {t.normal} {title}    '.format(t=term, title=menuItem[0], bv=specialChars[renderMode]["borderVertical"]))

      for i in range(lineLengthAtTextStart - len(menuItem[0])):
        toPrint += " "

      toPrint += "{bv}".format(bv=specialChars[renderMode]["borderVertical"])

      toPrint = term.center(toPrint)

      print(toPrint)

  def mainRender(needsRender, menu, selection):
    global hasRebuiltHardwareSelection
    term = Terminal()
    
    if needsRender == 1:
      print(term.clear())
      print(term.move_y(term.height // 16))
      print(term.black_on_cornsilk4(term.center('IOTstack DeConz Options')))
      print("")
      print(term.center(commonTopBorder(renderMode)))
      print(term.center(commonEmptyLine(renderMode)))
      print(term.center("{bv}      Select Option to configure                                                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
      print(term.center(commonEmptyLine(renderMode)))

    if needsRender >= 1:
      renderHotZone(term, menu, selection, hotzoneLocation)

    if needsRender == 1:
      if os.path.exists("{buildSettings}".format(buildSettings=buildSettings)):
        if hasRebuiltHardwareSelection:
          print(term.center(commonEmptyLine(renderMode)))
          print(term.center('{bv}      {t.grey_on_blue4} {text} {t.normal}{t.white_on_black}{t.normal}                      {bv}'.format(t=term, text="Hardware list has been rebuilt: build_settings.yml", bv=specialChars[renderMode]["borderVertical"])))
        else:
          print(term.center(commonEmptyLine(renderMode)))
          print(term.center('{bv}      {t.grey_on_blue4} {text} {t.normal}{t.white_on_black}{t.normal}             {bv}'.format(t=term, text="Using existing build_settings.yml for hardware installation", bv=specialChars[renderMode]["borderVertical"])))
      else:
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
      if not hideHelpText:
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center("{bv}      Controls:                                                                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Up] and [Down] to move selection cursor                                  {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [H] Show/hide this text                                                   {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Enter] to run command or save input                                      {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Escape] to go back to build stack menu                                   {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center(commonEmptyLine(renderMode)))
      print(term.center(commonEmptyLine(renderMode)))
      print(term.center(commonBottomBorder(renderMode)))

  def runSelection(selection):
    import types
    global deconzBuildOptions
    if len(deconzBuildOptions[selection]) > 1 and isinstance(deconzBuildOptions[selection][1], types.FunctionType):
      deconzBuildOptions[selection][1]()
    else:
      print(term.green_reverse('IOTstack Error: No function assigned to menu item: "{}"'.format(nodeRedBuildOptions[selection][0])))

  def isMenuItemSelectable(menu, index):
    if len(menu) > index:
      if len(menu[index]) > 2:
        if menu[index][2]["skip"] == True:
          return False
    return True

  def menuEntryPoint():
    # These need to be reglobalised due to eval()
    global currentMenuItemIndex
    global selectionInProgress
    global menuNavigateDirection
    global needsRender
    global hideHelpText
    global deconzBuildOptions
    term = Terminal()
    with term.fullscreen():
      menuNavigateDirection = 0
      mainRender(needsRender, deconzBuildOptions, currentMenuItemIndex)
      needsRender = 0
      selectionInProgress = True
      with term.cbreak():
        while selectionInProgress:
          menuNavigateDirection = 0

          if needsRender: # Only rerender when changed to prevent flickering
            mainRender(needsRender, deconzBuildOptions, currentMenuItemIndex)
            needsRender = 0

          key = term.inkey(esc_delay=0.05)
          if key.is_sequence:
            if key.name == 'KEY_TAB':
              menuNavigateDirection += 1
            if key.name == 'KEY_DOWN':
              menuNavigateDirection += 1
            if key.name == 'KEY_UP':
              menuNavigateDirection -= 1
            if key.name == 'KEY_LEFT':
              goBack()
            if key.name == 'KEY_ENTER':
              runSelection(currentMenuItemIndex)
            if key.name == 'KEY_ESCAPE':
              return True
          elif key:
            if key == 'h': # H pressed
              if hideHelpText:
                hideHelpText = False
              else:
                hideHelpText = True
              mainRender(1, deconzBuildOptions, currentMenuItemIndex)

          if menuNavigateDirection != 0: # If a direction was pressed, find next selectable item
            currentMenuItemIndex += menuNavigateDirection
            currentMenuItemIndex = currentMenuItemIndex % len(deconzBuildOptions)
            needsRender = 2

            while not isMenuItemSelectable(deconzBuildOptions, currentMenuItemIndex):
              currentMenuItemIndex += menuNavigateDirection
              currentMenuItemIndex = currentMenuItemIndex % len(deconzBuildOptions)
    return True

  ####################
  # End menu section
  ####################


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


def runOptionsMenu(context):
  """Open this service's interactive configuration menu."""
  return _runHook(context, "runOptionsMenu")


def preBuild(context):
  """Run this service's pre-build work."""
  return _runHook(context, "preBuild")


def postBuild(context):
  """Run this service's post-build work."""
  return _runHook(context, "postBuild")
