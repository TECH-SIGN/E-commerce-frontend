import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0
  },
  reducers: {
    addToCart: (state, action) => {
      const { id, productId, quantity, product, price, variant } = action.payload;
      console.log('🛒 addToCart called with:', action.payload);

      // Always use the given productId (or id) directly
      const itemId = id || productId;

      const existingItem = state.items.find(item => item.id === itemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        console.log('🛒 Updated existing item quantity:', existingItem.quantity);
      } else {
        state.items.push({
          id: itemId,           // keep as clean productId
          productId,            // clean productId only
          quantity,
          product,
          price: price ?? variant?.price ?? product?.price,
          variant: variant ? {
            id: variant.id,
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            price: variant.price,
          } : undefined,
        });
        console.log('🛒 Added new item to cart');
      }

      // Update total
      state.total = state.items.reduce(
        (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
        0
      );
      console.log('🛒 Cart total updated:', state.total);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.id === productId || item.productId === productId);
      if (item) {
        item.quantity = quantity;
        state.total = state.items.reduce(
          (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
          0
        );
      }
    },

    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId && item.productId !== productId);
      state.total = state.items.reduce(
        (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
        0
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },

    setCart: (state, action) => {
      const { items, total } = action.payload;
      state.items = items || [];
      state.total = total || 0;
      console.log('🛒 Cart state set from backend:', { items: state.items, total: state.total });
    }
  }
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;
