#!/usr/bin/env python3
"""Read-only Name.com sandbox health check; credentials never appear in output."""
import base64
import json
import os
from pathlib import Path
import stat
import sys
import urllib.error
import urllib.request


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check():
    config = Path.home() / ".local/share/vigil-domain-e2e/app-env.json"
    info = config.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600:
        raise ValueError("Use an owner-only regular local test configuration file.")
    env = json.loads(config.read_text())
    if env.get("NEXT_PUBLIC_SUPABASE_URL") != "http://127.0.0.1:55431" or env.get("NODE_ENV") == "production" or env.get("VERCEL_ENV") == "production":
        raise ValueError("The isolated local test configuration is required.")
    username = env.get("VIGIL_NAMECOM_SANDBOX_USERNAME", "")
    token = env.get("VIGIL_NAMECOM_SANDBOX_TOKEN", "")
    if not username.endswith("-test") or any(c.isspace() or c == ":" for c in username) or not token:
        raise ValueError("The development username and test token are required.")
    authorization = base64.b64encode((username + ":" + token).encode()).decode()
    request = urllib.request.Request("https://api.dev.name.com/core/v1/hello", headers={"Authorization": "Basic " + authorization})
    try:
        with urllib.request.build_opener(NoRedirects).open(request, timeout=20) as response:
            body = response.read(65_537)
            if len(body) > 65_536:
                raise ValueError("The sandbox health response was unexpectedly large.")
            data = json.loads(body)
            print(json.dumps({"environment": "namecom-sandbox", "httpStatus": response.status,
                              "authenticated": True, "accountMatched": data.get("username") == username,
                              "moneyMoved": False, "dnsChanged": False}))
            return 0
    except urllib.error.HTTPError as error:
        print(json.dumps({"environment": "namecom-sandbox", "httpStatus": error.code,
                          "authenticated": False, "moneyMoved": False, "dnsChanged": False}))
        return 1


if __name__ == "__main__":
    try:
        sys.exit(check())
    except Exception:
        print("Name.com sandbox health could not be confirmed; check the private test configuration and connectivity.", file=sys.stderr)
        sys.exit(1)
