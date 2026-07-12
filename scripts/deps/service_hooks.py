import hashlib
import importlib.util
import pathlib
import sys


HOOK_FUNCTIONS = {
  "options": "runOptionsMenu",
  "preBuild": "preBuild",
  "postBuild": "postBuild",
  "runChecks": "runChecks",
}


class HookContext:
  """State exposed to a service hook.

  New service hooks receive one context object rather than injected globals.
  Hooks may update ``services`` in place or replace it with another mapping.
  """

  def __init__(self, services, serviceName, renderMode=None, terminal=None):
    self.services = services
    self.serviceName = serviceName
    self.renderMode = renderMode
    self.terminal = terminal


def _loadHook(buildScriptPath, serviceName):
  sourcePath = pathlib.Path(buildScriptPath).resolve()
  digest = hashlib.sha1(str(sourcePath).encode("utf-8")).hexdigest()[:12]
  safeServiceName = "".join(character if character.isalnum() else "_" for character in serviceName)
  moduleName = "iotstack_service_hook_%s_%s" % (safeServiceName, digest)
  spec = importlib.util.spec_from_file_location(moduleName, str(sourcePath))
  if spec is None or spec.loader is None:
    raise ImportError("Unable to load service hook '%s'" % sourcePath)

  module = importlib.util.module_from_spec(spec)
  sys.modules[moduleName] = module
  try:
    spec.loader.exec_module(module)
  except Exception:
    sys.modules.pop(moduleName, None)
    raise

  return module


def serviceHookAvailable(buildScriptPath, hookName, context):
  if hookName not in HOOK_FUNCTIONS:
    raise ValueError("Unknown service hook '%s'" % hookName)

  module = _loadHook(buildScriptPath, context.serviceName)
  if hookName == "options" and getattr(module, "OPTIONS_AVAILABLE", True) is False:
    return False
  return callable(getattr(module, HOOK_FUNCTIONS[hookName], None))


def runServiceHook(buildScriptPath, hookName, context):
  if hookName not in HOOK_FUNCTIONS:
    raise ValueError("Unknown service hook '%s'" % hookName)

  module = _loadHook(buildScriptPath, context.serviceName)
  hook = getattr(module, HOOK_FUNCTIONS[hookName], None)
  if not callable(hook):
    return {} if hookName == "runChecks" else None
  result = hook(context)
  if hookName == "runChecks" and not isinstance(result, dict):
    raise TypeError(
      "%s: runChecks(context) must return a dictionary" % buildScriptPath
    )
  return result
