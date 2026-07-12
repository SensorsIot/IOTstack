import os
import secrets
import signal
import string
import textwrap

from deps.chars import (
  commonBottomBorder,
  commonEmptyLine,
  commonTextLine,
  commonTopBorder,
)
from deps.compose_environment import (
  configurableEnvironmentVariables,
  defaultEnvironmentValue,
  isPasswordEnvironmentName,
  isSensitiveEnvironmentName,
  loadDotEnv,
  requiredEnvironmentIssues,
  setDotEnvValue,
)


def generateEnvironmentSecret(size=32):
  alphabet = string.ascii_letters + string.digits
  return "".join(secrets.choice(alphabet) for unusedIndex in range(size))


def _boxWidth(term):
  return min(80, max(40, term.width - 2))


def _runMenu(term, renderMode, title, prompt, entries):
  state = {
    "selection": 0,
    "offset": 0,
  }

  def dimensions():
    visibleRows = max(1, min(len(entries), term.height - 9))
    if state["selection"] < state["offset"]:
      state["offset"] = state["selection"]
    if state["selection"] >= state["offset"] + visibleRows:
      state["offset"] = state["selection"] - visibleRows + 1
    maximumOffset = max(0, len(entries) - visibleRows)
    state["offset"] = max(0, min(state["offset"], maximumOffset))
    return _boxWidth(term), visibleRows

  def render():
    boxWidth, visibleRows = dimensions()
    visibleEntries = entries[state["offset"]:state["offset"] + visibleRows]
    print(term.clear(), end="")
    print(term.black_on_cornsilk4(term.center(title)))
    print("")
    print(term.center(commonTopBorder(renderMode, size=boxWidth)))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      prompt,
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    for visibleIndex, unusedEntry in enumerate(visibleEntries):
      entryIndex = state["offset"] + visibleIndex
      label = entries[entryIndex][1]
      selected = entryIndex == state["selection"]
      displayLabel = "-> %s <-" % label if selected else "   %s" % label
      print(term.center(commonTextLine(
        renderMode,
        displayLabel,
        size=boxWidth,
        paddingBefore=3,
        style=term.blue_on_green if selected else None,
      )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    if len(entries) > visibleRows:
      first = state["offset"] + 1
      last = state["offset"] + len(visibleEntries)
      status = "Items %s-%s of %s" % (first, last, len(entries))
    else:
      status = ""
    print(term.center(commonTextLine(
      renderMode,
      status,
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonTextLine(
      renderMode,
      "[Up/Down] Move  [Enter] Select  [Esc] Back",
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonBottomBorder(renderMode, size=boxWidth)))

  def onResize(sig, action):
    render()

  originalSignalHandler = signal.getsignal(signal.SIGWINCH)
  signal.signal(signal.SIGWINCH, onResize)
  try:
    render()
    while True:
      key = term.inkey(esc_delay=0.05)
      if key.name == "KEY_ESCAPE" or (
        not key.is_sequence and str(key).lower() == "q"
      ):
        return None
      if key.name == "KEY_UP":
        state["selection"] = (state["selection"] - 1) % len(entries)
        render()
      elif key.name == "KEY_DOWN":
        state["selection"] = (state["selection"] + 1) % len(entries)
        render()
      elif key.name == "KEY_HOME":
        state["selection"] = 0
        render()
      elif key.name == "KEY_END":
        state["selection"] = len(entries) - 1
        render()
      elif key.name == "KEY_PGUP":
        unusedWidth, visibleRows = dimensions()
        state["selection"] = max(0, state["selection"] - visibleRows)
        render()
      elif key.name == "KEY_PGDOWN":
        unusedWidth, visibleRows = dimensions()
        state["selection"] = min(
          len(entries) - 1,
          state["selection"] + visibleRows,
        )
        render()
      elif key.name == "KEY_ENTER":
        return entries[state["selection"]][0]
  finally:
    signal.signal(signal.SIGWINCH, originalSignalHandler)


def _storeValue(envPath, name, value, onValueSaved):
  setDotEnvValue(envPath, name, value)
  if onValueSaved is not None:
    onValueSaved(name, value)


def _promptForValue(
  term,
  renderMode,
  serviceName,
  name,
  requirement,
  envPath,
  onValueSaved,
):
  sensitive = isSensitiveEnvironmentName(name)
  currentValue = loadDotEnv(envPath).get(name, "")
  suggestedValue = defaultEnvironmentValue(name, requirement)
  initialValue = "" if sensitive else currentValue or suggestedValue
  state = {
    "value": initialValue,
    "message": None,
  }

  def render():
    boxWidth = _boxWidth(term)
    displayValue = "*" * len(state["value"]) if sensitive else state["value"]
    maximumValueWidth = max(1, boxWidth - 12)
    displayValue = displayValue[-maximumValueWidth:]
    print(term.clear(), end="")
    print(term.black_on_cornsilk4(term.center("%s Setting" % serviceName)))
    print("")
    print(term.center(commonTopBorder(renderMode, size=boxWidth)))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "Enter a value for %s:" % name,
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "Value: %s" % displayValue,
      size=boxWidth,
      paddingBefore=3,
      style=term.yellow,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      state["message"] or "",
      size=boxWidth,
      paddingBefore=3,
      style=term.red if state["message"] else None,
    )))
    print(term.center(commonTextLine(
      renderMode,
      "[Enter] Save  [Backspace] Delete  [Ctrl+U] Clear  [Esc] Cancel",
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonBottomBorder(renderMode, size=boxWidth)))

  def onResize(sig, action):
    render()

  originalSignalHandler = signal.getsignal(signal.SIGWINCH)
  signal.signal(signal.SIGWINCH, onResize)
  try:
    render()
    while True:
      key = term.inkey(esc_delay=0.05)
      keyText = str(key)
      if key.name == "KEY_ESCAPE":
        return None, None
      if key.name == "KEY_ENTER":
        value = state["value"]
        if not value and requirement["operator"] == ":?":
          state["message"] = "%s cannot be empty." % name
          render()
          continue
        _storeValue(envPath, name, value, onValueSaved)
        return True, "%s was saved to .env." % name
      if key.name == "KEY_BACKSPACE" or keyText in ("\x08", "\x7f"):
        state["value"] = state["value"][:-1]
        state["message"] = None
        render()
      elif not key.is_sequence and keyText == "\x15":
        state["value"] = ""
        state["message"] = None
        render()
      elif not key.is_sequence and keyText:
        printable = "".join(
          character
          for character in keyText
          if character.isprintable() and character not in "\r\n"
        )
        if printable:
          state["value"] += printable
          state["message"] = None
          render()
  finally:
    signal.signal(signal.SIGWINCH, originalSignalHandler)


def _showPassword(term, renderMode, serviceName, name, value):
  safeValue = "".join(
    character if character.isprintable() else "?"
    for character in value
  )
  if not safeValue:
    safeValue = "<no password>"

  def render():
    boxWidth = _boxWidth(term)
    rows = textwrap.wrap(
      "%s=%s" % (name, safeValue),
      width=max(20, boxWidth - 6),
      subsequent_indent="  ",
      break_long_words=True,
      break_on_hyphens=False,
    )
    print(term.clear(), end="")
    print(term.black_on_cornsilk4(term.center("%s Password" % serviceName)))
    print("")
    print(term.center(commonTopBorder(renderMode, size=boxWidth)))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    for row in rows:
      print(term.center(commonTextLine(
        renderMode,
        row,
        size=boxWidth,
        paddingBefore=3,
        style=term.yellow,
      )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "Saved in .env. It can be viewed here again later.",
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "[Enter/Esc] Back",
      size=boxWidth,
      paddingBefore=3,
    )))
    print(term.center(commonBottomBorder(renderMode, size=boxWidth)))

  def onResize(sig, action):
    render()

  originalSignalHandler = signal.getsignal(signal.SIGWINCH)
  signal.signal(signal.SIGWINCH, onResize)
  try:
    render()
    while True:
      key = term.inkey(esc_delay=0.05)
      if key.name in ("KEY_ENTER", "KEY_ESCAPE") or (
        not key.is_sequence and str(key).lower() == "q"
      ):
        return
  finally:
    signal.signal(signal.SIGWINCH, originalSignalHandler)


def _environmentStatus(name, requirement, envPath):
  savedEnvironment = loadDotEnv(envPath)
  if name in savedEnvironment and (
    requirement["operator"] != ":?" or savedEnvironment[name] != ""
  ):
    return "saved in .env"
  if name in os.environ and (
    requirement["operator"] != ":?" or os.environ[name] != ""
  ):
    return "set in process environment"
  if requirement["operator"] in (":-", "-"):
    return "using Compose default"
  return "not configured"


def _configurePassword(
  term,
  renderMode,
  serviceName,
  name,
  requirement,
  envPath,
  onValueSaved,
):
  defaultValue = defaultEnvironmentValue(name, requirement)
  hasDefault = requirement["operator"] in (":-", "-") or bool(defaultValue)
  savedValue = loadDotEnv(envPath).get(name)
  defaultLabel = defaultValue if defaultValue else "no password"
  entries = []
  if hasDefault:
    entries.append(("default", "Use default: %s" % defaultLabel))
  if savedValue is not None:
    entries.append(("view", "View password saved in .env"))
  entries.extend([
    ("custom", "Enter a custom password"),
    ("generate", "Generate a random password and save it"),
    (None, "Back to password list"),
  ])

  action = _runMenu(
    term,
    renderMode,
    "%s Password Options" % serviceName,
    "Choose how to configure %s:" % name,
    entries,
  )
  if action is None:
    return
  if action == "default":
    _storeValue(envPath, name, defaultValue, onValueSaved)
    _showPassword(term, renderMode, serviceName, name, defaultValue)
    return
  if action == "view":
    _showPassword(term, renderMode, serviceName, name, savedValue)
    return
  if action == "custom":
    success, unusedMessage = _promptForValue(
      term,
      renderMode,
      serviceName,
      name,
      requirement,
      envPath,
      onValueSaved,
    )
    if success:
      _showPassword(
        term,
        renderMode,
        serviceName,
        name,
        loadDotEnv(envPath)[name],
      )
    return
  if action == "generate":
    value = generateEnvironmentSecret()
    _storeValue(envPath, name, value, onValueSaved)
    _showPassword(term, renderMode, serviceName, name, value)


def _runPasswordOptions(
  term,
  renderMode,
  serviceName,
  passwordNames,
  requirements,
  envPath,
  onValueSaved,
):
  while True:
    entries = [
      (
        name,
        "%s [%s]" % (
          name,
          _environmentStatus(name, requirements[name], envPath),
        ),
      )
      for name in passwordNames
    ]
    entries.append((None, "Back to service settings"))
    name = _runMenu(
      term,
      renderMode,
      "%s Password Options" % serviceName,
      "Select a password to configure:",
      entries,
    )
    if name is None:
      return
    _configurePassword(
      term,
      renderMode,
      serviceName,
      name,
      requirements[name],
      envPath,
      onValueSaved,
    )


def runEnvironmentOptions(
  term,
  renderMode,
  serviceName,
  composeValue,
  openServiceOptions=None,
  envPath=".env",
  onValueSaved=None,
):
  requirements = configurableEnvironmentVariables(composeValue)
  passwordNames = sorted(
    name for name in requirements if isPasswordEnvironmentName(name)
  )
  state = {
    "selection": 0,
    "render": True,
    "message": None,
  }

  def entries():
    missing = requiredEnvironmentIssues(composeValue, envPath=envPath)
    result = []
    if passwordNames:
      result.append((
        "Password options (%s)" % len(passwordNames),
        lambda: _runPasswordOptions(
          term,
          renderMode,
          serviceName,
          passwordNames,
          requirements,
          envPath,
          onValueSaved,
        ),
      ))
    for name in sorted(requirements):
      if name in passwordNames:
        continue
      status = "missing" if "missingEnvironment:%s" % name in missing else "configured"
      result.append((
        "Set %s [%s]" % (name, status),
        lambda variableName=name: configure(variableName),
      ))
    if openServiceOptions is not None:
      result.append(("Open service-specific options", openServiceOptions))
    result.append(("Back to build menu", None))
    return result

  def configure(name):
    success, message = _promptForValue(
      term,
      renderMode,
      serviceName,
      name,
      requirements[name],
      envPath,
      onValueSaved,
    )
    if success is not None:
      state["message"] = message
    state["render"] = True

  def render():
    menuEntries = entries()
    state["selection"] %= len(menuEntries)
    boxWidth = _boxWidth(term)
    print(term.clear(), end="")
    print(term.black_on_cornsilk4(term.center("%s Service Settings" % serviceName)))
    print("")
    print(term.center(commonTopBorder(renderMode, size=boxWidth)))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "Configure values used by this service:",
      size=boxWidth,
      paddingBefore=4,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    for index, (label, unusedAction) in enumerate(menuEntries):
      selectedLabel = "-> %s <-" % label if index == state["selection"] else "   %s" % label
      style = term.blue_on_green if index == state["selection"] else None
      print(term.center(commonTextLine(
        renderMode,
        selectedLabel,
        size=boxWidth,
        paddingBefore=3,
        style=style,
      )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    if state["message"]:
      print(term.center(commonTextLine(
        renderMode,
        state["message"],
        size=boxWidth,
        paddingBefore=4,
        style=term.yellow,
      )))
    else:
      print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonTextLine(
      renderMode,
      "[Up/Down] Move  [Enter] Select  [Esc] Back",
      size=boxWidth,
      paddingBefore=4,
    )))
    print(term.center(commonEmptyLine(renderMode, size=boxWidth)))
    print(term.center(commonBottomBorder(renderMode, size=boxWidth)))
    state["render"] = False

  def onResize(sig, action):
    state["render"] = True
    render()

  originalSignalHandler = signal.getsignal(signal.SIGWINCH)
  signal.signal(signal.SIGWINCH, onResize)
  try:
    with term.fullscreen():
      with term.cbreak():
        while True:
          if state["render"]:
            render()
          key = term.inkey(esc_delay=0.05)
          menuEntries = entries()
          if key.name == "KEY_ESCAPE" or (
            not key.is_sequence and str(key).lower() == "q"
          ):
            return True
          if key.name == "KEY_UP":
            state["selection"] = (state["selection"] - 1) % len(menuEntries)
            state["render"] = True
          elif key.name == "KEY_DOWN":
            state["selection"] = (state["selection"] + 1) % len(menuEntries)
            state["render"] = True
          elif key.name == "KEY_ENTER":
            unusedLabel, action = menuEntries[state["selection"]]
            if action is None:
              return True
            action()
            state["render"] = True
  finally:
    signal.signal(signal.SIGWINCH, originalSignalHandler)
