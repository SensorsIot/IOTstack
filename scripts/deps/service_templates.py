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
