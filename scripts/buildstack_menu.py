#!/usr/bin/env python3
import signal

checkedMenuItems = []
results = {}

def main():
  import os
  import ruamel.yaml
  import sys
  import subprocess
  import traceback
  from deps.chars import specialChars, commonTopBorder, commonBottomBorder, commonEmptyLine, commonTextLine, padText
  from deps.consts import servicesDirectory, templatesDirectory, buildCache, envFile, dockerPathOutput, servicesFileName, composeOverrideFile
  from deps.yaml_merge import mergeYaml
  from deps.service_templates import loadServiceTemplate, mergeServiceTemplate, removeServiceTemplate, restoreSavedServiceTemplates
  from deps.menu_renderer import issuePanelHeight, pageSizeForTerminal, paginationStart, serviceOptionsMessage, terminalSupportsMenu
  from deps.service_hooks import HookContext, serviceHookAvailable, runServiceHook
  from deps.compose_environment import (
    requiredEnvironmentIssues,
    configurableEnvironmentVariables,
    restoreEnvironmentVariableReferences,
  )
  from deps.environment_options import runEnvironmentOptions
  from deps.issue_viewer import compactIssueRows, runIssueViewer
  from blessed import Terminal
  global signal
  global renderMode
  global term
  global paginationSize
  global paginationStartIndex
  global hideHelpText
  global lastSelection
  global transientMessage

  yaml = ruamel.yaml.YAML()
  yaml.preserve_quotes = True

  # Constants
  buildScriptFile = 'build.py'
  dockerSavePathOutput = buildCache

  # Runtime vars
  menu = []
  dockerComposeServicesYaml = {}
  templatesDirectoryFolders = next(os.walk(templatesDirectory))[1]
  term = Terminal()
  hotzoneLocation = [7, 0] # Top text
  paginationStartIndex = 0
  lastSelection = 0
  transientMessage = None
  
  try: # If not already set, then set it.
    hideHelpText = hideHelpText
  except:
    hideHelpText = False

  reservedLines = 19 if hideHelpText else 27
  paginationSize = pageSizeForTerminal(term.height, reservedLines=reservedLines)

  def buildServices(): # TODO: Move this into a dependency so that it can be executed with just a list of services.
    global dockerComposeServicesYaml
    try:
      requiredIssues = requiredEnvironmentIssues(dockerComposeServicesYaml)
      if requiredIssues:
        print("")
        print("Build warning: required environment variables are missing:")
        for description in requiredIssues.values():
          print("* %s" % description)
        print("Add the missing values to .env before building this stack.")
        input("Press Enter to continue...")
        return False
      if not runPrebuildHook():
        return False
      menuStateFileYaml = {}
      menuStateFileYaml["services"] = dockerComposeServicesYaml

      with open(r'%s' % envFile) as fileEnv:
        dockerFileYaml = yaml.load(fileEnv)
      dockerFileYaml["services"] = dockerComposeServicesYaml

      if os.path.exists(composeOverrideFile):
        with open(r'%s' % composeOverrideFile) as fileOverride:
          yamlOverride = yaml.load(fileOverride)

        mergedYaml = mergeYaml(yamlOverride, dockerFileYaml)
        dockerFileYaml = mergedYaml

      with open(r'%s' % dockerPathOutput, 'w') as outputFile:
        yaml.dump(dockerFileYaml, outputFile)

      if not os.path.exists(servicesDirectory):
        os.makedirs(servicesDirectory, exist_ok=True)

      with open(r'%s' % dockerSavePathOutput, 'w') as outputFile:
        yaml.dump(menuStateFileYaml, outputFile)
      if not runPostBuildHook():
        return False

      if os.path.exists('./postbuild.sh'):
        postBuildCommand = ["./postbuild.sh"] + list(dockerComposeServicesYaml)
        postBuildResult = subprocess.call(postBuildCommand)
        if postBuildResult != 0:
          print("postbuild.sh failed with exit status %s." % postBuildResult)
          input("Press Enter to continue...")
          return False

      return True
    except Exception as err: 
      print("Issue running build:")
      traceback.print_exc()
      input("Press Enter to continue...")
      return False

  def generateTemplateList(templatesDirectoryFolders):
    templatesDirectoryFolders.sort()
    templateListDirectories = []
    for directory in templatesDirectoryFolders:
      serviceFilePath = templatesDirectory + '/' + directory + '/' + servicesFileName
      if os.path.exists(serviceFilePath):
        templateListDirectories.append(directory)

    return templateListDirectories

  def generateLineText(text, textLength=None, paddingBefore=0, lineLength=26):
    result = ""
    for i in range(paddingBefore):
      result += " "

    textPrintableCharactersLength = textLength

    if (textPrintableCharactersLength) == None:
      textPrintableCharactersLength = len(text)

    result += text
    remainingSpace = lineLength - textPrintableCharactersLength

    for i in range(remainingSpace):
      result += " "
    
    return result

  def renderHotZone(term, renderType, menu, selection, paddingBefore):
    global paginationSize
    optionsLength = len(" >>   Options ")
    optionsIssuesSpace = len("      ")
    selectedTextLength = len("-> ")
    spaceAfterissues = len("      ")
    issuesLength = len(" !!   Issue ")

    print(term.move(hotzoneLocation[0], hotzoneLocation[1]), end="")

    if paginationStartIndex >= 1:
      print(term.center("{b}       {uaf}      {uaf}{uaf}{uaf}                                                   {ual}           {b}".format(
        b=specialChars[renderMode]["borderVertical"],
        uaf=specialChars[renderMode]["upArrowFull"],
        ual=specialChars[renderMode]["upArrowLine"]
      )))
    else:
      print(term.center(commonEmptyLine(renderMode)))

    if renderType == 2 or renderType == 1: # Rerender entire hotzone
      for (index, menuItem) in enumerate(menu): # Menu loop
        if index >= paginationStartIndex and index < paginationStartIndex + paginationSize:
          lineText = generateLineText(menuItem[0], paddingBefore=paddingBefore)

          # Menu highlight logic
          if index == selection:
            formattedLineText = '-> {t.blue_on_green}{title}{t.normal} <-'.format(t=term, title=menuItem[0])
            paddedLineText = generateLineText(formattedLineText, textLength=len(menuItem[0]) + selectedTextLength, paddingBefore=paddingBefore - selectedTextLength)
            toPrint = paddedLineText
          else:
            toPrint = '{title}{t.normal}'.format(t=term, title=lineText)
          # #####

          # Options and issues
          if "buildHooks" in menuItem[1] and "options" in menuItem[1]["buildHooks"] and menuItem[1]["buildHooks"]["options"]:
            toPrint = toPrint + '{t.blue_on_black} {raf}{raf} {t.normal}'.format(t=term, raf=specialChars[renderMode]["rightArrowFull"])
            toPrint = toPrint + ' {t.white_on_black} Options {t.normal}'.format(t=term)
          else:
            for i in range(optionsLength):
              toPrint += " "

          for i in range(optionsIssuesSpace):
            toPrint += " "

          if "issues" in menuItem[1] and menuItem[1]["issues"]:
            toPrint = toPrint + '{t.red_on_orange} !! {t.normal}'.format(t=term)
            toPrint = toPrint + ' {t.orange_on_black} Issue {t.normal}'.format(t=term)
          else:
            if menuItem[1]["checked"]:
              if not menuItem[1]["issues"] == None and len(menuItem[1]["issues"]) == 0:
                toPrint = toPrint + '     {t.green_on_blue} Pass {t.normal} '.format(t=term)
              else:
                for i in range(issuesLength):
                  toPrint += " "
            else:
              for i in range(issuesLength):
                toPrint += " "

          for i in range(spaceAfterissues):
            toPrint += " "
          # #####

          # Menu check render logic
          if menuItem[1]["checked"]:
            toPrint = "     (X) " + toPrint
          else:
            toPrint = "     ( ) " + toPrint

          toPrint = "{bv} {toPrint}  {bv}".format(bv=specialChars[renderMode]["borderVertical"], toPrint=toPrint) # Generate border
          toPrint = term.center(toPrint) # Center Text (All lines should have the same amount of printable characters)
          # #####
          print(toPrint)


    if renderType == 3: # Only partial rerender of hotzone (the unselected menu item, and the newly selected menu item rows)
      global lastSelection
      global renderOffsetLastSelection
      global renderOffsetCurrentSelection
      # TODO: Finish this, currently disabled. To enable, update the actions for UP and DOWN array keys below to assigned 3 to needsRender
      renderOffsetLastSelection = lastSelection - paginationStartIndex
      renderOffsetCurrentSelection = selection - paginationStartIndex
      lineText = generateLineText(menu[lastSelection][0], paddingBefore=paddingBefore)
      toPrint = '{title}{t.normal}'.format(t=term, title=lineText)
      print('{t.move_y(lastSelection)}{title}'.format(t=term, title=toPrint))
      # print(toPrint)
      print(renderOffsetCurrentSelection, lastSelection, renderOffsetLastSelection)
      lastSelection = selection
      


    if paginationStartIndex + paginationSize < len(menu):
      print(term.center("{b}       {daf}      {daf}{daf}{daf}                                                   {dal}           {b}".format(
        b=specialChars[renderMode]["borderVertical"],
        daf=specialChars[renderMode]["downArrowFull"],
        dal=specialChars[renderMode]["downArrowLine"]
      )))
    else:
      print(term.center(commonEmptyLine(renderMode)))

  def getIssueEntries():
    return [
      (menuItem[0], issue, menuItem[1]["issues"][issue])
      for menuItem in menu
      if menuItem[1].get("issues")
      for issue in menuItem[1]["issues"]
    ]

  def mainRender(menu, selection, renderType = 1):
    global paginationStartIndex
    global paginationSize

    if not terminalSupportsMenu(term.width, term.height):
      print(term.clear(), end="")
      print(term.black_on_cornsilk4(term.center("IOTstack Build Menu")))
      print("")
      print(term.center("Terminal is too small to render the build menu."))
      print(term.center("Resize to at least 82 columns by 30 rows, or press Escape."))
      return

    paddingBefore = 4

    issueEntries = getIssueEntries()
    maximumIssueRows = min(4, max(1, term.height - 28))
    issueRows = compactIssueRows(
      issueEntries,
      contentWidth=76,
      maximumRows=maximumIssueRows,
    )

    issuesHeight = issuePanelHeight(len(issueRows), fixedRows=8)
    showHelpText = not hideHelpText and term.height >= 27 + issuesHeight + 1
    reservedLines = (27 if showHelpText else 19) + issuesHeight
    newPaginationSize = pageSizeForTerminal(term.height, reservedLines=reservedLines)
    if newPaginationSize != paginationSize:
      paginationSize = newPaginationSize
      paginationStartIndex = max(0, min(paginationStartIndex, max(0, len(menu) - paginationSize)))
      renderType = 1

    newPaginationStartIndex = paginationStart(selection, paginationStartIndex, paginationSize)
    if newPaginationStartIndex != paginationStartIndex:
      paginationStartIndex = newPaginationStartIndex
      renderType = 1

    try:
      if (renderType == 1):
        checkForOptions()
        print(term.clear())
        print(term.move_y(7 - hotzoneLocation[0]))
        print(term.black_on_cornsilk4(term.center('IOTstack Build Menu')))
        print("")
        print(term.center(commonTopBorder(renderMode)))

        print(term.center(commonEmptyLine(renderMode)))
        print(term.center("{bv}      Select containers to build                                                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))

      renderHotZone(term, renderType, menu, selection, paddingBefore)

      if (renderType == 1):
        print(term.center(commonEmptyLine(renderMode)))
        if showHelpText:
          print(term.center(commonEmptyLine(renderMode)))
          print(term.center("{bv}      Controls:                                                                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [Space] to select or deselect image                                       {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [Up] and [Down] to move selection cursor                                  {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [Right] for options for containers that support them                      {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [H] Show/hide this text                                                   {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [Enter] to begin build                                                    {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center("{bv}      [Escape] to cancel build                                                  {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
          print(term.center(commonEmptyLine(renderMode)))
        if transientMessage:
          print(term.center(commonTextLine(
            renderMode,
            transientMessage,
            paddingBefore=6,
            style=term.yellow,
          )))
        else:
          print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonBottomBorder(renderMode)))

        if issueEntries:
          print(term.center(""))
          print(term.center(""))
          print(term.center(""))
          issueBoxWidth = 80
          issueTitle = " Build Issues "
          leftBorderSize = 6
          rightBorderSize = issueBoxWidth - leftBorderSize - len(issueTitle)
          print(term.center(
            specialChars[renderMode]["borderTopLeft"]
            + (specialChars[renderMode]["borderHorizontal"] * leftBorderSize)
            + issueTitle
            + (specialChars[renderMode]["borderHorizontal"] * rightBorderSize)
            + specialChars[renderMode]["borderTopRight"]
          ))
          print(term.center(commonEmptyLine(renderMode, size=issueBoxWidth)))
          for issueRow in issueRows:
            print(term.center(commonTextLine(
              renderMode,
              issueRow,
              size=issueBoxWidth,
              paddingBefore=2,
            )))
          print(term.center(commonTextLine(
            renderMode,
            "[I] View all issues",
            size=issueBoxWidth,
            paddingBefore=2,
            style=term.yellow,
          )))
          print(term.center(commonEmptyLine(renderMode, size=issueBoxWidth)))
          print(term.center(commonBottomBorder(renderMode, size=issueBoxWidth)))

    except Exception as err: 
      print("There was an error rendering the menu:")
      traceback.print_exc()
      print("Press [Esc] to go back")
      return

    return

  def setCheckedMenuItems():
    global checkedMenuItems
    checkedMenuItems.clear()
    for (index, menuItem) in enumerate(menu):
      if menuItem[1]["checked"]:
        checkedMenuItems.append(menuItem[0])

  def loadAllServices(reload = False):
    global dockerComposeServicesYaml
    dockerComposeServicesYaml.clear()
    for (index, checkedMenuItem) in enumerate(checkedMenuItems):
      templateServices = loadServiceTemplate(yaml, templatesDirectory, checkedMenuItem, servicesFileName)
      mergeServiceTemplate(dockerComposeServicesYaml, templateServices, reload=reload)

    return True

  def loadService(serviceName, reload = False):
    try:
      global dockerComposeServicesYaml
      templateServices = loadServiceTemplate(yaml, templatesDirectory, serviceName, servicesFileName)
      mergeServiceTemplate(dockerComposeServicesYaml, templateServices, reload=reload)
    except Exception as err:
      print("Error running build menu:", err)
      print("Check the following:")
      print("* YAML service name matches the folder name")
      print("* Error in YAML file")
      print("* YAML file is unreadable")
      print("* Buildstack script was modified")
      input("Press Enter to exit...")
      sys.exit(1)

    return True

  def createHookContext(serviceName):
    return HookContext(
      services=dockerComposeServicesYaml,
      serviceName=serviceName,
      renderMode=renderMode,
      terminal=term,
    )

  def getOwnedServices(serviceName):
    templateServices = loadServiceTemplate(
      yaml, templatesDirectory, serviceName, servicesFileName
    )
    return {
      ownedServiceName: dockerComposeServicesYaml[ownedServiceName]
      for ownedServiceName in templateServices
      if ownedServiceName in dockerComposeServicesYaml
    }

  def checkForIssues():
    global dockerComposeServicesYaml
    for (index, checkedMenuItem) in enumerate(checkedMenuItems):
      menuItemIndex = getMenuItemIndexByService(checkedMenuItem)
      buildScriptPath = templatesDirectory + '/' + checkedMenuItem + '/' + buildScriptFile

      try:
        issues = {}
        if os.path.exists(buildScriptPath):
          context = createHookContext(checkedMenuItem)
          if serviceHookAvailable(buildScriptPath, "runChecks", context):
            hookIssues = runServiceHook(buildScriptPath, "runChecks", context)
            issues.update(hookIssues)
          dockerComposeServicesYaml = context.services

        ownedServices = getOwnedServices(checkedMenuItem)
        issues.update(requiredEnvironmentIssues(ownedServices))
        menu[menuItemIndex][1]["issues"] = issues if issues else []
      except Exception:
        print("Error running checkForIssues on '%s'" % checkedMenuItem)
        traceback.print_exc()
        input("Press any key to exit...")
        sys.exit(1)

  def checkForOptions():
    for (index, menuItem) in enumerate(menu):
      serviceName = menuItem[0]
      buildScriptPath = templatesDirectory + '/' + serviceName + '/' + buildScriptFile
      hookState = menuItem[1].setdefault("buildHooks", {})
      hookState["serviceOptions"] = False

      try:
        templateServices = (
          loadServiceTemplate(
            yaml, templatesDirectory, serviceName, servicesFileName
          )
          if menuItem[1]["checked"]
          else {}
        )
        hookState["environmentOptions"] = bool(
          configurableEnvironmentVariables(templateServices)
        )
        if os.path.exists(buildScriptPath):
          context = createHookContext(serviceName)
          hookState["serviceOptions"] = serviceHookAvailable(
            buildScriptPath, "options", context
          )
        hookState["options"] = (
          hookState["environmentOptions"] or hookState["serviceOptions"]
        )
      except Exception:
        print("Error checking service options on '%s'" % serviceName)
        traceback.print_exc()
        input("Press any key to exit...")
        sys.exit(1)

  def runPrebuildHook():
    global dockerComposeServicesYaml
    for (index, checkedMenuItem) in enumerate(checkedMenuItems):
      buildScriptPath = templatesDirectory + '/' + checkedMenuItem + '/' + buildScriptFile
      if not os.path.exists(buildScriptPath):
        continue

      try:
        context = createHookContext(checkedMenuItem)
        if serviceHookAvailable(buildScriptPath, "preBuild", context):
          hookResult = runServiceHook(buildScriptPath, "preBuild", context)
          if hookResult is False:
            print("preBuild reported a failure for '%s'." % checkedMenuItem)
            input("Press Enter to continue...")
            return False
        dockerComposeServicesYaml = context.services
      except Exception:
        print("Error running preBuild on '%s'" % checkedMenuItem)
        traceback.print_exc()
        input("Press Enter to continue...")
        return False
    return True

  def runPostBuildHook():
    global dockerComposeServicesYaml
    for (index, checkedMenuItem) in enumerate(checkedMenuItems):
      buildScriptPath = templatesDirectory + '/' + checkedMenuItem + '/' + buildScriptFile
      if not os.path.exists(buildScriptPath):
        continue

      try:
        context = createHookContext(checkedMenuItem)
        if serviceHookAvailable(buildScriptPath, "postBuild", context):
          hookResult = runServiceHook(buildScriptPath, "postBuild", context)
          if hookResult is False:
            print("postBuild reported a failure for '%s'." % checkedMenuItem)
            input("Press Enter to continue...")
            return False
        dockerComposeServicesYaml = context.services
      except Exception:
        print("Error running postBuild on '%s'" % checkedMenuItem)
        traceback.print_exc()
        input("Press Enter to continue...")
        return False
    return True

  def executeServiceOptions():
    global dockerComposeServicesYaml
    menuItem = menu[selection]
    hookState = menuItem[1].get("buildHooks", {})
    if not menuItem[1]["checked"] or not hookState.get("options", False):
      return

    serviceName = menuItem[0]
    buildScriptPath = templatesDirectory + '/' + serviceName + '/' + buildScriptFile
    templateServices = loadServiceTemplate(
      yaml, templatesDirectory, serviceName, servicesFileName
    )

    def onEnvironmentValueSaved(name, unusedValue):
      restoreEnvironmentVariableReferences(
        dockerComposeServicesYaml,
        templateServices,
        name,
      )

    def openCustomServiceOptions():
      global dockerComposeServicesYaml
      context = createHookContext(serviceName)
      result = runServiceHook(buildScriptPath, "options", context)
      dockerComposeServicesYaml = context.services
      return result

    try:
      if hookState.get("environmentOptions", False):
        customOptions = (
          openCustomServiceOptions
          if hookState.get("serviceOptions", False)
          else None
        )
        runEnvironmentOptions(
          term,
          renderMode,
          serviceName,
          templateServices,
          openServiceOptions=customOptions,
          onValueSaved=onEnvironmentValueSaved,
        )
      elif hookState.get("serviceOptions", False):
        openCustomServiceOptions()
      checkForIssues()
      mainRender(menu, selection, 1)
    except Exception:
      print("Error running service options on '%s'" % serviceName)
      traceback.print_exc()
      input("Press Enter to continue...")

  def getMenuItemIndexByService(serviceName):
    for (index, menuItem) in enumerate(menu):
      if (menuItem[0] == serviceName):
        return index

  def checkMenuItem(selection):
    global dockerComposeServicesYaml
    if menu[selection][1]["checked"] == True:
      menu[selection][1]["checked"] = False
      menu[selection][1]["issues"] = None
      templateServices = loadServiceTemplate(yaml, templatesDirectory, menu[selection][0], servicesFileName)
      removeServiceTemplate(dockerComposeServicesYaml, templateServices)
    else:
      menu[selection][1]["checked"] = True
      print(menu[selection][0])
      loadService(menu[selection][0])

  def prepareMenuState():
    global dockerComposeServicesYaml
    selectedTemplates = [
      serviceName for serviceName in dockerComposeServicesYaml
      if serviceName in templatesList
    ]
    for serviceName in selectedTemplates:
      checkMenuItem(getMenuItemIndexByService(serviceName))
      setCheckedMenuItems()
      checkForIssues()

    return True

  def loadCurrentConfigs(templatesList):
    global dockerComposeServicesYaml
    if os.path.exists(dockerSavePathOutput):
      print("Loading config fom: '%s'" % dockerSavePathOutput)
      with open(r'%s' % dockerSavePathOutput) as fileSavedConfigs:
        previousConfigs = yaml.load(fileSavedConfigs)
        if not previousConfigs == None:
          if "services" in previousConfigs:
            dockerComposeServicesYaml = restoreSavedServiceTemplates(
              yaml,
              templatesDirectory,
              templatesList,
              previousConfigs["services"],
              servicesFileName,
            )
            return bool(dockerComposeServicesYaml)
    dockerComposeServicesYaml = {}
    return False

  def onResize(sig, action):
    mainRender(menu, selection, 1)

  templatesList = generateTemplateList(templatesDirectoryFolders)
  for directory in templatesList:
    menu.append([directory, { "checked": False, "issues": None }])

  if __name__ == 'builtins':
    global results
    global signal
    needsRender = 1
    signal.signal(signal.SIGWINCH, onResize)
    with term.fullscreen():
      print('Loading...')
      selection = 0
      if loadCurrentConfigs(templatesList):
        prepareMenuState()
      mainRender(menu, selection, 1)
      needsRender = 0
      selectionInProgress = True
      with term.cbreak():
        while selectionInProgress:
          key = term.inkey(esc_delay=0.05)
          if key and transientMessage:
            transientMessage = None
            needsRender = 1
          if key.is_sequence:
            if key.name == 'KEY_DOWN':
              selection += 1
              if needsRender != 1:
                needsRender = 2
            if key.name == 'KEY_UP':
              selection -= 1
              if needsRender != 1:
                needsRender = 2
            if key.name == 'KEY_RIGHT':
              hasOptions = menu[selection][1].get("buildHooks", {}).get("options", False)
              transientMessage = serviceOptionsMessage(
                hasOptions,
                menu[selection][1]["checked"],
              )
              if transientMessage:
                needsRender = 1
              else:
                executeServiceOptions()
            if key.name == 'KEY_ENTER':
              setCheckedMenuItems()
              checkForIssues()
              selectionInProgress = False
              results["buildState"] = buildServices()
              return results["buildState"]
            if key.name == 'KEY_ESCAPE':
              results["buildState"] = False
              return results["buildState"]
          elif key:
            if key == ' ': # Space pressed
              checkMenuItem(selection) # Update checked list
              setCheckedMenuItems() # Update UI memory
              checkForIssues()
              needsRender = 1
            elif key == 'h': # H pressed
              if hideHelpText:
                hideHelpText = False
              else:
                hideHelpText = True
              needsRender = 1
            elif key.lower() == 'i':
              issueEntries = getIssueEntries()
              if issueEntries:
                runIssueViewer(term, renderMode, issueEntries)
                needsRender = 1

          selection = selection % len(menu)

          if needsRender > 0:
            mainRender(menu, selection, needsRender)
            needsRender = 0

originalSignalHandler = signal.getsignal(signal.SIGWINCH)
main()
signal.signal(signal.SIGWINCH, originalSignalHandler)
