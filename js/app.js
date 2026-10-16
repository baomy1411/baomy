"use strict";

/* =========================================================
   BẢO MY — MAIN APPLICATION
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (
  selector,
  root = document
) =>
  root.querySelector(selector);


const $$ = (
  selector,
  root = document
) =>
  [...root.querySelectorAll(selector)];


const vnd = value =>
  Number(value || 0)
    .toLocaleString("vi-VN") + "₫";


const byId = id =>
  PRODUCTS.find(
    product =>
      product.id === Number(id)
  );


const esc = value =>
  String(value ?? "")
    .replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
    );


/* =========================================================
   STORAGE
   ========================================================= */

const store = {

  get(key, fallback) {

    try {

      const value =
        JSON.parse(
          localStorage.getItem(key)
        );

      return value ?? fallback;

    } catch {

      return fallback;

    }

  },


  set(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch {

      /* localStorage có thể bị chặn */

    }

  }

};


/* =========================================================
   STATE
   ========================================================= */

let cart =
  store.get(
    "bm_cart",
    []
  );


let wish =
  store.get(
    "bm_wish",
    []
  );


let coupon =
  store.get(
    "bm_coupon",
    null
  );


let me =
  store.get(
    "bm_me",
    null
  );


const view = {

  cat: "all",

  sort: "new",

  q: "",

  wish: false

};


/* =========================================================
   NORMALIZE CART
   ========================================================= */

function normalizeCart() {

  if (!Array.isArray(cart)) {

    cart = [];

    return;

  }


  cart = cart

    .filter(item => {

      const product =
        byId(item?.id);

      return Boolean(
        product &&
        item &&
        typeof item.size === "string" &&
        Number(item.qty) > 0
      );

    })

    .map(item => ({

      id: Number(item.id),

      size: item.size,

      qty: Math.max(
        1,
        Math.floor(
          Number(item.qty)
        )
      )

    }));

}


function normalizeWish() {

  if (!Array.isArray(wish)) {

    wish = [];

    return;

  }


  wish = [
    ...new Set(

      wish
        .map(Number)
        .filter(id =>
          Boolean(byId(id))
        )

    )
  ];

}


normalizeCart();

normalizeWish();


/* =========================================================
   SAVE
   ========================================================= */

function save() {

  store.set(
    "bm_cart",
    cart
  );

  store.set(
    "bm_wish",
    wish
  );

  store.set(
    "bm_coupon",
    coupon
  );

}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

  const element =
    $("#toast");

  if (!element) return;


  element.textContent =
    message;

  element.classList.add(
    "show"
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(() => {

      element.classList.remove(
        "show"
      );

    }, 2300);

}


/* =========================================================
   IMAGE HANDLING
   ========================================================= */

/*
 * Đây là phần QUAN TRỌNG nhất để sửa lỗi mất hình.
 *
 * Không dùng:
 *
 *   this.src = "assets/logo.svg"
 *
 * nữa.
 *
 * Nếu ảnh thật lỗi, chỉ ảnh đó chuyển sang
 * placeholder, các sản phẩm khác vẫn hoạt động.
 */

function imageFallback(img) {

  if (!img) return;


  const wrapper =
    img.closest(".image-holder") ||
    img.parentElement;


  const name =
    img.dataset.productName ||
    "Bảo My";


  const fallback =
    document.createElement("div");


  fallback.className =
    "image-fallback";


  fallback.textContent =
    name;


  img.replaceWith(
    fallback
  );

}


function imageHtml(
  src,
  name,
  options = {}
) {

  const {

    loading = "lazy",

    className = "ph",

    width = 600,

    height = 750

  } = options;


  if (!src) {

    return `
      <div class="image-fallback">
        ${esc(name)}
      </div>
    `;

  }


  return `
    <img
      class="${esc(className)}"
      src="${esc(src)}"
      alt="${esc(name)}"
      width="${width}"
      height="${height}"
      loading="${loading}"
      decoding="async"
      data-product-name="${esc(name)}"
    >
  `;

}


/*
 * Gắn error handler sau khi render.
 *
 * Dùng addEventListener thay vì nhét JavaScript
 * vào HTML attribute.
 */

function bindImageErrors(root = document) {

  $$(".ph", root)
    .forEach(img => {

      img.addEventListener(
        "error",
        () => {
          imageFallback(img);
        },
        {
          once: true
        }
      );

    });

}


/* =========================================================
   PRODUCT ART
   ========================================================= */

