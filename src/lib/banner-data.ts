export type Banner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  link?: string;
  cta?: string;
};

export const banners: Banner[] = [
  {
    id: 'artisan-jewelry',
    title: 'Gems of the Nile',
    description:
      'Discover handcrafted jewelry inspired by ancient Egyptian motifs and timeless elegance.',
    imageUrl:
      'https://images.unsplash.com/photo-1610041324267-33dc2d12e659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxhcnRpc2FuYWwlMjBqZXdlbHJ5fGVufDB8fHx8MTc2MjkzOTM5OHww&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'artisanal jewelry',
    link: '/products/jewelry',
    cta: 'Explore Jewelry',
  },
  {
    id: 'handmade-decor',
    title: 'Woven with Soul',
    description:
      'Adorn your home with unique, handmade decor that tells a story of tradition and artistry.',
    imageUrl:
      'https://images.unsplash.com/photo-1524238899696-ed8785a46353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxoYW5kbWFkZSUyMGRlY29yfGVufDB8fHx8MTc2MjkzOTM5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'handmade decor',
    link: '/products/decor',
    cta: 'Shop Decor',
  },
  {
    id: 'special-offer',
    title: 'Special Offer',
    description: 'Get 20% off on all handmade pottery for a limited time.',
    imageUrl:
      'https://images.unsplash.com/photo-1554998176-7a8a25a35c59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxoYW5kbWFkZSUyMHBvdHRlcnl8ZW58MHx8fHwxNzYyOTM5NDAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'handmade pottery',
    link: '/products/pottery',
    cta: 'View Offer',
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    description: 'Freshly crafted. Explore the latest additions to our collection.',
    imageUrl:
      'https://images.unsplash.com/photo-1551893669-99435b6a789d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxydXN0aWMlMjBjcmFmdCUyMG1hcmtldHxlbnwwfHx8fDE3NjI5Mzk0MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'craft market',
    link: '/products/new',
    cta: 'Discover Now',
  },
  {
    id: 'leather-craft',
    title: 'The Art of Leather',
    description:
      'Timeless quality and rugged elegance in every stitch. Explore our collection of handmade leather goods.',
    imageUrl:
      'https://images.unsplash.com/photo-1629457432822-95932d037497?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxsZWF0aGVyJTIwY3JhZnR8ZW58MHx8fHwxNzYyOTM5NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'leather craft',
    link: '/products/leather',
    cta: 'Shop Leather',
  },
  {
    id: 'woodworking',
    title: 'Carved by Hand',
    description:
      "From intricate boxes to elegant bowls, discover the warmth of masterfully worked wood.",
    imageUrl:
      'https://images.unsplash.com/photo-1495496035622-998813a3b593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3b29kd29ya2luZ3xlbnwwfHx8fDE3NjI5Mzk0MDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'woodworking',
    link: '/products/wood',
    cta: 'Explore Woodcraft',
  },
   {
    id: 'seasonal-discounts',
    title: 'Summer Sale',
    description:
      "Embrace the season with special discounts on our most popular items. Up to 40% off.",
    imageUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdW1tZXIlMjB0cmF2ZWx8ZW58MHx8fHwxNzYyOTM5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'summer travel',
    link: '/sale',
    cta: 'Shop the Sale',
  },
  {
    id: 'textile-art',
    title: 'Threads of History',
    description:
      "Experience the rich texture and vibrant colors of traditional North-African textiles.",
    imageUrl:
      'https://images.unsplash.com/photo-1561026442-3a4a1a4a69d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHx0ZXh0aWxlJTIwYXJ0fGVufDB8fHx8MTc2MjkzOTM5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'textile art',
    link: '/products/textiles',
    cta: 'View Textiles',
  },
   {
    id: 'black-friday',
    title: 'Black Friday Deals',
    description:
      "Our biggest sale of the year is here. Don't miss out on exclusive offers.",
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwYmxhY2t8ZW58MHx8fHwxNzYyOTQwMDUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'black product',
    link: '/black-friday',
    cta: 'Shop Now',
  },
    {
    id: 'vintage-market',
    title: 'The Vintage Collection',
    description:
      "Unique finds with a rich history. Each piece tells a story of a time gone by.",
    imageUrl:
      'https://images.unsplash.com/photo-1542037104857-e67931327a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx2aW50YWdlJTIwbWFya2V0fGVufDB8fHx8MTc2MjkzOTQwMXww&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'vintage market',
    link: '/products/vintage',
    cta: 'Explore Vintage',
  },
];
