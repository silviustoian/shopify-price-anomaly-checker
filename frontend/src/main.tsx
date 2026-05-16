import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "@shopify/polaris";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@shopify/polaris/build/esm/styles.css";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider i18n={{}}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AppProvider>
  </React.StrictMode>
);