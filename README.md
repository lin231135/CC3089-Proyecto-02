# E-Commerce Recommendation Engine con Neo4j

Proyecto universitario de **Bases de Datos 2** que implementa un sistema completo de e-commerce con motor de recomendaciones basado en grafos usando Neo4j AuraDB.

## Descripción

Sistema de comercio electrónico con funcionalidades completas de CRUD sobre nodos y relaciones, importación masiva de datos, y un motor de recomendaciones inteligente que utiliza algoritmos de filtrado colaborativo y análisis de patrones de compra sobre un grafo de conocimiento.

### Características Principales

- **CRUD Completo** sobre nodos y relaciones con soporte para etiquetas múltiples
- **Motor de Recomendaciones** basado en filtrado colaborativo
- **Dashboard Analytics** con métricas en tiempo real
- **Tienda E-Commerce** con carrito de compras y checkout
- **Importación Masiva CSV** con procesamiento batch (5000+ nodos)
- **Consultas Cypher** personalizadas para análisis de datos
- **API REST** completa con endpoints documentados

## Arquitectura

```
┌─────────────────┐      HTTP/REST       ┌──────────────────┐
│  React Frontend │ ◄──────────────────► │   Go Backend     │
│   (Vite + SPA)  │    JSON responses    │  (HTTP Server)   │
└─────────────────┘                      └──────────────────┘
                                                   │
                                                   │ Neo4j Driver
                                                   ▼
                                         ┌──────────────────┐
                                         │   Neo4j AuraDB   │
                                         │  (Cloud Graph)   │
                                         └──────────────────┘
```

## Stack Tecnológico

### Backend
- **Go 1.22+** - Lenguaje principal
- **Neo4j Go Driver v5** - Cliente oficial de Neo4j
- **HTTP Server** - Servidor nativo de Go 1.22 con ServeMux
- **godotenv** - Gestión de variables de entorno
- **CORS** - Manejo de peticiones cross-origin

### Frontend
- **React 18** - Biblioteca UI
- **Vite 5** - Build tool y dev server
- **React Router v6** - Navegación SPA
- **Axios** - Cliente HTTP
- **Context API** - State management

### Base de Datos
- **Neo4j AuraDB** - Base de datos de grafos en la nube
- **Cypher** - Lenguaje de consultas

## Modelo de Datos (Grafo)

### Nodos

| Label    | ID Field   | Propiedades Clave                                    |
|----------|------------|------------------------------------------------------|
| User     | userId     | name, isPremium, interests[], totalSpent, birthDate  |
| Product  | productId  | name, price, stock, tags[], isActive, description    |
| Category | categoryId | name, level, isActive                                |
| Order    | orderId    | status, total, isPaid, placedAt                      |
| Review   | reviewId   | rating, sentiment, comment, isVerified               |
| Seller   | sellerId   | name, rating, country, isVerified                    |

### Relaciones

```cypher
# Compras y carritos
(User)-[:PURCHASED {purchasedAt, quantity, unitPrice}]->(Product)
(User)-[:ADDED_TO_CART {addedAt, quantity}]->(Product)
(User)-[:VIEWED {viewedAt, duration, source}]->(Product)

# Reviews
(User)-[:WROTE]->(Review)
(Review)-[:ABOUT]->(Product)

# Órdenes
(User)-[:PLACED {placedAt, channel}]->(Order)
(Order)-[:CONTAINS {quantity, unitPrice, discount}]->(Product)

# Catálogo
(Product)-[:BELONGS_TO {isPrimary, rank}]->(Category)
(Category)-[:SUBCATEGORY_OF]->(Category)
(Seller)-[:SELLS {listedAt, sellerPrice}]->(Product)

# Recomendaciones
(Product)-[:SIMILAR_TO {similarityScore, algorithm}]->(Product)
(Product)-[:RECOMMENDED_TO {score, algorithm}]->(User)
(User)-[:FOLLOWS {followedAt, tier}]->(Seller)
```

## Instalación y Uso

### Prerrequisitos

