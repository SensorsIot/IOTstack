import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

from ruamel.yaml import YAML


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from deps.chars import commonTextLine
from deps.compose_environment import (
  requiredEnvironmentIssues,
  configurableEnvironmentVariables,
  defaultEnvironmentValue,
  isPasswordEnvironmentName,
  loadDotEnv,
  requiredEnvironmentVariables,
  restoreEnvironmentVariableReferences,
  setDotEnvValue,
)
from deps.menu_renderer import issuePanelHeight, pageSizeForTerminal, paginationStart, serviceOptionsMessage, terminalSupportsMenu
from deps.issue_viewer import compactIssueRows, issueDisplayRows
from deps.environment_options import generateEnvironmentSecret
from deps.service_hooks import (
  HookContext,
  getHookApiVersion,
  runServiceHook,
  serviceHookAvailable,
)
from deps.service_templates import loadServiceTemplate, mergeServiceTemplate, removeServiceTemplate, restoreSavedServiceTemplates
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

class ComposeEnvironmentTests(unittest.TestCase):
  def test_required_variable_has_a_short_actionable_warning(self):
    issues = requiredEnvironmentIssues(
      {"environment": ["PASSWORD=${PASSWORD:?add PASSWORD to .env}"]},
      envPath="/missing/iotstack-test.env",
      processEnvironment={},
    )
    self.assertEqual(
      "PASSWORD is required. Open Options to configure it.",
      issues["missingEnvironment:PASSWORD"],
    )

  def test_dotenv_and_process_environment_satisfy_requirements(self):
    with tempfile.TemporaryDirectory() as temporaryDirectory:
      envPath = pathlib.Path(temporaryDirectory) / ".env"
      envPath.write_text("FROM_FILE=secret\nEMPTY=\n")
      values = {
        "file": "${FROM_FILE:?missing}",
        "process": "${FROM_PROCESS:?missing}",
        "emptyAllowed": "${EMPTY?missing}",
        "emptyRejected": "${EMPTY:?missing}",
      }
      issues = requiredEnvironmentIssues(
        values,
        envPath=envPath,
        processEnvironment={"FROM_PROCESS": "secret"},
      )
    self.assertEqual(["missingEnvironment:EMPTY"], list(issues))

  def test_gitea_reports_each_missing_required_password(self):
    services = YAML().load(
      (ROOT / ".templates/gitea/service.yml").read_text()
    )
    issues = requiredEnvironmentIssues(
      services,
      envPath="/missing/iotstack-test.env",
      processEnvironment={},
    )
    self.assertIn("missingEnvironment:GITEA_DB_PASSWORD", issues)
    self.assertIn("missingEnvironment:GITEA_DB_ROOT_PASSWORD", issues)

  def test_configured_gitea_settings_remain_discoverable(self):
    services = YAML().load(
      (ROOT / ".templates/gitea/service.yml").read_text()
    )
    with tempfile.TemporaryDirectory(dir="/tmp") as temporaryDirectory:
      envPath = pathlib.Path(temporaryDirectory) / ".env"
      envPath.write_text(
        "GITEA_DB_PASSWORD=user\n"
        "GITEA_DB_ROOT_PASSWORD=root\n"
        "GITEA_SECRET_KEY=secret\n"
        "GITEA_INTERNAL_TOKEN=token\n"
      )
      variables = configurableEnvironmentVariables(services)
      issues = requiredEnvironmentIssues(
        services,
        envPath=envPath,
        processEnvironment={},
      )
    self.assertEqual(
      {
        "GITEA_DB_PASSWORD",
        "GITEA_DB_ROOT_PASSWORD",
        "GITEA_INTERNAL_TOKEN",
        "GITEA_SECRET_KEY",
      },
      set(variables),
    )
    self.assertEqual({}, issues)

  def test_saved_gitea_values_can_rejoin_dotenv_interpolation(self):
    template = YAML().load(
      (ROOT / ".templates/gitea/service.yml").read_text()
    )
    current = YAML().load(
      (ROOT / ".templates/gitea/service.yml").read_text()
    )
    current["gitea"]["ports"][0] = "8123:3000/tcp"
    current["gitea"]["environment"] = [
      value.replace(
        "GITEA__database__PASSWD=${GITEA_DB_PASSWORD:?eg echo GITEA_DB_PASSWORD=userPassword >>~/IOTstack/.env}",
        "GITEA__database__PASSWD=old-user",
      )
      for value in current["gitea"]["environment"]
    ]
    current["gitea_db"]["environment"] = [
      value.replace("${GITEA_DB_PASSWORD:?eg echo GITEA_DB_PASSWORD=userPassword >>~/IOTstack/.env}", "old-user")
      for value in current["gitea_db"]["environment"]
    ]

    changed = restoreEnvironmentVariableReferences(
      current, template, "GITEA_DB_PASSWORD"
    )

    self.assertEqual(2, changed)
    self.assertEqual("8123:3000/tcp", current["gitea"]["ports"][0])
    self.assertIn("${GITEA_DB_PASSWORD:?", str(current))

  def test_required_settings_can_be_written_without_losing_existing_env(self):
    with tempfile.TemporaryDirectory(dir="/tmp") as temporaryDirectory:
      envPath = pathlib.Path(temporaryDirectory) / ".env"
      envPath.write_text("# keep this comment\nUNCHANGED=yes\nPASSWORD=old\n")
      setDotEnvValue(envPath, "PASSWORD", "new-secret")
      setDotEnvValue(envPath, "DEVICE_PATH", "/dev/ttyUSB0")
      contents = envPath.read_text()
      protectedEnvPath = pathlib.Path(temporaryDirectory) / "new.env"
      setDotEnvValue(protectedEnvPath, "PASSWORD", "secret")
      protectedMode = protectedEnvPath.stat().st_mode & 0o777
    self.assertEqual(0o600, protectedMode)
    self.assertIn("# keep this comment", contents)
    self.assertIn("UNCHANGED=yes", contents)
    self.assertEqual(1, contents.count("PASSWORD="))
    self.assertIn("PASSWORD=new-secret", contents)
    self.assertIn("DEVICE_PATH=/dev/ttyUSB0", contents)

  def test_dotenv_complex_values_round_trip_exactly(self):
    values = [
      "space # value",
      'quote"value',
      "slash\\value",
      "dollar$value",
      "two$$dollars",
    ]
    with tempfile.TemporaryDirectory(dir="/tmp") as temporaryDirectory:
      envPath = pathlib.Path(temporaryDirectory) / ".env"
      for index, value in enumerate(values):
        setDotEnvValue(envPath, "VALUE_%s" % index, value)
      loaded = loadDotEnv(envPath)
    self.assertEqual(values, [loaded["VALUE_%s" % index] for index in range(len(values))])

  def test_all_bundled_required_setting_types_are_discovered(self):
    discovered = {}
    for serviceFile in (ROOT / ".templates").glob("*/service.yml"):
      requirements = requiredEnvironmentVariables(YAML().load(serviceFile.read_text()))
      if requirements:
        discovered[serviceFile.parent.name] = set(requirements)
    self.assertIn("GITEA_DB_PASSWORD", discovered["gitea"])
    self.assertIn("WORDPRESS_HOSTNAME", discovered["wordpress"])
    self.assertIn("DUCKDNS_TOKEN", discovered["duckdns"])
    self.assertIn("ZIGBEE2MQTT_DEVICE_PATH", discovered["zigbee2mqtt"])
    self.assertGreaterEqual(len(discovered), 13)

  def test_generated_passwords_use_random_alphanumeric_values(self):
    first = generateEnvironmentSecret()
    second = generateEnvironmentSecret()
    self.assertEqual(32, len(first))
    self.assertTrue(first.isalnum())
    self.assertNotEqual(first, second)

  def test_optional_passwords_and_sensitive_values_are_configurable(self):
    expected = {
      "deconz": "DECONZ_VNC_PASSWORD",
      "gitea": "GITEA_SECRET_KEY",
      "influxdb2": "INFLUXDB2_ADMIN_TOKEN",
      "mjpg-streamer": "MJPG_STREAMER_PASSWORD",
      "pihole": "PIHOLE_ADMIN_PASSWORD",
      "pihole6": "PIHOLE_ADMIN_PASSWORD",
    }
    for serviceName, variableName in expected.items():
      services = YAML().load(
        (ROOT / ".templates" / serviceName / "service.yml").read_text()
      )
      self.assertIn(variableName, configurableEnvironmentVariables(services))

  def test_database_passwords_have_documented_defaults(self):
    expected = {
      "MARIADB_ROOT_PASSWORD": "IOtSt4ckToorMariaDb",
      "MARIADB_USER_PASSWORD": "IOtSt4ckmariaDbPw",
      "NEXTCLOUD_DB_ROOT_PASSWORD": "IOtSt4ckToorMySqlDb",
      "NEXTCLOUD_DB_USER_PASSWORD": "IOtSt4ckmySqlDbPw",
    }
    variables = {}
    for serviceName in ("mariadb", "nextcloud"):
      services = YAML().load(
        (ROOT / ".templates" / serviceName / "service.yml").read_text()
      )
      variables.update(configurableEnvironmentVariables(services))
    for name, expectedDefault in expected.items():
      self.assertEqual(
        expectedDefault,
        defaultEnvironmentValue(name, variables[name]),
      )

  def test_required_passwords_all_offer_documented_defaults(self):
    missingDefaults = []
    for serviceFile in (ROOT / ".templates").glob("*/service.yml"):
      requirements = requiredEnvironmentVariables(
        YAML().load(serviceFile.read_text())
      )
      for name, requirement in requirements.items():
        if isPasswordEnvironmentName(name) and not defaultEnvironmentValue(
          name, requirement
        ):
          missingDefaults.append("%s:%s" % (serviceFile.parent.name, name))
    self.assertEqual([], missingDefaults)

  def test_mjpg_streamer_credentials_are_stable_and_configurable(self):
    services = YAML().load(
      (ROOT / ".templates/mjpg-streamer/service.yml").read_text()
    )
    variables = configurableEnvironmentVariables(services)
    self.assertEqual(
      "IOtSt4ckMJPG",
      defaultEnvironmentValue("MJPG_STREAMER_PASSWORD", variables["MJPG_STREAMER_PASSWORD"]),
    )
    self.assertIn("${MJPG_STREAMER_USERNAME:-iotstack}", str(services))

  def test_required_interpolation_wins_over_an_optional_duplicate(self):
    variables = configurableEnvironmentVariables([
      "${PASSWORD:-default}",
      "${PASSWORD?required}",
    ])
    self.assertEqual("?", variables["PASSWORD"]["operator"])
