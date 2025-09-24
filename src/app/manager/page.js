"use client";

import RoleLoginLayout from "@/components/CommonComponents/layout/RoleLoginLayout";

export default function ManagerLoginPage() {
  const handleManagerLogin = async (loginData) => {
    try {
      // Manager-specific login logic
      console.log("Manager login attempt:", loginData);
      
      // TODO: Replace with actual API call to backend authentication
      // For now, simulate authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful authentication response
      const mockAuthResponse = {
        access_token: 'mock_jwt_token_for_manager',
        refresh_token: 'mock_refresh_token',
        user: {
          id: 1,
          email: loginData.email,
          first_name: 'Manager',
          last_name: 'User',
          role: 'manager'
        }
      };
      
      // Store authentication data
      localStorage.setItem('authToken', mockAuthResponse.access_token);
      localStorage.setItem('refreshToken', mockAuthResponse.refresh_token);
      localStorage.setItem('userRole', 'manager');
      localStorage.setItem('userData', JSON.stringify(mockAuthResponse.user));
      
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
