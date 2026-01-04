#!/bin/bash
# Swap between real and dev state files
# Usage: ./scripts/swap-state.sh [real|dev]

set -e

DATA_DIR="data"
ACTIVE="$DATA_DIR/state.json"
REAL="$DATA_DIR/state-real.json"
DEV="$DATA_DIR/state-dev.json"

usage() {
  echo "Usage: $0 [real|dev|status]"
  echo "  real   - Switch to real state"
  echo "  dev    - Switch to dev/test state"
  echo "  status - Show which state is active"
  exit 1
}

get_current() {
  if [ ! -f "$ACTIVE" ]; then
    echo "none"
  elif [ -f "$REAL" ] && [ ! -f "$DEV" ]; then
    echo "real"
  elif [ -f "$DEV" ] && [ ! -f "$REAL" ]; then
    echo "dev"
  else
    echo "unknown"
  fi
}

case "$1" in
  real)
    if [ -f "$ACTIVE" ]; then
      mv "$ACTIVE" "$DEV"
      echo "✓ Shelved current state as dev"
    fi
    if [ -f "$REAL" ]; then
      mv "$REAL" "$ACTIVE"
      echo "✓ Activated real state"
    else
      echo "✓ No real state found - will seed fresh on next run"
    fi
    ;;
  dev)
    if [ -f "$ACTIVE" ]; then
      mv "$ACTIVE" "$REAL"
      echo "✓ Shelved current state as real"
    fi
    if [ -f "$DEV" ]; then
      mv "$DEV" "$ACTIVE"
      echo "✓ Activated dev state"
    else
      echo "✓ No dev state found - will seed fresh on next run"
    fi
    ;;
  status)
    current=$(get_current)
    echo "Active state: $current"
    echo ""
    echo "Files:"
    [ -f "$ACTIVE" ] && echo "  ✓ $ACTIVE (active)" || echo "  ✗ $ACTIVE"
    [ -f "$REAL" ] && echo "  ✓ $REAL (shelved)" || echo "  ✗ $REAL"
    [ -f "$DEV" ] && echo "  ✓ $DEV (shelved)" || echo "  ✗ $DEV"
    ;;
  *)
    usage
    ;;
esac

