#!/usr/bin/env bash

# SRC="/usercontent"
BUCKET="r2:usercontent/"

find "$SRC" -type f | while read -r f; do
  mime=$(file --mime-type -b "$f")
  echo "Uploading $f as $mime"

  rclone copyto "$f" "$BUCKET/$(basename "$f")" \
    --header-upload "Content-Type: $mime"
done