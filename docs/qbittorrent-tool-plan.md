# qBittorrent AI Tool Implementation Plan

## Overview
Create a read-only tool that allows the AI to query your qBittorrent instance at `http://192.168.50.21:8080/` for torrent information, download/upload speeds, and transfer statistics.

**Note**: qBittorrent API is accessible without authentication on the local network (verified).

## TDD Approach

We'll follow Test-Driven Development: write tests first, then implement to make them pass.

### Phase 1: Write Tests for QBittorrentClient

**File**: `src/clients/QBittorrentClient.test.ts`

Tests to write:
1. `getTorrents()` - returns parsed torrent list
2. `getTorrents(filter)` - applies filter parameter
3. `getTorrentProperties(hash)` - returns torrent details
4. `getTransferInfo()` - returns transfer stats
5. `isAvailable()` - returns true when API responds
6. `isAvailable()` - returns false on connection error
7. Metrics: records request duration on each call
8. Metrics: sets availability gauge correctly

### Phase 2: Write Tests for qBittorrent Tool

**File**: `src/tools/qbittorrent.tool.test.ts`

Tests to write:
1. Tool has correct name and schema
2. `execute({ action: 'list' })` - returns formatted torrent list
3. `execute({ action: 'list', filter: 'downloading' })` - filters correctly
4. `execute({ action: 'details', hash: '...' })` - returns torrent details
5. `execute({ action: 'details' })` - returns error without hash
6. `execute({ action: 'speeds' })` - returns speed summary
7. `execute({ action: 'transfer_info' })` - returns full transfer info
8. Handles connection errors gracefully

### Phase 3: Implement to Pass Tests

After tests are written and failing, implement:
1. `src/clients/QBittorrentClient.ts`
2. `src/tools/qbittorrent.tool.ts`

---

## Files to Create

### 1. `src/clients/QBittorrentClient.test.ts` (write first)
Unit tests with mocked fetch for the HTTP client.

### 2. `src/clients/QBittorrentClient.ts`
HTTP client for qBittorrent WebUI API v2 (no auth needed):
- Simple fetch-based requests
- Methods: `getTorrents()`, `getTorrentProperties()`, `getTransferInfo()`, `isAvailable()`
- Metrics integration for request duration and availability
- Error handling for connection failures

### 3. `src/clients/index.ts`
Export the client singleton.

### 4. `src/tools/qbittorrent.tool.test.ts` (write first)
Unit tests with mocked client for the tool.

### 5. `src/tools/qbittorrent.tool.ts`
Tool extending `BaseTool` with actions:
- `list` - Get all torrents (with optional filter)
- `details` - Get specific torrent by hash
- `speeds` - Quick overview of current speeds
- `transfer_info` - Full global transfer statistics

---

## Files to Modify

### 1. `src/config.ts`
Add qBittorrent configuration section:
```typescript
qbittorrent: {
  host: string;      // QBIT_HOST (default: http://192.168.50.21:8080)
  enabled: boolean;  // QBIT_ENABLED
}
```

### 2. `src/metrics/index.ts`
Add metrics:
```typescript
export const qbitAvailable = new Gauge({
  name: 'qbittorrent_available',
  help: '1=qBittorrent reachable, 0=unavailable',
  registers: [register],
});

export const qbitRequestDuration = new Histogram({
  name: 'qbittorrent_request_duration_seconds',
  help: 'qBittorrent API request duration in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});
```

### 3. `.env.example`
Document new environment variables.

---

## Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QBIT_HOST` | No | `http://192.168.50.21:8080` | WebUI URL |
| `QBIT_ENABLED` | No | `true` | Enable/disable tool |

---

## qBittorrent API Endpoints Used
- `GET /api/v2/torrents/info` - Torrent list
- `GET /api/v2/torrents/properties` - Torrent details
- `GET /api/v2/transfer/info` - Global transfer stats
- `GET /api/v2/app/version` - Health check

---

## Tool Schema
```json
{
  "name": "qbittorrent",
  "description": "Query qBittorrent for torrent status, download/upload speeds, and transfer information",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["list", "details", "speeds", "transfer_info"]
      },
      "filter": {
        "type": "string",
        "enum": ["all", "downloading", "seeding", "completed", "paused", "active", "inactive", "stalled"]
      },
      "hash": {
        "type": "string",
        "description": "Torrent hash (required for details)"
      }
    },
    "required": ["action"]
  }
}
```

---

## Implementation Order (TDD)

### Red Phase (Write Failing Tests)
1. Update `src/config.ts` - Add qBittorrent config section
2. Update `src/metrics/index.ts` - Add qBittorrent metrics
3. Create `src/clients/` directory
4. Create `src/clients/QBittorrentClient.test.ts` - Write client tests
5. Create `src/tools/qbittorrent.tool.test.ts` - Write tool tests
6. Run tests: `npm test` (should fail)

### Green Phase (Make Tests Pass)
7. Create `src/clients/QBittorrentClient.ts` - Implement client
8. Create `src/clients/index.ts` - Export
9. Create `src/tools/qbittorrent.tool.ts` - Implement tool
10. Run tests: `npm test` (should pass)

### Refactor Phase
11. Clean up any duplication
12. Update `.env.example` - Document env vars

---

## Verification
1. Run tests: `npm test`
2. Build the project: `npm run build`
3. Start the bot: `npm start`
4. Check `/tools` command shows `qbittorrent` tool
5. Test via Discord `/ask` command:
   - "What torrents are currently downloading?"
   - "What are my current download speeds?"
   - "Show me all seeding torrents"
6. Verify metrics at `http://localhost:9090/metrics` include `qbittorrent_*`

---

## Security Notes
- Read-only operations only (no add/delete/pause functionality)
- No authentication required (local network access)
- qBittorrent assumed to be on trusted LAN

---

## Documentation
**First step of implementation**: Copy this plan to `discord-bot/docs/qbittorrent-tool-plan.md` in the repo.
