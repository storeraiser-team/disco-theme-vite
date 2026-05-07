#!/bin/bash
# Disco Theme Setup Script

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║       Disco Theme — Setup Wizard         ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Perguntas iniciais ────────────────────────────────────────────────────────
ask() {
  local prompt="$1"
  local default="$2"
  local var_name="$3"
  if [ -n "$default" ]; then
    read -p "$(echo -e "  ${YELLOW}$prompt${NC} [${DIM}$default${NC}]: ")" answer
    answer=${answer:-$default}
  else
    read -p "$(echo -e "  ${YELLOW}$prompt${NC}: ")" answer
  fi
  eval "$var_name=\"$answer\""
}

ask "Nome da loja" "" store_name

repo_name=""
if [ -f ".git/config" ]; then
  repo_url=$(grep -E 'url = .*' .git/config | head -n 1 | sed 's/.*url = //g')
  [ -n "$repo_url" ] && repo_name=$(basename "$repo_url" .git)
fi

if [ -z "$repo_name" ]; then
  default_repo=$(echo "$store_name" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
  ask "Nome do repositório" "$default_repo" repo_name
fi

ask "Domínio Shopify (ex: minha-loja.myshopify.com)" "" store_domain

echo ""
echo -e "  ${DIM}Usando diretório atual como destino do template.${NC}"

# ── Download do template ──────────────────────────────────────────────────────
echo ""
echo -e "  ${DIM}Baixando template...${NC}"
git clone https://github.com/storeraiser-team/disco-theme-vite.git temp
rm -rf temp/.git temp/README.md temp/install.sh
mv temp/.github/workflows-dev temp/.github/workflows
cp -a temp/. .
rm -rf temp
echo -e "  ${GREEN}✓  Template baixado.${NC}"

# ── Atualizar package.json ────────────────────────────────────────────────────
echo ""
echo -e "  ${DIM}Atualizando package.json...${NC}"

is_windows=false
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  is_windows=true
elif command -v cmd.exe &>/dev/null; then
  is_windows=true
fi

if [ -f "package.json" ]; then
  if [ "$is_windows" = true ]; then
    sed -i "s/\"name\": \"[^\"]*\"/\"name\": \"$store_name\"/" package.json
    sed -i "s|\"url\": \"git+https://github.com/storeraiser-team/\[repo-name\].git\"|\"url\": \"git+https://github.com/storeraiser-team/$repo_name.git\"|" package.json
    sed -i "s|\"url\": \"https://github.com/storeraiser-team/\[repo-name\]/issues\"|\"url\": \"https://github.com/storeraiser-team/$repo_name/issues\"|" package.json
    sed -i "s/\[store-domain\]/$store_domain/g" package.json
  else
    sed -i '' "s/\"name\": \"[^\"]*\"/\"name\": \"$store_name\"/" package.json
    sed -i '' "s|\"url\": \"git+https://github.com/storeraiser-team/\[repo-name\].git\"|\"url\": \"git+https://github.com/storeraiser-team/$repo_name.git\"|" package.json
    sed -i '' "s|\"url\": \"https://github.com/storeraiser-team/\[repo-name\]/issues\"|\"url\": \"https://github.com/storeraiser-team/$repo_name/issues\"|" package.json
    sed -i '' "s/\[store-domain\]/$store_domain/g" package.json
  fi
fi
echo -e "  ${GREEN}✓  package.json atualizado.${NC}"

# ── Instalar dependências ─────────────────────────────────────────────────────
echo ""
read -p "$(echo -e "  ${YELLOW}Instalar dependências agora? (S/n)${NC} ")" install_deps
install_deps="${install_deps:-S}"
if [[ ! "$install_deps" =~ ^[Nn]$ ]]; then
  echo ""
  echo -e "  ${DIM}Instalando dependências...${NC}"
  if command -v yarn &>/dev/null; then
    yarn install
  else
    npm install
  fi
  echo -e "  ${GREEN}✓  Dependências instaladas.${NC}"
fi

# ── Injetar vite-tag no theme.liquid ─────────────────────────────────────────
THEME_LIQUID="layout/theme.liquid"
VITE_CSS="{%- render 'vite-tag' with 'store.css' -%}"
VITE_JS="{%- render 'vite-tag' with 'store.js' -%}"
ANCHOR="{{ content_for_header }}"

inject_vite_tags() {
  local file="$1"

  # Idempotente — pula se já estiver presente
  if grep -qF "vite-tag" "$file"; then
    echo -e "  ${DIM}vite-tag já presente em $file, pulando.${NC}"
    return 0
  fi

  local line_num
  line_num=$(grep -n "{{ content_for_header }}" "$file" | head -1 | cut -d: -f1)

  if [ -z "$line_num" ]; then
    return 1
  fi

  if [ "$is_windows" = true ]; then
    sed -i "${line_num}a\\  $VITE_CSS\n  $VITE_JS" "$file"
  else
    # macOS sed: inserir duas linhas separadas após o anchor
    sed -i '' "${line_num}a\\
  $VITE_JS
" "$file"
    sed -i '' "${line_num}a\\
  $VITE_CSS
" "$file"
  fi

  echo -e "  ${GREEN}✓  vite-tag adicionado em $file após {{ content_for_header }}.${NC}"
}

echo ""
if [ -f "$THEME_LIQUID" ]; then
  read -p "$(echo -e "  ${YELLOW}Adicionar chamada dos arquivos Vite ao layout/theme.liquid? (S/n)${NC} ")" add_vite
  add_vite="${add_vite:-S}"
  if [[ ! "$add_vite" =~ ^[Nn]$ ]]; then
    if ! inject_vite_tags "$THEME_LIQUID"; then
      echo -e "  ${YELLOW}⚠  Anchor '{{ content_for_header }}' não encontrado em $THEME_LIQUID.${NC}"
      echo -e "  ${DIM}Adicione manualmente após {{ content_for_header }}:${NC}"
      echo ""
      echo -e "  ${DIM}  $VITE_CSS${NC}"
      echo -e "  ${DIM}  $VITE_JS${NC}"
      echo ""
    fi
  else
    echo ""
    echo -e "  ${DIM}Adicione manualmente ao layout/theme.liquid após {{ content_for_header }}:${NC}"
    echo ""
    echo -e "  ${DIM}  $VITE_CSS${NC}"
    echo -e "  ${DIM}  $VITE_JS${NC}"
    echo ""
  fi
else
  echo -e "  ${YELLOW}⚠  layout/theme.liquid não encontrado.${NC}"
  echo -e "  ${DIM}Adicione manualmente após {{ content_for_header }}:${NC}"
  echo ""
  echo -e "  ${DIM}  $VITE_CSS${NC}"
  echo -e "  ${DIM}  $VITE_JS${NC}"
  echo ""
fi

# ── Finalização ───────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}✓  Setup concluído!${NC} Inicie o desenvolvimento com:"
echo ""
if command -v yarn &>/dev/null; then
  echo -e "  ${BOLD}yarn dev${NC}"
else
  echo -e "  ${BOLD}npm run dev${NC}"
fi
echo ""
