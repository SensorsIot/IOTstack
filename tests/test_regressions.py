import pathlib
import subprocess
import sys
import unittest

from ruamel.yaml import YAML


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from deps.chars import commonTextLine
from deps.menu_renderer import pageSizeForTerminal, paginationStart, terminalSupportsMenu
from deps.service_hooks import (
  HookContext,
  getHookApiVersion,
  runServiceHook,
  serviceHookAvailable,
)
from deps.service_templates import loadServiceTemplate, mergeServiceTemplate, removeServiceTemplate
from deps.version_check import checkVersion
import menu_main


class VersionCheckTests(unittest.TestCase):
  def test_rejects_older_minor_version(self):
    self.assertFalse(checkVersion("18.2.0", "18.1.99")[0])

  def test_accepts_newer_minor_version(self):
    self.assertTrue(checkVersion("18.2.0", "18.3.0")[0])

  def test_rejects_older_build_version(self):
    self.assertFalse(checkVersion("18.2.5", "18.2.4")[0])

  def test_shell_version_check_rejects_older_minor_version(self):
    source = (ROOT / "menu.sh").read_text()
    functionSource = source[source.index("function minimum_version_check"):source.index("function check_git_updates")]
    result = subprocess.run(
      ["bash", "-c", functionSource + "\nminimum_version_check 3.6.9 3 5 99"],
      capture_output=True,
      text=True,
    )
    self.assertNotEqual(0, result.returncode)
    self.assertEqual("false", result.stdout.strip())


class PaginationTests(unittest.TestCase):
  def test_page_boundary_scrolls_one_row(self):
    self.assertEqual(1, paginationStart(selection=10, currentStart=0, pageSize=10))

  def test_scrolling_up_places_selection_at_start(self):
    self.assertEqual(3, paginationStart(selection=3, currentStart=5, pageSize=10))

  def test_small_terminal_never_has_negative_page_size(self):
    self.assertEqual(1, pageSizeForTerminal(terminalHeight=10))

  def test_page_automatically_fills_available_terminal_height(self):
    self.assertEqual(13, pageSizeForTerminal(terminalHeight=40, reservedLines=27))

  def test_build_menu_uses_fallback_for_narrow_terminal(self):
    self.assertFalse(terminalSupportsMenu(terminalWidth=80, terminalHeight=24))

  def test_build_menu_supports_minimum_terminal_dimensions(self):
    self.assertTrue(terminalSupportsMenu(terminalWidth=82, terminalHeight=30))


class MenuRenderingTests(unittest.TestCase):
  def test_text_line_matches_standard_border_width(self):
    line = commonTextLine("ascii", "Warning", paddingBefore=6)
    self.assertEqual(82, len(line))
    self.assertEqual("|      Warning", line[:14])
    self.assertTrue(line.endswith("|"))

  def test_text_line_styling_does_not_affect_padding(self):
    style = lambda text: "<yellow>%s</yellow>" % text
    plain = commonTextLine("ascii", "Warning", paddingBefore=6)
    styled = commonTextLine("ascii", "Warning", paddingBefore=6, style=style)
    self.assertEqual(plain.count(" "), styled.count(" "))
    self.assertIn("<yellow>Warning</yellow>", styled)


class ServiceTemplateTests(unittest.TestCase):
  def setUp(self):
    self.yaml = YAML()
    self.templatesDirectory = str(ROOT / ".templates")

  def test_gitea_companion_database_is_loaded(self):
    template = loadServiceTemplate(self.yaml, self.templatesDirectory, "gitea", "service.yml")
    selected = {"gitea": {"custom": "preserved"}}
    mergeServiceTemplate(selected, template)
    self.assertEqual({"custom": "preserved"}, selected["gitea"])
    self.assertIn("gitea_db", selected)

  def test_wordpress_companion_database_is_loaded_and_removed(self):
    template = loadServiceTemplate(self.yaml, self.templatesDirectory, "wordpress", "service.yml")
    selected = {}
    mergeServiceTemplate(selected, template)
    self.assertEqual({"wordpress", "wordpress_db"}, set(selected))
    removeServiceTemplate(selected, template)
    self.assertEqual({}, selected)

  def test_every_template_defines_its_directory_service(self):
    for serviceFile in (ROOT / ".templates").glob("*/service.yml"):
      serviceName = serviceFile.parent.name
      template = loadServiceTemplate(self.yaml, self.templatesDirectory, serviceName, "service.yml")
      self.assertIn(serviceName, template)

  def test_openhab_environment_uses_valid_mapping_form(self):
    template = loadServiceTemplate(self.yaml, self.templatesDirectory, "openhab", "service.yml")
    self.assertIsInstance(template["openhab"]["environment"], dict)