function art(product) {

  const src =
    product?.image ||
    product?.img ||
    product?.Img ||
    product?.Image;


  /*
   * Nếu có ảnh thật -> luôn ưu tiên ảnh thật.
   */

  if (src) {

    return imageHtml(
      src,
      product.name,
      {
        loading: "lazy",
        className: "ph",
        width: 600,
        height: 750
      }
    );

  }


  /*
   * Chỉ sản phẩm không có image mới dùng
   * hình minh họa CSS/SVG.
   */

  const color =
    product?.color ||
    "#B4506F";


  const content =
    product?.cat === "perfume"

      ? `
        <rect
          x="70"
          y="30"
          width="20"
          height="14"
          rx="3"
          fill="#B08D4F"
        />

        <rect
          x="62"
          y="44"
          width="36"
          height="12"
          rx="2"
          fill="#2A1422"
        />

        <rect
          x="40"
          y="56"
          width="80"
          height="100"
          rx="14"
          fill="${esc(color)}"
        />

        <rect
          x="52"
          y="86"
          width="56"
          height="34"
          rx="3"
          fill="#fff"
          opacity=".85"
        />
      `

      : `
        <path
          d="
            M60 28
            h40
            l10 22
            -14 10
            18 100
            H46
            l18-100
            -14-10z
          "
          fill="${esc(color)}"
        />

        <path
          d="M68 28q12 16 24 0"
          fill="none"
          stroke="#fff"
          stroke-opacity=".6"
          stroke-width="3"
        />
      `;


  return `
    <svg
      viewBox="0 0 160 190"
      class="generated-art"
      aria-hidden="true"
    >
      ${content}
    </svg>
  `;

}


/* =========================================================
   PRODUCT LIST
   ========================================================= */

function getProducts() {

  const query =
    view.q
      .trim()
      .toLowerCase();


  let result =
    PRODUCTS.filter(
      product => {

        if (product.active === false) return false;

        const matchesCategory =
          view.cat === "all" ||
          product.cat === view.cat;


        const searchText = [

          product.name,

          product.sub,

          product.desc,

          product.cat

        ]
          .join(" ")
          .toLowerCase();


        const matchesSearch =
          !query ||
          searchText.includes(
            query
          );


        const matchesWish =
          !view.wish ||
          wish.includes(
            product.id
          );


        return (
          matchesCategory &&
          matchesSearch &&
          matchesWish
        );

      }
    );


  const sorters = {

    new:
      (a, b) =>
        b.id - a.id,

    asc:
      (a, b) =>
        a.price - b.price,

    desc:
      (a, b) =>
        b.price - a.price,

    rate:
      (a, b) =>
        b.rate - a.rate

  };


  result.sort(
    sorters[view.sort] ||
    sorters.new
  );


  return result;

}


/* =========================================================
   RENDER GRID
   ========================================================= */

function renderGrid() {

  const grid =
    $("#grid");

  const empty =
    $("#empty");


  if (!grid || !empty) {
    return;
  }


  const products =
    getProducts();


  grid.innerHTML =
    products
      .map(product => {

        const liked =
          wish.includes(
            product.id
          );


        return `
          <article
            class="card"
            data-product-id="${product.id}"
          >

            <button
              class="thumb"
              type="button"
              style="background:${esc(product.bg || "#f4e8ea")}"
              data-open="${product.id}"
              aria-label="Xem ${esc(product.name)}"
            >

              ${art(product)}

              ${
                product.old
                  ? `
                    <span class="tag">
                      Giảm giá
                    </span>
                  `
                  : ""
              }

              <span
                class="heart"
                data-wish="${product.id}"
                role="button"
                aria-label="${
                  liked
                    ? "Bỏ yêu thích"
                    : "Thêm vào yêu thích"
                }"
                aria-pressed="${liked}"
              >
                ${liked ? "♥" : "♡"}
              </span>

            </button>


            <h3>
              ${esc(product.name)}
            </h3>


            <div class="meta">
              ${esc(product.sub)}
              · ★ ${product.rate}
            </div>


            <div class="price">

              ${vnd(product.price)}

              ${
                product.old
                  ? `
                    <s>
                      ${vnd(product.old)}
                    </s>
                  `
                  : ""
              }

            </div>


            <button
              class="btn"
              type="button"
              data-open="${product.id}"
            >
              Chọn mua
            </button>

          </article>
        `;

      })
      .join("");


  empty.hidden =
    products.length > 0;


  if (!products.length) {

    empty.textContent =
      view.wish

        ? "Bạn chưa có sản phẩm yêu thích nào phù hợp."

        : "Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa khác.";

  }


  bindImageErrors(
    grid
  );

}


/* =========================================================
   WISHLIST
   ========================================================= */

function toggleWish(id) {

  id = Number(id);


  if (!byId(id)) {
    return;
  }


  if (
    wish.includes(id)
  ) {

    wish =
      wish.filter(
        item => item !== id
      );


    toast(
      "Đã bỏ khỏi danh sách yêu thích."
    );

  } else {

    wish.push(id);


    toast(
      "Đã thêm vào danh sách yêu thích."
    );

  }


  save();

  renderCart();


  if (
    view.wish &&
    wish.length === 0
  ) {

    view.wish = false;

  }


  renderGrid();

}


/* =========================================================
   WISH VIEW
   ========================================================= */

