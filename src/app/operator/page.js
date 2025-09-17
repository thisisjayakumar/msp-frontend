"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";

export default function OperatorLoginPage() {
  const handleOperatorLogin = async (loginData) => {
    try {
      // Operator-specific login logic
      console.log("Operator login attempt:", loginData);
      
      // Here you would make an API call to your operator authentication endpoint
      // Example: await operatorAuthAPI.login(loginData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful login, redirect to operator dashboard
      window?.location?.replace('/operator/dashboard');
      
    } catch (error) {
      console.error("Operator login failed:", error);
      throw new Error("Invalid operator credentials");
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
