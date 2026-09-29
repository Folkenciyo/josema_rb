"""Allowed category/subcategory pairs for the curated food catalog.

Only the seed batches are validated against this list. The trainer stays free to
type anything from the UI, exactly like exercise attributes.
"""

TAXONOMY: dict[str, tuple[str, ...]] = {
    "Proteína animal": (
        "Carne roja",
        "Aves",
        "Pescado blanco",
        "Pescado azul",
        "Marisco",
        "Huevos",
        "Embutidos",
    ),
    "Lácteos": ("Leche", "Yogur", "Queso", "Bebidas vegetales"),
    "Proteína vegetal": ("Legumbres", "Soja y derivados", "Proteína en polvo"),
    "Hidratos": ("Cereales y granos", "Pan", "Pasta", "Arroz", "Tubérculos"),
    "Verduras": ("Hoja verde", "Hortalizas", "Setas"),
    "Frutas": ("Fruta fresca", "Fruta desecada"),
    "Grasas": ("Aceites", "Frutos secos", "Semillas", "Aguacate y otros"),
    "Otros": (
        "Salsas y condimentos",
        "Bebidas",
        "Barritas y snacks",
        "Platos preparados",
    ),
    # Zero-macro by design: dosed in capsules/scoops, not eaten as food. A few
    # (ciclodextrina, mass gainer) do carry real calories in reality, but the
    # trainer's own plans never count them toward a meal's totals either.
    "Suplementos": (
        "Vitaminas y minerales",
        "Rendimiento deportivo",
        "Digestivos",
    ),
}
