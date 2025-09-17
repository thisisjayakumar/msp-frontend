"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";

export default function SupervisorLoginPage() {
  const handleSupervisorLogin = async (loginData) => {
    try {
      // Supervisor-specific login logic
      console.log("Supervisor login attempt:", loginData);
      
      // Here you would make an API call to your supervisor authentication endpoint
      // Example: await supervisorAuthAPI.login(loginData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful login, redirect to supervisor dashboard
      window?.location?.replace('/supervisor/dashboard');
      
    } catch (error) {
      console.error("Supervisor login failed:", error);
      throw new Error("Invalid supervisor credentials");
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
