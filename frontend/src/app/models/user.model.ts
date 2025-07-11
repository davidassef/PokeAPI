import { UserRole } from './user-role.enum';

/**
 * Interface que representa um usuário autenticado.
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

  /** Role/função do usuário no sistema */
  role: UserRole;

  /** Nível/permissão do usuário (opcional - mantido para compatibilidade) */
  level?: number;

  /** URL da imagem de avatar do usuário (opcional) */
  avatar?: string;

  /** Lista de papéis/permissões do usuário (opcional - mantido para compatibilidade) */
  roles?: string[];

  /** Pergunta de segurança para recuperação de senha */
  security_question?: string;

  /** Resposta da pergunta de segurança (apenas para registro/atualização) */
  security_answer?: string;

  /** Data de criação da conta */
  created_at?: string;

  /** Data da última atualização */
  updated_at?: string;
}