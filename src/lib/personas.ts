export type PersonaId = "riya_pet" | "arjun_snacks" | "meera_family" | "kabir_wfh";

export type OrderItem = {
  name: string;
  category: string;
  price: number;
  qty: number;
  lastOrderedDaysAgo: number;
};

export type Persona = {
  id: PersonaId;
  name: string;
  city: string;
  tagline: string;
  household: string[];
  orders: OrderItem[];
  gapCategories: string[];
  trigger: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "riya_pet",
    name: "Riya · Pet parent",
    city: "Bengaluru",
    tagline: "Weekly groceries + dog treats bought offline",
    household: ["cooks at home", "owns a Labrador", "rents 2BHK"],
    orders: [
      { name: "Amul Toned Milk 1L", category: "Dairy", price: 58, qty: 6, lastOrderedDaysAgo: 2 },
      { name: "Onion 1kg", category: "Vegetables", price: 35, qty: 2, lastOrderedDaysAgo: 3 },
      { name: "Britannia Marie Gold", category: "Snacks", price: 30, qty: 2, lastOrderedDaysAgo: 5 },
      { name: "Surf Excel 1kg", category: "Household", price: 210, qty: 1, lastOrderedDaysAgo: 12 },
      { name: "Eggs (6)", category: "Dairy & Eggs", price: 42, qty: 2, lastOrderedDaysAgo: 4 },
    ],
    gapCategories: ["Pet Supplies"],
    trigger: "Restock cycle · dog food usually runs out every 18 days",
  },
  {
    id: "arjun_snacks",
    name: "Arjun · Snack repeater",
    city: "Pune",
    tagline: "Late-night snacks; personal care still offline",
    household: ["lives alone", "WFH 3 days", "gym 4x/week"],
    orders: [
      { name: "Lay's Magic Masala", category: "Snacks", price: 20, qty: 4, lastOrderedDaysAgo: 1 },
      { name: "Coca-Cola 750ml", category: "Beverages", price: 40, qty: 3, lastOrderedDaysAgo: 2 },
      { name: "Maggi 4-pack", category: "Ready to cook", price: 56, qty: 2, lastOrderedDaysAgo: 3 },
      { name: "Amul Butter 100g", category: "Dairy", price: 58, qty: 1, lastOrderedDaysAgo: 6 },
    ],
    gapCategories: ["Personal Care", "Sports Nutrition"],
    trigger: "Occasion · Friday night restock + gym recovery Sunday",
  },
  {
    id: "meera_family",
    name: "Meera · Family shopper",
    city: "Mumbai",
    tagline: "Household essentials; baby aisle unused",
    household: ["2 kids (1 toddler)", "joint family help", "price sensitive"],
    orders: [
      { name: "Aashirvaad Atta 5kg", category: "Staples", price: 280, qty: 1, lastOrderedDaysAgo: 7 },
      { name: "Toor Dal 1kg", category: "Staples", price: 165, qty: 1, lastOrderedDaysAgo: 8 },
      { name: "Harpic 1L", category: "Household", price: 175, qty: 1, lastOrderedDaysAgo: 14 },
      { name: "Banana 1 dozen", category: "Fruits", price: 60, qty: 1, lastOrderedDaysAgo: 2 },
      { name: "Curd 400g", category: "Dairy", price: 35, qty: 3, lastOrderedDaysAgo: 2 },
    ],
    gapCategories: ["Baby Products"],
    trigger: "Life stage · toddler diapers currently bought at medical store",
  },
  {
    id: "kabir_wfh",
    name: "Kabir · WFH cook",
    city: "Hyderabad",
    tagline: "Cooks daily; never tried pharmacy/OTC on Instamart",
    household: ["cooks lunch daily", "mild allergies", "values speed"],
    orders: [
      { name: "Paneer 200g", category: "Dairy", price: 90, qty: 2, lastOrderedDaysAgo: 3 },
      { name: "Tomato 1kg", category: "Vegetables", price: 40, qty: 2, lastOrderedDaysAgo: 2 },
      { name: "Basmati Rice 1kg", category: "Staples", price: 145, qty: 1, lastOrderedDaysAgo: 10 },
      { name: "Olive Oil 500ml", category: "Cooking", price: 320, qty: 1, lastOrderedDaysAgo: 20 },
    ],
    gapCategories: ["Pharmacy & Wellness"],
    trigger: "Weather/season · monsoon cold & allergy flare",
  },
];

export type ShortlistSku = {
  name: string;
  category: string;
  price: number;
  reason: string;
  priceAnchor: string;
  riskReversal: string;
};

