import pathlib
import os
import re
import stat


_ENVIRONMENT_VARIABLE = re.compile(
  r"(?<!\$)\$\{([A-Za-z_][A-Za-z0-9_]*)(?:(:?[-?+])([^}]*))?\}"
)


def _decodeDoubleQuotedDotEnvValue(value):
  decoded = []
  index = 0
  while index < len(value):
    character = value[index]
    following = value[index + 1] if index + 1 < len(value) else None
    if character == "\\" and following in ("\\", '"'):
      decoded.append(following)
      index += 2
      continue
    if character == "$" and following == "$":
      decoded.append("$")
      index += 2
      continue
    decoded.append(character)
    index += 1
  return "".join(decoded)


def loadDotEnv(path):
  environment = {}
  try:
    with open(path) as envFile:
      lines = envFile.readlines()
  except OSError:
    return environment

  for rawLine in lines:
    line = rawLine.strip()
    if not line or line.startswith("#"):
      continue
    if line.startswith("export "):
      line = line[7:].lstrip()
    if "=" not in line:
      continue

    name, value = line.split("=", 1)
    name = name.strip()
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
      continue

    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
      quote = value[0]
      value = value[1:-1]
      if quote == '"':
        value = _decodeDoubleQuotedDotEnvValue(value)
    elif " #" in value:
      value = value.split(" #", 1)[0].rstrip()
    environment[name] = value

  return environment


def configurableEnvironmentVariables(value):
  variables = {}

  def inspect(item):
    if isinstance(item, dict):
      for child in item.values():
        inspect(child)
      return
    if isinstance(item, (list, tuple)):
      for child in item:
        inspect(child)
      return
    if not isinstance(item, str):
      return

    for match in _ENVIRONMENT_VARIABLE.finditer(item):
      name, operator, message = match.groups()
      operator = operator or ""
      message = (message or "").strip()
      shouldConfigure = operator in (":?", "?") or isSensitiveEnvironmentName(name)
      if not shouldConfigure:
        continue
      if name not in variables:
        variables[name] = {
          "operator": operator,
          "message": message,
        }
      else:
        operatorPriority = {
          "": 0, "-": 0, ":-": 0, "+": 0, ":+": 0,
          "?": 1, ":?": 2,
        }
        existingOperator = variables[name]["operator"]
        if operatorPriority[operator] > operatorPriority[existingOperator]:
          variables[name]["operator"] = operator
          variables[name]["message"] = message

  inspect(value)
  return variables


def restoreEnvironmentVariableReferences(currentValue, templateValue, name):
  """Restore template interpolation expressions for one environment variable.

  Saved stack files may contain values that Compose already interpolated. Those
  literal values are useful for restoring the rest of a service configuration,
  but they hide the setting from the options menu and prevent a newly saved
  .env value from taking effect. This mutates only template paths which refer
  to ``name`` and leaves unrelated restored settings alone.
  """
  changed = 0

  def usesVariable(value):
    if not isinstance(value, str):
      return False
    return any(
      match.group(1) == name
      for match in _ENVIRONMENT_VARIABLE.finditer(value)
    )

  def assignmentName(value):
    if not isinstance(value, str) or "=" not in value:
      return None
    candidate = value.split("=", 1)[0]
    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", candidate):
      return candidate
    return None

  def restore(current, template):
    nonlocal changed

    if isinstance(template, dict):
      if not isinstance(current, dict):
        return
      for key, templateChild in template.items():
        if key not in current:
          if configurableEnvironmentVariables(templateChild).get(name):
            current[key] = templateChild
            changed += 1
          continue
        if usesVariable(templateChild):
          if current[key] != templateChild:
            current[key] = templateChild
            changed += 1
        else:
          restore(current[key], templateChild)
      return

    if isinstance(template, (list, tuple)):
      if not isinstance(current, list):
        return
      for templateIndex, templateChild in enumerate(template):
        if usesVariable(templateChild):
          targetIndex = None
          variableAssignment = assignmentName(templateChild)
          if variableAssignment is not None:
            for currentIndex, currentChild in enumerate(current):
              if assignmentName(currentChild) == variableAssignment:
                targetIndex = currentIndex
                break
          if targetIndex is None and templateIndex < len(current):
            targetIndex = templateIndex
          if targetIndex is None:
            current.append(templateChild)
            changed += 1
          elif current[targetIndex] != templateChild:
            current[targetIndex] = templateChild
            changed += 1
        elif templateIndex < len(current):
          restore(current[templateIndex], templateChild)

  restore(currentValue, templateValue)
  return changed