function setWishView(
  enabled
) {

  view.wish =
    Boolean(enabled);


  if (view.wish) {

    view.cat = "all";

    view.q = "";


    if ($("#q")) {
      $("#q").value = "";
    }

  }


  $("#wishBtn")
    ?.classList.toggle(
      "on",
      view.wish
    );


  $$("#chips button")
    .forEach(button => {

      button.classList.toggle(

        "on",

        !view.wish &&
        button.dataset.cat ===
          view.cat

      );

    });


  renderGrid();

}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProduct(id) {

  const product =
    byId(id);

  const dialog =
    $("#pm");


  if (!product || !dialog) {
    return;
  }


  let size =
    product.sizes?.[1] ||
    product.sizes?.[0] ||
    "";


  dialog.innerHTML = `

    <button
      class="x"
      type="button"
      aria-label="Đóng"
    >
      ✕
    </button>


    <div class="pm">


      <div
        class="thumb"
        style="background:${esc(product.bg || "#f4e8ea")}"
      >

        ${art(product)}

      </div>


      <div class="info">

        <span class="eyebrow">

          ${
            product.cat === "perfume"

              ? "Nước hoa"

              : "Thời trang nữ"

          }

        </span>


        <h3>
          ${esc(product.name)}
        </h3>


        <div class="meta">

          ${esc(product.sub)}

          · ★ ${product.rate}

        </div>


        <div class="price">

          ${vnd(product.price)}

          ${
            product.old
              ? `
                <s>
                  ${vnd(product.old)}
                </s>
              `
              : ""
          }

        </div>


        <p>
          ${esc(product.desc)}
        </p>


        <div>

          <div class="meta">

            ${
              product.cat === "perfume"

                ? "Dung tích"

                : "Kích cỡ"

            }

          </div>


          <div class="opts">

            ${
              (product.sizes || [])
                .map(
                  option => `

                    <button
                      type="button"
                      data-size="${esc(option)}"
                      class="${
                        option === size
                          ? "on"
                          : ""
                      }"
                    >
                      ${esc(option)}
                    </button>

                  `
                )
                .join("")
            }

          </div>

        </div>


        <div class="cta">

          <button
            class="btn solid"
            type="button"
            id="add"
          >
            Thêm vào giỏ
          </button>


          <button
            class="btn"
            type="button"
            id="buy"
          >
            Mua ngay
          </button>

        </div>


      </div>

    </div>

  `;


  bindImageErrors(
    dialog
  );


  dialog.onclick =
    event => {

      if (

        event.target === dialog ||

        event.target.closest(".x")

      ) {

        dialog.close();

        return;

      }


      const option =
        event.target.closest(
          "[data-size]"
        );


      if (option) {

        size =
          option.dataset.size;


        $$(".opts button", dialog)
          .forEach(button => {

            button.classList.toggle(
              "on",
              button === option
            );

          });


        return;

      }


      if (

        event.target.id === "add" ||

        event.target.id === "buy"

      ) {

        addToCart(
          product.id,
          size
        );


        dialog.close();


        if (
          event.target.id === "buy"
        ) {

          openCart();

        } else {

          toast(
            "Đã thêm sản phẩm vào giỏ hàng."
          );

        }

      }

    };


  if (!dialog.open) {

    dialog.showModal();

  }

}


/* =========================================================
   CART
   ========================================================= */

function addToCart(
  id,
  size
) {

  const product =
    byId(id);


  if (
    !product ||
    !size
  ) {

    return;

  }


  const existing =
    cart.find(
      item =>
        item.id === Number(id) &&
        item.size === size
    );


  if (existing) {

    existing.qty += 1;

  } else {

    cart.push({

      id: Number(id),

      size,

      qty: 1

    });

  }


  save();

  renderCart();

}


function changeQuantity(
  index,
  delta
) {

  const item =
    cart[index];


  if (!item) {
    return;
  }


  item.qty += Number(
    delta
  );


  if (
    item.qty <= 0
  ) {

    cart.splice(
      index,
      1
    );

  }


  save();

  renderCart();

}


function removeCartItem(
  index
) {

  if (!cart[index]) {
    return;
  }


  cart.splice(
    index,
    1
  );


  save();

  renderCart();


  toast(
    "Đã xóa sản phẩm khỏi giỏ."
  );

}


/* =========================================================
   TOTALS
   ========================================================= */

