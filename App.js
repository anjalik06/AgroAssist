import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigation/StackNavigator";
import { CartProvider } from "./context/CartContext";
import SplashScreen from "./screens/SplashScreen";
import { getToken, getRole } from "./services/authStorage";

export default function App() {

  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const checkLogin = async () => {
    const token = await getToken();

    if (token) {
      setIsLogged(true);
      const role = await getRole();
      setUserRole(role);
    } else {
      setIsLogged(false);
      setUserRole(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkLogin();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <StackNavigator
          isLogged={isLogged}
          setIsLogged={setIsLogged}
          userRole={userRole}
          setUserRole={setUserRole}
        />
      </NavigationContainer>
    </CartProvider>
  );
}