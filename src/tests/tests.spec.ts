/**
 * Desarrollo de 10 pruebas de software
 * Pruebas unitarias y de integración
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Tipos
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
}

interface CartItem {
  productId: number;
  qty: number;
}

// Mock de productos
const mockProducts: Product[] = [
  { id: 1, name: "Runner Azul", price: 199999, image: "/img/shoe_1.png", description: "Zapatilla ligera", stock: 12 },
  { id: 2, name: "Classic Rojo", price: 149999, image: "/img/shoe_2.png", description: "Clásico urbano", stock: 24 },
  { id: 7, name: "Pro Basketball Negro", price: 229999, image: "/img/shoe_7.png", description: "Diseño profesional", stock: 15 },
];

// Funciones a probar
function validateProductId(id: any): boolean {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

function validateQuantity(qty: any): boolean {
  return typeof qty === 'number' && qty > 0 && Number.isInteger(qty);
}

function calculateCartTotal(cart: CartItem[], products: Product[]): number {
  const productMap = new Map(products.map(p => [p.id, p.price]));
  return cart.reduce((total, item) => {
    const price = productMap.get(item.productId) || 0;
    return total + (price * item.qty);
  }, 0);
}

function checkStock(productId: number, qty: number, products: Product[]): boolean {
  const product = products.find(p => p.id === productId);
  return product ? product.stock >= qty : false;
}

function searchProducts(query: string, products: Product[]): Product[] {
  const term = query.toLowerCase().trim();
  return products.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.description.toLowerCase().includes(term)
  );
}

function filterByPriceRange(products: Product[], min: number, max: number): Product[] {
  return products.filter(p => p.price >= min && p.price <= max);
}

//  SUITE DE PRUEBAS

describe('ACTIVIDAD 10 - Suite de Pruebas de Software', () => {
  
  // PRUEBA 1: Validación de ID de producto
  describe('Prueba 1 - Validación de ProductId', () => {
    it('debe aceptar IDs numéricos positivos válidos', () => {
      expect(validateProductId(1)).toBe(true);
      expect(validateProductId(7)).toBe(true);
      expect(validateProductId(100)).toBe(true);
    });

    it('debe rechazar IDs inválidos', () => {
      expect(validateProductId(-1)).toBe(false);
      expect(validateProductId(0)).toBe(false);
      expect(validateProductId('1')).toBe(false);
      expect(validateProductId(null)).toBe(false);
      expect(validateProductId(undefined)).toBe(false);
      expect(validateProductId(1.5)).toBe(false);
    });
  });

  // PRUEBA 2: Validación de cantidad
  describe('Prueba 2 - Validación de Cantidad', () => {
    it('debe aceptar cantidades válidas', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(5)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
    });

    it('debe rechazar cantidades inválidas', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-5)).toBe(false);
      expect(validateQuantity('5')).toBe(false);
      expect(validateQuantity(2.5)).toBe(false);
      expect(validateQuantity(null)).toBe(false);
    });
  });

  // PRUEBA 3: Cálculo de total del carrito
  describe('Prueba 3 - Cálculo de Total del Carrito', () => {
    it('debe calcular correctamente el total con un producto', () => {
      const cart: CartItem[] = [{ productId: 1, qty: 2 }];
      const total = calculateCartTotal(cart, mockProducts);
      expect(total).toBe(399998); // 199999 * 2
    });

    it('debe calcular correctamente el total con múltiples productos', () => {
      const cart: CartItem[] = [
        { productId: 1, qty: 1 }, // 199999
        { productId: 2, qty: 2 }, // 299998
      ];
      const total = calculateCartTotal(cart, mockProducts);
      expect(total).toBe(499997); // 199999 + 299998
    });

    it('debe retornar 0 para carrito vacío', () => {
      const cart: CartItem[] = [];
      const total = calculateCartTotal(cart, mockProducts);
      expect(total).toBe(0);
    });

    it('debe ignorar productos inexistentes', () => {
      const cart: CartItem[] = [
        { productId: 999, qty: 5 },
      ];
      const total = calculateCartTotal(cart, mockProducts);
      expect(total).toBe(0);
    });
  });

  // PRUEBA 4: Verificación de stock
  describe('Prueba 4 - Verificación de Stock', () => {
    it('debe validar stock suficiente', () => {
      expect(checkStock(1, 5, mockProducts)).toBe(true);
      expect(checkStock(1, 12, mockProducts)).toBe(true);
    });

    it('debe rechazar cuando no hay stock suficiente', () => {
      expect(checkStock(1, 13, mockProducts)).toBe(false);
      expect(checkStock(1, 100, mockProducts)).toBe(false);
    });

    it('debe retornar false para productos inexistentes', () => {
      expect(checkStock(999, 1, mockProducts)).toBe(false);
    });
  });

  // PRUEBA 5: Búsqueda de productos
  describe('Prueba 5 - Búsqueda de Productos', () => {
    it('debe encontrar productos por nombre', () => {
      const results = searchProducts('runner', mockProducts);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Runner Azul');
    });

    it('debe encontrar productos por descripción', () => {
      const results = searchProducts('profesional', mockProducts);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(7);
    });

    it('debe ser case-insensitive', () => {
      const results1 = searchProducts('RUNNER', mockProducts);
      const results2 = searchProducts('runner', mockProducts);
      expect(results1).toEqual(results2);
    });

    it('debe retornar array vacío si no encuentra resultados', () => {
      const results = searchProducts('inexistente', mockProducts);
      expect(results).toHaveLength(0);
    });
  });

  // PRUEBA 6: Filtro por rango de precio
  describe('Prueba 6 - Filtro por Rango de Precio', () => {
    it('debe filtrar productos dentro del rango', () => {
      const results = filterByPriceRange(mockProducts, 150000, 200000);
      expect(results).toHaveLength(2);
      expect(results.every(p => p.price >= 150000 && p.price <= 200000)).toBe(true);
    });

    it('debe retornar todos los productos con rango amplio', () => {
      const results = filterByPriceRange(mockProducts, 0, 999999);
      expect(results).toHaveLength(3);
    });

    it('debe retornar array vacío si ninguno cumple', () => {
      const results = filterByPriceRange(mockProducts, 500000, 600000);
      expect(results).toHaveLength(0);
    });
  });

  // PRUEBA 7: Agregar producto al carrito
  describe('Prueba 7 - Agregar Producto al Carrito', () => {
    let cart: CartItem[];

    beforeEach(() => {
      cart = [];
    });

    it('debe agregar nuevo producto al carrito', () => {
      cart.push({ productId: 1, qty: 1 });
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(1);
      expect(cart[0].qty).toBe(1);
    });

    it('debe incrementar cantidad si el producto ya existe', () => {
      cart.push({ productId: 1, qty: 1 });
      const existing = cart.find(i => i.productId === 1);
      if (existing) existing.qty += 2;
      expect(cart[0].qty).toBe(3);
    });
  });

  // PRUEBA 8: Eliminar producto del carrito
  describe('Prueba 8 - Eliminar Producto del Carrito', () => {
    it('debe eliminar producto del carrito', () => {
      let cart: CartItem[] = [
        { productId: 1, qty: 2 },
        { productId: 2, qty: 1 },
      ];
      cart = cart.filter(i => i.productId !== 1);
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(2);
    });
  });

  // PRUEBA 9: Formato de moneda
  describe('Prueba 9 - Formato de Moneda', () => {
    it('debe formatear precios correctamente', () => {
      const fmt = (n: number) => n.toLocaleString('es-CO', { 
        style: 'currency', 
        currency: 'COP' 
      });
      
      expect(fmt(199999)).toContain('199');
      expect(fmt(0)).toContain('0');
    });
  });

  // PRUEBA 10: Validación de datos del request
  describe('Prueba 10 - Validación Completa de Request', () => {
    interface AddToCartRequest {
      productId?: any;
      qty?: any;
    }

    function validateAddToCartRequest(req: AddToCartRequest): { valid: boolean; error?: string } {
      if (!req.productId || req.qty == null) {
        return { valid: false, error: 'Datos requeridos faltantes' };
      }
      if (!validateProductId(req.productId)) {
        return { valid: false, error: 'ProductId inválido' };
      }
      if (!validateQuantity(req.qty)) {
        return { valid: false, error: 'Cantidad inválida' };
      }
      if (!checkStock(req.productId, req.qty, mockProducts)) {
        return { valid: false, error: 'Stock insuficiente' };
      }
      return { valid: true };
    }

    it('debe validar request correcto', () => {
      const result = validateAddToCartRequest({ productId: 1, qty: 5 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe rechazar request con datos faltantes', () => {
      const result1 = validateAddToCartRequest({});
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Datos requeridos faltantes');
    });

    it('debe rechazar request con productId inválido', () => {
      const result = validateAddToCartRequest({ productId: -1, qty: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ProductId inválido');
    });

    it('debe rechazar request con cantidad inválida', () => {
      const result = validateAddToCartRequest({ productId: 1, qty: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cantidad inválida');
    });

    it('debe rechazar request sin stock suficiente', () => {
      const result = validateAddToCartRequest({ productId: 1, qty: 100 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Stock insuficiente');
    });
  });
});

// Configuración para ejecutar las pruebas
export { };

/**
 * Para ejecutar estas pruebas:
 * 
 * 1. Instalar Jest:
 *    npm install --save-dev jest @types/jest ts-jest
 * 
 * 2. Configurar Jest en package.json:
 *    "scripts": {
 *      "test": "jest"
 *    }
 * 
 * 3. Ejecutar:
 *    npm test
 */