import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty favorites', () => {
    expect(service.getFavorites()).toEqual([]);
  });

  it('should add pokemon to favorites', () => {
    const pokemonId = 1;
    service.addToFavorites(pokemonId);
    expect(service.isFavorite(pokemonId)).toBeTruthy();
  });

  it('should remove pokemon from favorites', () => {
    const pokemonId = 1;
    service.addToFavorites(pokemonId);
    service.removeFromFavorites(pokemonId);
    expect(service.isFavorite(pokemonId)).toBeFalsy();
  });

  it('should toggle pokemon favorite status', () => {
    const pokemonId = 1;
    
    // Initially not favorite
    expect(service.isFavorite(pokemonId)).toBeFalsy();
    
    // Toggle to favorite
    service.toggleFavorite(pokemonId);
    expect(service.isFavorite(pokemonId)).toBeTruthy();
    
    // Toggle back to not favorite
    service.toggleFavorite(pokemonId);
    expect(service.isFavorite(pokemonId)).toBeFalsy();
  });

  it('should return correct favorites count', () => {
    expect(service.getFavoritesCount()).toBe(0);
    
    service.addToFavorites(1);
    service.addToFavorites(2);
    expect(service.getFavoritesCount()).toBe(2);
    
    service.removeFromFavorites(1);
    expect(service.getFavoritesCount()).toBe(1);
  });

  it('should clear all favorites', () => {
    service.addToFavorites(1);
    service.addToFavorites(2);
    service.addToFavorites(3);
    
    expect(service.getFavoritesCount()).toBe(3);
    
    service.clearFavorites();
    expect(service.getFavoritesCount()).toBe(0);
    expect(service.getFavorites()).toEqual([]);
  });

  it('should handle duplicate additions gracefully', () => {
    const pokemonId = 1;
    
    service.addToFavorites(pokemonId);
    service.addToFavorites(pokemonId); // Duplicate
    
    expect(service.getFavoritesCount()).toBe(1);
    expect(service.isFavorite(pokemonId)).toBeTruthy();
  });

  it('should handle removal of non-existent pokemon gracefully', () => {
    const pokemonId = 999;
    
    // Try to remove pokemon that was never added
    service.removeFromFavorites(pokemonId);
    
    expect(service.getFavoritesCount()).toBe(0);
    expect(service.isFavorite(pokemonId)).toBeFalsy();
  });
});
