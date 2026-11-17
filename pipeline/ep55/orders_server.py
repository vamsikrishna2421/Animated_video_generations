# EP55: the shop's order lookup as an MCP server. This file is the whole server (the official Python SDK, mcp 2.x).
# Any app that speaks MCP can start it, ask what tools it has (name, description, inputs) and call them.
# The orders live in series/scripts/ep55_demo/orders.json (made up by us); the file is read on every call.
#   python3 pipeline/ep55/orders_server.py      (an MCP client starts it; it talks over stdin/stdout)
import json
from pathlib import Path

from mcp.server.mcpserver import MCPServer

DB = Path(__file__).resolve().parents[2] / "series/scripts/ep55_demo/orders.json"
mcp = MCPServer("shop-orders")


@mcp.tool()
def get_order(order_id: str) -> dict:
    """Look up one order in the shop's system: item, amount, status and refund."""
    orders = json.loads(DB.read_text())
    return orders.get(str(order_id).strip().lstrip("#"), {"error": "no such order"})


if __name__ == "__main__":
    mcp.run("stdio")
