import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DeliveryProviderStatus {
  isProvider: boolean;
  status: "not_applied" | "pending" | "verified" | "rejected" | "suspended";
  providerId?: string;
  loading: boolean;
}

export function useDeliveryProvider(): DeliveryProviderStatus {
  const [providerStatus, setProviderStatus] = useState<DeliveryProviderStatus>({
    isProvider: false,
    status: "not_applied",
    loading: true,
  });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProviderStatus({
        isProvider: false,
        status: "not_applied",
        loading: false,
      });
      return;
    }

    // Check if user is a delivery provider
    const checkProviderStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.warn("No auth token found for delivery provider check");
          setProviderStatus({
            isProvider: false,
            status: "not_applied",
            loading: false,
          });
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/delivery/providers/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const provider = await response.json();

          // Validate the provider data structure
          if (!provider || typeof provider !== 'object') {
            console.error("Invalid provider data structure:", provider);
            throw new Error("Invalid provider data received from server");
          }

          // Validate the verification status
          const validStatuses = ["pending", "verified", "rejected", "suspended"];
          const status = provider.verificationStatus && validStatuses.includes(provider.verificationStatus)
            ? provider.verificationStatus
            : "pending";

          // Validate provider ID
          if (!provider.id) {
            console.error("Provider data missing ID:", provider);
            throw new Error("Provider data is missing required ID field");
          }

          setProviderStatus({
            isProvider: true,
            status: status as "pending" | "verified" | "rejected" | "suspended",
            providerId: String(provider.id), // Ensure it's a string
            loading: false,
          });
        } else if (response.status === 404) {
          // User is not a delivery provider
          setProviderStatus({
            isProvider: false,
            status: "not_applied",
            loading: false,
          });
        } else if (response.status === 401) {
          // Unauthorized - token might be invalid
          console.warn("Unauthorized access to delivery provider profile");
          localStorage.removeItem("token"); // Clear invalid token
          setProviderStatus({
            isProvider: false,
            status: "not_applied",
            loading: false,
          });
        } else if (response.status === 500) {
          // Server error
          console.error("Server error when fetching delivery provider profile");
          const errorData = await response.json().catch(() => ({}));
          console.error("Server error details:", errorData);
          throw new Error(`Server error: ${errorData.error || 'Unknown server error'}`);
        } else {
          // Other error status codes
          console.error(`Unexpected response status: ${response.status}`);
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response data:", errorData);
          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error checking delivery provider status:", error);

        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn("Delivery provider status check timed out");
          } else if (error.message.includes('Failed to fetch')) {
            console.warn("Network error when checking delivery provider status");
          } else {
            console.error("Error details:", {
              message: error.message,
              stack: error.stack,
              name: error.name,
            });
          }
        } else {
          console.error("Unknown error type:", error);
        }

        setProviderStatus({
          isProvider: false,
          status: "not_applied",
          loading: false,
        });
      }
    };

    checkProviderStatus();
  }, [user, isAuthenticated]);

  return providerStatus;
}
