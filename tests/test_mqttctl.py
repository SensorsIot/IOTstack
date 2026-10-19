"""Isolated integration check: python3 tests/test_mqttctl.py (requires Docker)."""
import json
import http.cookiejar
import urllib.parse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
work = Path(tempfile.mkdtemp(prefix="iotstack-mqttctl-"))
project = work.name
env = dict(os.environ, COMPOSE_PROJECT_NAME=project)

def run(*args, check=True):
    result = subprocess.run(args, cwd=work, env=env, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if check and result.returncode:
        raise AssertionError(f"{args}: {result.stdout} {result.stderr}")
    return result

def menu(*args):
    result = run("bash", "iotstack-menu.sh", *args)
    return result.stdout + result.stderr

def compose(*args, check=True):
    return run("docker", "compose", "-p", project, *args, check=check)

def wait_for(check, seconds=90):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            result = check()
            if result:
                return result
        except Exception:
            pass
        time.sleep(1)
    raise AssertionError("Timed out waiting for service")

shutil.copytree(ROOT / ".templates", work / ".templates")
shutil.copytree(ROOT / "scripts", work / "scripts")
shutil.copy2(ROOT / "iotstack-menu.sh", work)
shutil.copy2(ROOT / "install.sh", work)
run("git", "init", "-q")
try:
    menu("reload")
    menu("install", "mqttctl")
    menu("build")
    dotenv = (work / ".env").read_text()
    assert "MQTTCTL_ADMIN_PASSWORD=IOT-" in dotenv
    assert "MQTTCTL_PUBLIC_URL=http://" in dotenv
    assert "Warning: mqttctl and mosquitto" in menu("install", "mosquitto")
    warning = menu("build")
    assert "Warning: mqttctl and mosquitto" in warning
    assert "Both use host MQTT port 1883 by default" in warning
    config = json.loads(compose("config", "--format", "json").stdout)
    assert "mosquitto" in config["services"]
    broker_ports = config["services"]["mqttctl-broker-agent"]["ports"]
    assert {(int(port["published"]), port["target"]) for port in broker_ports} == {
        (1883, 1883), (8883, 8883), (9001, 9001)
    }
    # Overrides allow both brokers without changing their internal MQTT ports.
    with (work / ".env").open("a") as dotenv_file:
        dotenv_file.write("\nMQTTCTL_MQTT_PORT=1884\nMQTTCTL_MQTTS_PORT=8884\nMQTTCTL_WS_PORT=9002\n")
    custom_config = json.loads(compose("config", "--format", "json").stdout)
    assert {(int(port["published"]), port["target"])
            for port in custom_config["services"]["mqttctl-broker-agent"]["ports"]} == {
        (1884, 1883), (8884, 8883), (9002, 9001)
    }
    assert custom_config["services"]["mosquitto"]["ports"][0]["published"] == "1883"
    assert all("mcp" not in name for name in config["services"])
    for name in ("mqttctl", "mqttctl-init", "mqttctl-broker-agent"):
        assert config["services"][name]["image"].endswith(":v0.0.8-264ca1e6585c")
    menu("deactivate", "mqttctl")
    assert "Warning: mqttctl and mosquitto" in menu("activate", "mqttctl")
    menu("deactivate", "mosquitto")
    menu("build")
    print("PASS menu install, defaults, dual-broker warning and activation", flush=True)

    # Use random localhost ports and unique names; do not touch the real stack.
    (work / ".env").write_text(
        "MQTTCTL_ADMIN_PASSWORD='Test-$-password-123A'\n"
        "MQTTCTL_PUBLIC_URL=http://127.0.0.1:3002\n")
    menu("build")
    config = json.loads(compose("config", "--format", "json").stdout)
    for name, service in config["services"].items():
        service["container_name"] = project + "-" + name
        service["restart"] = "no"
        if "ports" in service:
            for port in service["ports"]:
                port["host_ip"] = "127.0.0.1"
                port["published"] = "0"
    (work / "docker-compose.yml").write_text(json.dumps(config))
    compose("up", "-d")
    address = compose("port", "mqttctl", "3000").stdout.strip()
    url = "http://" + address
    def ready():
        with urllib.request.urlopen(url, timeout=3) as response:
            return response.status == 200
    wait_for(ready)
    print("PASS pinned images, initialization, verified broker TLS and UI HTTP", flush=True)
    # Read protected test credentials inside the init image, never print them.
    def read_state():
        return json.loads(compose("run", "--rm", "--no-deps", "mqttctl-init",
            "node", "-e",
            "console.log(require('fs').readFileSync('/state/app-config/mqttctl.secrets.json','utf8'))").stdout)
    secrets = read_state()
    assert secrets["bootstrapAdmin"]["password"] == "Test-$-password-123A"
    password = secrets["broker"]["dynsecAdminPassword"]
    jar = http.cookiejar.CookieJar()
    browser = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    login = urllib.request.Request(url + "/auth/login",
        data=urllib.parse.urlencode({"username": "admin", "password": "Test-$-password-123A"}).encode(),
        headers={"Origin": "http://127.0.0.1:3002", "Accept": "text/html"})
    with browser.open(login, timeout=10) as response:
        assert response.status == 200 and "/dashboard" in response.url, response.url
    assert list(jar), "Login should create a session cookie"
    print("PASS browser login with custom password", flush=True)
    # Give the isolated test admin a data-plane role. Production device
    # accounts and roles are configured through the UI by the user.
    def grant_test_role():
        result = compose("exec", "-T", "mqttctl-broker-agent",
            "mosquitto_ctrl", "-h", "localhost", "-u", "admin", "-P", password,
            "dynsec", "addClientRole", "admin", "read-write-all", check=False)
        return result.returncode == 0 and "Error" not in result.stdout + result.stderr
    wait_for(grant_test_role)
    def mqtt_roundtrip():
        common = ["exec", "-T", "mqttctl-broker-agent"]
        auth = ["-h", "localhost", "-u", "admin", "-P", password]
        pub = compose(*common, "mosquitto_pub", *auth, "-t", "iotstack/test",
                      "-m", "persistent-test", "-r", check=False)
        sub = compose(*common, "mosquitto_sub", *auth, "-t", "iotstack/test",
                      "-C", "1", "-W", "3", check=False)
        return pub.returncode == 0 and sub.stdout.strip() == "persistent-test"
    wait_for(mqtt_roundtrip)
    print("PASS MQTT authenticated publish/subscribe and custom bootstrap password", flush=True)
    compose("exec", "-T", "mqttctl-broker-agent", "sh", "-c",
            "echo '# persistence-marker' >> /mosquitto/config/mosquitto.conf")
    compose("down")
    compose("up", "-d")
    address = compose("port", "mqttctl", "3000").stdout.strip()
    url = "http://" + address
    wait_for(ready)
    assert read_state() == secrets
    content = compose("exec", "-T", "mqttctl-broker-agent", "cat",
                      "/mosquitto/config/mosquitto.conf").stdout
    assert "# persistence-marker" in content
    wait_for(mqtt_roundtrip)
    print("PASS recreation preserves credentials, broker config and MQTT access", flush=True)
finally:
    if (work / "docker-compose.yml").exists():
        logs = compose("logs", "--no-color", check=False).stdout
        (work / "test-containers.log").write_text(logs)
        compose("down", "--remove-orphans", check=False)
    print(f"Test files and logs retained at {work}", flush=True)
