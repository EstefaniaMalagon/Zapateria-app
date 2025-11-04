import { Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import type { CartItem } from "../types/index.d.js";

const router = Router();
const DATA_FILE = path.join(process.cwd(), "src", "data", "data.json");

// Helper para persistencia de datos
async function saveCartToFile(userId: string, cart: CartItem[]) {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8").catch(() => "{}");
    const allCarts = JSON.parse(data);
    allCarts[userId] = cart;
    await fs.writeFile(DATA_FILE, JSON.stringify(allCarts, null, 2));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
}

async function loadCartFromFile(userId: string): Promise<CartItem[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const allCarts = JSON.parse(data);
    return allCarts[userId] || [];
  } catch {
    return [];
  }
}

// GET cart
router.get("/", async (req, res) => {
  const sess: any = req.session;
  const userId = sess.userId || "anonymous";
  
  // Cargar desde archivo si existe
  if (!sess.cart) {
    sess.cart = await loadCartFromFile(userId);
  }
  
  const cart: CartItem[] = sess.cart || [];
  res.json(cart);
});

// Nueva ruta /api/cart/total
router.get("/total", async (req, res) => {
  const sess: any = req.session;
  const cart: CartItem[] = sess.cart || [];
  
  // Importar productos para calcular precios
  const { default: productsData } = await import("./products.js");
  const productsResponse = await fetch("http://localhost:3000/api/products");
  
  // Calcular total
  let total = 0;
  for (const item of cart) {
    // En producción, buscaríamos el precio en la base de datos
    // Aquí simulamos con precios fijos
    const prices: Record<number, number> = {
      1: 199999, 2: 149999, 3: 179999, 4: 159999, 
      5: 189999, 6: 209999, 7: 229999, 8: 139999, 9: 169999
    };
    const price = prices[item.productId] || 0;
    total += price * item.qty;
  }
  
  res.json({ 
    total,
    itemCount: cart.reduce((acc, i) => acc + i.qty, 0),
    currency: "COP"
  });
});

// POST add to cart - Validación mejorada
router.post("/add", async (req, res) => {
  const { productId, qty } = req.body as CartItem;
  
  // VALIDACIÓN 1: Datos requeridos
  if (!productId || qty == null) {
    return res.status(400).json({ 
      error: "Datos inválidos: productId y qty son requeridos" 
    });
  }
  
  // VALIDACIÓN 2: Tipos correctos
  if (typeof productId !== "number" || typeof qty !== "number") {
    return res.status(400).json({ 
      error: "Datos inválidos: productId y qty deben ser números" 
    });
  }
  
  // VALIDACIÓN 3: Cantidad no negativa
  if (qty <= 0) {
    return res.status(400).json({ 
      error: "La cantidad debe ser mayor a 0" 
    });
  }
  
  // VALIDACIÓN 4: ProductId válido (1-9)
  if (productId < 1 || productId > 9) {
    return res.status(400).json({ 
      error: "El ID del producto no existe" 
    });
  }
  
  // VALIDACIÓN 5: Stock disponible (simulado)
  const stockMap: Record<number, number> = {
    1: 12, 2: 24, 3: 8, 4: 16, 5: 10, 6: 7, 7: 15, 8: 20, 9: 11
  };
  
  const sess: any = req.session;
  sess.cart = sess.cart || [];
  sess.userId = sess.userId || `user_${Date.now()}`;
  
  const existing = sess.cart.find((i: CartItem) => i.productId === productId);
  const currentQty = existing ? existing.qty : 0;
  const newQty = currentQty + qty;
  
  if (newQty > stockMap[productId]) {
    return res.status(400).json({ 
      error: `Stock insuficiente. Disponible: ${stockMap[productId]}` 
    });
  }
  
  // Agregar o actualizar
  const idx = sess.cart.findIndex((i: CartItem) => i.productId === productId);
  if (idx >= 0) {
    sess.cart[idx].qty += qty;
  } else {
    sess.cart.push({ productId, qty });
  }
  
  // Guardar en archivo
  await saveCartToFile(sess.userId, sess.cart);
  
  res.json({ ok: true, cart: sess.cart });
});

// POST remove from cart - Validación mejorada
router.post("/remove", async (req, res) => {
  const { productId } = req.body as { productId: number };
  
  // VALIDACIÓN 1: ProductId requerido
  if (!productId) {
    return res.status(400).json({ 
      error: "productId es requerido" 
    });
  }
  
  // VALIDACIÓN 2: Tipo correcto
  if (typeof productId !== "number") {
    return res.status(400).json({ 
      error: "productId debe ser un número" 
    });
  }
  
  const sess: any = req.session;
  sess.cart = (sess.cart || []).filter((i: CartItem) => i.productId !== productId);
  
  // Guardar en archivo
  if (sess.userId) {
    await saveCartToFile(sess.userId, sess.cart);
  }
  
  res.json({ ok: true, cart: sess.cart });
});

// POST clear cart
router.post("/clear", async (req, res) => {
  const sess: any = req.session;
  sess.cart = [];
  
  // Guardar en archivo
  if (sess.userId) {
    await saveCartToFile(sess.userId, sess.cart);
  }
  
  res.json({ ok: true, cart: [] });
});

export default router;