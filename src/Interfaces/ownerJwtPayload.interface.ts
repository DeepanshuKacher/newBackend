import { UserType } from "../auth/dto";

interface JwtPayload {
  userType: UserType;
  userId: string;
}

export interface JwtPayload_restaurantId extends JwtPayload {
  restaurantId: string;
}
