/**
 * Interface para usuário
 */
export interface User {
  id?: number;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para criação de usuário
 */
export interface CreateUser {
  username: string;
  email: string;
}

/**
 * Interface para atualização de usuário
 */
export interface UpdateUser {
  username?: string;
  email?: string;
}
