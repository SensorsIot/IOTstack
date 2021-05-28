#!/usr/bin/env python3

# export API_ADDR=localhost:32128 && export HOST_CON_API=localhost:32128 && cd .internal/pycli; nodemon --no-stdin --exec python3 entry.py

from blessed import Terminal
import sys
import subprocess
import os
import time
import types
import signal
from multiprocessing import Process, Manager
from deps.chars import specialChars
from deps.api import checkApiHealth, checkWuiState

term = Terminal()

apiUrl = os.getenv('API_ADDR')
wuiUrl = os.getenv('WUI_ADDR')
sshUri = os.getenv('HOSTSSH_ADDR')

# Vars
selectionInProgress = True
currentMenuItemIndex = 0
menuNavigateDirection = 0
screenRefreshRate = 1
hotzoneLocation = [int(term.height ** 0.3), 0]
screenActive = True

manager = Manager()

apiHealthResults = manager.dict()
apiHealthResults['status'] = None

wuiHealthResults = manager.dict()
wuiHealthResults['status'] = None

sshState = 'unknown'

for x in sys.argv[1:]:
  if x == '--no-ssh':
    sshState = 'no'
  if x == '--ssh':
    sshState = 'yes'

  # Render Modes:
  #  0 = No render needed
  #  1 = Full render
  #  2 = Hotzone only
needsRender = 1

def checkRenderOptions():
  global term
  global renderMode
  if len(sys.argv) > 1 and (sys.argv[1] == "simple" or sys.argv[1] == "latin" or sys.argv[1] == "ascii"):
    renderMode = sys.argv[1]
  else:
    print(term.clear())
    try:
      print(
        specialChars["latin"]["rightArrowFull"],
        specialChars["latin"]["upArrowFull"],
        specialChars["latin"]["upArrowLine"],
        specialChars["latin"]["downArrowFull"],
        specialChars["latin"]["downArrowLine"],
        specialChars["latin"]["borderVertical"],
        specialChars["latin"]["borderHorizontal"],
        specialChars["latin"]["borderTopLeft"],
        specialChars["latin"]["borderTopRight"],
        specialChars["latin"]["borderBottomLeft"],
        specialChars["latin"]["borderBottomRight"],
      )
      print(term.clear())
      renderMode = "latin"
      return "latin"
    except:
      try:
        print(
          specialChars["simple"]["rightArrowFull"],
          specialChars["simple"]["upArrowFull"],
          specialChars["simple"]["upArrowLine"],
          specialChars["simple"]["downArrowFull"],
          specialChars["simple"]["downArrowLine"],
          specialChars["simple"]["borderVertical"],
          specialChars["simple"]["borderHorizontal"],
          specialChars["simple"]["borderTopLeft"],
          specialChars["simple"]["borderTopRight"],
          specialChars["simple"]["borderBottomLeft"],
          specialChars["simple"]["borderBottomRight"],
        )
        print(term.clear())
        renderMode = "simple"
        return "simple"
      except:
        print(term.clear())
        renderMode = "ascii"
        return "ascii"


def onResize(sig, action):
  global needsRender
  global mainMenuList
  global currentMenuItemIndex
  global screenActive
  global hotzoneLocation

  hotzoneLocation = [int(term.height ** 0.4), 0]
  if screenActive:
    mainRender(1, mainMenuList, currentMenuItemIndex)

# Menu Functions
def exitMenu():
  print("Exiting IOTstack menu.")
  print(term.clear())
  sys.exit(0)