- **Go 1.22+** ([Descargar](https://go.dev/dl/))
- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **Cuenta Neo4j AuraDB** (gratis en [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/))

### 1. Configuración de Neo4j

Crea un archivo `.env` en la carpeta `backend/` con tus credenciales:

```env
NEO4J_URI=neo4j+s://tu-instancia.databases.neo4j.io
NEO4J_USERNAME=tu-usuario
NEO4J_PASSWORD=tu-password
NEO4J_DATABASE=neo4j
```

### 2. Iniciar Backend

```powershell
cd backend
go run ./cmd/main.go
```

El servidor iniciará en `http://localhost:8080`

### 3. Iniciar Frontend

```powershell
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 4. Importar Datos (Primera vez)

**Opción 1: Desde la UI**
1. Ve a `http://localhost:5173/import`
2. Selecciona "Importación Masiva"
3. Sube los archivos CSV en orden:
   - Nodos: `users.csv`, `products.csv`, `categories.csv`, `sellers.csv`, `orders.csv`, `reviews.csv`
   - Relaciones: todos los archivos `rel_*.csv`

**Opción 2: Desde PowerShell** (más rápido)

```powershell
# Importar nodos
foreach ($type in @("categories", "sellers", "users", "products", "orders", "reviews")) {
    curl.exe -X POST http://localhost:8080/api/import/csv `
        -F "type=$type" `
        -F "file=@data/${type}.csv"
}

# Importar relaciones
foreach ($type in @("rel_belongs_to", "rel_subcategory_of", "rel_sells", "rel_purchased", "rel_wrote", "rel_about", "rel_viewed", "rel_added_to_cart", "rel_placed", "rel_contains", "rel_follows", "rel_similar_to", "rel_recommended_to")) {
    curl.exe -X POST http://localhost:8080/api/import/csv `
        -F "type=$type" `
        -F "file=@data/${type}.csv"
}
```

## Estructura del Proyecto

```
ecommerce-neo4j/
├── backend/
│   ├── cmd/
│   │   └── main.go              # Punto de entrada, rutas HTTP
│   ├── config/
│   │   └── config.go            # Configuración y env vars
│   ├── internal/
│   │   ├── db/
│   │   │   └── neo4j.go         # Driver y utilidades Neo4j
│   │   ├── handlers/
│   │   │   ├── nodes.go         # CRUD de nodos
│   │   │   ├── relationships.go # CRUD de relaciones
│   │   │   ├── import.go        # Importación CSV masiva
│   │   │   └── queries.go       # Estadísticas y consultas
│   │   └── models/
│   │       └── models.go        # Estructuras de datos
│   └── .env                     # Credenciales Neo4j
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── store/           # Componentes de la tienda
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Icon.jsx
│   │   │   └── Table.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx  # Estado global del carrito
│   │   ├── pages/
│   │   │   ├── store/           # Páginas de la tienda
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── CatalogPage.jsx
│   │   │   │   ├── ProductPage.jsx
│   │   │   │   ├── CartPage.jsx
│   │   │   │   └── StorePage.jsx
│   │   │   ├── StatsPage.jsx    # Dashboard
│   │   │   ├── NodesPage.jsx    # CRUD nodos
│   │   │   ├── RelationshipsPage.jsx
│   │   │   ├── ImportPage.jsx
│   │   │   └── QueriesPage.jsx
│   │   ├── api.js               # Cliente API
│   │   ├── App.jsx              # Layout principal
│   │   └── main.jsx             # Punto de entrada
│   └── package.json
├── data/                        # CSVs de datos
│   ├── users.csv                # 1500 usuarios
│   ├── products.csv             # 3000 productos
│   ├── categories.csv           # 130 categorías
│   ├── orders.csv               # 500 órdenes
│   ├── sellers.csv              # 100 vendedores
│   ├── reviews.csv              # 750 reseñas
│   └── rel_*.csv                # Archivos de relaciones
└── README.md
```

## API Endpoints

### Nodos

| Método | Ruta                      | Descripción                           |
|--------|---------------------------|---------------------------------------|
| POST   | `/api/nodes`              | Crear nodo (1 o más labels)           |
| GET    | `/api/nodes?label=X`      | Listar nodos con filtros              |
| GET    | `/api/nodes/{id}?label=X` | Obtener nodo por ID                   |
| PATCH  | `/api/nodes/properties`   | Actualizar propiedades (1+ nodos)     |
| DELETE | `/api/nodes/properties`   | Eliminar propiedades (1+ nodos)       |
| DELETE | `/api/nodes`              | Eliminar nodos (1+ nodos)             |

### Relaciones

| Método | Ruta                             | Descripción                        |
|--------|----------------------------------|------------------------------------|
| POST   | `/api/relationships`             | Crear relación con propiedades     |
| GET    | `/api/relationships`             | Listar relaciones                  |
| PATCH  | `/api/relationships/properties`  | Actualizar propiedades             |
| DELETE | `/api/relationships/properties`  | Eliminar propiedades               |
| DELETE | `/api/relationships`             | Eliminar relaciones                |

### Consultas y Analytics

| Método | Ruta                               | Descripción                              |
|--------|------------------------------------|------------------------------------------|
| GET    | `/api/stats`                       | Estadísticas generales del grafo         |
| GET    | `/api/recommendations/{userId}`    | Recomendaciones colaborativas            |
| GET    | `/api/queries/{name}`              | Consultas Cypher predefinidas            |
| GET    | `/api/graph/verify`                | Verificar conectividad del grafo         |
| DELETE | `/api/graph/isolated`              | Eliminar nodos aislados                  |

### Importación

| Método | Ruta              | Descripción                    |
|--------|-------------------|--------------------------------|
| POST   | `/api/import/csv` | Importar CSV (batch de 500)    |

## Consultas Cypher Implementadas

### 1. Filtrado Colaborativo (`/api/recommendations/{userId}`)
```cypher
MATCH (u:User {userId: $userId})-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(similar:User)-[:PURCHASED]->(rec:Product)
WHERE NOT (u)-[:PURCHASED]->(rec) AND rec.isActive = true
WITH rec, count(*) AS score
ORDER BY score DESC LIMIT 10
RETURN rec.productId, rec.name, rec.price, rec.description, score
```

### 2. Top Productos Más Vendidos (`top-products-by-sales`)
```cypher
MATCH (p:Product)<-[c:CONTAINS]-(o:Order)
WITH p, sum(c.quantity) AS totalSold, count(DISTINCT o) AS orderCount
ORDER BY totalSold DESC LIMIT 10
RETURN p.productId, p.name, p.price, totalSold, orderCount
```

### 3. También Compraron (`also-bought`)
```cypher
MATCH (u:User)-[:PURCHASED]->(p:Product {productId: $productId})
MATCH (u)-[:PURCHASED]->(other:Product)
WHERE other.productId <> p.productId
WITH other, count(DISTINCT u) AS buyers
ORDER BY buyers DESC LIMIT 10
RETURN other.productId, other.name, other.price, buyers
```

### 4. Productos Similares (`similar-products`)
```cypher
MATCH (u:User {userId: $userId})-[:VIEWED]->(p:Product)-[:SIMILAR_TO]->(rec:Product)
WHERE NOT (u)-[:PURCHASED]->(rec) AND rec.isActive = true
WITH rec, max(similarityScore) AS simScore
ORDER BY simScore DESC LIMIT 10
RETURN rec.productId, rec.name, rec.price, simScore
```

### 5. Rating Promedio por Categoría (`avg-rating-by-category`)
```cypher
MATCH (cat:Category)<-[:BELONGS_TO]-(p:Product)<-[:ABOUT]-(rev:Review)
WITH cat, avg(rev.rating) AS avgRating, count(rev) AS reviewCount
RETURN cat.name, avgRating, reviewCount
ORDER BY avgRating DESC
```

### 6. Productos Sin Reseñas (`products-without-reviews`)
```cypher
MATCH (p:Product)
WHERE NOT (:Review)-[:ABOUT]->(p)
RETURN p.productId, p.name, p.price, p.stock
LIMIT 50
```

## Funcionalidades de la Tienda

### Para Usuarios
- **Catálogo de productos** con búsqueda y filtros
- **Carrito de compras** con persistencia en LocalStorage
- **Checkout** que crea órdenes y relaciones en Neo4j
- **Recomendaciones personalizadas** por usuario
- **Tracking de vistas** automático
- **Productos similares** en cada página de detalle

### Para Administradores
- **Dashboard** con métricas en tiempo real
- **CRUD completo** de nodos y relaciones
- **Importación masiva** de datos CSV
- **Consultas personalizadas** con resultados en tabla
- **Verificación de grafo** y limpieza de nodos aislados


## Datos de Prueba

El proyecto incluye datos generados para simular un e-commerce real:

- **1,500 usuarios** con preferencias y historial
- **3,000 productos** en 130 categorías
- **100 vendedores** verificados
- **500 órdenes** completadas
- **750 reseñas** verificadas
- **20,000+ relaciones** entre nodos

## Desarrollo

### Backend (Go)

```powershell
# Ejecutar con hot-reload (requiere air)
cd backend
air

# Build para producción
go build -o server.exe ./cmd/main.go
```

### Frontend (React)

```powershell
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```