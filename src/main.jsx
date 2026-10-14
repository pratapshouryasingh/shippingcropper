import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

// Fallback key format so the app runs smoothly during local development if .env is missing
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xldmVyLWd1cHB5LTY5LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "Notice: VITE_CLERK_PUBLISHABLE_KEY is not defined in .env. Using fallback development key."
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);