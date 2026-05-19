import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Spinner,
  Text,
} from "@shopify/polaris";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  api,
  type IssueSeverity,
  type ScanDetails,
  type ScanIssue,
} from "./api";
import "./App.css";

type SeverityFilter = "ALL" | IssueSeverity;

type GroupedVariantIssue = {
  groupKey: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string | number | null;
  compareAtPrice: string | number | null;
  issues: ScanIssue[];
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMoney = (value: string | number | null) => {
  if (value === null) return "-";

  const numberValue = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(numberValue)) return "-";

  return `$${numberValue.toFixed(2)}`;
};

const getIssueLabel = (issueType: string) => {
  return issueType
    .split("_")
    .map((word) => word.toLowerCase())
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getIssueDescription = (issueType: string) => {
  const descriptions: Record<string, string> = {
    ZERO_OR_INVALID_PRICE:
      "This variant has a zero, negative, or invalid price. It can directly impact merchant revenue.",
    COMPARE_AT_PRICE_LOWER_THAN_PRICE:
      "The compare-at price is lower than the active price, so the discount setup may be incorrect.",
    VERY_HIGH_DISCOUNT:
      "The calculated discount is unusually high. It may be intentional, but should be reviewed.",
    MISSING_SKU:
      "The variant does not have a SKU. This can affect inventory tracking, fulfillment, and reporting.",
    DEFAULT_VARIANT_TITLE:
      "The variant uses Shopify’s default title. This can be unclear for store operations.",
  };

  return descriptions[issueType] || "This product variant needs review.";
};

const getGroupClassName = (issues: ScanIssue[]) => {
  const hasCritical = issues.some((issue) => issue.severity === "CRITICAL");
  const hasWarning = issues.some((issue) => issue.severity === "WARNING");

  if (hasCritical) return "issue-card issue-card--critical";
  if (hasWarning) return "issue-card issue-card--warning";

  return "issue-card issue-card--info";
};

const IssueSeverityBadge = ({ severity }: { severity: IssueSeverity }) => {
  if (severity === "CRITICAL") return <Badge tone="critical">Critical</Badge>;
  if (severity === "WARNING") return <Badge tone="warning">Warning</Badge>;

  return <Badge tone="info">Info</Badge>;
};

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "blue" | "purple" | "red" | "orange";
}) => {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <Text as="p" tone="subdued">
        {label}
      </Text>
      <Text as="h2" variant="headingXl">
        {value}
      </Text>
    </div>
  );
};

const IssueGroupCard = ({ group }: { group: GroupedVariantIssue }) => {
  return (
    <div className={getGroupClassName(group.issues)}>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="start" gap="300">
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              {group.productTitle}
            </Text>

            <Text as="p" tone="subdued">
              Variant: {group.variantTitle}
            </Text>
          </BlockStack>

          <Badge>{`${group.issues.length} issues`}</Badge>
        </InlineStack>

        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="300">
          <div className="mini-metric">
            <Text as="p" tone="subdued">
              Price
            </Text>
            <Text as="p" fontWeight="semibold">
              {formatMoney(group.price)}
            </Text>
          </div>

          <div className="mini-metric">
            <Text as="p" tone="subdued">
              Compare-at
            </Text>
            <Text as="p" fontWeight="semibold">
              {formatMoney(group.compareAtPrice)}
            </Text>
          </div>

          <div className="mini-metric">
            <Text as="p" tone="subdued">
              SKU
            </Text>
            <Text as="p" fontWeight="semibold">
              {group.sku || "Missing"}
            </Text>
          </div>
        </InlineGrid>

        <Divider />

        <BlockStack gap="300">
          {group.issues.map((issue) => (
            <div key={issue.id} className="issue-row">
              <InlineStack align="space-between" blockAlign="start" gap="300">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <IssueSeverityBadge severity={issue.severity} />

                    <Text as="p" fontWeight="semibold">
                      {getIssueLabel(issue.issueType)}
                    </Text>
                  </InlineStack>

                  <Text as="p" tone="subdued">
                    {getIssueDescription(issue.issueType)}
                  </Text>
                </BlockStack>
              </InlineStack>

              <BlockStack gap="100">
                <Text as="p" fontWeight="semibold">
                  Recommended action
                </Text>
                <Text as="p" tone="subdued">
                  {issue.recommendation}
                </Text>
              </BlockStack>
            </div>
          ))}
        </BlockStack>
      </BlockStack>
    </div>
  );
};

