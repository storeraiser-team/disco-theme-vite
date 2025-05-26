import discoAlpine from "alpinejs";
import discoMask from '@alpinejs/mask'
import discoSplide from "@splidejs/splide";

import "@splidejs/splide/css/core";

discoAlpine.plugin(discoMask);

discoAlpine.$dispatch = (event, detail = {}) => {
  document.dispatchEvent(
    new CustomEvent(event, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    })
  );
};

discoAlpine.store("cart", {
  items: [],
  itemsCount: 0,
  init() {
    this.fetchItems();
  },
  refresh(items, itemsCount) {
    this.items = items;
    this.itemsCount = itemsCount;
  },
  fetchItems() {
    fetch("/cart.js")
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        this.refresh(response.items, response.item_count);
        discoAlpine.$dispatch("cart-change");
      })
      .catch((error) => {
        console.error("Fetch Cart:", error);
      });
  },
  checkAvailability(response) {
    let { status, message, description } = response;

    if (status !== undefined && status !== 200) {
      if (description === undefined) {
        description = message;
        message = "Erro de carrinho";
      }

      discoAlpine.$dispatch("show-notification", {
        type: "error",
        title: message,
        description,
      });
    }

    return response;
  },
  clear() {
    this.items = [];
    this.itemsCount = 0;

    return fetch("/cart/clear.js", {
      method: "POST",
    });
  },
  addItem(formData, options = {}) {
    return fetch("/cart/add.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const { status } = response;

        if (status !== undefined && status !== 200) {
          return this.checkAvailability(response);
        }

        discoAlpine.store("cart").fetchItems();

        if (options.showCart || options.showCart === undefined) {
          discoAlpine.$dispatch("cart-notification", { items: [response] });
        }

        return response;
      })
      .catch((error) => {
        console.error("Add to Cart:", error);
      });
  },
  addItems(items, options = {}) {
    return fetch("/cart/add.js", {
      method: "POST",
      body: JSON.stringify({ items: items }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const { status } = response;

        if (status !== undefined && status !== 200) {
          return this.checkAvailability(response);
        }

        discoAlpine.store("cart").fetchItems();

        if (options.showCart || options.showCart === undefined) {
          discoAlpine.$dispatch("cart-notification", response);
        }

        return response;
      })
      .catch((error) => {
        console.error("Add to Cart:", error);
      });
  },
  updateItem(item) {
    return fetch("/cart/change.js", {
      method: "POST",
      body: JSON.stringify(item),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const { status } = response;

        if (status !== undefined && status !== 200) {
          discoAlpine.$dispatch("cart-change");

          return this.checkAvailability(response);
        }

        this.refresh(response.items, response.item_count);
        discoAlpine.$dispatch("cart-change");

        return response;
      })
      .catch((error) => {
        console.error("Update Cart Item:", error);
      });
  },
  updateItems(items) {
    return fetch("/cart/update.js", {
      method: "POST",
      body: JSON.stringify({ updates: items }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const { status } = response;

        if (status === 200) {
          this.refresh(response.items, response.item_count);
        }

        discoAlpine.$dispatch("cart-change");

        return response;
      })
      .catch((error) => {
        console.error("Update Items Cart:", error);
      });
  },
});

discoAlpine.store("product", {
  fetch(product, optionValues, variantId, sectionId) {
    const pathname = window.location.pathname;
    const url = pathname.includes("/products/")
      ? pathname
      : `/products/${product.handle}`;
    const params = [];

    if (optionValues.length) {
      if (optionValues.length === 1) {
        params.push(`variant=${variantId}`);
      } else {
        params.push(`option_values=${optionValues.join(",")}`);
      }
    }

    const productPath = `${url}?${params.join("&")}`;
    window.history.replaceState({}, "", productPath);

    params.push(`section_id=${sectionId}`);

    const productSectionPath = `${url}?${params.join("&")}`;

    return fetch(productSectionPath)
      .then((response) => {
        return response.text();
      })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error("Fetch Product:", error);
      });
  }
});

discoAlpine.store("slider", {
  mount(el) {
    const queryClasses = el?.id
      ? `#${el.id} .splide`
      : ".shopify-section .splide";
    const spls = document.querySelectorAll(queryClasses);

    // biome-ignore lint/complexity/noForEach: <explanation>
    spls.forEach((spl) => {
      new discoSplide(spl, {
        mediaQuery: "min",
      }).mount();
    });
  },
});

discoAlpine.directive(
  "money",
  (el, { expression, modifiers }, { evaluateLater, effect }) => {
    const isDecimal = modifiers.includes("decimal");
    const {
      locale: shopifyLocale,
      currency: { active: shopifyCurrency },
    } = window?.Shopify || {};
    const getValue = evaluateLater(expression);

    effect(() => {
      getValue((moneyValue) => {
        if (!moneyValue || !shopifyLocale || !shopifyCurrency) {
          return;
        }

        const formattedMoney = isDecimal ? moneyValue : moneyValue / 100;
        const formattedPrice = new Intl.NumberFormat(shopifyLocale, {
          style: "currency",
          currency: shopifyCurrency,
        }).format(formattedMoney);

        el.innerText = formattedPrice;
      });
    });
  }
);

document.addEventListener("alpine:initialized", () => {
  if (Shopify?.designMode) {
    document.addEventListener("shopify:section:load", (section) => {
      discoAlpine.store("slider").mount();
    });
    document.addEventListener("shopify:section:reorder", () => {
      discoAlpine.store("slider").mount();
    });
  }
});

discoAlpine.prefix("disco-");
window.discoAlpine = discoAlpine;

document.addEventListener("DOMContentLoaded", () => {
  discoAlpine.store("slider").mount();
});

discoAlpine.start();
