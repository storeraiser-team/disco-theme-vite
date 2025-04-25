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
```

## Build

To build for production:

```bash
yarn build
```

## Features

- Modern JavaScript with ES modules
- TailwindCSS support with 'd-' prefix
- AlpineJS for interactive components
- Hot Module Replacement (HMR)
- Optimized production builds
- Integrated with Shopify theme development workflow

## License

MIT