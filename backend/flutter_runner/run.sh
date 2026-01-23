#!/bin/bash
set -e

cd /workspace

flutter pub get

flutter test --machine
