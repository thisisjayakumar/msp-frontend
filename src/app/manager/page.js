"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";
import { roleAuthService } from "@/components/API_Service/role-auth";

export default function ManagerLoginPage() {
  const handleManagerLogin = async (loginData) => {
    try {
      // Manager-specific login logic using actual backend API
      console.log("Manager login attempt:", loginData);
      
      // Use the actual backend authentication
      const response = await roleAuthService.managerLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        // On successful login, redirect to manager dashboard
        window?.location?.replace('/manager/dashboard');
      } else {
        throw new Error(response.error || "Login failed");
      }
      
    } catch (error) {
      console.error("Manager login failed:", error);
      throw new Error(error.message || "Invalid manager credentials");
    }
  };

  return (
    <RoleLoginLayout 
      role="manager"
      onLogin={handleManagerLogin}
      showForgotPassword={true}
    />
  );
}
