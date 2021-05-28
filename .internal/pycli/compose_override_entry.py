#!/usr/bin/env python3

# This is the entry file for merging compose-override.yml

import sys
import traceback
import ruamel.yaml
import os
import sys

yaml = ruamel.yaml.YAML()
yaml.preserve_quotes = True

hasError = False

try:
  print('ruamel.yaml Version:', ruamel.yaml.__version__)
  print('')

  if len(sys.argv) > 1:
    try:
      print('(args - base    ) sys.argv[1]: ', sys.argv[1])
      print('(args - override) sys.argv[2]: ', sys.argv[2])
      print('(args - output  ) sys.argv[3]: ', sys.argv[3])
      baseYamlFile = sys.argv[1]
      overrideYamlFile = sys.argv[2]
      outputYamlFile = sys.argv[3]
    except:
      print("Error: Not enough args")
      print("Usage:")
      print(" compose_override_entry.py [inputFile] [mergeFile] [outputFile]")
      print("")
      print("Example:")
      print(" compose_override_entry.py ./docker-compose.tmp.yml ./compose-override.yml ./docker-compose.yml")
      sys.exit(4)

    print('baseYamlFile: ', baseYamlFile)
    print('overrideYamlFile: ', overrideYamlFile)
    print('outputYamlFile: ', outputYamlFile)

  else:
    print('(env) PYCLI_OVERRIDE_YML: ', os.getenv('PYCLI_OVERRIDE_YML'))
    print('(env) PYCLI_BASE_YML: ', os.getenv('PYCLI_BASE_YML'))
    print('(env) PYCLI_OUTPUT_YML: ', os.getenv('PYCLI_OUTPUT_YML'))
    overrideYamlFile = os.getenv('PYCLI_OVERRIDE_YML')
    baseYamlFile = os.getenv('PYCLI_BASE_YML')
    outputYamlFile = os.getenv('PYCLI_OUTPUT_YML')

  if overrideYamlFile == None:
    hasError = True
    print("Error: overrideYamlFile not set. Set environment variable 'PYCLI_OVERRIDE_YML'")

  if baseYamlFile == None:
    hasError = True
    print("Error: baseYamlFile not set. Set environment variable 'PYCLI_BASE_YML'")

  if outputYamlFile == None:
    hasError = True
    print("Error: outputYamlFile not set. Set environment variable 'PYCLI_OUTPUT_YML'")

  if hasError:
    sys.exit(1)

  def mergeYaml(priorityYaml, defaultYaml):
    finalYaml = {}
    if isinstance(defaultYaml, dict):
      for dk, dv in defaultYaml.items():
        if dk in priorityYaml:
          finalYaml[dk] = mergeYaml(priorityYaml[dk], dv)
        else:
          finalYaml[dk] = dv
      for pk, pv in priorityYaml.items():
        if pk in finalYaml:
          finalYaml[pk] = mergeYaml(finalYaml[pk], pv)
        else:
          finalYaml[pk] = pv
    else:
      finalYaml = defaultYaml
    return finalYaml

  def main():
    with open(r'%s' % baseYamlFile) as fileBaseYamlFile:
      baseYaml = yaml.load(fileBaseYamlFile)

    with open(r'%s' % overrideYamlFile) as fileOverrideYamlFile:
      yamlOverride = yaml.load(fileOverrideYamlFile)

    mergedYaml = mergeYaml(yamlOverride, baseYaml)

    with open(r'%s' % outputYamlFile, 'w') as outputFile:
      yaml.dump(mergedYaml, outputFile)

  main()
  print('')
  print('Merge complete')

except SystemExit:
  sys.exit(0)
except:
  print("Something went wrong: ")
  print(sys.exc_info())
  print(traceback.print_exc())
  print("")
  sys.exit(2)