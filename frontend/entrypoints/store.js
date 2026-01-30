import discoAlpine from "alpinejs";
import discoMask from '@alpinejs/mask'
import discoSwiper from "swiper/bundle";
import 'swiper/css/bundle';

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

discoAlpine.data('shipping', () => ({
  loading: false,
  message: '',
  zipcode: '',
  zipcodeMask: /^\d{5}-\d{3}$/,
  rates: [],
  shippingAddress: {
    zip: '',
    country: Shopify.country,
    province: '',
    city: '',
    address1: '',
  },
  showShippingInput: false,
  async simulateRates(productId) {
    this.rates = [];
    this.message = '';

    if (!this.zipcode || !this.zipcodeMask.test(this.zipcode)) {
      this.message = 'CEP inválido';
      return;
    }

    this.loading = true;

    const zip = this.zipcode;
    const country = Shopify.country;
    let quantity = 1;

    if (productId) {
      const addItem = await this.$store.cart.addItems([{ id: productId, quantity }], { showCart: false });
      quantity = ((addItem.items || []).find((item) => item.id === productId)?.quantity || 1) - 1;
    }

    if (country === 'BR') {
      try {
        const cachedAddressKey = `address_${this.zipcode}`;
        const cachedAddress = localStorage.getItem(cachedAddressKey);
        let address;

        if (cachedAddress) {
          address = JSON.parse(cachedAddress);
        } else {
          const addressResponse = await fetch(`https://viacep.com.br/ws/${this.zipcode}/json/`);
          address = await addressResponse.json();

          if (address.erro) {
            this.message = 'CEP não encontrado';
            this.loading = false;
            return;
          }

          localStorage.setItem(cachedAddressKey, JSON.stringify(address));
        }

        this.shippingAddress = {
          zip,
          country,
          province: address.estado,
          city: address.localidade,
          address1: address.logradouro,
        };
      } catch (err) {}
    }

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_address: this.shippingAddress }),
    };

    await fetch(`/cart/prepare_shipping_rates.json`, fetchOptions);

    const shippingRatesResponse = await fetch(`/cart/shipping_rates.json`, fetchOptions);
    const shippingRates = await shippingRatesResponse.json();

    this.rates = shippingRates.shipping_rates.map((shippingRate) => {
      const price = Math.round(parseFloat(shippingRate.price) * 100);
      const comparePrice = Math.round(parseFloat(shippingRate.compare_price || shippingRate.price) * 100);

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [startDate, endDate] = (shippingRate.delivery_range || [today, today]).map((date) => new Date(date));
      const formatDate = (date) => date.toLocaleDateString(Shopify.locale, { day: '2-digit', month: '2-digit' });
      const deliveryDate = formatDate(startDate);

      let description = `Previsão de entrega entre ${deliveryDate} e ${formatDate(endDate)}`;

      if (startDate.toDateString() === today.toDateString()) {
        description = `${shippingRate.delivery_range ? 'Previsão de entrega' : 'Retirada'} hoje (${deliveryDate})`;
      } else if (startDate.toDateString() === tomorrow.toDateString()) {
        description = `Previsão de entrega amanhã (${deliveryDate})`;
      } else if (startDate.getTime() === endDate.getTime()) {
        description = `Previsão de entrega dia ${deliveryDate}`;
      }

      return {
        name: shippingRate.presentment_name,
        description,
        deliveryDate,
        comparePrice,
        price,
      };
    });

    if (productId) {
      const updates = { [productId]: quantity };
      await this.$store.cart.updateItems(updates);
    }

    this.loading = false;
  },
  toggleShippingInput() {
    if (this.rates.length > 0) {
      this.resetShipping();
    }
    this.showShippingInput = !this.showShippingInput;
  },
  resetShipping() {
    this.rates = [];
    this.shippingAddress = { zip: '', country: 'BR', province: '', city: '', address1: '' };
    this.zipcode = '';
  }
}));


discoAlpine.store("swiper", {
  mount(el) {
    const queryClasses = el?.id
      ? `#${el.id} .swiper`
      : ".shopify-section .swiper";
    const spls = document.querySelectorAll(queryClasses);

    // biome-ignore lint/complexity/noForEach: <explanation>
    spls.forEach((spl) => {
      new discoSwiper(spl, {
        mediaQuery: "min",
      });
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
      discoAlpine.store("swiper").mount();
    });
    document.addEventListener("shopify:section:reorder", () => {
      discoAlpine.store("swiper").mount();
    });
  }
});

discoAlpine.prefix("disco-");
window.discoAlpine = discoAlpine;
window.discoSwiper = discoSwiper;

document.addEventListener("DOMContentLoaded", () => {
  discoAlpine.store("swiper").mount();
});

discoAlpine.start();
