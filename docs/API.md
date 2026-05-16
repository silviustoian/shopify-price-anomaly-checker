## docs/API.md
```md
# API Documentation
Base URL:
```txt
http://localhost:4000/api

GET /health

Checks if the backend is running.

Response

{
  "status": "ok",
  "service": "shopify-price-anomaly-checker-api",
  "timestamp": "2026-05-16T12:00:00.000Z"
}

⸻

GET /shopify/products

Fetches products and variants from the connected Shopify development store using the Shopify Admin GraphQL API.

Used mainly to test Shopify connectivity.

Response

{
  "count": 13,
  "products": [
    {
      "id": "gid://shopify/Product/123",
      "title": "Test Hoodie Zero Price",
      "handle": "test-hoodie-zero-price",
      "status": "ACTIVE",
      "imageUrl": null,
      "variants": [
        {
          "id": "gid://shopify/ProductVariant/456",
          "title": "Default Title",
          "sku": "HOODIE-ZERO",
          "price": 0,
          "compareAtPrice": null
        }
      ]
    }
  ]
}

⸻

GET /shopify/analyze-preview

Fetches Shopify products and runs the price anomaly rules without saving anything to the database.

Useful for debugging the analyzer.

Response

{
  "productsScanned": 13,
  "variantsScanned": 15,
  "issues": [
    {
      "shopifyProductId": "gid://shopify/Product/123",
      "shopifyVariantId": "gid://shopify/ProductVariant/456",
      "productTitle": "Test Hoodie Zero Price",
      "variantTitle": "Default Title",
      "sku": "HOODIE-ZERO",
      "price": 0,
      "compareAtPrice": null,
      "issueType": "ZERO_OR_INVALID_PRICE",
      "severity": "CRITICAL",
      "recommendation": "Set a valid variant price before making this product available for sale."
    }
  ],
  "criticalCount": 1,
  "warningCount": 0,
  "infoCount": 1
}

⸻

POST /scans/run

Runs the full scan flow:

1. Fetches products from Shopify
2. Runs price anomaly rules
3. Saves scan summary in PostgreSQL
4. Saves all issues in PostgreSQL
5. Returns the saved scan with issues

Request Body

No body required.

Example

curl -X POST http://localhost:4000/api/scans/run

Response

{
  "id": "cmabc123",
  "shopDomain": "your-store.myshopify.com",
  "productsScanned": 13,
  "variantsScanned": 15,
  "issuesFound": 20,
  "criticalCount": 2,
  "warningCount": 1,
  "infoCount": 17,
  "createdAt": "2026-05-16T12:00:00.000Z",
  "issues": [
    {
      "id": "cmissue123",
      "scanId": "cmabc123",
      "shopifyProductId": "gid://shopify/Product/123",
      "shopifyVariantId": "gid://shopify/ProductVariant/456",
      "productTitle": "Test Hoodie Zero Price",
      "variantTitle": "Default Title",
      "sku": "HOODIE-ZERO",
      "price": "0",
      "compareAtPrice": null,
      "issueType": "ZERO_OR_INVALID_PRICE",
      "severity": "CRITICAL",
      "recommendation": "Set a valid variant price before making this product available for sale.",
      "createdAt": "2026-05-16T12:00:00.000Z"
    }
  ]
}

⸻

GET /scans

Returns all saved scans, newest first.

Does not include issue details.

Response

[
  {
    "id": "cmabc123",
    "shopDomain": "your-store.myshopify.com",
    "productsScanned": 13,
    "variantsScanned": 15,
    "issuesFound": 20,
    "criticalCount": 2,
    "warningCount": 1,
    "infoCount": 17,
    "createdAt": "2026-05-16T12:00:00.000Z"
  }
]

⸻

GET /scans/:id

Returns one scan with all related issues.

Response

{
  "id": "cmabc123",
  "shopDomain": "your-store.myshopify.com",
  "productsScanned": 13,
  "variantsScanned": 15,
  "issuesFound": 20,
  "criticalCount": 2,
  "warningCount": 1,
  "infoCount": 17,
  "createdAt": "2026-05-16T12:00:00.000Z",
  "issues": [
    {
      "id": "cmissue123",
      "scanId": "cmabc123",
      "productTitle": "Test Hoodie Zero Price",
      "variantTitle": "Default Title",
      "sku": "HOODIE-ZERO",
      "price": "0",
      "compareAtPrice": null,
      "issueType": "ZERO_OR_INVALID_PRICE",
      "severity": "CRITICAL",
      "recommendation": "Set a valid variant price before making this product available for sale.",
      "createdAt": "2026-05-16T12:00:00.000Z"
    }
  ]
}

404 Response

{
  "error": "Scan not found"
}

⸻

Issue Types

Issue Type	Severity	Meaning
ZERO_OR_INVALID_PRICE	Critical	Price is zero, negative, or invalid
COMPARE_AT_PRICE_LOWER_THAN_PRICE	Critical	Compare-at price is lower than active price
VERY_HIGH_DISCOUNT	Warning	Discount is unusually high
MISSING_SKU	Info	Variant does not have a SKU
DEFAULT_VARIANT_TITLE	Info	Variant uses Shopify default title

⸻

Error Format

Most errors return:

{
  "error": "Short error title",
  "message": "Detailed error message"
}

Example:

{
  "error": "Failed to fetch Shopify products",
  "message": "Shopify API request failed with status 401"
}