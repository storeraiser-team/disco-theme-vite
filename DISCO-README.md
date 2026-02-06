# Disco Theme Vite

A modern Shopify theme development setup using Vite.

## Installation

You can quickly set up the Disco Theme Vite by running the following command:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/storeraiser-team/disco-theme-vite/main/install.sh)"
```

This script will:
1. Clone the repository into your current directory
2. Configure the project with your store name and domain
3. Install all required dependencies (optional)

## Important: Theme Configuration

**Warning:** Do not add any Vite code directly to your `theme.liquid` file. This can cause conflicts and break your theme.

After installation, you need to add the following code to your `layout/theme.liquid` file:

```liquid
{% liquid
  # Relative to entrypointsDir
  render 'vite-tag' with 'store.css'
  render 'vite-tag' with 'store.js'
%}
```

This will ensure your Vite assets are properly loaded in your theme.

## Development

To start the development server:

```bash
yarn dev
# or with npm
npm run dev
```

## Build

To build for production:

```bash
yarn build
# or with npm
npm run build
```

## Features

- Modern JavaScript with ES modules
- TailwindCSS support with 'd-' prefix
- AlpineJS with 'disco-' prefix for interactive components
- Hot Module Replacement (HMR)
- Optimized production builds
- Integrated with Shopify theme development workflow

## Included Packages

- **AlpineJS** - Lightweight JavaScript framework
  - AlpineJS Mask - For input masking
  - AlpineJS Persist - For local storage persistence
- **Splide.js** - Lightweight and flexible carousel/slider
- **TailwindCSS** - Utility-first CSS framework
  - TailwindCSS Forms - Better form styling
  - tailwindcss-rem-to-px - Conversion plugin

## Alpine JS Stores

The theme includes pre-configured Alpine JS stores for common functionality:

### Cart Store
- `discoAlpine.store('cart')` - Handles cart operations
  - `fetchItems()` - Get cart items
  - `addItem(formData, options)` - Add item to cart
  - `addItems(items, options)` - Add multiple items
  - `updateItem(item)` - Update cart item
  - `updateItems(items)` - Update multiple items
  - `clear()` - Clear cart

### Product Store
- `discoAlpine.store('product')` - Handles product operations
  - `fetch(product, optionValues, variantId, sectionId)` - Fetch product data

### Slider Store
- `discoAlpine.store('slider')` - Manages Splide sliders
  - `mount(el)` - Initialize sliders

## Custom Directives

- `disco-money` - Format price values as currency
  - Example: `<span disco-money="product.price"></span>`
  - With decimal values: `<span disco-money.decimal="product.price_decimal"></span>`

## License

MIT