function totals() {

  const subtotal =
    cart.reduce(
      (
        sum,
        item
      ) => {

        const product =
          byId(item.id);


        if (!product) {
          return sum;
        }


        return (
          sum +
          product.price *
          item.qty
        );

      },
      0
    );


  const currentCoupon =
    coupon &&
    COUPONS[coupon]
      ? COUPONS[coupon]
      : null;


  const discount =
    currentCoupon?.type === "pct"

      ? Math.round(
          subtotal *
          currentCoupon.v /
          100
        )

      : 0;


  const afterDiscount =
    Math.max(
      0,
      subtotal - discount
    );


  const freeShipping =
    afterDiscount >=
      FREESHIP_FROM ||

    currentCoupon?.type ===
      "ship";


  const shipping =
    cart.length === 0 ||
    freeShipping

      ? 0

      : SHIP_FEE;


  const total =
    afterDiscount +
    shipping;


  return {

    subtotal,

    discount,

    shipping,

    total,

    freeShipping

  };

}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  const cartCount =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum + item.qty,
      0
    );


  const cartN =
    $("#cartN");


  const wishN =
    $("#wishN");


  if (cartN) {
    cartN.textContent =
      cartCount;
  }


  if (wishN) {
    wishN.textContent =
      wish.length;
  }


  const items =
    $("#items");


  const sum =
    $("#sum");


  if (!items || !sum) {
    return;
  }


  if (!cart.length) {

    items.innerHTML = `

      <p class="empty">

        Giỏ hàng đang trống.
        Hãy chọn một sản phẩm bạn thích.

      </p>

    `;


    sum.innerHTML =
      "";


    save();

    return;

  }


  items.innerHTML =
    cart
      .map(
        (
          item,
          index
        ) => {

          const product =
            byId(item.id);


          if (!product) {
            return "";
          }


          return `

            <div class="it">


              <div
                class="mini"
                style="background:${esc(product.bg || "#f4e8ea")}"
              >

                ${art(product)}

              </div>


              <div>

                <b>
                  ${esc(product.name)}
                </b>


                <small>

                  ${esc(item.size)}

                  ·

                  ${vnd(product.price)}

                </small>


                <div class="qty">

                  <button
                    type="button"
                    data-q="${index}"
                    data-d="-1"
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>


                  <span>
                    ${item.qty}
                  </span>


                  <button
                    type="button"
                    data-q="${index}"
                    data-d="1"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>

                </div>

              </div>


              <button
                class="rm"
                type="button"
                data-rm="${index}"
              >
                Xóa
              </button>


            </div>

          `;

        }
      )
      .join("");


  bindImageErrors(
    items
  );


  const total =
    totals();


  sum.innerHTML = `

    <div class="cp">

      <input
        id="cpv"
        type="text"
        maxlength="30"
        placeholder="Mã giảm giá"
        value="${esc(coupon || "")}"
        aria-label="Mã giảm giá"
      >


      <button
        class="btn"
        type="button"
        id="cpb"
      >
        Áp dụng
      </button>

    </div>


    <div class="row">

      <span>
        Tạm tính
      </span>

      <span>
        ${vnd(total.subtotal)}
      </span>

    </div>


    ${
      total.discount
        ? `

          <div class="row">

            <span>
              Giảm giá
            </span>

            <span>
              −${vnd(total.discount)}
            </span>

          </div>

        `
        : ""
    }


    <div class="row">

      <span>
        Vận chuyển
      </span>

      <span>

        ${
          total.shipping
            ? vnd(total.shipping)
            : "Miễn phí"
        }

      </span>

    </div>


    <div class="row t">

      <span>
        Tổng cộng
      </span>

      <span>
        ${vnd(total.total)}
      </span>

    </div>


    <button
      class="btn solid"
      type="button"
      id="checkout"
    >
      Thanh toán
    </button>

  `;


  save();

}


/* =========================================================
   CART DRAWER
   ========================================================= */

function openCart() {

  const drawer =
    $("#drawer");


  const scrim =
    $("#scrim");


  if (!drawer || !scrim) {
    return;
  }


  drawer.classList.add(
    "open"
  );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );


  scrim.hidden =
    false;


  document.body.style.overflow =
    "hidden";

}


function closeCart() {

  const drawer =
    $("#drawer");


  const scrim =
    $("#scrim");


  if (!drawer || !scrim) {
    return;
  }


  drawer.classList.remove(
    "open"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );


  scrim.hidden =
    true;


  document.body.style.overflow =
    "";

}


/* =========================================================
   COUPON
   ========================================================= */

function applyCoupon() {

  const input =
    $("#cpv");


  if (!input) {
    return;
  }


  const value =
    input.value
      .trim()
      .toUpperCase();


  if (!value) {

    coupon =
      null;


    save();

    toast(
      "Đã xóa mã giảm giá."
    );


    renderCart();

    return;

  }


  if (!COUPONS[value]) {

    coupon =
      null;


    save();


    toast(
      "Mã giảm giá không hợp lệ."
    );


    renderCart();

    return;

  }


  coupon =
    value;


  save();


  toast(
    "Đã áp dụng: " +
    COUPONS[value].label
  );


  renderCart();

}


/* =========================================================
   CHECKOUT
   ========================================================= */

