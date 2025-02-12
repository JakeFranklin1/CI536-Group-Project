#!/bin/bash

PORT=3000

# Find the PID of the process using the port
PID=$(lsof -t -i :$PORT)

if [ -n "$PID" ]; then
  echo "Killing process $PID using port $PORT"
  kill -9 $PID
else
  echo "No process found using port $PORT"
fi
