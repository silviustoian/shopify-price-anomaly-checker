const API_BASE_URL = "http://localhost:4000/api";

export type IssueSeverity = "CRITICAL" | "WARNING" | "INFO";

export type ScanIssue = {
  id: string;
  scanId: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string | number | null;
  compareAtPrice: string | number | null;
  issueType: string;
  severity: IssueSeverity;
  recommendation: string;
  createdAt: string;
};

export type Scan = {
  id: string;
  shopDomain: string;
  productsScanned: number;
  variantsScanned: number;
  issuesFound: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  createdAt: string;
};

export type ScanDetails = Scan & {
  issues: ScanIssue[];
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.message ||
        errorBody?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
};

export const api = {
  runScan: () =>
    request<ScanDetails>("/scans/run", {
      method: "POST",
    }),

  getScans: () => request<Scan[]>("/scans"),

  getScanDetails: (id: string) => request<ScanDetails>(`/scans/${id}`),
};