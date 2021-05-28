#!/usr/bin/env python3
import signal

checkedMenuItems = []
results = {}

def main():
  import os
  import time
  import math
  import sys
  import subprocess
  from deps.chars import specialChars, commonTopBorder, commonBottomBorder, commonEmptyLine, padText
  from deps.host_exec import execInteractive
  # from deps.consts import servicesDirectory, templatesDirectory, volumesDirectory, buildCache, envFile, dockerPathOutput, servicesFileName, composeOverrideFile
  from deps.api import getPreviousBuildList, checkWuiState, getTemplateBuildBootstrap
  from blessed import Terminal
  global signal
  global renderMode
  global term
  global paginationSize
  global paginationStartIndex
  global hideHelpText
  global activeMenuLocation
  global lastSelection
  global apiPreviousBuildList
  global wuiState

  # Runtime vars
  menu = []
  term = Terminal()
  paginationToggle = [3, int(term.height - 24)] # Top text + controls text
  paginationStartIndex = 0
  paginationSize = paginationToggle[0]
  activeMenuLocation = 0
  lastSelection = 0
  
  try: # If not already set, then set it.
    hideHelpText = hideHelpText
  except:
    hideHelpText = False

  def getMenuItem(selectedIndex):
    if selectedIndex >= 0:
      for (index, menuItem) in enumerate(menu):
        if index == selectedIndex:
          return menu[selectedIndex]

  def getBuildList():
    global apiPreviousBuildList
    apiPreviousBuildList = getPreviousBuildList(os.getenv('API_ADDR'))
    return apiPreviousBuildList

  def buildListToMenuItems():
    if 'buildsList' in apiPreviousBuildList['json']:
      for (index, build) in enumerate(apiPreviousBuildList['json']['buildsList']):
        menu.append([build])

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

  def renderHotZone(term, renderType, menu, selection, paddingBefore, titleRenderStart, linesBelowHotzone):
    global paginationSize
    selectedTextLength = len("-> ")

    print(term.move(titleRenderStart + 5, 0))

    if paginationStartIndex >= 1:
      print(term.center("{b}     {uaf}       {uaf}{uaf}{uaf}                                       {ual}      {b}".format(
        b=specialChars[renderMode]["borderVertical"],
        uaf=specialChars[renderMode]["upArrowFull"],
        ual=specialChars[renderMode]["upArrowLine"]
      )))
    else:
      print(term.center(commonEmptyLine(renderMode)))

    print(term.center(commonEmptyLine(renderMode)))
    print(term.center(commonEmptyLine(renderMode)))
    print(term.center(commonEmptyLine(renderMode)))

    print(term.move(titleRenderStart + 6, 0))

    menuItemsActiveRow = term.get_location()[0]
    if renderType == 2 or renderType == 1: # Rerender entire hotzone
      if len(menu) < 1:
        emptyWarningText = "You have no builds."
        paddedLineText = generateLineText(emptyWarningText, textLength=len(emptyWarningText), paddingBefore=paddingBefore - 2)
        toPrint = paddedLineText

        rightPad = ''
        for i in range(30):
          rightPad += " "
        toPrint = toPrint + rightPad

        toPrint = "{bv}  {toPrint}  {bv}".format(bv=specialChars[renderMode]["borderVertical"], toPrint=toPrint) # Generate border
        toPrint = term.center(toPrint) # Center Text (All lines should have the same amount of printable characters)
        print(toPrint)

        emptyWarningText = "A build can be created with the WUI or this menu."
        paddedLineText = generateLineText(emptyWarningText, textLength=len(emptyWarningText), paddingBefore=paddingBefore - 2)
        toPrint = paddedLineText
        toPrint = "{bv}  {toPrint}         {bv}".format(bv=specialChars[renderMode]["borderVertical"], toPrint=toPrint) # Generate border
        toPrint = term.center(toPrint) # Center Text (All lines should have the same amount of printable characters)
        print(toPrint)

        emptyWarningText = "Press [Escape] to go back."
        paddedLineText = generateLineText(emptyWarningText, textLength=len(emptyWarningText), paddingBefore=paddingBefore - 2)
        toPrint = paddedLineText
        rightPad = ''
        for i in range(29):
          rightPad += " "
        toPrint = toPrint + rightPad
        toPrint = "{bv}  {toPrint}   {bv}".format(bv=specialChars[renderMode]["borderVertical"], toPrint=toPrint) # Generate border
        toPrint = term.center(toPrint) # Center Text (All lines should have the same amount of printable characters)
        print(toPrint)

      else:
        for (index, menuItem) in enumerate(menu): # Menu loop
          if index >= paginationStartIndex and index < paginationStartIndex + paginationSize:
            lineText = generateLineText(menuItem[0], paddingBefore=paddingBefore)

            # Menu highlight logic
            if index == selection:
              activeMenuLocation = term.get_location()[0]
              formattedLineText = '-> {t.blue_on_green}{title}{t.normal} <-'.format(t=term, title=menuItem[0])
              paddedLineText = generateLineText(formattedLineText, textLength=len(menuItem[0]) + selectedTextLength, paddingBefore=paddingBefore - selectedTextLength)
              toPrint = paddedLineText
            else:
              toPrint = '{title}{t.normal}'.format(t=term, title=lineText)

            leftPad = ''
            rightPad = ''

            for i in range(8):
              leftPad += " "

            for i in range(21):
              rightPad += " "

            toPrint = leftPad + toPrint + rightPad

            toPrint = "{bv} {toPrint}  {bv}".format(bv=specialChars[renderMode]["borderVertical"], toPrint=toPrint) # Generate border
            toPrint = term.center(toPrint) # Center Text (All lines should have the same amount of printable characters)

            print(toPrint)

    if paginationStartIndex + paginationSize < len(menu):
      print(term.center("{b}     {dal}       {daf}{daf}{daf}                                       {dal}      {b}".format(
        b=specialChars[renderMode]["borderVertical"],
        daf=specialChars[renderMode]["downArrowFull"],
        dal=specialChars[renderMode]["downArrowLine"]
      )))
    else:
      print(term.center(commonEmptyLine(renderMode)))

  def mainRender(menu, selection, renderType = 1):
    global paginationStartIndex
    global paginationSize
    paddingBefore = 4

    if selection >= paginationStartIndex + paginationSize:
      paginationStartIndex = selection - (paginationSize - 1) + 1
      renderType = 1
      
    if selection <= paginationStartIndex - 1:
      paginationStartIndex = selection
      renderType = 1

    try:
      titleRenderStart = 0 if term.height < 32 else 2
      linesBelowHotzone = 2 if hideHelpText else 12

      if (renderType == 1):
        print(term.clear())
        print(term.move_y(titleRenderStart))
        print(term.black_on_cornsilk4(term.center('IOTstack Build Installer Menu (w: {w}, h: {h})'.format(h=term.height, w=term.width))))
        print("")
        print(term.center(commonTopBorder(renderMode)))

        print(term.center(commonEmptyLine(renderMode)))
        print(term.center("{bv}      Select build to install                                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))

      renderHotZone(term, renderType, menu, selection, paddingBefore, titleRenderStart, linesBelowHotzone)

      if (renderType == 1):
        print(term.center(commonEmptyLine(renderMode)))
        if not hideHelpText:
          room = term.height - (6 + paginationSize + linesBelowHotzone)
          if room < 0:
            print(term.center(commonEmptyLine(renderMode)))
            print(term.center("{bv}   Not enough vertical room to render text ({th}, {rm})         {bv}".format(bv=specialChars[renderMode]["borderVertical"], th=padText(str(term.height), 3), rm=padText(str(room), 3))))
            print(term.center(commonEmptyLine(renderMode)))
          else:
            print(term.center(commonEmptyLine(renderMode)))
            print(term.center("{bv}      Controls:                                               {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [Up] and [Down] to move selection cursor                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [Tab] Expand or collapse build menu size                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [H] Show/hide this text                                 {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [R] Reload build list                                   {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [Enter] to install build                                {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center("{bv}      [Escape] to cancel build install                        {bv}".format(bv=specialChars[renderMode]["borderVertical"])))
            print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonEmptyLine(renderMode)))
        print(term.center(commonBottomBorder(renderMode)))

    except Exception as err: 
      print("There was an error rendering the menu:")
      print(err)
      print("Press [Esc] to go back")
      return

    return

  def downloadBootstrapScript(build):
    print(term.clear())
    print('Downloading bootstrap script for build {build}...'.format(build=build))
    time.sleep(1)
    scriptToExec = getTemplateBuildBootstrap(os.getenv('HOST_CON_API'), build)
    if scriptToExec['text'] == None:
      print('Something went wrong getting the script from the API.')
      print(scriptToExec)
      input("Press Enter to continue to menu...")
      mainRender(menu, selection, 1)
      return True
    print('Install Build. Executing:')
    print(scriptToExec['text'])
    print('')
    input("Press Enter to run this command or ctrl+c to exit")
    print('')
    print(execInteractive(scriptToExec['text']))
    print('')
    print('Install script finished')
    input("Press Enter to continue to menu...")
    mainRender(menu, selection, 1)

  def onResize(sig, action):
    global paginationToggle
    global paginationSize
    paginationToggle = [3, int(term.height - 24)]
    paginationSize = paginationToggle[1] if not paginationSize == paginationToggle[0] else paginationToggle[0]
    
    mainRender(menu, selection, 1)

  if __name__ == 'builtins':
    global results
    global signal
    needsRender = 1
    signal.signal(signal.SIGWINCH, onResize)
    with term.fullscreen():
      print('Loading build list...')
      getBuildList()
      buildListToMenuItems()
      selection = 0
      mainRender(menu, selection, 1)
      selectionInProgress = True
      with term.cbreak():
        while selectionInProgress:
          key = term.inkey(esc_delay=0.05)
          if key.is_sequence:
            if key.name == 'KEY_TAB':
              needsRender = 1
              if paginationSize == paginationToggle[0]:
                paginationSize = paginationToggle[1]
                paginationStartIndex = 0
              else:
                paginationSize = paginationToggle[0]
            if key.name == 'KEY_DOWN':
              selection += 1
              needsRender = 2
            if key.name == 'KEY_UP':
              selection -= 1
              needsRender = 2
            if key.name == 'KEY_ENTER':
              downloadBootstrapScript(getMenuItem(selection)[0])
            if key.name == 'KEY_ESCAPE':
              results["buildState"] = False
              return results["buildState"]
          elif key:
            if key == 'r': # R pressed
              menu = []
              print('Refreshing build list...')
              getBuildList()
              buildListToMenuItems()
              mainRender(menu, selection, 1)
            if key == 'h': # H pressed
              if hideHelpText:
                hideHelpText = False
              else:
                hideHelpText = True
              needsRender = 1
          else:
            print(key)
            time.sleep(0.5)

          if len(menu) > 0:
            selection = selection % len(menu)

          mainRender(menu, selection, needsRender)

originalSignalHandler = signal.getsignal(signal.SIGINT)
main()
signal.signal(signal.SIGWINCH, originalSignalHandler)
