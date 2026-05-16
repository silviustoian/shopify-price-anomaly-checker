import { Router } from "express";
import { IssueSeverity } from "@prisma/client";
import { prisma } from "./db.js";
import { analyzePriceAnomalies } from "./analyzer.js";
import { fetchShopifyProducts } from "./shopify.js";
import { env } from "./env.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "shopify-price-anomaly-checker-api",
    timestamp: new Date().toISOString(),
  });
});

router.get("/shopify/products", async (_req, res) => {
  try {
    const products = await fetchShopifyProducts();

    res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch Shopify products",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/shopify/analyze-preview", async (_req, res) => {
  try {
    const products = await fetchShopifyProducts();
    const result = analyzePriceAnomalies(products);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to analyze Shopify products",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/scans/run", async (_req, res) => {
  try {
    const products = await fetchShopifyProducts();
    const result = analyzePriceAnomalies(products);

    const savedScan = await prisma.scan.create({
      data: {
        shopDomain: env.shopifyShopDomain,
        productsScanned: result.productsScanned,
        variantsScanned: result.variantsScanned,
        issuesFound: result.issues.length,
        criticalCount: result.criticalCount,
        warningCount: result.warningCount,
        infoCount: result.infoCount,
        issues: {
          create: result.issues.map((issue) => ({
            shopifyProductId: issue.shopifyProductId,
            shopifyVariantId: issue.shopifyVariantId,
            productTitle: issue.productTitle,
            variantTitle: issue.variantTitle,
            sku: issue.sku,
            price: issue.price,
            compareAtPrice: issue.compareAtPrice,
            issueType: issue.issueType,
            severity: issue.severity as IssueSeverity,
            recommendation: issue.recommendation,
          })),
        },
      },
      include: {
        issues: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    res.status(201).json(savedScan);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to run price scan",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/scans", async (_req, res) => {
  try {
    const scans = await prisma.scan.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        shopDomain: true,
        productsScanned: true,
        variantsScanned: true,
        issuesFound: true,
        criticalCount: true,
        warningCount: true,
        infoCount: true,
        createdAt: true,
      },
    });

    res.json(scans);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch scan history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/scans/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scan = await prisma.scan.findUnique({
      where: {
        id,
      },
      include: {
        issues: {
          orderBy: [
            {
              severity: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
      },
    });

    if (!scan) {
      res.status(404).json({
        error: "Scan not found",
      });
      return;
    }

    res.json(scan);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch scan details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});