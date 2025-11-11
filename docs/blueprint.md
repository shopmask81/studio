# **App Name**: MaskShopv2

## Core Features:

- Product Display: Fetch product data from the existing Firestore database and display it in a responsive grid layout on the home page.
- Firestore Integration: Connect to the existing Firestore database using environment variables from the .env.local file to retrieve and display product data. Firebase Auth setup for user authentication.
- User Authentication: Implement Firebase Authentication for user login, registration, and account management functionalities.
- Dark/Light Mode Toggle: Allow users to switch between dark and light mode for enhanced accessibility and user experience.
- Affiliate Link Generation: Provide a feature for users in the affiliate program to generate trackable links for products.
- Wishlist Functionality: Enable users to save favorite items to a wishlist for future purchase.
- Shopping Cart and Checkout: Implement a shopping cart system with checkout functionality for processing orders.

## Style Guidelines:

- Dark theme with #0F0F0F as the primary background.
- Use #E6E1D3 for primary text to ensure readability on the dark background.
- Employ #3E7660 for buttons and links, providing a distinct and thematic highlight.
- #5FAF8E to indicate interactivity on hover for links and buttons.
- 'Playfair' (serif) for titles to maintain an elegant and readable aesthetic. Note: currently only Google Fonts are supported.
- 'Lato' (sans-serif) for the main body text to provide clarity. Note: currently only Google Fonts are supported.
- Use simple, line-based icons for the header and other UI elements, ensuring they are legible and match the aesthetic.
- Implement rounded corners (border-radius: 12px) on cards and other containers to soften the overall look.
- Apply subtle card shadows (shadow-md) to give depth to elements.
- Incorporate smooth transitions and animations for UI elements, such as the dark/light mode toggle and cart updates.