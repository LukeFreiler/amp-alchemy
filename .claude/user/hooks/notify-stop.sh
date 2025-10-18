#!/usr/bin/env bash
# Claude Code Stop hook: send a push via ntfy
curl -sS -d "✅ Claude Home Finished!" https://ntfy.sh/centercode-home >/dev/null