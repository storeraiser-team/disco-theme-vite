#!/bin/bash
# Disco Theme Setup Script

set -e

echo "🚀 Welcome to Disco Shopify Theme Setup Wizard!"
echo "This script will help you set up a new Shopify theme project."
echo

# Function to ask questions
ask() {
  local prompt="$1"
  local default="$2"
  local var_name="$3"
  
  if [ -n "$default" ]; then
    read -p "$prompt [$default]: " answer
    answer=${answer:-$default}
  else
    read -p "$prompt: " answer
  fi
  
  eval "$var_name=\"$answer\""
}

# Ask for store name
ask "What is the name of your store" "" store_name

# Try to get repository name from .git/config
repo_name=""
if [ -f ".git/config" ]; then
  # Extract repository URL and get the name
  repo_url=$(grep -E 'url = .*' .git/config | head -n 1 | sed 's/.*url = //g')
  if [ -n "$repo_url" ]; then
    # Extract repository name from URL (remove .git at the end if it exists)
    repo_name=$(basename "$repo_url" .git)
  fi
fi

# If repository name wasn't found, generate one based on store name
if [ -z "$repo_name" ]; then
  default_repo=$(echo "$store_name" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
  ask "What will be the repository name" "$default_repo" repo_name
fi

# Ask for Shopify store domain
ask "What is your Shopify store domain (e.g. my-store.myshopify.com)" "" store_domain

# Since this script is intended to be run within the template itself,
# we assume we are already in the template directory
echo -e "\n✅ Using current directory as template"

echo -e "\n📦 Downloading template..."
# Git clone
git clone https://github.com/storeraiser-team/disco-theme-vite.git temp
rm -rf temp/.git
rm -rf temp/README.md
rm temp/install.sh
cp -a temp/. .
rm -rf temp

echo "✅ Template downloaded successfully!"

# Update package.json
echo -e "\n🔄 Updating package.json..."

# Replace values directly in package.json with sed
if [ -f "package.json" ]; then
  # Replace values in package.json
  sed -i '' "s/\"name\": \"[^\"]*\"/\"name\": \"$store_name\"/" package.json
  sed -i '' "s|\"url\": \"git+https://github.com/storeraiser-team/\[repo-name\].git\"|\"url\": \"git+https://github.com/storeraiser-team/$repo_name.git\"|" package.json
  sed -i '' "s|\"url\": \"https://github.com/storeraiser-team/\[repo-name\]/issues\"|\"url\": \"https://github.com/storeraiser-team/$repo_name/issues\"|" package.json
  sed -i '' "s/\[store-domain\]/$store_domain/g" package.json
fi

echo "✅ package.json updated successfully!"

# Ask if dependencies should be installed
read -p "Do you want to install dependencies now? (Y/n): " install_deps
if [[ "$install_deps" =~ ^[Nn]$ ]]; then
  install_deps="false"
else
  install_deps="true"
fi

# Install dependencies if requested
if [ "$install_deps" = "true" ]; then
  echo -e "\n📦 Installing dependencies..."
  if command -v yarn &> /dev/null; then
    yarn install
  else
    npm install
  fi
  echo "✅ Dependencies installed successfully!"
fi

# Advise user to add Vite code to theme.liquid
echo -e "\n📝 Important: You need to add the following code to your layout/theme.liquid file:"
echo -e "{% liquid"
echo -e "  # Relative to entrypointsDir"
echo -e "  render 'vite-tag' with 'store.css'"
echo -e "  render 'vite-tag' with 'store.js'"
echo -e "%}\n"
echo "This will ensure your Vite assets are properly loaded in your theme."

echo -e "\n🎉 Setup complete! You can now start developing with:"
echo "  yarn dev"