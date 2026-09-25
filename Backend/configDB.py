# file: configDB.py
# Desc: Sets up database conn from env variable, raises error if not set

import os

try:
    DATABASE_URL: str = os.environ["DATABASE_URL"]
    DELETE_PASSWORD: str = os.environ["DELETE_PASSWORD"]
except KeyError as err:
    raise RuntimeError(
        f"Required environment variable is not set: {err.args[0]}"
    ) from err
