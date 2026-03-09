# file: configDB.py
# Desc: Sets up database conn from env variable, raises error if not set

import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")