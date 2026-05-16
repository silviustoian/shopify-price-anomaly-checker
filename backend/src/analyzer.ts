import type { ShopifyProduct } from "./shopify.js";

export type IssueSeverity = "CRITICAL" | "WARNING" | "INFO";

export type PriceAnomalyIssue = {
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: number | null;
  compareAtPrice: number | null;
  issueType: string;
  severity: IssueSeverity;
  recommendation: string;
};

export type PriceScanResult = {
  productsScanned: number;
  variantsScanned: number;
  issues: PriceAnomalyIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
};

const HIGH_DISCOUNT_THRESHOLD = 70;

const getDiscountPercentage = (price: number, compareAtPrice: number): number => {
  const discount = ((compareAtPrice - price) / compareAtPrice) * 100;

  return Math.round(discount);
};

const createIssue = (
  product: ShopifyProduct,
  variant: ShopifyProduct["variants"][number],
  issueType: string,
  severity: IssueSeverity,
  recommendation: string
): PriceAnomalyIssue => {
  return {
    shopifyProductId: product.id,
    shopifyVariantId: variant.id,
    productTitle: product.title,
    variantTitle: variant.title,
    sku: variant.sku,
    price: Number.isFinite(variant.price) ? variant.price : null,
    compareAtPrice: variant.compareAtPrice,
    issueType,
    severity,
    recommendation,
  };
};

export const analyzePriceAnomalies = (
  products: ShopifyProduct[]
): PriceScanResult => {
  const issues: PriceAnomalyIssue[] = [];

  let variantsScanned = 0;

  for (const product of products) {
    for (const variant of product.variants) {
      variantsScanned += 1;

      if (!Number.isFinite(variant.price) || variant.price <= 0) {
        issues.push(
          createIssue(
            product,
            variant,
            "ZERO_OR_INVALID_PRICE",
            "CRITICAL",
            "Set a valid variant price before making this product available for sale."
          )
        );
      }

      if (
        variant.compareAtPrice !== null &&
        variant.compareAtPrice < variant.price
      ) {
        issues.push(
          createIssue(
            product,
            variant,
            "COMPARE_AT_PRICE_LOWER_THAN_PRICE",
            "CRITICAL",
            "Compare-at price should usually be higher than the active price. Review the discount configuration."
          )
        );
      }

      if (
        variant.compareAtPrice !== null &&
        variant.compareAtPrice > 0 &&
        variant.price > 0 &&
        variant.compareAtPrice > variant.price
      ) {
        const discountPercentage = getDiscountPercentage(
          variant.price,
          variant.compareAtPrice
        );

        if (discountPercentage >= HIGH_DISCOUNT_THRESHOLD) {
          issues.push(
            createIssue(
              product,
              variant,
              "VERY_HIGH_DISCOUNT",
              "WARNING",
              `This variant has an unusually high discount of ${discountPercentage}%. Confirm this is intentional.`
            )
          );
        }
      }

      if (!variant.sku || variant.sku.trim().length === 0) {
        issues.push(
          createIssue(
            product,
            variant,
            "MISSING_SKU",
            "INFO",
            "Add a SKU to improve inventory tracking, fulfillment and reporting consistency."
          )
        );
      }

      if (variant.title.toLowerCase() === "default title") {
        issues.push(
          createIssue(
            product,
            variant,
            "DEFAULT_VARIANT_TITLE",
            "INFO",
            "Consider using explicit variant titles when products have multiple options or operational differences."
          )
        );
      }
    }
  }

  const criticalCount = issues.filter(
    (issue) => issue.severity === "CRITICAL"
  ).length;

  const warningCount = issues.filter(
    (issue) => issue.severity === "WARNING"
  ).length;

  const infoCount = issues.filter((issue) => issue.severity === "INFO").length;

  return {
    productsScanned: products.length,
    variantsScanned,
    issues,
    criticalCount,
    warningCount,
    infoCount,
  };
};