export const GAP_CATALOGS: Record<string, ShortlistSku[]> = {
  "Pet Supplies": [
    {
      name: "Pedigree Adult Chicken 3kg",
      category: "Pet Supplies",
      price: 649,
      reason: "Matches Labrador adult feeding; popular starter bag size",
      priceAnchor: "~₹216/kg · similar to nearby pet store packs",
      riskReversal: "Easy replace if seal damaged · start with 3kg not 10kg",
    },
    {
      name: "Drools Absolute Calcium Bones",
      category: "Pet Supplies",
      price: 199,
      reason: "Low-commitment treat to test delivery quality before food bags",
      priceAnchor: "Under ₹200 trial",
      riskReversal: "If quality concerns, replace within delivery window",
    },
    {
      name: "Simple Pet Wet Wipes (80)",
      category: "Pet Supplies",
      price: 149,
      reason: "Household-adjacent SKU; bridges grocery → pet aisle",
      priceAnchor: "Parity with supermarket",
      riskReversal: "Non-perishable · zero freshness risk",
    },
  ],
  "Personal Care": [
    {
      name: "Dove Men+Care Body Wash 250ml",
      category: "Personal Care",
      price: 199,
      reason: "Gym routine adjacency from your snack/recovery pattern",
      priceAnchor: "Within ₹10 of offline chemist",
      riskReversal: "Sealed FMCG · full replace if leaked",
    },
    {
      name: "Minimalist 10% Niacinamide 30ml",
      category: "Personal Care",
      price: 599,
      reason: "High-intent skincare trial with clear usage instructions",
      priceAnchor: "Same MRP as Nykaa",
      riskReversal: "Authenticity seal check on delivery photo",
    },
    {
      name: "Colgate Sensitive 80g",
      category: "Personal Care",
      price: 145,
      reason: "Lowest-risk entry into personal care aisle",
      priceAnchor: "Kirana parity",
      riskReversal: "Familiar brand · zero learning curve",
    },
  ],
  "Baby Products": [
    {
      name: "Pampers Baby Dry (S) 44",
      category: "Baby Products",
      price: 549,
      reason: "Toddler size match · replaces medical-store emergency buys",
      priceAnchor: "~₹12.5/pc · compare to chemist",
      riskReversal: "Unopened pack replace guaranteed",
    },
    {
      name: "Himalaya Baby Lotion 200ml",
      category: "Baby Products",
      price: 210,
      reason: "Trusted Indian brand lowers first-purchase anxiety",
      priceAnchor: "Pharmacy parity",
      riskReversal: "Sealed FMCG",
    },
    {
      name: "Johnson's Baby Wipes 72",
      category: "Baby Products",
      price: 149,
      reason: "Small basket add during grocery run",
      priceAnchor: "Under ₹150",
      riskReversal: "Non-food · no freshness worry",
    },
  ],
  "Pharmacy & Wellness": [
    {
      name: "Crocin Advance 15 tabs",
      category: "Pharmacy & Wellness",
      price: 30,
      reason: "Monsoon cold kit starter · tiny commitment",
      priceAnchor: "Chemist MRP",
      riskReversal: "Check expiry on delivery · replace if <6 months",
    },
    {
      name: "Vicks VapoRub 25ml",
      category: "Pharmacy & Wellness",
      price: 99,
      reason: "Seasonal trigger match for your allergy household",
      priceAnchor: "Kirana parity",
      riskReversal: "Long shelf life",
    },
    {
      name: "Dettol Handwash 200ml",
      category: "Pharmacy & Wellness",
      price: 99,
      reason: "Bridge from kitchen staples into wellness aisle",
      priceAnchor: "Supermarket parity",
      riskReversal: "Everyday brand",
    },
  ],
  "Sports Nutrition": [
    {
      name: "MuscleBlaze Whey 1kg",
      category: "Sports Nutrition",
      price: 1899,
      reason: "Gym 4x adjacency from snack pattern",
      priceAnchor: "Compare vs HealthKart before checkout",
      riskReversal: "Authenticity hologram · sealed jar photos on delivery",
    },
    {
      name: "ORS Powder Orange 21g (3)",
      category: "Sports Nutrition",
      price: 45,
      reason: "Micro-trial before protein commitment",
      priceAnchor: "Chemist parity",
      riskReversal: "Under ₹50",
    },
    {
      name: "Yoga Bar Protein Bar",
      category: "Sports Nutrition",
      price: 75,
      reason: "Snack aisle → nutrition bridge",
      priceAnchor: "Café parity",
      riskReversal: "Single serve",
    },
  ],
};

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}

export function shortlistForPersona(persona: Persona): ShortlistSku[] {
  const out: ShortlistSku[] = [];
  for (const gap of persona.gapCategories) {
    const skus = GAP_CATALOGS[gap] || [];
    out.push(...skus.slice(0, 3));
  }
  return out.slice(0, 3);
}
