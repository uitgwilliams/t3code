"""Seed a first packaged G3 profile with the dev client's settings and encrypted catalog."""
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile


def seed(home):
    source = home / ".t3-fork-local/client/userdata"
    target = home / ".g3/userdata"
    if target.exists() or target.is_symlink():
        sys.exit("G3 already has a profile. Skipping import.")
    settings = json.loads((source / "desktop-settings.json").read_bytes())
    if settings.get("localEnvironmentEnabled") is not False:
        sys.exit("Expected a client-only development profile.")
    catalog = (source / "connection-catalog.json").read_bytes()
    if not isinstance(json.loads(catalog).get("encryptedCatalog"), str):
        sys.exit("Expected an encrypted development catalog.")
    target.parent.mkdir(mode=0o700, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent) as tmp:
        stage = Path(tmp) / "userdata"
        stage.mkdir(mode=0o700)
        (stage / "desktop-settings.json").write_text(json.dumps(settings))
        (stage / "connection-catalog.json").write_bytes(catalog)
        prefs = source / "client-settings.json"
        if prefs.is_file():
            shutil.copyfile(prefs, stage / prefs.name)
        # macOS renamex_np with RENAME_EXCL also protects concurrently initialized profiles.
        import ctypes
        libc = ctypes.CDLL(None, use_errno=True)
        if libc.renamex_np(os.fsencode(stage), os.fsencode(target), 4) != 0:
            raise OSError(ctypes.get_errno(), "Could not create new G3 profile")
    print("Seeded the separate packaged profile. Verify the paired environments in G3.")


if __name__ == "__main__":
    if sys.platform != "darwin":
        sys.exit("This helper runs on macOS.")
    os.umask(0o077)
    seed(Path.home())
