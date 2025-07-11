import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { User } from '../../models/user.model';
import { UserRole, hasRolePermission } from '../../models/user-role.enum';

/**
 * Enumeração das permissões disponíveis no sistema
 */
export enum Permission {
  // Permissões públicas (sem autenticação)
  VIEW_POKEMON_LIST = 'view_pokemon_list',
  VIEW_POKEMON_DETAILS = 'view_pokemon_details',
  USE_SEARCH_FILTERS = 'use_search_filters',
  VIEW_RANKING = 'view_ranking',

  // Permissões de usuário autenticado
  CAPTURE_POKEMON = 'capture_pokemon',
  MANAGE_PERSONAL_COLLECTION = 'manage_personal_collection',
  VIEW_CAPTURED_POKEMON = 'view_captured_pokemon',
  UPDATE_PROFILE = 'update_profile',
  TRACK_VIEWING_PROGRESS = 'track_viewing_progress',

  // Permissões administrativas
  ADD_POKEMON = 'add_pokemon',
  EDIT_POKEMON = 'edit_pokemon',
  DELETE_POKEMON = 'delete_pokemon',
  MANAGE_USERS = 'manage_users',
  ACCESS_ADMIN_DASHBOARD = 'access_admin_dashboard',
  MANAGE_USER_ROLES = 'manage_user_roles'
}

/**
 * Permissões base para visitantes
 */
const VISITOR_PERMISSIONS = [
  Permission.VIEW_POKEMON_LIST,
  Permission.VIEW_POKEMON_DETAILS,
  Permission.USE_SEARCH_FILTERS,
  Permission.VIEW_RANKING
];

/**
 * Permissões para usuários autenticados
 */
const USER_PERMISSIONS = [
  ...VISITOR_PERMISSIONS,
  Permission.CAPTURE_POKEMON,
  Permission.MANAGE_PERSONAL_COLLECTION,
  Permission.VIEW_CAPTURED_POKEMON,
  Permission.UPDATE_PROFILE,
  Permission.TRACK_VIEWING_PROGRESS
];

/**
 * Permissões para administradores
 */
const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  Permission.ADD_POKEMON,
  Permission.EDIT_POKEMON,
  Permission.DELETE_POKEMON,
  Permission.MANAGE_USERS,
  Permission.ACCESS_ADMIN_DASHBOARD,
  Permission.MANAGE_USER_ROLES
];

/**
 * Mapeamento de roles para suas permissões
 */
const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.VISITOR]: VISITOR_PERMISSIONS,
  [UserRole.USER]: USER_PERMISSIONS,
  [UserRole.ADMINISTRATOR]: ADMIN_PERMISSIONS
};

/**
 * Serviço de controle de acesso baseado em roles (RBAC)
 * Gerencia permissões e controle de acesso para diferentes funcionalidades
 */
@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {
    // Observa mudanças no estado de autenticação
    this.authService.getAuthState().subscribe(isAuth => {
      this.isAuthenticated$.next(isAuth);
    });

    // Observa mudanças no usuário atual
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser$.next(user);
    });
  }

  /**
   * Verifica se o usuário atual tem uma permissão específica
   * @param permission Permissão a ser verificada
   * @returns Observable<boolean> indicando se o usuário tem a permissão
   */
  hasPermission(permission: Permission): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        if (!user) {
          // Usuário não autenticado - apenas permissões públicas
          return RolePermissions[UserRole.VISITOR].includes(permission);
        }

        const userPermissions = RolePermissions[user.role] || [];
        return userPermissions.includes(permission);
      })
    );
  }

  /**
   * Verifica se o usuário atual tem um role específico ou superior
   * @param requiredRole Role mínimo necessário
   * @returns Observable<boolean> indicando se o usuário tem o role necessário
   */
  hasRole(requiredRole: UserRole): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => {
        if (!user) {
          return requiredRole === UserRole.VISITOR;
        }

        return hasRolePermission(user.role, requiredRole);
      })
    );
  }

  /**
   * Verifica se o usuário atual é administrador
   * @returns Observable<boolean> indicando se o usuário é admin
   */
  isAdmin(): Observable<boolean> {
    return this.hasRole(UserRole.ADMINISTRATOR);
  }

  /**
   * Verifica se o usuário atual é um usuário autenticado (não visitante)
   * @returns Observable<boolean> indicando se o usuário está autenticado
   */
  isAuthenticatedUser(): Observable<boolean> {
    return this.hasRole(UserRole.USER);
  }

  /**
   * Verifica se o usuário pode gerenciar Pokemon (adicionar, editar, deletar)
   * @returns Observable<boolean> indicando se o usuário pode gerenciar Pokemon
   */
  canManagePokemon(): Observable<boolean> {
    return combineLatest([
      this.hasPermission(Permission.ADD_POKEMON),
      this.hasPermission(Permission.EDIT_POKEMON),
      this.hasPermission(Permission.DELETE_POKEMON)
    ]).pipe(
      map(([canAdd, canEdit, canDelete]) => canAdd || canEdit || canDelete)
    );
  }

  /**
   * Verifica se o usuário pode capturar Pokemon
   * @returns Observable<boolean> indicando se o usuário pode capturar Pokemon
   */
  canCapturePokemon(): Observable<boolean> {
    return this.hasPermission(Permission.CAPTURE_POKEMON);
  }

  /**
   * Verifica se o usuário pode acessar funcionalidades administrativas
   * @returns Observable<boolean> indicando se o usuário pode acessar admin
   */
  canAccessAdmin(): Observable<boolean> {
    return this.hasPermission(Permission.ACCESS_ADMIN_DASHBOARD);
  }

  /**
   * Obtém o role do usuário atual
   * @returns Observable<UserRole | null> role do usuário ou null se não autenticado
   */
  getCurrentUserRole(): Observable<UserRole | null> {
    return this.currentUser$.pipe(
      map(user => user?.role || null)
    );
  }

  /**
   * Obtém todas as permissões do usuário atual
   * @returns Observable<Permission[]> lista de permissões do usuário
   */
  getCurrentUserPermissions(): Observable<Permission[]> {
    return this.currentUser$.pipe(
      map(user => {
        if (!user) {
          return RolePermissions[UserRole.VISITOR];
        }

        return RolePermissions[user.role] || [];
      })
    );
  }

  /**
   * Verifica se o usuário atual pode executar múltiplas permissões
   * @param permissions Lista de permissões a serem verificadas
   * @param requireAll Se true, requer todas as permissões. Se false, requer pelo menos uma
   * @returns Observable<boolean> resultado da verificação
   */
  hasMultiplePermissions(permissions: Permission[], requireAll: boolean = true): Observable<boolean> {
    const permissionChecks = permissions.map(permission => this.hasPermission(permission));

    return combineLatest(permissionChecks).pipe(
      map(results => {
        return requireAll ? results.every(result => result) : results.some(result => result);
      })
    );
  }

  /**
   * Obtém informações de debug sobre o estado atual do RBAC
   * @returns Observable com informações de debug
   */
  getDebugInfo(): Observable<any> {
    return combineLatest([
      this.currentUser$,
      this.isAuthenticated$,
      this.getCurrentUserRole(),
      this.getCurrentUserPermissions()
    ]).pipe(
      map(([user, isAuth, role, permissions]) => ({
        user,
        isAuthenticated: isAuth,
        role,
        permissions,
        timestamp: new Date().toISOString()
      }))
    );
  }
}
