# Creating an IOTstack service

1. Copy this entire directory and give the copy your service name.
2. Rename `example_service.yml` to `service.yml`.
3. Change the root key in `service.yml` so it exactly matches the directory name.
4. Edit the Compose settings for the container.
5. Delete `build.py` if the service needs no menu hooks. Otherwise, keep only the hook functions you need.

A hook file starts with:

```python
HOOK_API_VERSION = 2
```

The optional functions are:

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

Run `python3 -m unittest discover -v` before submitting a pull request.
