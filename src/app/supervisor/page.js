"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";
import { roleAuthService } from "@/components/API_Service/role-auth";

export default function SupervisorLoginPage() {
  const handleSupervisorLogin = async (loginData) => {
    try {
      // Supervisor-specific login logic using actual backend API
      console.log("Supervisor login attempt:", loginData);
      
      // Use the actual backend authentication
      const response = await roleAuthService.supervisorLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        // On successful login, redirect to supervisor dashboard
        window?.location?.replace('/supervisor/dashboard');
      } else {
        throw new Error(response.error || "Login failed");
      }
      
    } catch (error) {
      console.error("Supervisor login failed:", error);
      throw new Error(error.message || "Invalid supervisor credentials");
    }
  };

  return (
    <RoleLoginLayout 
      role="supervisor"
      onLogin={handleSupervisorLogin}
      showForgotPassword={true}
    />
  );
}
