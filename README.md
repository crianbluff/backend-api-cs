# Guests API

REST API para gestionar guests de couchsurfing — viajeros individuales y parejas.

**Stack:** Node.js · TypeScript · Express · MongoDB (Mongoose) · Docker

---

## Estructura del proyecto

```
src/
├── config/
│   ├── database.ts      # Conexión MongoDB
│   ├── env.ts           # Variables de entorno validadas
│   └── swagger.ts       # Configuración OpenAPI / Swagger
├── controllers/
│   └── guest.controller.ts
├── middlewares/
│   ├── error.middleware.ts
│   ├── rateLimiter.middleware.ts
│   └── validate.middleware.ts
├── models/
│   └── guest.model.ts   # Mongoose schema
├── routes/
│   └── guest.routes.ts  # Rutas + JSDoc para Swagger
├── services/
│   └── guest.service.ts # Lógica de negocio
├── types/
│   └── guest.types.ts   # Interfaces TypeScript
├── utils/
│   ├── dateRange.ts     # Parser de rangos de fecha
│   ├── logger.ts        # Winston logger
│   ├── nanoid.ts        # Generador de IDs
│   ├── response.ts      # Helpers de respuesta HTTP
│   └── validation.ts    # Schemas Zod
├── app.ts
└── server.ts
```

---

## Inicio rápido

### Desarrollo (hot-reload)

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar API + MongoDB + Mongo Express
docker compose -f docker-compose.dev.yml up --build

# API          → http://localhost:3001
# Swagger UI   → http://localhost:3001/docs
# Mongo Express → http://localhost:8081  (admin / admin123)
```

### Producción

```bash
docker compose up --build -d
```

### Local sin Docker

```bash
npm install
# Editar .env con tu MONGO_URI local
npm run dev
```

---

## Variables de entorno

| Variable               | Default       | Descripción                   |
| ---------------------- | ------------- | ----------------------------- |
| `NODE_ENV`             | `development` | Entorno                       |
| `PORT`                 | `3001`        | Puerto del servidor           |
| `MONGO_URI`            | —             | URI de conexión a MongoDB     |
| `API_VERSION`          | `v1`          | Versión de la API             |
| `RATE_LIMIT_WINDOW_MS` | `900000`      | Ventana del rate limiter (ms) |
| `RATE_LIMIT_MAX`       | `100`         | Máx. requests por ventana     |

---

## Endpoints

Base URL: `http://localhost:3001/api/v1`

| Método   | Ruta          | Descripción              |
| -------- | ------------- | ------------------------ |
| `GET`    | `/guests`     | Obtener todos los guests |
| `GET`    | `/guests/:id` | Obtener un guest por ID  |
| `POST`   | `/guests`     | Crear un nuevo guest     |
| `PUT`    | `/guests/:id` | Actualizar un guest      |
| `DELETE` | `/guests/:id` | Eliminar un guest        |
| `GET`    | `/docs`       | Swagger UI               |
| `GET`    | `/docs.json`  | Spec OpenAPI en JSON     |
| `GET`    | `/health`     | Health check             |

### Query params — GET /guests

| Param       | Tipo     | Descripción                                    | Ejemplo              |
| ----------- | -------- | ---------------------------------------------- | -------------------- |
| `page`      | `number` | Número de página (default: 1)                  | `?page=2`            |
| `limit`     | `number` | Items por página, máx. 100 (default: 10)       | `?limit=20`          |
| `country`   | `string` | Filtrar por país (case-insensitive, parcial)   | `?country=Morocco`   |
| `continent` | `string` | Filtrar por continente (valor exacto del enum) | `?continent=Europe`  |
| `from`      | `string` | Inicio del rango de visita (`month-year`)      | `?from=january-2024` |
| `to`        | `string` | Fin del rango de visita (`month-year`)         | `?to=december-2025`  |

---

## Modelo de datos

### Guest individual

```json
{
  "guestId": "aT84plm2UiN",
  "nights": 2,
  "stayed": true,
  "wasACouple": false,
  "coupleId": null,
  "rating": 4,
  "countryCode": "mar",
  "prefixCode": "+212",
  "country": "Morocco",
  "flag": "🇲🇦",
  "continent": "Africa",
  "fullName": "Simo Amri",
  "birthplace": "Casablanca",
  "livingIn": "Essaouira",
  "birthyear": 1991,
  "occupation": ["GIS specialist"],
  "urlProfileCs": "simo-amri",
  "gender": "male",
  "whatsapp": "663852898",
  "instagram": "simo.amri",
  "gift": ["handcrafted soap"],
  "comments": "Ambassador ⭐",
  "didWeHangOut": true,
  "visitedMonth": "November",
  "visitedYear": 2025,
  "createdAt": "2025-11-15T10:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z"
}
```

### Pareja

```json
{
  "guestId": "Bz91kLm4XpQ",
  "nights": 3,
  "stayed": true,
  "wasACouple": true,
  "coupleId": "zzl09j7A791adlOIS",
  "didWeHangOut": true,
  "visitedMonth": "June",
  "visitedYear": 2025,
  "gift": ["card", "bracelets"],
  "comments": null,
  "coupleInfo": [
    {
      "rating": 4,
      "countryCode": "arg",
      "country": "Argentina",
      "flag": "🇦🇷",
      "continent": "South America",
      "fullName": "Aylen Rivarola",
      "gender": "female"
    },
    {
      "rating": 4,
      "countryCode": "arg",
      "country": "Argentina",
      "flag": "🇦🇷",
      "continent": "South America",
      "fullName": "Manu Sabanés",
      "gender": "male"
    }
  ],
  "createdAt": "2025-06-01T10:00:00.000Z",
  "updatedAt": "2025-06-01T10:00:00.000Z"
}
```

---

## Respuesta paginada

```json
{
  "success": true,
  "message": "Guests retrieved successfully",
  "data": {
    "data": [...],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
