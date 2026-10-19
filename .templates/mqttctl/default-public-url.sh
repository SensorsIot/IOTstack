#!/usr/bin/env bash
# The menu evaluates presets without embedded whitespace.
read -r -a addresses <<< "$(hostname -I 2>/dev/null)"
host="${addresses[0]:-$(hostname)}"
[[ "$host" == *:* ]] && host="[$host]"
printf 'http://%s:3002\n' "$host"
