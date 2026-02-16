#!/bin/bash
set -e

if [ ! -d /workspace ]; then
	echo "No /workspace mount detected; keeping flutter-runner idle."
	tail -f /dev/null
fi

cd /workspace

flutter pub get

flutter test --machine "$@"
