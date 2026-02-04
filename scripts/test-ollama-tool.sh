#!/bin/bash
# Test Ollama tool calling directly
# Usage: ./scripts/test-ollama-tool.sh "your prompt here"

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-qwen-tools}"
PROMPT="${1:-What torrents are downloading?}"

echo "Testing Ollama tool calling"
echo "Host: $OLLAMA_HOST"
echo "Model: $MODEL"
echo "Prompt: $PROMPT"
echo "---"

curl -s "$OLLAMA_HOST/api/chat" \
  -H "Content-Type: application/json" \
  -d @- <<EOF | jq .
{
  "model": "$MODEL",
  "stream": false,
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant with tools. Use the simplest approach to answer questions. Don't ask for parameters unless required.\n\nTools:\n• qbittorrent: Actions: list (show torrents, optional filter: downloading|seeding|completed|paused|active), details (requires hash), speeds, transfer_info. Use \"list\" for \"show downloads\" questions.\n• calculate: Evaluate math expressions. Examples: \"2+2\", \"sqrt(16)\", \"pow(2,8)\". Supports +,-,*,/,% and functions: sqrt, pow, sin, cos, tan, log, abs, ceil, floor, round, PI, E.\n• get_current_time: Get current time. Optional timezone param (IANA format: \"America/New_York\", \"Europe/London\"). Defaults to UTC."
    },
    {
      "role": "user",
      "content": "$PROMPT"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "qbittorrent",
        "description": "Query qBittorrent for torrent status, download/upload speeds, and transfer information. Read-only access to torrent information on the local network.",
        "parameters": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "Action to perform",
              "enum": ["list", "details", "speeds", "transfer_info"]
            },
            "filter": {
              "type": "string",
              "description": "Filter torrents (used with list action)",
              "enum": ["all", "downloading", "seeding", "completed", "paused", "active", "inactive", "stalled"]
            },
            "hash": {
              "type": "string",
              "description": "Torrent hash (required for details action)"
            }
          },
          "required": ["action"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "calculate",
        "description": "Perform a mathematical calculation.",
        "parameters": {
          "type": "object",
          "properties": {
            "expression": {
              "type": "string",
              "description": "Mathematical expression to evaluate"
            }
          },
          "required": ["expression"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_current_time",
        "description": "Get the current date and time in a specified timezone",
        "parameters": {
          "type": "object",
          "properties": {
            "timezone": {
              "type": "string",
              "description": "IANA timezone name (e.g., America/New_York). Defaults to UTC."
            }
          },
          "required": []
        }
      }
    }
  ]
}
EOF
