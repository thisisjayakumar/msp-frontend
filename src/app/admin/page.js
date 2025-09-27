"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";
import { roleAuthService } from "@/components/API_Service/role-auth";

export default function AdminLoginPage() {
  const handleAdminLogin = async (loginData) => {
    try {
      // Admin-specific login logic using actual backend API
      console.log("Admin login attempt:", loginData);
      
      // Use the actual backend authentication
      const response = await roleAuthService.adminLogin({
        email: loginData.email,
        password: loginData.password
      });
      
      if (response.success) {
        // On successful login, redirect to admin dashboard
        window?.location?.replace('/admin/dashboard');
      } else {
        throw new Error(response.error || "Login failed");
      }
      
    } catch (error) {
      console.error("Admin login failed:", error);
      throw new Error(error.message || "Invalid admin credentials");
    }
  };

  return (
    <RoleLoginLayout 
      role="admin"
      onLogin={handleAdminLogin}
      showForgotPassword={true}
    />
  );
}
