#!/usr/bin/env bash
set -e

/root/.local/bin/flow emulator --chain-id mainnet --rpc-host access.mainnet.nodes.onflow.org:9000 --start-block-height 101914675 > emulator.log 2>&1 &

until grep -q "Started gRPC server on port" /app/emulator.log; do
  sleep 1
done

# Insert running test suites here
/root/.local/bin/flow status --network emulator
/root/.local/bin/flow blocks get 101914675 --host localhost:3569 --include transactions

# Then hand off to whatever command was passed to the container:
exec "$@"
