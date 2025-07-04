#!/bin/bash
# Script para remover arquivos TypeScript não utilizados

echo "🧹 Limpando arquivos TypeScript não utilizados..."

# Lista de arquivos para remover baseada nos warnings do build
FILES_TO_REMOVE=(
  "src/app/core/services/translation.service.ts"
  "src/app/explore-container/explore-container.component.ts"
  "src/app/explore-container/explore-container.module.ts"
  "src/app/icons/pokeball-outline.icon.ts"
  "src/app/models/user.model.ts"
  "src/app/pages/web/details/pokemon-theme.service.ts"
  "src/app/pages/web/favorites/favorites-routing.module.ts"
  "src/app/pages/web/favorites/favorites.module.ts"
  "src/app/pages/web/favorites/favorites.page.ts"
  "src/app/shared/components/pokemon-abilities/pokemon-abilities.component.ts"
  "src/app/shared/components/pokemon-detail/pokemon-detail.component.ts"
  "src/app/shared/components/pokemon-image/pokemon-image.component.ts"
  "src/app/shared/components/pokemon-info-card/pokemon-info-card.component.ts"
  "src/app/shared/components/pokemon-stats/pokemon-stats.component.ts"
  "src/app/shared/components/pokemon-types/pokemon-types.component.ts"
  "src/app/shared/shared-components.module.ts"
  "src/assets/img/pokeball-outline.icon.ts"
)

REMOVED_COUNT=0

for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "  🗑️  Removendo: $file"
    rm "$file"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  else
    echo "  ⚠️  Arquivo não encontrado: $file"
  fi
done

echo "✅ Limpeza concluída! Removidos $REMOVED_COUNT arquivos."
echo "📝 Agora você deve:"
echo "   1. Fazer build novamente: npm run build:prod"
echo "   2. Verificar se não há erros de compilação"
echo "   3. Fazer commit das alterações"
