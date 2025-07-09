/**
 * Interface que representa um usuário autenticado.
 *
 */
export interface User {
  /** Identificador único do usuário */
  id: string;
  
  /** Nome completo do usuário */
  name: string;
  
  /** Primeiro nome do usuário (opcional) */
  firstName?: string;
  
  /** Endereço de e-mail do usuário */
  email: string;
  
  /** Nível/permissão do usuário (opcional) */
  level?: number;
  
  /** URL da imagem de avatar do usuário (opcional) */
  avatar?: string;
  
  /** Lista de papéis/permissões do usuário (opcional) */
  roles?: string[];
}