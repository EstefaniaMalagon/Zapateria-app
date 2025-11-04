# SportZone - Calzado Deportivo
Aplicación web desarrollada con Bootstrap (frontend) y Express + TypeScript (backend). Sistema completo de carrito de compras con persistencia de datos y medidas de seguridad implementadas.

## Integrantes del Equipo
- Estefania Malagon - Desarrollo backend, frontend
- Javier Montero - Desarrollo pruebas de software, implementación de seguridad

## Dependencias Utilizadas

### Frontend

- HTML5 
- CSS3 + Bootstrap 5.3
- JavaScript ES6+ 

### Backend

- Express.js 
- TypeScript 
- Node.js 18+ 

<img width="696" height="587" alt="image-2" src="https://github.com/user-attachments/assets/0552b47c-8a8c-4473-9611-126266e1f4c8" />

## Rutas del Backend

### Rutas de Productos (/api/products)

GET /api/products
- Descripción: Obtiene la lista completa de productos disponibles en el catálogo
- Respuesta: Array JSON con todos los productos (9 productos)

GET /api/products/:id
- Descripción: Obtiene un producto específico por su ID
- Parámetros: id (number) - ID del producto (1-9)
- Respuesta: Objeto JSON con los datos del producto
- Validaciones: Verifica que el ID sea válido y que el producto exista

### Rutas del Carrito (/api/cart)

GET /api/cart
- Descripción: Obtiene los productos del carrito de la sesión actual
- Respuesta: Array JSON con los items del carrito [{productId, qty}, ...]

GET /api/cart/total
- Descripción: Calcula y retorna el total del carrito actual
- Respuesta: JSON con {total, itemCount, currency}

POST /api/cart/add
- Descripción: Agrega un producto al carrito o incrementa su cantidad
- Validaciones:
Verifica que productId y qty sean números válidos.
Valida que la cantidad sea mayor a 0.
Verifica que el producto exista (ID entre 1-9).
Comprueba que haya stock suficiente.

POST /api/cart/remove
- Descripción: Elimina completamente un producto del carrito
- Validaciones: Verifica que el productId sea válido

POST /api/cart/clear
- Descripción: Vacía completamente el carrito de la sesión
- Respuesta: {ok: true, cart: []}

## Funcionamiento del Carrito

### Sistema de Sesiones
El carrito utiliza cookie-session para mantener el estado del carrito en el navegador del usuario:

- Creación de sesión: Cuando un usuario visita la página, se crea automáticamente una sesión con un userId único
- Persistencia: Los datos del carrito se almacenan en una cookie cifrada en el navegador
- Duración: La sesión dura 24 horas (configurable en server.ts)

### Estructura de Datos
El carrito se representa como un array de objetos:
[
  { productId: 1, qty: 2 },
  { productId: 3, qty: 1 }
]

### Flujo de Operaciones

#### Agregar producto:
- Cliente envía POST /api/cart/add con {productId, qty}
- Servidor valida los datos
- Si el producto ya existe, incrementa la cantidad
- Si es nuevo, lo agrega al array
- Guarda el carrito en la sesión
- Retorna el carrito actualizado

#### Eliminar producto:
- Cliente envía POST /api/cart/remove con {productId}
- Servidor filtra el producto del array
- Actualiza la sesión
- Retorna el carrito actualizado

#### Calcular total:
- Cliente solicita GET /api/cart/total
- Servidor obtiene el carrito de la sesión
- Multiplica precio × cantidad para cada producto
- Suma todos los subtotales
- Retorna {total, itemCount, currency}

## Integración Frontend-Backend

### Flujo de Comunicación

1. Carga de Productos (index.html)

// Frontend (app.js)
async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  // Renderizar productos en el DOM
}

// Backend (products.ts)
router.get("/", (req, res) => {
  res.json(products); // Array de 9 productos
});

2. Agregar al Carrito

// Frontend (app.js)
async function addToCart(productId, qty) {
  await fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, qty })
  });
  // Mostrar toast de confirmación
  // Actualizar badge del carrito
}

// Backend (cart.ts)
router.post("/add", (req, res) => {
  const { productId, qty } = req.body;
  // Validaciones...
  sess.cart.push({ productId, qty });
  res.json({ ok: true, cart: sess.cart });
});

3. Visualizar Carrito (cart.html)

// Frontend (cart.js)
async function renderCart() {
  const [products, cart] = await Promise.all([
    fetch('/api/products').then(r => r.json()),
    fetch('/api/cart').then(r => r.json())
  ]);
  // Renderizar tabla con productos
  // Calcular y mostrar total
}

### Manejo de Estado

#### Frontend:

- Mantiene la UI sincronizada con el servidor
- Actualiza el badge del carrito después de cada operación
- Muestra notificaciones (Toast) al usuario

#### Backend:

- Almacena el estado del carrito en la sesión
- Valida todas las operaciones
- Retorna siempre el estado actualizado

## Instalación y Ejecución

1. Clonar el repositorio
git clone https://github.com/EstefaniaMalagon/Zapateria-app.git

2. Instalar dependencias
npm install

3. Modo desarrollo
npm run dev
El servidor se ejecutará en: http://localhost:3000

4. Compilar para producción
npm run build
npm start

5. Ejecutar pruebas
npm test
