#!/bin/bash

PORT=3000

# Find the PID of the process using the port
# Use this if you're having issues with port 3000 in dev mode
PID=$(lsof -t -i :$PORT)

if [ -n "$PID" ]; then
  echo "Killing process $PID using port $PORT"
  kill -9 $PID
else
  echo "No process found using port $PORT"
fi
