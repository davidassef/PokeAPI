# 🖼️ Sistema de Armazenamento Local de Imagens

Este documento descreve como usar o novo sistema de armazenamento local de imagens de Pokémon, que resolve o problema de URLs instáveis e garante disponibilidade permanente das imagens.

## 🚀 Características

- ✅ **Armazenamento local completo**: Todas as imagens de Pokémon (1-1010) são armazenadas localmente
- ✅ **Otimização automática**: Imagens são comprimidas e convertidas para WebP
- ✅ **Multiplos tamanhos**: Suporte para original, medium, small e thumbnail
- ✅ **Cache inteligente**: Sistema de cache com fallback para URLs externas
- ✅ **Baixo consumo de espaço**: Imagens otimizadas ocupam ~50% menos espaço

## 📦 Instalação Rápida

### Windows (PowerShell)
```powershell
# Na pasta backend\
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python setup_image_storage.py
```

### Linux/Mac (Bash)
```bash
# Na pasta backend/
chmod +x setup_image_storage.sh
./setup_image_storage.sh
```

## 📊 Uso de Espaço

| Tipo de Imagem | Quantidade | Tamanho Médio | Total Estimado |
|----------------|------------|---------------|----------------|
| Original       | 4,040      | ~150KB        | ~600MB         |
| Otimizada      | 4,040      | ~75KB         | ~300MB         |
| Thumbnails     | 4,040      | ~15KB         | ~60MB          |
| **Total**      | **12,120** | -             | **~960MB**     |

## 🔧 Como Usar

### 1. Verificar Armazenamento
```bash
python check_image_storage.py
```

### 2. Pré-carregar Todas as Imagens
```bash
python mass_image_preloader.py
```

### 3. Usar na API

#### Imagens Originais
```
GET /api/images/pokemon/{pokemon_id}?image_type=official-artwork
```

#### Imagens Otimizadas
```
GET /api/images/optimized/{pokemon_id}?size=medium&quality=85&format=webp
```

**Parâmetros disponíveis:**
- `image_type`: `official-artwork`, `dream-world`, `home`, `showdown`
- `size`: `original`, `medium`, `small`, `thumbnail`
- `quality`: 1-100 (padrão: 85)
- `format`: `webp`, `jpg`, `png`

### 4. Usar no Frontend

#### Componente React (exemplo)
```jsx
// Usar imagem otimizada
<img 
  src={`/api/images/optimized/${pokemonId}?size=medium&quality=85`}
  alt={pokemonName}
  loading="lazy"
/>

// Fallback para imagem original
<img 
  src={`/api/images/pokemon/${pokemonId}?image_type=official-artwork`}
  alt={pokemonName}
  onError={(e) => {
    e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }}
/>
```

## 📁 Estrutura de Diretórios

```
backend/
├── app/
│   ├── data/
│   │   ├── images/           # Imagens originais cacheadas
│   │   ├── optimized/        # Imagens otimizadas
│   │   └── thumbnails/       # Miniaturas
│   ├── services/
│   │   ├── image_cache_service.py      # Cache de imagens
│   │   └── image_optimization_service.py # Otimização
│   └── routes/
│       └── images.py         # Rotas da API
├── check_image_storage.py    # Verificador de armazenamento
├── mass_image_preloader.py   # Pré-carregamento em massa
└── setup_image_storage.sh    # Script de configuração
```

## 🎯 Tamanhos de Imagens

| Tamanho   | Dimensões | Uso Recomendado |
|-----------|-----------|-----------------|
| original  | Original  | Galerias, zoom  |
| medium    | 300x300   | Cards, listas   |
| small     | 150x150   | Mini cards      |
| thumbnail | 50x50     | Avatares        |

## 🔍 Troubleshooting

### Problema: Imagens não carregam
1. Verifique se o backend está rodando: `uvicorn main:app --reload`
2. Execute: `python check_image_storage.py`
3. Verifique espaço em disco: `df -h`

### Problema: Espaço insuficiente
1. Use imagens otimizadas: `/api/images/optimized/`
2. Use qualidade menor: `?quality=60`
3. Use apenas thumbnails: `?size=thumbnail`

### Problema: Download lento
1. Execute em partes: `python mass_image_preloader.py --start 1 --end 100`
2. Use threads: `python mass_image_preloader.py --max-workers 10`

## 📈 Monitoramento

### Verificar integridade
```bash
python check_image_storage.py --verify
```

### Estatísticas detalhadas
```bash
curl http://localhost:8000/api/images/stats
```

### Limpar cache antigo
```bash
python -c "
from app.services.image_cache_service import ImageCacheService
from app.core.database import SessionLocal
service = ImageCacheService(SessionLocal())
service.cleanup_old_cache(days=30)
"
```

## 🔄 Atualizações Futuras

Para adicionar novos Pokémon ou tipos de imagem:

1. Atualizar `mass_image_preloader.py`
2. Executar: `python mass_image_preloader.py --update-only`
3. Verificar: `python check_image_storage.py`

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `tail -f logs/app.log`
2. Execute diagnóstico: `python check_image_storage.py --debug`
3. Verifique issues no GitHub ou entre em contato com a equipe de desenvolvimento