def buildStack():
  global buildComplete
  global needsRender
  global screenActive
  
  buildComplete = None
  buildstackFilePath = "./buildstack_menu.py"
  with open(buildstackFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), buildstackFilePath, "exec")
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  print(term.clear())
  exec(code, execGlobals, execLocals)
  buildComplete = execGlobals["results"]["buildState"]
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def installBuild():
  global needsRender
  installBuildFilePath = "./install_build.py"
  with open(installBuildFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), installBuildFilePath, "exec")
  # execGlobals = globals()
  # execLocals = locals()
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  exec(code, execGlobals, execLocals)
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def dockerCommands():
  global needsRender
  dockerCommandsFilePath = "./docker_commands.py"
  with open(dockerCommandsFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), dockerCommandsFilePath, "exec")
  # execGlobals = globals()
  # execLocals = locals()
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  exec(code, execGlobals, execLocals)
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def miscCommands():
  global needsRender
  dockerCommandsFilePath = "./misc_commands.py"
  with open(dockerCommandsFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), dockerCommandsFilePath, "exec")
  # execGlobals = globals()
  # execLocals = locals()
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  exec(code, execGlobals, execLocals)
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def nativeInstalls():
  global needsRender
  global screenActive
  dockerCommandsFilePath = "./native_installs.py"
  with open(dockerCommandsFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), dockerCommandsFilePath, "exec")
  # currGlobals = globals()
  # currLocals = locals()
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  exec(code, execGlobals, execLocals)
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def backupAndRestore():
  global needsRender
  global screenActive
  dockerCommandsFilePath = "./backup_restore.py"
  with open(dockerCommandsFilePath, "rb") as pythonDynamicImportFile:
    code = compile(pythonDynamicImportFile.read(), dockerCommandsFilePath, "exec")
  # currGlobals = globals()
  # currLocals = locals()
  execGlobals = {
    "renderMode": renderMode
  }
  execLocals = {}
  screenActive = False
  exec(code, execGlobals, execLocals)
  signal.signal(signal.SIGWINCH, onResize)
  screenActive = True
  needsRender = 1

def doNothing():
  selectionInProgress = True

def skipItem(currentMenuItemIndex, direction):
  currentMenuItemIndex = currentMenuItemIndex % len(mainMenuList)
  if len(mainMenuList[currentMenuItemIndex]) > 2 and mainMenuList[currentMenuItemIndex][2]["skip"] == True:
    currentMenuItemIndex += lastSelectionDirection
  return currentMenuItemIndex

baseMenu = [
  ["Install Builds", installBuild],
  ["Create Build", buildStack], # Not yet ready
  ["Docker Commands", dockerCommands],
  ["Miscellaneous Commands", miscCommands],
  ["Backup and Restore", backupAndRestore],
  ["Native Installs", nativeInstalls],
  # ["Developer: Example Menu", runExampleMenu], # Uncomment if you want to see the example menu
  ["Exit", exitMenu]
]

def apiThreadInit():
  global apiHealthResults
  apiCheckThread = Process(target=apiCheckWrapper, args=(apiHealthResults,))
  apiCheckThread.start()
  # apiCheckThread.join()

def apiCheckWrapper(apiHealthResults):
  while True:
    apiHealthResults = updateApiState()
    time.sleep(5)

def updateApiState():
  global apiHealthResults
  apiHealthResults = checkApiHealth(apiUrl)
  return apiHealthResults

def updateWuiState():
  global wuiHealthResults
  wuiHealthResults = checkWuiState(wuiUrl)
  return wuiHealthResults

def generateApiState():
  global apiHealthResults
  rendered = ''

  if apiHealthResults['status'] == None:
    rendered = (term.black_on_cornsilk2(' Checking... ({apiUrl}) '.format(apiUrl=apiUrl)))
    return rendered
  if apiHealthResults['status'] >= 200 and apiHealthResults['status'] < 299:
    rendered = (term.blue_on_green2(' Online ({apiUrl}) '.format(apiUrl=apiUrl)))
  else:
    rendered = (term.red_on_black(' Offline ({apiUrl}) '.format(apiUrl=apiUrl)))

  return rendered

def generateWuiState():
  global wuiHealthResults
  rendered = ''

  if wuiHealthResults['status'] == None:
    rendered = (term.black_on_cornsilk2(' Checking... ({wuiUrl}) '.format(wuiUrl=wuiUrl)))
    return rendered
  if wuiHealthResults['status'] >= 200 and wuiHealthResults['status'] < 299:
    rendered = (term.blue_on_green2(' Online ({wuiUrl}) '.format(wuiUrl=wuiUrl)))
  else:
    rendered = (term.red_on_black(' Offline ({wuiUrl}) '.format(wuiUrl=wuiUrl)))

  return rendered