function checkout() {

  if (!cart.length) {

    toast(
      "Giỏ hàng đang trống."
    );

    return;

  }


  const total =
    totals();


  const dialog =
    $("#co");


  if (!dialog) {
    return;
  }


  const code =
    "BM" +
    Date.now()
      .toString()
      .slice(-8);


  closeCart();


  dialog.innerHTML = `

    <button
      class="x"
      type="button"
      aria-label="Đóng"
    >
      ✕
    </button>


    <form
      class="co"
      id="checkoutForm"
      novalidate
    >

      <span class="eyebrow">
        Bảo My Checkout
      </span>


      <h3>
        Thông tin giao hàng
      </h3>


      <label>

        Họ và tên

        <input
          name="n"
          autocomplete="name"
          required
        >

      </label>


      <label>

        Số điện thoại

        <input
          name="p"
          inputmode="tel"
          autocomplete="tel"
          placeholder="0900000000"
          required
        >

      </label>


      <label>

        Địa chỉ nhận hàng

        <textarea
          name="a"
          rows="3"
          autocomplete="street-address"
          required
        ></textarea>

      </label>


      <label class="pay">

        <span>

          <input
            type="radio"
            name="m"
            value="cod"
            checked
          >

          Thanh toán khi nhận hàng

        </span>


        <span>

          <input
            type="radio"
            name="m"
            value="bank"
          >

          Chuyển khoản

        </span>

      </label>


      <div
        class="qr"
        id="checkoutQr"
        hidden
      >

        <img
          src="${esc(BANK.qr)}"
          alt="Mã QR chuyển khoản"
          width="150"
          height="150"
        >


        <div
          class="qrno"
          hidden
        >
          Chưa tìm thấy ảnh QR.
          Hãy kiểm tra file
          <b>${esc(BANK.qr)}</b>.
        </div>


        <div class="qri">

          <b>
            ${esc(BANK.bank)}
          </b>

          <span>
            ${esc(BANK.account)}
          </span>

          <span>
            ${esc(BANK.owner)}
          </span>

          <span>
            Số tiền:
            <b>
              ${vnd(total.total)}
            </b>
          </span>

          <span>
            Nội dung:
            <b>
              ${esc(code)}
            </b>
          </span>

        </div>

      </div>


      <div
        class="err"
        id="checkoutError"
        role="alert"
      ></div>


      <div class="row t">

        <span>
          Tổng thanh toán
        </span>

        <span>
          ${vnd(total.total)}
        </span>

      </div>


      <button
        class="btn solid"
        type="submit"
      >
        Đặt hàng
      </button>

    </form>

  `;


  bindImageErrors(
    dialog
  );


  dialog.onclick =
    event => {

      if (

        event.target === dialog ||

        event.target.closest(".x")

      ) {

        dialog.close();

      }

    };


  $$(
    'input[name="m"]',
    dialog
  )
    .forEach(radio => {

      radio.addEventListener(
        "change",
        () => {

          const qr =
            $("#checkoutQr", dialog);


          if (!qr) {
            return;
          }


          qr.hidden =
            radio.value !== "bank" ||
            !radio.checked;

        }
      );

    });


  $("#checkoutForm", dialog)
    .onsubmit =
    event => {

      event.preventDefault();


      submitCheckout(
        event.target,
        dialog,
        total,
        code
      );

    };


  if (!dialog.open) {

    dialog.showModal();

  }

}


/* =========================================================
   PHONE
   ========================================================= */

function validPhone(phone) {

  return /^(0|\+84)\d{9,10}$/
    .test(
      phone.replace(
        /\s/g,
        ""
      )
    );

}


/* =========================================================
   SUBMIT CHECKOUT
   ========================================================= */

async function submitCheckout(
  form,
  dialog,
  total,
  code
) {

  const data =
    new FormData(form);


  const name =
    String(
      data.get("n") || ""
    ).trim();


  const phone =
    String(
      data.get("p") || ""
    ).trim();


  const address =
    String(
      data.get("a") || ""
    ).trim();


  const method =
    data.get("m");


  const error =
    $("#checkoutError", dialog);


  if (!name) {

    error.textContent =
      "Vui lòng nhập họ và tên.";

    return;

  }


  if (!validPhone(phone)) {

    error.textContent =
      "Số điện thoại chưa đúng, ví dụ 0900000000.";

    return;

  }


  if (address.length < 8) {

    error.textContent =
      "Vui lòng nhập địa chỉ đầy đủ.";

    return;

  }


  const submitButton = $("button[type=submit]", form);
  if (submitButton?.disabled) return;
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Đang gửi đơn..."; }
  error.textContent = "";
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, phone, address, method,
        coupon: coupon || null,
        items: cart.map(item => ({ id: item.id, size: item.size, qty: item.qty }))
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Không thể gửi đơn hàng.");
    const savedOrder = result.order;
    cart = [];
    coupon = null;
    save();
    renderCart();
    dialog.close();
    const confirmedTotal = Number(savedOrder.total);
    if (method === "bank") {
      openQr({ ...total, total: confirmedTotal }, savedOrder.code, name);
    } else {
      showOrderSuccess(savedOrder.code, name, confirmedTotal);
    }
  } catch (e) {
    error.textContent = e.message || "Không thể kết nối máy chủ. Vui lòng thử lại.";
  } finally {
    if (submitButton?.isConnected) { submitButton.disabled = false; submitButton.textContent = "Đặt hàng"; }
  }

}


/* =========================================================
   ORDER SUCCESS
   ========================================================= */

function showOrderSuccess(
  code,
  name,
  total
) {

  const dialog =
    $("#co");


  if (!dialog) {
    return;
  }


  dialog.innerHTML = `

    <button
      class="x"
      type="button"
      aria-label="Đóng"
    >
      ✕
    </button>


    <div class="co">

      <span class="eyebrow">
        Hoàn tất
      </span>


      <h3>
        Đặt hàng thành công
      </h3>


      <p>

        Cảm ơn
        <b>${esc(name)}</b>.

        Mã đơn của bạn là
        <b>${esc(code)}</b>.

      </p>


      <p class="meta">

        Thanh toán khi nhận hàng
        · ${vnd(total)}

      </p>


      <p>

        Bảo My sẽ gọi xác nhận đơn hàng
        trong thời gian sớm nhất.

      </p>


      <button
        class="btn solid"
        type="button"
        id="continueShopping"
      >
        Tiếp tục mua sắm
      </button>

    </div>

  `;


  dialog.onclick =
    event => {

      if (

        event.target === dialog ||

        event.target.closest(".x") ||

        event.target.id ===
          "continueShopping"

      ) {

        dialog.close();

      }

    };


  if (!dialog.open) {

    dialog.showModal();

  }

}