class ServiceHookTests(unittest.TestCase):
  def setUp(self):
    self.yaml = YAML()

  def test_example_uses_modern_hook_api(self):
    buildScript = ROOT / ".templates/example_template/build.py"
    serviceFile = ROOT / ".templates/example_template/example_service.yml"
    services = self.yaml.load(serviceFile.read_text())
    serviceName = next(iter(services))
    context = HookContext(services, serviceName, renderMode="ascii")

    self.assertEqual(2, getHookApiVersion(buildScript))
    self.assertTrue(serviceHookAvailable(buildScript, "options", context))
    self.assertTrue(serviceHookAvailable(buildScript, "runChecks", context))
    self.assertEqual({}, runServiceHook(buildScript, "runChecks", context))

  def test_converted_bundled_hook_uses_modern_api(self):
    buildScript = ROOT / ".templates/openhab/build.py"
    services = self.yaml.load((ROOT / ".templates/openhab/service.yml").read_text())
    context = HookContext(services, "openhab", renderMode="ascii")

    self.assertEqual(2, getHookApiVersion(buildScript))
    self.assertTrue(serviceHookAvailable(buildScript, "runChecks", context))
    self.assertEqual({}, runServiceHook(buildScript, "runChecks", context))

  def test_hooks_without_an_api_version_are_rejected(self):
    buildScript = ROOT / "tests/fixtures/legacy_build.py"
    context = HookContext({}, "legacy-service", renderMode="ascii")

    with self.assertRaisesRegex(ValueError, "HOOK_API_VERSION = 2"):
      serviceHookAvailable(buildScript, "runChecks", context)

  def test_every_bundled_hook_uses_modern_api(self):
    for buildScript in (ROOT / ".templates").glob("*/build.py"):
      self.assertEqual(2, getHookApiVersion(buildScript), str(buildScript))

  def test_every_bundled_hook_can_be_inspected(self):
    servicesWithOptions = {
      "adminer", "deconz", "diyhue", "dozzle", "gitea", "grafana",
      "home_assistant", "influxdb", "mariadb", "motioneye", "n8n",
      "nextcloud", "nodered", "otbr", "portainer-ce",
      "python-matter-server", "transmission",
    }
    for buildScript in (ROOT / ".templates").glob("*/build.py"):
      serviceName = buildScript.parent.name
      if serviceName == "example_template":
        continue
      serviceFile = buildScript.parent / "service.yml"
      services = self.yaml.load(serviceFile.read_text())
      context = HookContext(services, serviceName, renderMode="ascii")

      self.assertTrue(serviceHookAvailable(buildScript, "runChecks", context))
      self.assertTrue(serviceHookAvailable(buildScript, "preBuild", context))
      self.assertTrue(serviceHookAvailable(buildScript, "postBuild", context))
      self.assertEqual(
        serviceName in servicesWithOptions,
        serviceHookAvailable(buildScript, "options", context),
      )

  def test_hook_path_contains_no_dynamic_execution(self):
    self.assertNotIn("exec(", (ROOT / "scripts/buildstack_menu.py").read_text())
    self.assertNotIn("exec(", (ROOT / "scripts/deps/service_hooks.py").read_text())
    for buildScript in (ROOT / ".templates").glob("*/build.py"):
      self.assertNotIn("eval(toRun)", buildScript.read_text(), str(buildScript))


