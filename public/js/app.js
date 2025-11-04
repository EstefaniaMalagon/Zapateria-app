const fmt = (n) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

let allProducts = [];
let filteredProducts = [];

// Cargar todos los productos
async function loadProducts() {
  const res = await fetch('/api/products');
  allProducts = await res.json();
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
  updateCartCount();
}

// Renderizar productos en el DOM
function renderProducts(products) {
  const list = document.getElementById('product-list');
  const noResults = document.getElementById('no-results');
  
  if (products.length === 0) {
    list.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  
  noResults.style.display = 'none';
  
  list.innerHTML = products.map(p => `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <img src="${p.image}" class="card-img-top" alt="${p.name}" style="height: 250px; object-fit: cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <p class="text-muted mb-2 small">${p.description}</p>
          <p class="fw-bold fs-5 text-primary">${fmt(p.price)}</p>
          <p class="small text-success">Stock: ${p.stock} unidades</p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-primary flex-grow-1" data-id="${p.id}" data-qty="1">
              🛒 Agregar
            </button>
            <a href="/cart.html" class="btn btn-outline-secondary">
              Ver carrito
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Agregar event listeners a los botones
  list.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = Number(btn.dataset.id);
      const qty = Number(btn.dataset.qty);
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, qty })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Mostrar notificación Toast
          showToast();
          updateCartCount();
        } else {
          alert(data.error || 'Error al agregar producto');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
      }
    });
  });
}

// Mostrar Toast de notificación
function showToast() {
  const toastEl = document.getElementById('toast-notification');
  const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 3000
  });
  toast.show();
}

// Actualizar contador del carrito
async function updateCartCount() {
  const res = await fetch('/api/cart');
  const cart = await res.json();
  const count = cart.reduce((acc, i) => acc + i.qty, 0);
  document.getElementById('cart-count').textContent = String(count);
}

// Filtro de búsqueda por nombre
function filterBySearch(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return allProducts;
  
  return allProducts.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.description.toLowerCase().includes(term)
  );
}

// Filtro por rango de precios
function filterByPrice(products, minPrice, maxPrice) {
  return products.filter(p => {
    const price = p.price;
    const min = minPrice || 0;
    const max = maxPrice || Infinity;
    return price >= min && price <= max;
  });
}

// Aplicar todos los filtros
function applyFilters() {
  const searchTerm = document.getElementById('search-input').value;
  const minPrice = Number(document.getElementById('min-price').value) || 0;
  const maxPrice = Number(document.getElementById('max-price').value) || Infinity;
  
  // Primero filtrar por búsqueda
  let results = filterBySearch(searchTerm);
  
  // Luego filtrar por precio
  results = filterByPrice(results, minPrice, maxPrice);
  
  filteredProducts = results;
  renderProducts(filteredProducts);
}

// Limpiar filtros
function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
}

// Event listeners para filtros
document.getElementById('btn-filter')?.addEventListener('click', applyFilters);
document.getElementById('btn-clear-filter')?.addEventListener('click', clearFilters);

// Filtro en tiempo real al escribir
document.getElementById('search-input')?.addEventListener('input', (e) => {
  // Filtrar mientras se escribe 
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
});

// Cargar productos al iniciar
loadProducts();