/* =========================================================
   QR PAYMENT
   ========================================================= */

function openQr(
  total,
  code,
  name
) {

  const dialog =
    $("#qrm");


  if (!dialog) {
    return;
  }


  dialog.innerHTML = `

    <button
      class="x"
      type="button"
      aria-label="Đóng"
    >
      ✕
    </button>


    <div class="co qrm">

      <span class="eyebrow">
        Chuyển khoản
      </span>


      <h3>
        Quét mã để thanh toán
      </h3>


      <p>

        Cảm ơn
        <b>${esc(name)}</b>.

        Đơn
        <b>${esc(code)}</b>
        đã được ghi nhận.

      </p>


      <img
        src="${esc(BANK.qr)}"
        alt="Mã QR chuyển khoản"
        width="280"
        height="280"
      >


      <div
        class="qrno"
        hidden
      >
        Chưa tìm thấy ảnh QR.
        Hãy kiểm tra file
        <b>${esc(BANK.qr)}</b>.
      </div>


      <div class="qri">

        <b>
          ${esc(BANK.bank)}
        </b>


        <span>
          Số tài khoản:
          ${esc(BANK.account)}
        </span>


        <span>
          Chủ tài khoản:
          ${esc(BANK.owner)}
        </span>


        <span>
          Số tiền:
          <b>
            ${vnd(total.total)}
          </b>
        </span>


        <span>
          Nội dung:
          <b>
            ${esc(code)}
          </b>
        </span>

      </div>


      <button
        class="btn solid"
        type="button"
        id="qrdone"
      >
        Tôi đã chuyển khoản
      </button>

    </div>

  `;


  bindImageErrors(
    dialog
  );


  dialog.onclick =
    event => {

      if (

        event.target === dialog ||

        event.target.closest(".x")

      ) {

        dialog.close();

        return;

      }


      if (
        event.target.id ===
        "qrdone"
      ) {

        dialog.close();


        toast(
          "Cảm ơn bạn! Bảo My sẽ xác nhận khi nhận được tiền."
        );

      }

    };


  if (!dialog.open) {

    dialog.showModal();

  }

}


/* =========================================================
   ACCOUNT
   ========================================================= */

function users() {

  const data =
    store.get(
      "bm_users",
      []
    );


  return Array.isArray(data)
    ? data
    : [];

}


/* =========================================================
   HASH
   ========================================================= */

async function hash(
  value
) {

  try {

    const buffer =
      await crypto.subtle.digest(

        "SHA-256",

        new TextEncoder()
          .encode(
            "baomy:" + value
          )

      );


    return [
      ...new Uint8Array(
        buffer
      )
    ]
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(
              2,
              "0"
            )
      )
      .join("");


  } catch {

    return "fallback:" +
      value;

  }

}


/* =========================================================
   ACCOUNT UI
   ========================================================= */

function renderAccount() {

  const headerAuth = document.getElementById("headerAuth");
  if (headerAuth) {
    headerAuth.innerHTML = me
      ? `<span class="header-welcome">Xin chào, ${String(me.name || "bạn").replace(/[&<>"']/g, "")}</span><button class="header-auth-link" type="button" data-auth="logout">Đăng xuất</button>`
      : `<button class="header-auth-link" type="button" data-auth="login">Đăng nhập</button><button class="header-auth-register" type="button" data-auth="register">Đăng ký</button>`;
  }

  const box = $("#acc");
  const text = $("#accText");
  if (!box || !text) return;

  if (me) {

    text.textContent =
      `Xin chào, ${me.name}. Bạn đang đăng nhập.`;


    box.innerHTML = `

      <button
        class="btn"
        type="button"
        data-auth="logout"
      >
        Đăng xuất
      </button>

    `;


    return;

  }


  text.textContent =
    "Đăng ký để lưu thông tin và nhận mã giảm giá, hoặc đăng nhập nếu bạn đã có tài khoản.";


  box.innerHTML = `

    <button
      class="btn"
      type="button"
      data-auth="login"
    >
      Đăng nhập
    </button>


    <button
      class="btn solid"
      type="button"
      data-auth="register"
    >
      Đăng ký
    </button>

  `;

}


/* =========================================================
   AUTH MODAL
   ========================================================= */

