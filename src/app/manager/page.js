"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";

export default function ManagerLoginPage() {
  const handleManagerLogin = async (loginData) => {
    try {
      // Manager-specific login logic
      console.log("Manager login attempt:", loginData);
      
      // Here you would make an API call to your manager authentication endpoint
      // Example: await managerAuthAPI.login(loginData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful login, redirect to manager dashboard
      window?.location?.replace('/manager/dashboard');
      
    } catch (error) {
      console.error("Manager login failed:", error);
      throw new Error("Invalid manager credentials");
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
