import React, { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {

const [cart, setCart] = useState([]);

const addToCart = (product) => {
  setCart(prevCart => {
    const existing = prevCart.find(item => item.id === product.id);
    if (existing) {
      return prevCart.map(item =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      );
    }
    return [...prevCart, { ...product, qty: 1 }];
  });
};

const increaseQty = (id) => {
  setCart(prev => prev.map(item =>
    item.id === id ? { ...item, qty: item.qty + 1 } : item
  ));
};

const decreaseQty = (id) => {
  setCart(prev =>
    prev.map(item =>
      item.id === id ? { ...item, qty: item.qty - 1 } : item
    ).filter(item => item.qty > 0)
  );
};

const clearCart = () => {
  setCart([]);
};

return (
  <CartContext.Provider value={{ cart, addToCart, increaseQty, decreaseQty, clearCart }}>
    {children}
  </CartContext.Provider>
);

};