class SourceRegressionTests(unittest.TestCase):
  def test_cached_services_are_not_all_readded(self):
    expectedLoops = {
      ".templates/influxdb/build.py": "enumerate(serviceYamlTemplate)",
      ".templates/deconz/build.py": "enumerate(serviceYamlTemplate)",
      ".templates/mariadb/build.py": "enumerate(serviceYamlTemplate)",
      ".templates/nextcloud/build.py": "enumerate(servicesListed)",
    }
    for relativePath, expectedLoop in expectedLoops.items():
      source = (ROOT / relativePath).read_text()
      self.assertNotIn("enumerate(buildCacheServices)", source)
      self.assertIn(expectedLoop, source)

  def test_backup_manifest_includes_both_override_files(self):
    source = (ROOT / "scripts/backup.sh").read_text()
    self.assertIn('echo "./docker-compose.override.yml" >> $BACKUPLIST', source)
    self.assertIn('echo "./compose-override.yml" >> $BACKUPLIST', source)
    self.assertIn('echo "./.env" >> $BACKUPLIST', source)
    self.assertIn('echo "./post_restore.sh" >> $BACKUPLIST', source)
    self.assertIn('[ -e "./extra" ]', source)


  def test_resize_handlers_preserve_sigwinch(self):

    for relativePath in (
      "scripts/buildstack_menu.py",
      "scripts/docker_commands.py",
      "scripts/misc_commands.py",
      "scripts/backup_restore.py",
      "scripts/native_installs.py",
    ):
      source = (ROOT / relativePath).read_text()
      self.assertIn("originalSignalHandler = signal.getsignal(signal.SIGWINCH)", source)
      self.assertNotIn("originalSignalHandler = signal.getsignal(signal.SIGINT)", source)
  def test_backup_and_restore_propagate_archive_failures(self):
    backupSource = (ROOT / "scripts/backup.sh").read_text()
    restoreSource = (ROOT / "scripts/restore.sh").read_text()
    self.assertIn('if ! sudo tar -czf', backupSource)
    self.assertIn('if ! tar -tzf "$RESTOREFILE"', restoreSource)
    self.assertIn('if ! sudo tar -zxvf', restoreSource)


  def test_build_menu_does_not_query_cursor_position(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertNotIn("get_location", source)

  def test_build_menu_explains_options_require_selected_container(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertIn(
      'Select this container with [Space] before opening its options.',
      source,
    )
    self.assertIn('if key and transientMessage:', source)

  def test_build_menu_height_is_automatic(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertNotIn("KEY_TAB", source)
    self.assertNotIn("paginationExpanded", source)
    self.assertIn("pageSizeForTerminal(term.height", source)

  def test_dynamic_menu_removal_keeps_selection_in_range(self):

    originalMenu = list(menu_main.mainMenuList)
    originalAdded = menu_main.potentialMenu["deletePromptFiles"]["added"]
    originalIndex = menu_main.currentMenuItemIndex
    try:
      menu_main.mainMenuList.append(menu_main.potentialMenu["deletePromptFiles"]["menuItem"])
      menu_main.potentialMenu["deletePromptFiles"]["added"] = True
      menu_main.currentMenuItemIndex = len(menu_main.mainMenuList) - 1
      self.assertTrue(menu_main.removeMenuItemByLabel("deletePromptFiles"))
      self.assertLess(menu_main.currentMenuItemIndex, len(menu_main.mainMenuList))
    finally:
      menu_main.mainMenuList[:] = originalMenu
      menu_main.potentialMenu["deletePromptFiles"]["added"] = originalAdded
      menu_main.currentMenuItemIndex = originalIndex
  def test_saved_service_restore_uses_stable_key_snapshot(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertIn("enumerate(list(dockerComposeServicesYaml))", source)

  def test_yaml_merge_without_arguments_shows_usage(self):
    result = subprocess.run(
      [sys.executable, str(ROOT / "scripts/yaml_merge.py")],
      capture_output=True,
      text=True,
    )
    self.assertEqual(4, result.returncode)
    self.assertIn("Usage:", result.stdout)



if __name__ == "__main__":
  unittest.main()