function App() {
  const queryClient = useQueryClient();

  const [selectedScan, setSelectedScan] = useState<ScanDetails | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");

  const scansQuery = useQuery({
    queryKey: ["scans"],
    queryFn: api.getScans,
  });

  const runScanMutation = useMutation({
    mutationFn: api.runScan,
    onSuccess: (scan) => {
      setSelectedScan(scan);
      setSeverityFilter("ALL");
      queryClient.invalidateQueries({ queryKey: ["scans"] });
    },
  });

  const groupedIssues = useMemo(() => {
    if (!selectedScan) return [];

    const issues =
      severityFilter === "ALL"
        ? selectedScan.issues
        : selectedScan.issues.filter(
            (issue) => issue.severity === severityFilter
          );

    const groups = new Map<string, GroupedVariantIssue>();

    for (const issue of issues) {
      const groupKey = `${issue.shopifyProductId}-${issue.shopifyVariantId}`;
      const existingGroup = groups.get(groupKey);

      if (existingGroup) {
        existingGroup.issues.push(issue);
      } else {
        groups.set(groupKey, {
          groupKey,
          productTitle: issue.productTitle,
          variantTitle: issue.variantTitle,
          sku: issue.sku,
          price: issue.price,
          compareAtPrice: issue.compareAtPrice,
          issues: [issue],
        });
      }
    }

    return Array.from(groups.values());
  }, [selectedScan, severityFilter]);

  const loadScanDetails = async (scanId: string) => {
    const details = await api.getScanDetails(scanId);
    setSelectedScan(details);
    setSeverityFilter("ALL");
  };

  return (
    <div className="app-shell">
      <div className="hero">
        <div className="hero__content">
          <Badge tone="info">Shopify GraphQL Admin API demo</Badge>

          <h1>Price Anomaly Checker</h1>

          <p>
            Scan Shopify product variants for pricing issues, save scan history
            in PostgreSQL, and review merchant-friendly recommendations.
          </p>

          <div className="hero__actions">
            <Button
              variant="primary"
              loading={runScanMutation.isPending}
              onClick={() => runScanMutation.mutate()}
            >
              Run price scan
            </Button>

            {selectedScan ? (
              <span className="hero__meta">
                Last scan: {formatDate(selectedScan.createdAt)}
              </span>
            ) : (
              <span className="hero__meta">Connected to Shopify dev store</span>
            )}
          </div>
        </div>

        <div className="hero__panel">
          <Text as="p" tone="subdued">
            Current scan
          </Text>

          <Text as="h2" variant="heading2xl">
            {selectedScan ? `${selectedScan.issuesFound}` : "-"}
          </Text>

          <Text as="p" tone="subdued">
            total issues detected
          </Text>
        </div>
      </div>

      <Page fullWidth>
        <BlockStack gap="500">
          {runScanMutation.isError ? (
            <Banner tone="critical" title="Scan failed">
              <p>
                {runScanMutation.error instanceof Error
                  ? runScanMutation.error.message
                  : "Unknown error"}
              </p>
            </Banner>
          ) : null}

          {runScanMutation.isPending ? (
            <Card>
              <InlineStack gap="300" align="center">
                <Spinner size="small" />

                <Text as="p">
                  Fetching Shopify products, analyzing price data, and saving
                  the report...
                </Text>
              </InlineStack>
            </Card>
          ) : null}

          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <StatCard
              label="Products scanned"
              value={selectedScan?.productsScanned ?? "-"}
              tone="blue"
            />

            <StatCard
              label="Variants scanned"
              value={selectedScan?.variantsScanned ?? "-"}
              tone="purple"
            />

            <StatCard
              label="Critical issues"
              value={selectedScan?.criticalCount ?? "-"}
              tone="red"
            />

            <StatCard
              label="Warnings"
              value={selectedScan?.warningCount ?? "-"}
              tone="orange"
            />
          </InlineGrid>

          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingLg">
                        Pricing issues
                      </Text>

                      <Text as="p" tone="subdued">
                        Filter by severity and review recommended merchant
                        actions.
                      </Text>
                    </BlockStack>

                    {selectedScan ? (
                      <Badge>{`${selectedScan.issuesFound} total issues`}</Badge>
                    ) : null}
                  </InlineStack>

                  {selectedScan ? (
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        pressed={severityFilter === "ALL"}
                        onClick={() => setSeverityFilter("ALL")}
                      >
                        All
                      </Button>

                      <Button
                        size="slim"
                        pressed={severityFilter === "CRITICAL"}
                        onClick={() => setSeverityFilter("CRITICAL")}
                      >
                        Critical
                      </Button>

                      <Button
                        size="slim"
                        pressed={severityFilter === "WARNING"}
                        onClick={() => setSeverityFilter("WARNING")}
                      >
                        Warnings
                      </Button>

                      <Button
                        size="slim"
                        pressed={severityFilter === "INFO"}
                        onClick={() => setSeverityFilter("INFO")}
                      >
                        Info
                      </Button>
                    </InlineStack>
                  ) : null}

                  {!selectedScan ? (
                    <div className="empty-state">
                      <Text as="h3" variant="headingMd">
                        No scan loaded yet
                      </Text>

                      <Text as="p" tone="subdued">
                        Run a price scan to analyze real products from your
                        Shopify development store.
                      </Text>
                    </div>
                  ) : groupedIssues.length > 0 ? (
                    <BlockStack gap="300">
                      {groupedIssues.map((group) => (
                        <IssueGroupCard
                          key={group.groupKey}
                          group={group}
                        />
                      ))}
                    </BlockStack>
                  ) : (
                    <Banner tone="success" title="No issues in this filter">
                      <p>
                        There are no issues matching the selected severity
                        filter.
                      </p>
                    </Banner>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Scan history
                    </Text>

                    {scansQuery.isLoading ? (
                      <InlineStack gap="300" align="center">
                        <Spinner size="small" />

                        <Text as="p">Loading history...</Text>
                      </InlineStack>
                    ) : null}

                    {scansQuery.isError ? (
                      <Banner tone="critical" title="Could not load history">
                        <p>
                          {scansQuery.error instanceof Error
                            ? scansQuery.error.message
                            : "Unknown error"}
                        </p>
                      </Banner>
                    ) : null}

                    {scansQuery.data?.length ? (
                      <BlockStack gap="300">
                        {scansQuery.data.slice(0, 8).map((scan) => (
                          <div
                            key={scan.id}
                            className={
                              selectedScan?.id === scan.id
                                ? "history-card history-card--active"
                                : "history-card"
                            }
                          >
                            <InlineStack align="space-between">
                              <Text as="p" fontWeight="semibold">
                                {formatDate(scan.createdAt)}
                              </Text>

                              <Badge>{`${scan.issuesFound} issues`}</Badge>
                            </InlineStack>

                            <Text as="p" tone="subdued">
                              {scan.productsScanned} products ·{" "}
                              {scan.variantsScanned} variants
                            </Text>

                            <InlineStack gap="200">
                              <Badge tone="critical">
                                {`${scan.criticalCount} critical`}
                              </Badge>

                              <Badge tone="warning">
                                {`${scan.warningCount} warnings`}
                              </Badge>

                              <Badge tone="info">
                                {`${scan.infoCount} info`}
                              </Badge>
                            </InlineStack>

                            <Button
                              size="slim"
                              onClick={() => loadScanDetails(scan.id)}
                            >
                              {selectedScan?.id === scan.id
                                ? "Selected"
                                : "View scan"}
                            </Button>
                          </div>
                        ))}
                      </BlockStack>
                    ) : !scansQuery.isLoading ? (
                      <Text as="p" tone="subdued">
                        No scans saved yet.
                      </Text>
                    ) : null}
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Checks included
                    </Text>

                    <div className="check-list">
                      <span>Zero or invalid prices</span>
                      <span>Wrong compare-at prices</span>
                      <span>Very high discounts</span>
                      <span>Missing SKUs</span>
                      <span>Generic variant titles</span>
                    </div>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    </div>
  );
}

export default App;