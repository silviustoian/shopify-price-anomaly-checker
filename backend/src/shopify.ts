import { env } from "./env.js";

type ShopifyGraphQlResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type ShopifyProductVariantNode = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
};

type ShopifyProductNode = {
  id: string;
  title: string;
  handle: string;
  status: string;
  featuredImage: {
    url: string;
  } | null;
  variants: {
    edges: Array<{
      node: ShopifyProductVariantNode;
    }>;
  };
};

type ShopifyProductsQueryData = {
  products: {
    edges: Array<{
      node: ShopifyProductNode;
    }>;
  };
};

export type ShopifyVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
  imageUrl: string | null;
  variants: ShopifyVariant[];
};

const PRODUCTS_QUERY = `
  query ProductsForPriceScan($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          status
          featuredImage {
            url
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
              }
            }
          }
        }
      }
    }
  }
`;

export const fetchShopifyProducts = async (): Promise<ShopifyProduct[]> => {
  if (!env.shopifyShopDomain || !env.shopifyAdminAccessToken) {
    throw new Error(
      "Shopify credentials are missing. Check SHOPIFY_SHOP_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN."
    );
  }

  const response = await fetch(
    `https://${env.shopifyShopDomain}/admin/api/2026-04/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.shopifyAdminAccessToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: {
          first: 50,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API request failed with status ${response.status}`);
  }

  const json =
    (await response.json()) as ShopifyGraphQlResponse<ShopifyProductsQueryData>;

  if (json.errors?.length) {
    const message = json.errors.map((error) => error.message).join(", ");
    throw new Error(`Shopify GraphQL error: ${message}`);
  }

  if (!json.data) {
    throw new Error("Shopify GraphQL response did not include data.");
  }

  return json.data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    status: node.status,
    imageUrl: node.featuredImage?.url ?? null,
    variants: node.variants.edges.map(({ node: variant }) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice
        ? Number(variant.compareAtPrice)
        : null,
    })),
  }));
};