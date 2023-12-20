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
  sessionId: string;
  // createdAt: number;
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
  // createdAt: string;
  sessionId: string;
  restaurantId: string;
}

interface Order extends CartItem {
  kotId: string;
  createdAt: number;
  kotCount: number;
  printCount: number;

}

interface OrderReturnFromRedis extends CartItemRedisReturn {
  kotId: string;
  createdAt: string;
  kotCount: string;
  printCount: string;

}


interface RetreveKotJson {
  id: string;
  value: OrderReturnFromRedis
}

interface RetreveCartItemFromRedisIndex {
  id: string;
  value: CartItemRedisReturn
}

export { Order, CartItem, CartItemRedisReturn, OrderReturnFromRedis, RetreveKotJson, RetreveCartItemFromRedisIndex };
