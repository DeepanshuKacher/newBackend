enum Size {
  Large = "large",
  Medium = "medium",
  Small = "small",
}

interface CartItem {
  dishId: string;
  orderId: string;
  tableNumber: number;
  tableSectionId: string;
  user_description?: string;
  orderedBy: string;
  size: Size;
  fullQuantity: number;
  halfQuantity: number;
  chefAssign?: string;
  completed?: string;
  createdAt: number;
  sessionId: string;
  restaurantId: string;
}

interface CartItemRedisReturn {
  dishId: string;
  orderId: string;
  tableNumber: string;
  tableSectionId: string;
  user_description?: string;
  orderedBy: string;
  size: Size;
  fullQuantity: string;
  halfQuantity: string;
  chefAssign?: string;
  completed?: string;
  createdAt: string;
  sessionId: string;
  restaurantId: string;
}

interface Order extends CartItem {
  kotId: string;
}

interface OrderReturnFromRedis extends CartItemRedisReturn {
  kotId: string;
}

export { Order, CartItem, CartItemRedisReturn, OrderReturnFromRedis };
