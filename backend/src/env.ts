import "dotenv/config";

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: requiredEnv("DATABASE_URL"),
  shopifyShopDomain: process.env.SHOPIFY_SHOP_DOMAIN || "",
  shopifyAdminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "",
};

