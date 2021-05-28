#!/usr/bin/env python3

import signal

buildSettingsConfig = {}
haltOnErrors = True

# Main wrapper function. Required to make local vars work correctly
def main():
  import os
  import time
  import sys
  import traceback
  from blessed import Terminal
  from deps.chars import specialChars, commonTopBorder, commonBottomBorder, commonEmptyLine, padText
  # from deps.common_functions import getExternalPorts, getInternalPorts, checkPortConflicts, enterPortNumberWithWhiptail

  global signal
  global apiBuildDockerCompose # The loaded memory YAML of all checked services
  global apiBuildMetadata # The loaded memory YAML of all checked services
  global apiBuildOptions # Passed in response from the API for this service
  global apiServicesOptions # Passed in response from the API for all services
  global currentServiceName # Name of the current service
  global haltOnErrors # Turn on to allow erroring
  global buildOptions # Store config changes for build
  global menu
  global renderMode
  global hideHelpText

  menu = []

  global validMenuItems # Used for returning the lits of valid menu items
  validMenuItems = []

  try: # If not already set, then set it.
    hideHelpText = hideHelpText
  except:
    hideHelpText = False

  ############################
  # Menu Logic
  ############################

  global currentMenuItemIndex
  global selectionInProgress
  global menuNavigateDirection
  global needsRender
  global toRun

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

  def run_nodered_npmSelection():
    global buildOptions
    global menu
    execGlobals = {
      "validMenuItems": [],
      "currentServiceName": currentServiceName,
      "apiBuildOptions": apiBuildOptions,
      "apiServicesOptions": apiServicesOptions,
      "renderMode": renderMode,
      "buildOptions": buildOptions
    }
    execLocals = locals()
    optionsScriptPath = "./serviceOptions/service_nodered_addons.py"
    with open(optionsScriptPath, "rb") as pythonDynamicImportFile:
      code = compile(pythonDynamicImportFile.read(), optionsScriptPath, "exec")
      exec(code, execGlobals, execLocals)
    mainRender(1, menu, 0)


  def createMenuOptions():
    global menu
    global apiBuildOptions
    global validMenuItems
    try:
      configOptions = apiBuildOptions
      if "nodered_npmSelection" in configOptions:
        menu.append(["Select Addons", run_nodered_npmSelection])
        validMenuItems.append("nodered_npmSelection")
    except:
      pass
    menu.append(["Go back", goBack])

  def runOptionsMenu():
    createMenuOptions()
    menuEntryPoint()
    return True

  def renderHotZone(term, menu, selection, hotzoneLocation):
    lineLengthAtTextStart = 53
    print(term.move(hotzoneLocation[0], hotzoneLocation[1]))
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
    global hideHelpText
    term = Terminal()
    
    if needsRender == 1:
      print(term.clear())
      print(term.move_y(term.height // 16))
      print(term.black_on_cornsilk4(term.center('IOTstack Grafana Options')))
      print("")
      print(term.center(commonTopBorder(renderMode)))
      print(term.center(commonEmptyLine(renderMode)))
      print(term.center("{bv}      Select Option to configure                              {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
      print(term.center(commonEmptyLine(renderMode)))

    if needsRender >= 1:
      renderHotZone(term, menu, selection, hotzoneLocation)

    if needsRender == 1:
      print(term.center(commonEmptyLine(renderMode)))
      print(term.center(commonEmptyLine(renderMode)))
      if not hideHelpText:
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center("{bv}      Controls:                                               {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Up] and [Down] to move selection cursor                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [H] Show/hide this text                                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Enter] to run command or save input                    {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center("{bv}      [Escape] to go back to build stack menu                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center(commonEmptyLine(renderMode)))
      print(term.center(commonEmptyLine(renderMode)))
      print(term.center(commonBottomBorder(renderMode)))

  def runSelection(selection):
    import types
    global menu
    if len(menu[selection]) > 1 and isinstance(menu[selection][1], types.FunctionType):
      menu[selection][1]()
    else:
      print(term.green_reverse('IOTstack Error: No function assigned to menu item: "{}"'.format(menu[selection][0])))

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
    global menu
    term = Terminal()
    with term.fullscreen():
      menuNavigateDirection = 0
      mainRender(needsRender, menu, currentMenuItemIndex)
      selectionInProgress = True
      with term.cbreak():
        while selectionInProgress:
          menuNavigateDirection = 0

          if needsRender: # Only rerender when changed to prevent flickering
            mainRender(needsRender, menu, currentMenuItemIndex)
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
              mainRender(1, menu, currentMenuItemIndex)

          if menuNavigateDirection != 0: # If a direction was pressed, find next selectable item
            currentMenuItemIndex += menuNavigateDirection
            currentMenuItemIndex = currentMenuItemIndex % len(menu)
            needsRender = 2

            while not isMenuItemSelectable(menu, currentMenuItemIndex):
              currentMenuItemIndex += menuNavigateDirection
              currentMenuItemIndex = currentMenuItemIndex % len(menu)
    return True

  ####################
  # End menu section
  ####################

  if toRun == 'createMenuOptions' or toRun == 'runOptionsMenu':
    if haltOnErrors:
      eval(toRun)()
    else:
      try:
        eval(toRun)()
      except:
        print("Issue running options:")
        print(toRun)
        print(err)
        print(sys.exc_info())
        traceback.print_exc()
        input("Press Enter to continue...")
  else:
    print("Invalid function call: ", toRun)
    input("Press Enter to continue...")


originalSignalHandler = signal.getsignal(signal.SIGINT)
main()
signal.signal(signal.SIGWINCH, originalSignalHandler)