function authModal(
  type
) {

  const dialog =
    $("#auth");


  if (!dialog) {
    return;
  }


  const register =
    type === "register";


  dialog.setAttribute(
    "aria-label",
    register
      ? "Đăng ký tài khoản"
      : "Đăng nhập"
  );


  dialog.innerHTML = `

    <button
      class="x"
      type="button"
      aria-label="Đóng"
    >
      ✕
    </button>


    <form
      class="co"
      id="authForm"
      novalidate
    >

      <span class="eyebrow">
        Bảo My Member
      </span>


      <h3>

        ${
          register
            ? "Đăng ký tài khoản"
            : "Đăng nhập"
        }

      </h3>


      ${
        register
          ? `

            <label>

              Họ và tên

              <input
                name="n"
                autocomplete="name"
              >

            </label>

          `
          : ""
      }


      <label>

        ${
          register
            ? "Email"
            : "Email hoặc số điện thoại"
        }


        <input
          name="e"
          autocomplete="username"
        >

      </label>


      ${
        register
          ? `

            <label>

              Số điện thoại

              <input
                name="p"
                type="tel"
                inputmode="numeric"
                maxlength="12"
                placeholder="0900000000"
                autocomplete="tel"
              >

            </label>

          `
          : ""
      }


      <label>

        Mật khẩu

        <input
          name="w"
          type="password"
          autocomplete="${
            register
              ? "new-password"
              : "current-password"
          }"
        >

      </label>


      ${
        register
          ? `

            <label>

              Nhập lại mật khẩu

              <input
                name="w2"
                type="password"
                autocomplete="new-password"
              >

            </label>

          `
          : ""
      }


      <div
        class="err"
        id="authError"
        role="alert"
      ></div>


      <button
        class="btn solid"
        type="submit"
      >

        ${
          register
            ? "Tạo tài khoản"
            : "Đăng nhập"
        }

      </button>


      <p class="meta">

        ${
          register

            ? `
              Đã có tài khoản?

              <a
                href="#"
                data-sw="login"
              >
                Đăng nhập
              </a>
            `

            : `
              Chưa có tài khoản?

              <a
                href="#"
                data-sw="register"
              >
                Đăng ký
              </a>
            `
        }

      </p>

    </form>

  `;


  dialog.onclick =
    event => {

      if (

        event.target === dialog ||

        event.target.closest(".x")

      ) {

        dialog.close();

        return;

      }


      const switcher =
        event.target.closest(
          "[data-sw]"
        );


      if (switcher) {

        event.preventDefault();


        authModal(
          switcher.dataset.sw
        );

      }

    };


  $("#authForm", dialog)
    .onsubmit =
    async event => {

      event.preventDefault();


      await submitAuth(
        event.target,
        dialog,
        register
      );

    };


  if (!dialog.open) {

    dialog.showModal();

  }

}


/* =========================================================
   SUBMIT AUTH
   ========================================================= */

