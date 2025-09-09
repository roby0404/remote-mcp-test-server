import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Test",
		version: "1.0.0",
	});

    private async makeApiCall(
        endpoint: string,
        method: string = 'GET',
        data?: any,
        headers?: HeadersInit
    ): Promise<any> {
        try {
            // Extract domain and token from incoming request headers
            const magentoUrl = headers?.['x-magento-domain'] as string;
            const bearerToken = headers?.['authorization'] as string;

            if (!magentoUrl || !bearerToken) {
                throw new Error('Missing required headers: x-magento-domain and authorization');
            }

            // Ensure bearer token format
            const token = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;

            const apiUrl = `${magentoUrl}/rest/V1/${endpoint}`;

            const requestOptions: RequestInit = {
                method,
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...headers
                }
            };

            if (data && method !== 'GET') {
                requestOptions.body = JSON.stringify(data);
            }

            const response = await fetch(apiUrl, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`API call error: ${error.message}`);
        }
    }

	async init() {

        // Get product by SKU
        this.server.tool(
            "get_product_by_sku",
            {
                sku: z.string().describe("The SKU of the product to retrieve")
            },
            async ({ sku }, { headers }) => {
                try {
                    const result = await this.makeApiCall(`mcpdata/product/sku/${encodeURIComponent(sku)}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

        // Get products by IDs
        this.server.tool(
            "get_products_by_ids",
            {
                ids: z.string().describe("Comma-separated list of product IDs")
            },
            async ({ ids }, { headers }) => {
                try {
                    const result = await this.makeApiCall(`mcpdata/products/ids/${encodeURIComponent(ids)}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

        // Search products
        this.server.tool(
            "search_products",
            {
                query: z.string().optional().describe("Search query for product names"),
                page_size: z.number().optional().default(10).describe("Number of products per page"),
                current_page: z.number().optional().default(1).describe("Current page number")
            },
            async ({ query = '', page_size = 10, current_page = 1 }, { headers }) => {
                try {
                    const params = new URLSearchParams({
                        query,
                        pageSize: page_size.toString(),
                        currentPage: current_page.toString()
                    });
                    const result = await this.makeApiCall(`mcpdata/products/search?${params}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

        // Get product categories
        this.server.tool(
            "get_product_categories",
            {
                sku: z.string().describe("The SKU of the product to get categories for")
            },
            async ({ sku }, { headers }) => {
                try {
                    const result = await this.makeApiCall(`mcpdata/product/categories/${encodeURIComponent(sku)}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

        // Get bestsellers
        this.server.tool(
            "get_bestsellers",
            {
                date_range: z.string().optional().default('today').describe("Date range: 'today', 'yesterday', 'this week', 'last week', 'this month', 'last month', 'ytd', 'last year', or 'YYYY-MM-DD to YYYY-MM-DD'"),
                limit: z.number().optional().default(10).describe("Number of bestsellers to return"),
                status: z.string().optional().describe("Order status filter (e.g., 'complete', 'processing')")
            },
            async ({ date_range = 'today', limit = 10, status }, { headers }) => {
                try {
                    const params = new URLSearchParams({
                        dateRange: date_range,
                        limit: limit.toString()
                    });
                    if (status) {
                        params.append('status', status);
                    }
                    const result = await this.makeApiCall(`mcpdata/bestsellers?${params}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

        // Get revenue data
        this.server.tool(
            "get_revenue",
            {
                date_range: z.string().optional().default('today').describe("Date range: 'today', 'yesterday', 'this week', 'last week', 'this month', 'last month', 'ytd', 'last year', or 'YYYY-MM-DD to YYYY-MM-DD'"),
                status: z.string().optional().describe("Order status filter (e.g., 'complete', 'processing')"),
                include_tax: z.boolean().optional().default(true).describe("Whether to include tax in revenue calculation")
            },
            async ({ date_range = 'today', status, include_tax = true }, { headers }) => {
                try {
                    const params = new URLSearchParams({
                        dateRange: date_range,
                        includeTax: include_tax.toString()
                    });
                    if (status) {
                        params.append('status', status);
                    }
                    const result = await this.makeApiCall(`mcpdata/revenue?${params}`, 'GET', null, headers);
                    return {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                    };
                }
            }
        );

		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

        if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