def requiredEnvironmentVariables(value):
  return {
    name: requirement
    for name, requirement in configurableEnvironmentVariables(value).items()
    if requirement["operator"] in (":?", "?")
  }


def requiredEnvironmentIssues(value, envPath=".env", processEnvironment=None):
  environment = loadDotEnv(envPath)
  if processEnvironment is None:
    processEnvironment = os.environ
  environment.update(processEnvironment)

  issues = {}
  for name, requirement in requiredEnvironmentVariables(value).items():
    isMissing = name not in environment
    if requirement["operator"] == ":?":
      isMissing = isMissing or environment.get(name, "") == ""
    if isMissing:
      issues["missingEnvironment:%s" % name] = (
        "%s is required. Open Options to configure it." % name
      )
  return issues


def isSensitiveEnvironmentName(name):
  upperName = name.upper()
  return any(marker in upperName for marker in (
    "PASSWORD",
    "PASSWD",
    "SECRET",
    "TOKEN",
    "AUTHORIZATION",
    "API_KEY",
  ))

def isPasswordEnvironmentName(name):
  upperName = name.upper()
  return "PASSWORD" in upperName or "PASSWD" in upperName



def suggestedEnvironmentValue(name, message):
  match = re.search(r"(?:^|\s)%s=([^\s]+)" % re.escape(name), message)
  return match.group(1) if match else ""

def defaultEnvironmentValue(name, requirement):
  if requirement["operator"] in (":-", "-"):
    return requirement["message"]
  suggested = suggestedEnvironmentValue(name, requirement["message"])
  if suggested.startswith("%random"):
    return ""
  return suggested


def _encodeDotEnvValue(value):
  if "\n" in value or "\r" in value:
    raise ValueError("Environment values must fit on one line")
  if re.match(r"^[A-Za-z0-9_./:@%+,-]*$", value):
    return value
  escaped = value.replace("\\", "\\\\").replace('"', '\\"').replace("$", "$$")
  return '"%s"' % escaped


def setDotEnvValue(path, name, value):
  if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
    raise ValueError("Invalid environment variable name")

  path = pathlib.Path(path)
  existingMode = path.stat().st_mode if path.exists() else None
  lines = path.read_text().splitlines(True) if path.exists() else []
  assignmentPattern = re.compile(
    r"^\s*(?:export\s+)?%s\s*=" % re.escape(name)
  )
  replacement = "%s=%s" % (name, _encodeDotEnvValue(value))
  replaced = False

  for index, line in enumerate(lines):
    if assignmentPattern.match(line):
      ending = "\n" if line.endswith("\n") else ""
      lines[index] = replacement + ending
      replaced = True
      break

  if not replaced:
    if lines and not lines[-1].endswith("\n"):
      lines[-1] += "\n"
    lines.append(replacement + "\n")

  path.parent.mkdir(parents=True, exist_ok=True)
  temporaryPath = path.with_name(path.name + ".tmp")
  temporaryPath.write_text("".join(lines))
  if existingMode is not None:
    os.chmod(str(temporaryPath), stat.S_IMODE(existingMode))
  else:
    os.chmod(str(temporaryPath), 0o600)
  os.replace(str(temporaryPath), str(path))
