export interface JwtUser {
  id: string;
  email: string;
  storeId: string;
}

export interface RequestWithUser {
  user?: JwtUser;
}