async function submitAuth(form, dialog, register) {
  const data = new FormData(form);
  const error = $('#authError', dialog);
  const key = String(data.get('e') || '').trim().toLowerCase();
  const password = String(data.get('w') || '');
  const name = String(data.get('n') || '').trim();
  const phone = String(data.get('p') || '').replace(/\s/g, '');
  if (register) {
    if (name.length < 2) { error.textContent = 'Vui lòng nhập họ và tên.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) { error.textContent = 'Email chưa đúng, ví dụ ten@gmail.com.'; return; }
    if (!validPhone(phone)) { error.textContent = 'Số điện thoại chưa đúng.'; return; }
    if (password.length < 8) { error.textContent = 'Mật khẩu cần ít nhất 8 ký tự.'; return; }
    if (password !== String(data.get('w2') || '')) { error.textContent = 'Hai mật khẩu chưa giống nhau.'; return; }
  } else if (!key || !password) { error.textContent = 'Vui lòng nhập đủ thông tin.'; return; }
  const submit = $('button[type="submit"]', form);
  if (submit) { submit.disabled = true; submit.textContent = 'Đang xử lý…'; }
  try {
    const response = await fetch(register ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(register ? {name,email:key,phone,password} : {email:key,password})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Không thể xử lý tài khoản.');
    const user = result.user;
    me = {id:user.id,name:user.name,email:user.email,phone:user.phone};
    store.set('bm_me', me);
    renderAccount();
    dialog.close();
    toast(register ? `Đăng ký thành công. Chào mừng ${user.name}!` : `Xin chào, ${user.name}!`);
  } catch (e) { error.textContent = e.message || 'Lỗi kết nối. Vui lòng thử lại.'; }
  finally { if (submit) { submit.disabled = false; submit.textContent = register ? 'Tạo tài khoản' : 'Đăng nhập'; } }
}

/* =========================================================
   GLOBAL CLICK
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const target =
      event.target;


    /* -----------------------------------------
       Wishlist
       ----------------------------------------- */

    const wishButton =
      target.closest(
        "[data-wish]"
      );


    if (wishButton) {

      event.preventDefault();

      event.stopPropagation();


      toggleWish(
        wishButton.dataset.wish
      );


      return;

    }


    /* -----------------------------------------
       Product
       ----------------------------------------- */

    const openButton =
      target.closest(
        "[data-open]"
      );


    if (openButton) {

      openProduct(
        openButton.dataset.open
      );


      return;

    }


    /* -----------------------------------------
       Category
       ----------------------------------------- */

    const category =
      target.closest(
        "[data-cat]"
      );


    if (category) {

      view.wish =
        false;


      view.cat =
        category.dataset.cat;


      $$("#chips button")
        .forEach(button => {

          button.classList.toggle(
            "on",
            button === category
          );

        });


      $("#wishBtn")
        ?.classList.remove(
          "on"
        );


      renderGrid();


      return;

    }


    /* -----------------------------------------
       Navigation
       ----------------------------------------- */

    const navigation =
      target.closest(
        "[data-go]"
      );


    if (navigation) {

      view.wish =
        false;


      view.cat =
        navigation.dataset.go;


      $$("#chips button")
        .forEach(button => {

          button.classList.toggle(

            "on",

            button.dataset.cat ===
              view.cat

          );

        });


      $("#wishBtn")
        ?.classList.remove(
          "on"
        );


      renderGrid();


      document
        .querySelector("#shop")
        ?.scrollIntoView({
          behavior: "smooth"
        });


      return;

    }


    /* -----------------------------------------
       Cart quantity
       ----------------------------------------- */

    const quantity =
      target.closest(
        "[data-q]"
      );


    if (quantity) {

      changeQuantity(

        Number(
          quantity.dataset.q
        ),

        Number(
          quantity.dataset.d
        )

      );


      return;

    }


    /* -----------------------------------------
       Remove
       ----------------------------------------- */

    const remove =
      target.closest(
        "[data-rm]"
      );


    if (remove) {

      removeCartItem(
        Number(
          remove.dataset.rm
        )
      );


      return;

    }


    /* -----------------------------------------
       Coupon
       ----------------------------------------- */

    if (
      target.id === "cpb"
    ) {

      applyCoupon();

      return;

    }


    /* -----------------------------------------
       Checkout
       ----------------------------------------- */

    if (
      target.id === "checkout"
    ) {

      checkout();

      return;

    }


    /* -----------------------------------------
       Auth
       ----------------------------------------- */

    const authButton =
      target.closest(
        "[data-auth]"
      );


    if (authButton) {

      const action =
        authButton.dataset.auth;


      if (
        action === "logout"
      ) {

        me = null;


        store.set(
          "bm_me",
          null
        );


        renderAccount();


        toast(
          "Đã đăng xuất."
        );


        return;

      }


      authModal(
        action
      );


      return;

    }


    /* -----------------------------------------
       Cart
       ----------------------------------------- */

    if (
      target.closest(
        "#cartBtn"
      ) ||
      target.closest(
        "#footerCart"
      )
    ) {

      openCart();

      return;

    }


    /* -----------------------------------------
       Close cart
       ----------------------------------------- */

    if (

      target.closest(
        "#closeCart"
      ) ||

      target.id === "scrim"

    ) {

      closeCart();

      return;

    }


    /* -----------------------------------------
       Wishlist view
       ----------------------------------------- */

    if (
      target.closest(
        "#wishBtn"
      )
    ) {

      if (!wish.length) {

        toast(
          "Bạn chưa có sản phẩm yêu thích."
        );


        return;

      }


      setWishView(
        !view.wish
      );


      $("#shop")
        ?.scrollIntoView({
          behavior: "smooth"
        });


      toast(

        view.wish

          ? "Đang xem sản phẩm yêu thích."

          : "Đã quay lại tất cả sản phẩm."

      );

    }

  }
);


/* =========================================================
   SEARCH
   ========================================================= */

$("#q")
  ?.addEventListener(
    "input",
    event => {

      view.q =
        event.target.value
          .trim()
          .toLowerCase();


      view.wish =
        false;


      $("#wishBtn")
        ?.classList.remove(
          "on"
        );


      renderGrid();

    }
  );


/* =========================================================
   SORT
   ========================================================= */

$("#sort")
  ?.addEventListener(
    "change",
    event => {

      view.sort =
        event.target.value;


      renderGrid();

    }
  );


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeCart();

    }

  }
);


/* =========================================================
   YEARS
   ========================================================= */

function calculateYears() {

  const start =
    new Date(
      FOUNDED +
      "T00:00:00"
    );


  const now =
    new Date();


  let years =
    now.getFullYear() -
    start.getFullYear();


  const anniversary =
    new Date(

      now.getFullYear(),

      start.getMonth(),

      start.getDate()

    );


  if (
    now < anniversary
  ) {

    years--;

  }


  return Math.max(
    0,
    years
  );

}


const years =
  calculateYears();


if ($("#years")) {

  $("#years").textContent =
    years;

}


$$(".yrs")
  .forEach(
    element => {

      element.textContent =
        years;

    }
  );


if ($("#yr")) {

  $("#yr").textContent =
    new Date()
      .getFullYear();

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {
  try {
    const response = await fetch("/api/products");
    if (response.ok) {
      const liveProducts = await response.json();
      for (const live of liveProducts) {
        const local = byId(live.id);
        if (local) Object.assign(local, { price: Number(live.price), stock: Number(live.stock), active: Boolean(live.active) });
      }
      for (const local of PRODUCTS) {
        if (!liveProducts.some(p => p.id === local.id)) local.active = false;
      }
    }
  } catch (error) {
    console.warn("Không thể đồng bộ danh mục từ máy chủ:", error);
  }
  renderGrid();
  renderCart();
  renderAccount();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init,
    {
      once: true
    }
  );

} else {

  init();

}