/**
 * Enumeração dos roles/funções de usuário no sistema PokeAPIApp
 */
export enum UserRole {
  /** Usuário visitante/comum - acesso básico */
  VISITOR = 'visitor',

  /** Usuário comum/registrado - acesso a funcionalidades pessoais */
  USER = 'user',

  /** Administrador - acesso completo ao sistema */
  ADMINISTRATOR = 'administrator'
}

/**
 * Mapeamento de roles para chaves de tradução i18n
 */
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.VISITOR]: 'admin.roles.visitor',
  [UserRole.USER]: 'admin.roles.user',
  [UserRole.ADMINISTRATOR]: 'admin.roles.administrator'
};

/**
 * Hierarquia de permissões dos roles (do menor para o maior)
 */
export const RoleHierarchy: UserRole[] = [
  UserRole.VISITOR,
  UserRole.USER,
  UserRole.ADMINISTRATOR
];

/**
 * Verifica se um role tem permissão igual ou superior a outro
 * @param userRole Role do usuário
 * @param requiredRole Role mínimo necessário
 * @returns true se o usuário tem permissão suficiente
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = RoleHierarchy.indexOf(userRole);
  const requiredLevel = RoleHierarchy.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

/**
 * Obtém o role padrão para novos usuários
 */
export function getDefaultRole(): UserRole {
  return UserRole.USER;
}

/**
 * Verifica se um role é válido
 * @param role String do role a ser verificado
 * @returns true se o role é válido
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
