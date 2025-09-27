"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";
import { roleAuthService } from "@/components/API_Service/role-auth";

export default function StoreManagerLoginPage() {
  const handleStoreManagerLogin = async (loginData) => {
    try {
      // Store Manager-specific login logic using actual backend API
      console.log("Store Manager login attempt:", loginData);
      
      // Use the actual backend authentication
      const response = await roleAuthService.storeManagerLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        // On successful login, redirect to store manager dashboard
        window?.location?.replace('/store_manager/dashboard');
      } else {
        throw new Error(response.error || "Login failed");
      }
      
    } catch (error) {
      console.error("Store Manager login failed:", error);
      throw new Error(error.message || "Invalid store manager credentials");
    }
  };

  return (
    <RoleLoginLayout 
      role="store_manager"
      onLogin={handleStoreManagerLogin}
      showForgotPassword={true}
    />
  );
}
