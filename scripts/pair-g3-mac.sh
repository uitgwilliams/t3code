#!/bin/bash
# Mint a normal upstream pairing credential and direct its desktop link to installed G3.
set -euo pipefail
"${T3_CLI:-t3}" pair "$@" | sed 's|^App link: t3code://pair?|App link: g3code://pair?|'
