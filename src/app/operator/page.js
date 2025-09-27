"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";
import { roleAuthService } from "@/components/API_Service/role-auth";

export default function OperatorLoginPage() {
  const handleOperatorLogin = async (loginData) => {
    try {
      // Operator-specific login logic using actual backend API
      console.log("Operator login attempt:", loginData);
      
      // Use the actual backend authentication
      const response = await roleAuthService.operatorLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        // On successful login, redirect to operator dashboard
        window?.location?.replace('/operator/dashboard');
      } else {
        throw new Error(response.error || "Login failed");
      }
      
    } catch (error) {
      console.error("Operator login failed:", error);
      throw new Error(error.message || "Invalid operator credentials");
    }
  };

  return (
    <RoleLoginLayout 
      role="operator"
      onLogin={handleOperatorLogin}
      showForgotPassword={true}
    />
  );
}