class PaginationTests(unittest.TestCase):
  def test_page_boundary_scrolls_one_row(self):
    self.assertEqual(1, paginationStart(selection=10, currentStart=0, pageSize=10))

  def test_scrolling_up_places_selection_at_start(self):
    self.assertEqual(3, paginationStart(selection=3, currentStart=5, pageSize=10))

  def test_small_terminal_never_has_negative_page_size(self):
    self.assertEqual(1, pageSizeForTerminal(terminalHeight=10))

  def test_page_automatically_fills_available_terminal_height(self):
    self.assertEqual(13, pageSizeForTerminal(terminalHeight=40, reservedLines=27))

  def test_issue_panel_height_includes_frame_rows(self):
    self.assertEqual(0, issuePanelHeight(0))
    self.assertEqual(9, issuePanelHeight(2))

  def test_service_options_feedback_matches_service_state(self):
    self.assertEqual(
      "This container has no configurable options.",
      serviceOptionsMessage(False, False),
    )
    self.assertIn("Select this container", serviceOptionsMessage(True, False))
    self.assertIsNone(serviceOptionsMessage(True, True))

  def test_long_issues_wrap_instead_of_truncating(self):
    rows = issueDisplayRows([
      (
        "gitea",
        "missingEnvironment:GITEA_DB_PASSWORD",
        "A required setting with a description that needs another line.",
      ),
    ], contentWidth=32)
    self.assertGreater(len(rows), 1)
    self.assertTrue(all(len(row) <= 32 for row in rows))

  def test_compact_issue_rows_link_to_scrolling_viewer(self):
    rows = compactIssueRows([
      ("one", "first", "First issue"),
      ("two", "second", "Second issue"),
      ("three", "third", "Third issue"),
    ], contentWidth=40, maximumRows=2)
    self.assertEqual(2, len(rows))
    self.assertIn("Press [I]", rows[-1])

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


  def test_saved_companion_service_configuration_is_restored(self):
    savedServices = {
      "gitea": {"marker": "saved root"},
      "gitea_db": {"marker": "saved database"},
      "orphan": {"marker": "not owned"},
    }
    restored = restoreSavedServiceTemplates(
      self.yaml,
      self.templatesDirectory,
      ["gitea", "grafana"],
      savedServices,
      "service.yml",
    )
    self.assertEqual({"gitea", "gitea_db"}, set(restored))
    self.assertEqual("saved database", restored["gitea_db"]["marker"])

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

  def test_esphome_checks_do_not_generate_credentials(self):
    buildScript = ROOT / ".templates/esphome/build.py"
    services = self.yaml.load(
      (ROOT / ".templates/esphome/service.yml").read_text()
    )
    context = HookContext(services, "esphome", renderMode="ascii")
    with tempfile.TemporaryDirectory() as temporaryDirectory:
      previousDirectory = os.getcwd()
      try:
        os.chdir(temporaryDirectory)
        result = runServiceHook(buildScript, "runChecks", context)
        envCreated = pathlib.Path(".env").exists()
      finally:
        os.chdir(previousDirectory)
    self.assertEqual({}, result)
    self.assertFalse(envCreated)
    self.assertNotIn("generateRandomString", buildScript.read_text())

  def test_empty_custom_option_menus_are_not_advertised(self):
    for serviceName in ("dozzle", "home_assistant", "influxdb", "mariadb"):
      buildScript = ROOT / ".templates" / serviceName / "build.py"
      services = self.yaml.load(
        (ROOT / ".templates" / serviceName / "service.yml").read_text()
      )
      context = HookContext(services, serviceName, renderMode="ascii")
      self.assertFalse(
        serviceHookAvailable(buildScript, "options", context),
        serviceName,
      )

  def test_prebuild_keeps_current_service_settings(self):
    for serviceName in ("influxdb", "mariadb"):
      with tempfile.TemporaryDirectory() as temporaryDirectory:
        temporaryRoot = pathlib.Path(temporaryDirectory)
        (temporaryRoot / "services").mkdir()
        services = self.yaml.load(
          (ROOT / ".templates" / serviceName / "service.yml").read_text()
        )
        services[serviceName]["x-iotstack-test-marker"] = "current selection"
        context = HookContext(services, serviceName, renderMode="ascii")
        previousDirectory = os.getcwd()
        try:
          os.chdir(temporaryRoot)
          result = runServiceHook(
            ROOT / ".templates" / serviceName / "build.py",
            "preBuild",
            context,
          )
        finally:
          os.chdir(previousDirectory)
        self.assertTrue(result)
        self.assertEqual(
          "current selection",
          context.services[serviceName]["x-iotstack-test-marker"],
        )

  def test_hardware_prebuild_fails_cleanly_without_configuration(self):
    for serviceName in ("deconz", "otbr"):
      with tempfile.TemporaryDirectory() as temporaryDirectory:
        temporaryRoot = pathlib.Path(temporaryDirectory)
        shutil.copytree(
          ROOT / ".templates" / serviceName,
          temporaryRoot / ".templates" / serviceName,
        )
        (temporaryRoot / "services").mkdir()
        services = self.yaml.load(
          (temporaryRoot / ".templates" / serviceName / "service.yml").read_text()
        )
        context = HookContext(services, serviceName, renderMode="ascii")
        previousDirectory = os.getcwd()
        try:
          os.chdir(temporaryRoot)
          result = runServiceHook(
            ROOT / ".templates" / serviceName / "build.py",
            "preBuild",
            context,
          )
        finally:
          os.chdir(previousDirectory)
        self.assertFalse(result)

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
      "adminer", "deconz", "diyhue", "gitea", "grafana",
      "motioneye", "n8n",
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
  def test_legacy_password_cache_cannot_override_environment_settings(self):
    for relativePath in (
      ".templates/deconz/build.py", ".templates/influxdb/build.py",
      ".templates/mariadb/build.py", ".templates/nextcloud/build.py",
    ):
      source = (ROOT / relativePath).read_text()
      self.assertNotIn("buildCacheServices", source)
      self.assertNotIn("Password randomisation", source)
      self.assertNotIn("generateRandomString", source)

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
    for pythonFile in (ROOT / ".templates").glob("*/*.py"):
      self.assertNotIn("getsignal(signal.SIGINT)", pythonFile.read_text(), str(pythonFile))
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
    self.assertIn("serviceOptionsMessage", source)
    transmissionSource = (ROOT / ".templates/transmission/build.py").read_text()
    self.assertIn("except OSError as err:", transmissionSource)
    self.assertIn('if key and transientMessage:', source)
    self.assertIn("if needsRender != 1:", source)

  def test_build_menu_height_is_automatic(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertNotIn("KEY_TAB", source)
    self.assertNotIn("paginationExpanded", source)
    self.assertIn("pageSizeForTerminal(term.height", source)
    self.assertIn("issuePanelHeight(len(issueRows), fixedRows=8)", source)

  def test_hook_failures_stop_the_build(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertIn("if not runPrebuildHook():", source)
    self.assertIn("if not runPostBuildHook():", source)
    self.assertIn("if hookResult is False:", source)
    self.assertIn("postBuildResult = subprocess.call", source)
    self.assertIn("if postBuildResult != 0:", source)
    self.assertIn("return subprocess.call(commandToRun) == 0", (ROOT / ".templates/nextcloud/build.py").read_text())

  def test_service_option_renderers_preserve_cursor_and_signal_state(self):
    badCursorMove = "print(term.move(hotzoneLocation[0], hotzoneLocation[1]))"
    for pythonFile in (ROOT / ".templates").glob("*/*.py"):
      source = pythonFile.read_text()
      self.assertNotIn(badCursorMove, source, str(pythonFile))
      lines = source.splitlines()
      for index, line in enumerate(lines):
        if "mainRender(needsRender," not in line:
          continue
        following = "\n".join(lines[index + 1:index + 4])
        if "SelectionInProgress = True" in following or "selectionInProgress = True" in following:
          self.assertIn("needsRender = 0", following, str(pythonFile))

    for buildScript in (ROOT / ".templates").glob("*/build.py"):
      source = buildScript.read_text()
      if "signal." in source:
        self.assertIn("import signal", source, str(buildScript))
      if buildScript.parent.name != "example_template" and "def runOptionsMenu(context)" in source:
        self.assertIn("finally:", source, str(buildScript))
        self.assertIn("signal.signal(signal.SIGWINCH, originalSignalHandler)", source, str(buildScript))

  def test_docker_commands_only_report_success_on_zero_exit(self):
    source = (ROOT / "scripts/docker_commands.py").read_text()
    startSource = source[
      source.index("def startStack"):source.index("def restartStack")
    ]
    self.assertIn('stackStarted = runCommand("docker-compose up -d --remove-orphans")', source)
    self.assertIn("if stackStarted:", source)
    self.assertIn("return stackStarted", source)
    self.assertNotIn('subprocess.call("docker-compose up -d", shell=True)', startSource)
    self.assertIn("if not runCommand(command):", source)
    self.assertIn("return allStopped", source)
    self.assertIn("return volumesPruned", source)
    self.assertIn("return imagesPruned", source)
    self.assertNotIn('subprocess.call("docker-compose pull"', source)
    self.assertNotIn('subprocess.call("docker system prune --volumes"', source)

  def test_required_environment_warnings_are_part_of_build_checks(self):
    source = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertIn("issues.update(requiredEnvironmentIssues(ownedServices))", source)
    self.assertIn("Build warning: required environment variables are missing:", source)
    self.assertIn('hookState["environmentOptions"]', source)
    self.assertIn("runEnvironmentOptions(", source)
    self.assertIn("runIssueViewer(term, renderMode, issueEntries)", source)
    self.assertIn("elif key.lower() == 'i':", source)
    self.assertLess(
      source.index("requiredIssues = requiredEnvironmentIssues"),
      source.index("if not runPrebuildHook():"),
    )
  def test_password_controls_have_one_owner(self):
    for serviceName in ("deconz", "influxdb", "mariadb", "nextcloud"):
      source = (ROOT / ".templates" / serviceName / "build.py").read_text()
      self.assertNotIn("def setPasswordOptions", source, serviceName)
      self.assertNotIn("passwords.py", source, serviceName)
      self.assertFalse(
        (ROOT / ".templates" / serviceName / "passwords.py").exists()
      )

    optionsSource = (ROOT / "scripts/deps/environment_options.py").read_text()
    self.assertIn('"Password options (%s)"', optionsSource)
    self.assertIn('"Use default: %s"', optionsSource)
    self.assertIn('"Enter a custom password"', optionsSource)
    self.assertIn('"Generate a random password and save it"', optionsSource)
    self.assertIn("Saved in .env.", optionsSource)
    self.assertIn("View password saved in .env", optionsSource)
    self.assertNotIn("whiptail", optionsSource.lower())
    self.assertNotIn("subprocess", optionsSource)
    self.assertIn("with term.cbreak():", optionsSource)
    buildMenuSource = (ROOT / "scripts/buildstack_menu.py").read_text()
    self.assertIn("configurableEnvironmentVariables(templateServices)", buildMenuSource)
    self.assertIn("onValueSaved=onEnvironmentValueSaved", buildMenuSource)
    self.assertNotIn("envPath=envFile", buildMenuSource)
    self.assertIn('envPath=".env"', optionsSource)

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
    self.assertIn("selectedTemplates = [", source)
    self.assertIn("for serviceName in selectedTemplates:", source)

  def test_contributor_guide_uses_modern_hook_api(self):
    source = (ROOT / "docs/Developers/BuildStack-Services.md").read_text()
    self.assertIn("HOOK_API_VERSION = 2", source)
    self.assertIn("def runChecks(context):", source)
    self.assertNotIn("eval(toRun)", source)
    self.assertNotIn("buildHooks = {}", source)

  def test_yaml_merge_without_arguments_shows_usage(self):
    result = subprocess.run(
      [sys.executable, str(ROOT / "scripts/yaml_merge.py")],
      capture_output=True,
      text=True,
    )
    self.assertEqual(4, result.returncode)
    self.assertIn("Usage:", result.stdout)


  def test_default_ports_generator_is_python_and_parses_every_template(self):
    script = ROOT / "scripts/default_ports_md_generator.py"
    self.assertTrue(script.exists())
    self.assertFalse((ROOT / "scripts/default_ports_md_generator.sh").exists())
    result = subprocess.run(
      [sys.executable, str(script)],
      capture_output=True,
      text=True,
    )
    self.assertEqual(0, result.returncode)
    self.assertNotIn("Parsing error", result.stdout)
    self.assertEqual(63, len(result.stdout.splitlines()))


if __name__ == "__main__":
  unittest.main()
