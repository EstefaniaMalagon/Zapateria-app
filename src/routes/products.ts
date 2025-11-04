import { Router } from "express";
import type { Product } from "../types/index.d.js";

const router = Router();

// In-memory catalog
const products: Product[] = [
  { id: 1, name: "Runner Azul", price: 199999, image: "/img/shoe_1.png", description: "Zapatilla ligera para correr, malla transpirable.", stock: 12 },
  { id: 2, name: "Classic Rojo", price: 149999, image: "/img/shoe_2.png", description: "Clásico urbano para uso diario.", stock: 24 },
  { id: 3, name: "Eco Verde", price: 179999, image: "/img/shoe_3.png", description: "Materiales reciclados, cómodo y resistente.", stock: 8 },
  { id: 4, name: "Urban Naranja", price: 159999, image: "/img/shoe_4.png", description: "Estilo urbano con suela de alta tracción.", stock: 16 },
  { id: 5, name: "Sport Morado", price: 189999, image: "/img/shoe_5.png", description: "Para entrenamientos de alto rendimiento.", stock: 10 },
  { id: 6, name: "Trail Gris", price: 209999, image: "/img/shoe_6.png", description: "Ideal para montaña y terrenos irregulares.", stock: 7 },
  { id: 7, name: "Pro Basketball Negro", price: 229999, image: "/img/shoe_7.png", description: "Diseño profesional con soporte de tobillo y amortiguación avanzada.", stock: 15 },
  { id: 8, name: "Casual Blanco", price: 139999, image: "/img/shoe_8.png", description: "Estilo minimalista y elegante, perfecto para cualquier ocasión.", stock: 20 },
  { id: 9, name: "Skate Amarillo", price: 169999, image: "/img/shoe_9.png", description: "Suela reforzada y diseño resistente.", stock: 11 },
];

// GET all products
router.get("/", (_req, res) => {
  res.json(products);
});

// GET product by ID - Validación mejorada
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  
  // Validación: ID debe ser un número positivo
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      error: "ID inválido. Debe ser un número positivo." 
    });
  }
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ 
      error: "Producto no encontrado" 
    });
  }
  
  res.json(product);
});

// Búsqueda de productos 
router.get("/search/:query", (req, res) => {
  const query = req.params.query.toLowerCase();
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );
  res.json(filtered);
});

// Filtro por rango de precio 
router.get("/filter/price", (req, res) => {
  const minPrice = Number(req.query.min) || 0;
  const maxPrice = Number(req.query.max) || Infinity;
  
  const filtered = products.filter(p => 
    p.price >= minPrice && p.price <= maxPrice
  );
  
  res.json(filtered);
});

export default router;