# EP55, the fix (written and committed before it ran): the same MCP server, one change.
# mcp_demo.py found the small AI sending the order number as a number (4417), while orders_server.py's input schema says
# text (order_id: str); the SDK checks every call against the schema, so it refused ("Input should be a valid string").
# Here order_id accepts a number or text and is turned into text before the lookup.
import json
from pathlib import Path

from mcp.server.mcpserver import MCPServer

DB = Path(__file__).resolve().parents[2] / "series/scripts/ep55_demo/orders.json"
mcp = MCPServer("shop-orders")


@mcp.tool()
def get_order(order_id: str | int) -> dict:
    """Look up one order in the shop's system: item, amount, status and refund. order_id: the order number."""
    orders = json.loads(DB.read_text())
    return orders.get(str(order_id).strip().lstrip("#"), {"error": "no such order"})


if __name__ == "__main__":
    mcp.run("stdio")