def generateSshState():
  global sshHealthResults
  rendered = ''

  if sshState == 'unknown':
    rendered = (term.black_on_cornsilk2(' Unknown ({sshUri}) '.format(sshUri=sshUri)))
    return rendered
  elif sshState == 'yes':
    rendered = (term.blue_on_green2(' Online ({sshUri}) '.format(sshUri=sshUri)))
  else:
    rendered = (term.red_on_black(' Offline ({sshUri}) '.format(sshUri=sshUri)))

  return rendered

# Main Menu
mainMenuList = baseMenu

def renderHotZone(term, menu, selection):
  print(term.move(hotzoneLocation[0], hotzoneLocation[1]))

  print(term.center(term.black_on_cornsilk3('API {apiResults}'.format(apiResults=generateApiState()))))
  print(term.center(term.black_on_cornsilk3('WUI {wuiResults}'.format(wuiResults=generateWuiState()))))
  print(term.center(term.black_on_cornsilk3('SSH {sshResults}'.format(sshResults=generateSshState()))))
  print('')
  print('')

  for (index, menuItem) in enumerate(menu):
    if index == selection:
      print(term.center('-> {t.blue_on_green}{title}{t.normal} <-'.format(t=term, title=menuItem[0])))
    else:
      print(term.center('{title}'.format(t=term, title=menuItem[0])))

def mainRender(needsRender, menu, selection):
  term = Terminal()
  if needsRender == 1:
    print(term.clear())
    print(term.move_y(int(term.height ** 0.1)))
    print(term.black_on_cornsilk4(term.center('IOTstack Main Menu (w: {w}, h: {h})'.format(h=term.height, w=term.width, apiResults=generateApiState()))))
    print("")

  if needsRender >= 1:
    renderHotZone(term, menu, selection)
    checkApiHealth

def runSelection(selection):
  global needsRender
  if len(mainMenuList[selection]) > 1 and isinstance(mainMenuList[selection][1], types.FunctionType):
    mainMenuList[selection][1]()
    needsRender = 1
  else:
    print(term.green_reverse('IOTstack Error: No function assigned to menu item: "{}"'.format(mainMenuList[selection][0])))

def isMenuItemSelectable(menu, index):
  if len(menu) > index:
    if len(menu[index]) > 2:
      if menu[index][2]["skip"] == True:
        return False
  return True

# Entrypoint
if __name__ == '__main__':
  term = Terminal()

  signal.signal(signal.SIGWINCH, onResize)

  updateApiState()
  updateWuiState()

  with term.fullscreen():
    checkRenderOptions()
    mainRender(needsRender, mainMenuList, currentMenuItemIndex) # Initial Draw
    with term.cbreak():
      while selectionInProgress:
        menuNavigateDirection = 0

        if needsRender > 0: # Only rerender when changed to prevent flickering
          mainRender(needsRender, mainMenuList, currentMenuItemIndex)
          needsRender = 0
        
        key = term.inkey(timeout=screenRefreshRate)
        if key.is_sequence:
          if key.name == 'KEY_TAB':
            menuNavigateDirection = 1
          if key.name == 'KEY_DOWN':
            menuNavigateDirection = 1
          if key.name == 'KEY_UP':
            menuNavigateDirection = -1
          if key.name == 'KEY_ENTER':
            runSelection(currentMenuItemIndex)
          if key.name == 'KEY_ESCAPE':
            exitMenu()
        elif key:
          if key == 'r': # R pressed
            print('Refreshing...')
            updateApiState()
            updateWuiState()
            checkRenderOptions()
            needsRender = 1
            mainRender(needsRender, mainMenuList, currentMenuItemIndex)
          if key == ' ': # Space pressed
            runSelection(currentMenuItemIndex)
        
        if not menuNavigateDirection == 0: # If a direction was pressed, find next selectable item
          currentMenuItemIndex += menuNavigateDirection
          currentMenuItemIndex = currentMenuItemIndex % len(mainMenuList)
          needsRender = 2

          while not isMenuItemSelectable(mainMenuList, currentMenuItemIndex):
            currentMenuItemIndex += menuNavigateDirection
            currentMenuItemIndex = currentMenuItemIndex % len(mainMenuList)
