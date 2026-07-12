import os


def loadServiceTemplate(yaml, templatesDirectory, serviceName, servicesFileName):
  serviceFilePath = os.path.join(templatesDirectory, serviceName, servicesFileName)
  with open(serviceFilePath) as yamlServiceFile:
    templateServices = yaml.load(yamlServiceFile)

  if not isinstance(templateServices, dict) or serviceName not in templateServices:
    raise ValueError("Service template '%s' does not define '%s'" % (serviceFilePath, serviceName))

  return templateServices


def mergeServiceTemplate(dockerComposeServicesYaml, templateServices, reload=False):
  for templateServiceName, templateService in templateServices.items():
    if reload or templateServiceName not in dockerComposeServicesYaml:
      dockerComposeServicesYaml[templateServiceName] = templateService


def removeServiceTemplate(dockerComposeServicesYaml, templateServices):
  for templateServiceName in templateServices:
    dockerComposeServicesYaml.pop(templateServiceName, None)


def restoreSavedServiceTemplates(
  yaml,
  templatesDirectory,
  templateNames,
  savedServices,
  servicesFileName,
):
  if not isinstance(savedServices, dict):
    return {}

  restoredServices = {}
  for templateName in templateNames:
    if templateName not in savedServices:
      continue
    templateServices = loadServiceTemplate(
      yaml, templatesDirectory, templateName, servicesFileName
    )
    for serviceName in templateServices:
      if serviceName in savedServices:
        restoredServices[serviceName] = savedServices[serviceName]
  return restoredServices
