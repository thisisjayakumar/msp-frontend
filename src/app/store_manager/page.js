"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";

export default function StoreManagerLoginPage() {
  const handleStoreManagerLogin = async (loginData) => {
    try {
      // Store Manager-specific login logic
      console.log("Store Manager login attempt:", loginData);
      
      // Here you would make an API call to your store manager authentication endpoint
      // Example: await storeManagerAuthAPI.login(loginData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // On successful login, redirect to store manager dashboard
      window?.location?.replace('/store_manager/dashboard');
      
    } catch (error) {
      console.error("Store Manager login failed:", error);
      throw new Error("Invalid store manager credentials");
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
