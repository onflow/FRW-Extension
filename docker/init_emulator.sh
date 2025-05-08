#!/bin/bash

# Define emulator storage location
STORAGE_PATH="/root/.flow-emulator"

# Ensure the emulator storage directory exists
mkdir -p $STORAGE_PATH

# Start Flow Emulator with Testnet access in the background
flow emulator --persist --chain-id testnet --rpc-host access.devnet.nodes.onflow.org:9000 --snapshot &

# Wait for emulator to sync and store queried data
echo "Waiting for Flow Emulator to initialize..."
sleep 20 # Ensure emulator is fully running before creating snapshot

# Retry logic for snapshot creation
SNAPSHOT_CREATED=false
MAX_RETRIES=5
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i: Creating snapshot..."

  RESPONSE=$(curl -s -X POST http://localhost:8080/emulator/snapshots -d 'name=testnet_snapshot')

  if [[ "$RESPONSE" == *"testnet_snapshot"* ]]; then
    SNAPSHOT_CREATED=true
    echo "✅ Snapshot created successfully!"
    break
  else
    echo "⚠️ Snapshot not found, retrying in $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
  fi
done

# Stop the emulator after saving the snapshot
pkill -f "flow emulator"

# Ensure the snapshot directory exists before copying
if [ -d "$STORAGE_PATH" ]; then
  echo "✅ Emulator state saved in $STORAGE_PATH"
else
  echo "❌ Error: Snapshot directory not found!"
  exit 1
fi
