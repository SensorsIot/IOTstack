# Menu system

This page explains how the menu system works for developers.

## Background
Originally this script was written in bash. After a while it became obvious that bash wasn't well suited to dealing with all the different types of configuration files, and logic that goes with configuring everything. IOTstack needs to be accessible to all levels of programmers and tinkerers, not just ones experienced with Linux and bash. For this reason, it was rewritten in Python since the language syntax is easier to understand, and is more commonly used for scripting and programming than bash. Bash is still used in IOTstack where it makes sense to use it, but the menu system itself uses Python. The code it self while not being the most well structured or efficient, was intentionally made that way so that beginners and experienced programmers could contribute to the project. We are always open to improvements if you have suggestions.

## Menu Structure

Each screen of the menu is its own Python script. You can find most of these in the `./scripts` directory. When you select an item from the menu, and it changes screens, it actually dynamically loads and executes that Python script. It passes data as required by placing it into the global variable space so that both the child and the parent script can access it.
This injected-global design applies to the menu screens themselves. Service `build.py` hooks use the simpler importlib/context API described below.


### Injecting and getting globals in a child script
```
with open(childPythonScriptPath, "rb") as pythonDynamicImportFile:
  code = compile(pythonDynamicImportFile.read(), childPythonScriptPath, "exec")
execGlobals = {
  "globalKeyName": "globalKeyValue"
}
execLocals = {}
print(globalKeyName) # Will print out 'globalKeyValue'
exec(code, execGlobals, execLocals)
print(globalKeyName) # Will print out 'newValue'
```

### Reading and writing global variables in a child script
```
def someFunction():
  global globalKeyName
  print(globalKeyName) # Will print out 'globalKeyValue'
  globalKeyName = "newValue"
```

Each menu is its own python executable. The entry point is down the bottom of the file wrapped in a `main()` function to prevent variable scope creep.

The code at the bottom of the `main()` function:
```
if __name__ == 'builtins':
```

Is actually where the execution path runs, all the code above it is just declared so that it can be called without ordering or scope issues.

### Optimisations

It was obvious early on that the menu system would be slow on lower end devices, such as the Raspberry Pi, especially if it were rending a 4k terminal screen from a desktop via SSH. To mitigate this issue, not all of the screen is redrawn when there is a change. A "Hotzone" as it's called in the code, is usually rerendered when there's a change (such as pressing up or down to change an item selection, but not when scrolling). Full screen redraws are expensive and are only used when required, for example, when scrolling the pagination, selecting or deselecting a service, expanding or collapsing the menu and so on.

### Environments and encoding
At the very beginning of the main menu screen (`./scripts/menu_main.py`) the function `checkRenderOptions()` is run to determine what characters can be displayed on the screen. It will try various character sets, and eventually default to ASCII if none of the fancier stuff can be rendered. This setting is passed into of the sub menus through the submenu's global variables so that they don't have to recheck when they load.

### Sub-Menus

From the main screen, you will see several sections leading to various submenus. Most of these menus work in the same way as the main menu. The only exception to this rule is the Build Stack menu, which is probably the most complex part of IOTstack.

## Build Stack Menu

Path: `./scripts/buildstack_menu.py`

### Loading

1. The Build Stack menu lists folders in `./.templates` that contain a `service.yml` file. A `build.py` file is optional.
2. The menu loads `./services/docker-compose.save.yml`, if present, to restore the previous selection and settings.
3. The menu prepares the selected state and runs checks for the restored services.

### Adding a service hook

The intended workflow is to copy `./.templates/example_template`, rename the directory, rename `example_service.yml` to `service.yml`, make its root service key match the new directory name, and optionally edit `build.py`. Service hooks are ordinary Python modules loaded with the standard-library `importlib` machinery.

A new `build.py` must declare hook API version 2:

```python
HOOK_API_VERSION = 2
```

It may define any of these optional functions. Delete the functions the service does not need:

```python
def runChecks(context):
  return {}

def runOptionsMenu(context):
  pass

def preBuild(context):
  pass

def postBuild(context):
  pass
```

No classes, decorators, registration dictionaries, package installation, or global declarations are required. IOTstack discovers the functions by name. Each function receives a context with four attributes:

* `context.serviceName` - the service directory/name currently being processed.
* `context.services` - the in-memory Compose services mapping. Hooks may update it in place.
* `context.renderMode` - the selected terminal character mode.
* `context.terminal` - the active blessed terminal, for an options UI.

`runChecks(context)` must return a dictionary. Return `{}` when the service passes its checks. The other hooks may return `None`.

The loader and validation live in `scripts/deps/service_hooks.py`. Contributors should not need to modify that file.

All bundled service hooks use API version 2. A hook without the version declaration is rejected with an error pointing to the required declaration. Existing generated Compose projects do not depend on the hook loader and continue to run normally.

### Selection and deselection

When an item is selected, the menu updates its checked state, loads every Compose service from that template, and runs checks against the new selection. Deselecting it removes every Compose service owned by the template.

### Check for options

During a full render, the build menu loads each optional `build.py` module and checks for a callable `runOptionsMenu(context)` function. If one exists, the options indicator is shown for that service.

### Check for issues

When a service is selected or deselected, the menu calls its optional `runChecks(context)` function. Checks commonly detect port conflicts, missing dependent services, or required configuration files. The returned dictionary is displayed in the build issues panel.

### Prebuild hook

Pressing enter starts the build and calls each selected service's optional `preBuild(context)` function. It can create configuration files, generate credentials, or update `context.services` before Compose output is written.

### Postbuild hook

After `docker-compose.yml` has been written, the menu calls each selected service's optional `postBuild(context)` function. Most services do not need one, but it can apply permissions or clean up temporary files.

### The build process
The selected services' yaml configuration is already loaded into memory before the build stack process is started.

1. Run prebuildHooks.
2. Read `./.templates/docker-compose-base.yml` file into a in memory yaml structure.
3. Add selected services into the in memory structure.
4. If it exists merge the `./compose-override.yml` file into memory
5. Write the in memory yaml structure to disk `./docker-compose.yml`.
6. Run postbuildHooks.
7. Run `postbuild.sh` if it exists, with the list of services built.
