declare const process: any;
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting official TEZLAA database seed from menu...');

  // 1. Branches
  const malabeBranch = await prisma.branch.upsert({
    where: { slug: 'tezlaa-malabe-flagship' },
    update: {},
    create: {
      name: 'TEZLAA Malabe Flagship Café',
      slug: 'tezlaa-malabe-flagship',
      address: 'No 450, Kaduwela Road, Malabe, Sri Lanka',
      phone: '+94 74 412 4503',
      email: 'info@tezlaa.com',
      latitude: 6.9044,
      longitude: 79.9547,
      openingHours: '7:00 AM - 11:00 PM (Monday - Sunday)',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop',
    },
  });

  console.log(`✅ Seeded branch: ${malabeBranch.name}`);

  // 2. Categories
  const categoryDefs = [
    {
      name: 'Hot Coffee',
      slug: 'hot-coffee',
      description: 'Handcrafted espresso, artisan pour-overs, and steamed lattes.',
      displayOrder: 1,
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Cold Coffee',
      slug: 'cold-coffee',
      description: 'Signature iced coffees, cold brews, and iced Spanish lattes.',
      displayOrder: 2,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Cold Matcha & Specialty',
      slug: 'cold-matcha-specialty',
      description: 'Premium ceremonial Japanese matcha, matcha espresso, and fruit blends.',
      displayOrder: 3,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Non Coffee & Chocolate',
      slug: 'non-coffee-chocolate',
      description: 'Rich Belgian hot & cold chocolate, gourmet teas, and warm matcha.',
      displayOrder: 4,
      imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Milkshakes & Smoothies',
      slug: 'milkshakes-smoothies',
      description: 'Creamy milkshakes, refreshing fruit granitas, and thick smoothies.',
      displayOrder: 5,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Signature Mocktails & Mojitos',
      slug: 'mocktails-mojitos',
      description: 'Artisan sparkling mojitos and TEZLAA signature mocktails.',
      displayOrder: 6,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Sourdough Toast & Bakery',
      slug: 'sourdough-toast-bakery',
      description: 'Slow-fermented artisan sourdough toast, savory toppings, and baguettes.',
      displayOrder: 7,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Bagels & Croissants',
      slug: 'bagels-croissants',
      description: 'French laminated butter croissants and toasted gourmet bagels.',
      displayOrder: 8,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Sandwiches & Burgers',
      slug: 'sandwiches-burgers',
      description: 'Gourmet café sandwiches and juicy artisan beef & chicken burgers.',
      displayOrder: 9,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Rice, Pasta & Mains',
      slug: 'rice-pasta-mains',
      description: 'Authentic nasi goreng, peri-peri chicken, moussaka, and creamy pastas.',
      displayOrder: 10,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryDefs) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`✅ Seeded ${categoryDefs.length} categories.`);

  // 3. Official Products Seed
  const products = [
    // Hot Coffee
    {
      name: 'Espresso',
      slug: 'espresso',
      categorySlug: 'hot-coffee',
      description: 'Intense, aromatic single shot pulled from locally roasted TEZLAA signature beans.',
      price: 450,
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600&auto=format&fit=crop',
      rating: 4.8,
      ratingCount: 88,
      isFeatured: false,
    },
    {
      name: 'Flat White',
      slug: 'flat-white',
      categorySlug: 'hot-coffee',
      description: 'Double shot espresso balanced with silky, micro-foamed milk.',
      price: 650,
      imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 142,
      isFeatured: true,
    },
    {
      name: 'Cappuccino',
      slug: 'cappuccino',
      categorySlug: 'hot-coffee',
      description: 'Rich espresso topped with deep layer of velvety foamed milk and dusted cocoa.',
      price: 730,
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 198,
      isFeatured: true,
      variants: [
        { name: 'Medium (12oz)', price: 730 },
        { name: 'Large (16oz)', price: 950 },
      ],
    },
    {
      name: 'Café Latte',
      slug: 'cafe-latte',
      categorySlug: 'hot-coffee',
      description: 'Smooth espresso with steamed fresh milk and a delicate layer of crema.',
      price: 760,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=600&auto=format&fit=crop',
      rating: 4.8,
      ratingCount: 110,
      isFeatured: true,
      variants: [
        { name: 'Medium (12oz)', price: 760 },
        { name: 'Large (16oz)', price: 980 },
      ],
    },
    {
      name: 'Spanish Latte',
      slug: 'spanish-latte',
      categorySlug: 'hot-coffee',
      description: 'Espresso combined with sweetened condensed milk and velvety textured milk.',
      price: 880,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 220,
      isFeatured: true,
    },

    // Cold Coffee
    {
      name: 'Iced Spanish Latte',
      slug: 'iced-spanish-latte',
      categorySlug: 'cold-coffee',
      description: 'Espresso poured over ice with sweetened milk blend. A TEZLAA signature best-seller.',
      price: 950,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop',
      rating: 5.0,
      ratingCount: 310,
      isFeatured: true,
      variants: [
        { name: 'Medium (12oz)', price: 950 },
        { name: 'Large (16oz)', price: 1150 },
      ],
    },
    {
      name: 'Iced Caramel Macchiato',
      slug: 'iced-caramel-macchiato',
      categorySlug: 'cold-coffee',
      description: 'Chilled milk marked with espresso and drizzled with buttery caramel sauce.',
      price: 1050,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=800',
      rating: 4.9,
      ratingCount: 175,
      isFeatured: true,
      variants: [
        { name: 'Medium (12oz)', price: 1050 },
        { name: 'Large (16oz)', price: 1150 },
      ],
    },

    // Cold Matcha
    {
      name: 'Strawberry Matcha',
      slug: 'strawberry-matcha',
      categorySlug: 'cold-matcha-specialty',
      description: 'Layered house-made strawberry compote, chilled fresh milk, and whisked ceremonial Uji matcha.',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 165,
      isFeatured: true,
    },
    {
      name: 'Nutella Matcha',
      slug: 'nutella-matcha',
      categorySlug: 'cold-matcha-specialty',
      description: 'Decadent Nutella spread base, textured milk, and premium cold matcha.',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop',
      rating: 4.8,
      ratingCount: 90,
      isFeatured: false,
    },

    // Sourdough Toast
    {
      name: 'Smoked Salmon & Avocado Sourdough',
      slug: 'smoked-salmon-avocado-sourdough',
      categorySlug: 'sourdough-toast-bakery',
      description: 'Artisan sourdough topped with smashed Haas avocado, Norwegian smoked salmon, capers, and dill.',
      price: 2300,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 140,
      isFeatured: true,
    },
    {
      name: 'Garlic Spinach & Scrambled Egg Sourdough',
      slug: 'garlic-spinach-scrambled-egg-sourdough',
      categorySlug: 'sourdough-toast-bakery',
      description: 'Toasted artisan sourdough with sautéed garlic baby spinach and fluffy scrambled eggs.',
      price: 900,
      imageUrl: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=600&auto=format&fit=crop',
      rating: 4.7,
      ratingCount: 75,
      isFeatured: false,
    },

    // Croissants & Bagels
    {
      name: 'Ham & Cheese Croissant',
      slug: 'ham-cheese-croissant',
      categorySlug: 'bagels-croissants',
      description: 'Flaky 72-hour fermented French butter croissant filled with premium sliced ham and melted cheese.',
      price: 1250,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 210,
      isFeatured: true,
    },
    {
      name: 'Smoked Chicken & Cheese Bagel',
      slug: 'smoked-chicken-cheese-bagel',
      categorySlug: 'bagels-croissants',
      description: 'Toasted seeded bagel layered with tender smoked chicken, cheddar cheese, and house relish.',
      price: 1250,
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=600&auto=format&fit=crop',
      rating: 4.8,
      ratingCount: 115,
      isFeatured: false,
    },

    // Burgers
    {
      name: 'Crispy Chicken Burger',
      slug: 'crispy-chicken-burger',
      categorySlug: 'sandwiches-burgers',
      description: 'Golden buttermilk fried chicken thigh with secret TEZLAA sauce, lettuce, and pickles in a brioche bun.',
      price: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 280,
      isFeatured: true,
    },
    {
      name: 'Classic Double Beef Burger',
      slug: 'classic-double-beef-burger',
      categorySlug: 'sandwiches-burgers',
      description: 'Two juicy smash beef patties, double aged cheddar, caramelized onions, and house burger sauce.',
      price: 2600,
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=600&auto=format&fit=crop',
      rating: 4.9,
      ratingCount: 195,
      isFeatured: true,
    },

    // Rice & Pasta
    {
      name: 'Chicken Nasi Goreng',
      slug: 'chicken-nasi-goreng',
      categorySlug: 'rice-pasta-mains',
      description: 'Indonesian style wok-tossed jasmine rice with chicken skewers, fried egg, prawn crackers, and sambal.',
      price: 1390,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
      rating: 4.8,
      ratingCount: 320,
      isFeatured: true,
    },
    {
      name: 'Creamy Garlic Prawn Pasta',
      slug: 'creamy-garlic-prawn-pasta',
      categorySlug: 'rice-pasta-mains',
      description: 'Pan-seared ocean prawns tossed with fettuccine in a rich garlic white wine parmesan cream sauce.',
      price: 2200,
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
      rating: 4.9,
      ratingCount: 180,
      isFeatured: true,
    },
  ];

  for (const item of products) {
    const category = categories[item.categorySlug];
    if (!category) continue;

    const { categorySlug, variants, ...prodData } = item;

    const createdProduct = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        ...prodData,
        categoryId: category.id,
      },
      create: {
        ...prodData,
        categoryId: category.id,
      },
    });

    // 1. Seed Product Variants if defined
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await prisma.productVariant.upsert({
          where: {
            productId_name: {
              productId: createdProduct.id,
              name: variant.name,
            },
          },
          update: {
            price: variant.price,
            isAvailable: true,
          },
          create: {
            productId: createdProduct.id,
            name: variant.name,
            price: variant.price,
            isAvailable: true,
          },
        });
      }
    }

    // 2. Deterministic Addons for beverages and foods
    if (category.slug.includes('coffee') || category.slug.includes('matcha')) {
      const beverageAddons = [
        { name: 'Oat Milk Alternative', price: 420 },
        { name: 'Almond Milk Alternative', price: 580 },
        { name: 'Extra Espresso Shot', price: 400 },
        { name: 'Vanilla Syrup', price: 200 },
        { name: 'Caramel Syrup', price: 250 },
        { name: 'Hazelnut Syrup', price: 200 },
      ];
      for (const addon of beverageAddons) {
        await prisma.productAddon.upsert({
          where: {
            productId_name: {
              productId: createdProduct.id,
              name: addon.name,
            },
          },
          update: {
            price: addon.price,
          },
          create: {
            productId: createdProduct.id,
            name: addon.name,
            price: addon.price,
          },
        });
      }
    } else {
      const foodAddons = [
        { name: 'Cheese Slice', price: 180 },
        { name: 'French Fries (Side)', price: 300 },
        { name: 'Potato Wedges', price: 300 },
        { name: 'Two Fried Eggs', price: 180 },
        { name: 'Bockwurst Sausage', price: 180 },
      ];
      for (const addon of foodAddons) {
        await prisma.productAddon.upsert({
          where: {
            productId_name: {
              productId: createdProduct.id,
              name: addon.name,
            },
          },
          update: {
            price: addon.price,
          },
          create: {
            productId: createdProduct.id,
            name: addon.name,
            price: addon.price,
          },
        });
      }
    }
  }

  // 4. Seed Standard Coupons (Idempotent)
  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% discount on your first artisan order',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      minOrderValue: 1000,
      maxDiscount: 500,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
      usageLimit: 1000,
      isActive: true,
    },
    {
      code: 'TEZLAA500',
      description: 'Flat Rs. 500 off on gourmet mains over Rs. 2,500',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 500,
      minOrderValue: 2500,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
      usageLimit: 500,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 5. Seed Loyalty Rewards (Idempotent)
  const rewards = [
    {
      title: 'Free Artisan Espresso Shot',
      description: 'Complimentary extra single origin espresso shot',
      pointsRequired: 150,
      rewardType: 'FREE_ITEM',
      discountValue: 400,
      isActive: true,
    },
    {
      title: 'Complimentary Butter Croissant',
      description: 'Freshly baked French laminated butter croissant',
      pointsRequired: 350,
      rewardType: 'FREE_ITEM',
      discountValue: 650,
      isActive: true,
    },
    {
      title: 'Rs. 1,000 Off Any Order',
      description: 'Redeem 800 TEZLAA Circle points for Rs. 1,000 store credit',
      pointsRequired: 800,
      rewardType: 'DISCOUNT_VOUCHER',
      discountValue: 1000,
      isActive: true,
    },
  ];

  for (const r of rewards) {
    const existing = await prisma.reward.findFirst({ where: { title: r.title } });
    if (existing) {
      await prisma.reward.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.reward.create({ data: r });
    }
  }

  console.log(`✅ Seeded ${products.length} official TEZLAA products with variants and addons.`);
  console.log('✨ Official menu seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
