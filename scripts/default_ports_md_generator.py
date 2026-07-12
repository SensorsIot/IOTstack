#!/usr/bin/env python3

import pathlib
import re


def readServiceDetails(serviceFile):
  source = serviceFile.read_text()
  nameMatch = re.search(
    r"^\s*container_name:\s*[\"\x27]?([A-Za-z0-9_.-]+)", source, re.MULTILINE
  )
  serviceName = nameMatch.group(1) if nameMatch else "Parsing error"
  mode = "host" if re.search(
    r"^\s*network_mode:\s*[\"\x27]?host[\"\x27]?\s*$",
    source,
    re.MULTILINE,
  ) else "non-host"

  ports = []
  listValues = re.findall(
    r"^\s*-\s*[\"\x27]?([^\"\x27#\s]+)[\"\x27]?\s*(?:#.*)?$",
    source,
    re.MULTILINE,
  )
  for value in listValues:
    portValue = value.split("/", 1)[0]
    parts = portValue.rsplit(":", 2)
    if len(parts) >= 2 and parts[-2].isdigit() and parts[-1].isdigit():
      port = "%s:%s" % (parts[-2], parts[-1])
      if port not in ports:
        ports.append(port)

  return serviceName, mode, ports


def main():
  print("| Service Name | Mode | Port(s)<br> *External:Internal* |")
  print("| ------------ | -----| --------------- |")

  repositoryRoot = pathlib.Path(__file__).resolve().parents[1]
  for serviceFile in sorted(repositoryRoot.glob(".templates/*/service.yml")):
    serviceName, mode, ports = readServiceDetails(serviceFile)
    portText = "".join("%s <br> " % port for port in ports)
    print("| %s | %s | %s|" % (serviceName, mode, portText))


if __name__ == "__main__":
  main()
