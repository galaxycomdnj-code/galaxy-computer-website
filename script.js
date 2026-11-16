const $ = (id) => document.getElementById(id);
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMainMenu() {
  navLinks?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open menu');
}
menuButton?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', closeMainMenu));

let english = false;
$('languageBtn')?.addEventListener('click', () => {
  english = !english;
  document.documentElement.lang = english ? 'en' : 'bn';
  document.querySelectorAll('[data-bn][data-en]').forEach(element => {
    element.textContent = english ? element.dataset.en : element.dataset.bn;
  });
  $('languageBtn').textContent = english ? 'বাংলা' : 'EN';
  const search = $('productSearch');
  if (search) search.placeholder = english ? 'Search products...' : 'পণ্য খুঁজুন...';
  if (typeof productsCache !== 'undefined') filterProducts(search?.value || '');
});
if ($('year')) $('year').textContent = new Date().getFullYear();

// Cart: stores only the shopper's cart locally; checkout is handed off to WhatsApp.
const CART_STORAGE_KEY = 'galaxy-computer-cart-v1';
let cartItems = [];
try {
  const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  cartItems = Array.isArray(savedCart) ? savedCart.filter(item => item && item.id && item.name && Number.isInteger(item.quantity) && item.quantity > 0) : [];
} catch { cartItems = []; }

function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); }
  catch (error) { console.warn('Cart could not be saved on this device.', error); }
  renderCart();
}
function formatBDT(value) {
  return '৳ ' + Number(value || 0).toLocaleString('en-BD');
}
function addToCart(product) {
  const id = String(product.id || product.name);
  const existing = cartItems.find(item => String(item.id) === id);
  if (existing) existing.quantity += 1;
  else cartItems.push({
    id, name: product.name || 'Product', price: Number.isFinite(Number(product.price)) && product.price !== null && product.price !== '' ? Number(product.price) : null,
    image_url: product.image_url || '', quantity: 1
  });
  saveCart();
  const dialog = $('cartDialog');
  if (dialog && !dialog.open) dialog.showModal();
}
function changeCartQuantity(id, change) {
  const item = cartItems.find(entry => String(entry.id) === String(id));
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cartItems = cartItems.filter(entry => String(entry.id) !== String(id));
  saveCart();
}
function removeCartItem(id) {
  cartItems = cartItems.filter(entry => String(entry.id) !== String(id));
  saveCart();
}
function renderCart() {
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  if ($('cartCount')) $('cartCount').textContent = String(count);
  const list = $('cartItems');
  if (!list) return;
  list.replaceChildren();
  if (!cartItems.length) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.textContent = english ? 'Your cart is empty.' : 'আপনার কার্ট এখনো খালি।';
    list.append(empty);
  }
  cartItems.forEach(item => {
    const row = document.createElement('article');
    row.className = 'cart-item';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = item.price === null ? (english ? 'Price on request' : 'দাম জানতে যোগাযোগ করুন') : formatBDT(item.price * item.quantity);
    const controls = document.createElement('div');
    controls.className = 'cart-quantity';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Decrease quantity');
    minus.addEventListener('click', () => changeCartQuantity(item.id, -1));
    const qty = document.createElement('span'); qty.textContent = String(item.quantity);
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase quantity');
    plus.addEventListener('click', () => changeCartQuantity(item.id, 1));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = english ? 'Remove' : 'বাদ দিন';
    remove.addEventListener('click', () => removeCartItem(item.id));
    controls.append(minus, qty, plus, remove);
    row.append(name, price, controls);
    list.append(row);
  });
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0);
  if ($('cartSubtotal')) $('cartSubtotal').textContent = formatBDT(subtotal);
  const checkout = $('checkoutForm');
  if (checkout) {
    const disabled = cartItems.length === 0;
    checkout.querySelectorAll('input,textarea,button').forEach(control => control.disabled = disabled);
  }
}
$('openCart')?.addEventListener('click', () => { renderCart(); $('cartDialog')?.showModal(); });
$('closeCart')?.addEventListener('click', () => $('cartDialog')?.close());
$('checkoutForm')?.addEventListener('submit', event => {
  event.preventDefault();
  if (!cartItems.length) return;
  const name = $('customerName').value.trim();
  const phone = $('customerPhone').value.trim();
  const address = $('customerAddress').value.trim();
  const note = $('customerNote').value.trim();
  if (!name || !phone || !address) return;
  const lines = cartItems.map(item => `• ${item.name} × ${item.quantity} — ${item.price === null ? 'Price to confirm' : formatBDT(item.price * item.quantity)}`);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0);
  const message = [
    'Assalamu Alaikum, Galaxy Computer. I want to place an order:',
    ...lines,
    `Subtotal (priced items): ${formatBDT(subtotal)}`,
    `Name: ${name}`, `Phone: ${phone}`, `Delivery address: ${address}`,
    note ? `Note: ${note}` : '',
    'Please confirm availability, delivery charge and final total.'
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/8801621422327?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});
renderCart();

// Supabase public read access; write access remains in the protected Admin Panel.
const SUPABASE_URL = 'https://wfuvzfiwnpbgbzzeygei.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FMsWzO2LqaTzM8tem94M2w_i3HhnWHR';
const productGrid = $('productGrid');
let productsCache = [];

function showProductMessage(message, className = 'product-empty') {
  if (!productGrid) return;
  productGrid.replaceChildren();
  const messageBox = document.createElement('div');
  messageBox.className = className;
  messageBox.textContent = message;
  productGrid.append(messageBox);
}

function renderProducts(products) {
  if (!productGrid) return;
  productGrid.replaceChildren();
  if (!products.length) {
    showProductMessage(english ? 'No matching products found. Contact us and we will help you find it.' : 'কোনো পণ্য পাওয়া যায়নি। পণ্য খুঁজে পেতে আমাদের সঙ্গে যোগাযোগ করুন।');
    $('productCount').textContent = english ? '0 products' : '০টি পণ্য';
    return;
  }

  $('productCount').textContent = english ? `${products.length} product${products.length === 1 ? '' : 's'}` : `${products.length}টি পণ্য`;
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.search = [product.name, product.description, product.category].filter(Boolean).join(' ').toLowerCase();

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-image-wrap';
    if (product.image_url) {
      const image = document.createElement('img');
      image.src = product.image_url;
      image.alt = product.name || 'Galaxy Computer product';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.onerror = () => {
        image.remove();
        const fallback = document.createElement('span');
        fallback.className = 'product-placeholder';
        fallback.textContent = '▣';
        imageWrap.append(fallback);
      };
      imageWrap.append(image);
    } else {
      const fallback = document.createElement('span');
      fallback.className = 'product-placeholder';
      fallback.textContent = '▣';
      imageWrap.append(fallback);
    }

    const title = document.createElement('h3');
    title.textContent = product.name || 'Product';
    const description = document.createElement('p');
    description.textContent = product.description || product.category || (english ? 'Contact us for details.' : 'বিস্তারিত জানতে যোগাযোগ করুন।');
    card.append(imageWrap, title, description);

    if (product.price !== null && product.price !== undefined && product.price !== '') {
      const price = document.createElement('div');
      price.className = 'product-price';
      price.textContent = `৳ ${Number(product.price).toLocaleString('en-BD')}`;
      card.append(price);
    }

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'cart-add-btn';
    cartButton.textContent = english ? 'Add to Cart' : 'কার্টে যোগ করুন';
    cartButton.addEventListener('click', () => addToCart(product));

    const detailsButton = document.createElement('button');
    detailsButton.type = 'button';
    detailsButton.className = 'product-details-btn';
    detailsButton.textContent = english ? 'View Details' : 'বিস্তারিত দেখুন';
    detailsButton.addEventListener('click', () => openProductDetails(product));

    const orderLink = document.createElement('a');
    orderLink.href = `https://wa.me/8801621422327?text=${encodeURIComponent(`${product.name} সম্পর্কে জানতে চাই`)}`;
    orderLink.target = '_blank';
    orderLink.rel = 'noopener';
    orderLink.textContent = english ? 'Ask on WhatsApp ↗' : 'দাম ও বিস্তারিত জানুন ↗';
    card.append(cartButton, detailsButton, orderLink);
    productGrid.append(card);
  });
}

function openProductDetails(product) {
  const dialog = $('productDialog');
  const content = $('productDialogContent');
  if (!dialog || !content) return;
  content.replaceChildren();

  const layout = document.createElement('div');
  layout.className = 'product-dialog-layout';
  const image = document.createElement('img');
  image.className = 'product-dialog-image';
  image.alt = product.name || 'Galaxy Computer product';
  image.src = product.image_url || 'logo-mark.png';
  image.onerror = () => { image.src = 'logo-mark.png'; };
  const details = document.createElement('div');
  details.className = 'product-dialog-details';
  const title = document.createElement('h2');
  title.id = 'productDialogTitle';
  title.textContent = product.name || (english ? 'Product details' : 'পণ্যের বিবরণ');
  details.append(title);

  if (product.category) {
    const category = document.createElement('span');
    category.className = 'product-dialog-category';
    category.textContent = product.category;
    details.append(category);
  }
  if (product.description) {
    const description = document.createElement('p');
    description.textContent = product.description;
    details.append(description);
  }
  if (product.price !== null && product.price !== undefined && String(product.price).trim() !== '') {
    const price = document.createElement('strong');
    price.className = 'product-dialog-price';
    const numericPrice = Number(product.price);
    price.textContent = Number.isFinite(numericPrice) && String(product.price).trim() !== ''
      ? `৳ ${numericPrice.toLocaleString('en-BD')}`
      : String(product.price);
    details.append(price);
  }
  const ask = document.createElement('a');
  ask.className = 'btn btn-primary product-dialog-ask';
  ask.href = `https://wa.me/8801621422327?text=${encodeURIComponent(`${product.name || 'Product'} সম্পর্কে জানতে চাই`)}`;
  ask.target = '_blank';
  ask.rel = 'noopener';
  ask.textContent = english ? 'Ask on WhatsApp ↗' : 'WhatsApp-এ বিস্তারিত জানুন ↗';
  details.append(ask);
  layout.append(image, details);
  content.append(layout);
  if (!dialog.open) dialog.showModal();
}
$('closeProductDialog')?.addEventListener('click', () => $('productDialog')?.close());
$('productDialog')?.addEventListener('click', event => {
  if (event.target === $('productDialog')) $('productDialog').close();
});

function filterProducts(term) {
  const query = (term || '').trim().toLowerCase();
  const filtered = !query ? productsCache : productsCache.filter(product =>
    [product.name, product.description, product.category].filter(Boolean).join(' ').toLowerCase().includes(query)
  );
  renderProducts(filtered);
  $('clearProductSearch').hidden = !query;
}

async function loadProducts() {
  if (!productGrid) return;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description,price,image_url,category&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Product request failed (${response.status})`);
    const products = await response.json();
    productsCache = Array.isArray(products) ? products : [];
    renderProducts(productsCache);
  } catch (error) {
    console.error('Could not load products:', error);
    showProductMessage(english ? 'Products could not be loaded right now. Please contact us on WhatsApp.' : 'এই মুহূর্তে পণ্য লোড করা যায়নি। WhatsApp-এ যোগাযোগ করুন।');
    $('productCount').textContent = english ? 'Products unavailable' : 'পণ্য লোড হয়নি';
  }
}

$('productSearchForm')?.addEventListener('submit', event => {
  event.preventDefault();
  filterProducts($('productSearch').value);
  $('products').scrollIntoView({ behavior: 'smooth' });
});
$('productSearch')?.addEventListener('input', event => filterProducts(event.target.value));
$('clearProductSearch')?.addEventListener('click', () => {
  $('productSearch').value = '';
  filterProducts('');
});
document.querySelectorAll('.category-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    const category = tile.dataset.category || '';
    $('productSearch').value = category;
    const aliases = {
      laptop: ['laptop', 'notebook'],
      desktop: ['desktop', 'pc'],
      monitor: ['monitor', 'display'],
      processor: ['processor', 'cpu'],
      ram: ['ram', 'memory'],
      ssd: ['ssd', 'solid state'],
      graphics: ['graphics', 'gpu', 'vga'],
      accessories: ['accessory', 'accessories', 'keyboard', 'mouse', 'headphone'],
      software: ['software', 'operating system']
    };
    const terms = aliases[category] || [category];
    const matches = productsCache.filter(product => {
      const searchable = [product.name, product.description, product.category].filter(Boolean).join(' ').toLowerCase();
      return terms.some(term => searchable.includes(term));
    });
    renderProducts(matches);
    $('clearProductSearch').hidden = false;
  });
});
loadProducts();

async function loadManagedServices() {
  const grid = $('serviceGrid');
  if (!grid) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/services?select=name,description,image_url`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) throw new Error(`Service request failed (${response.status})`);
    const services = await response.json();
    if (!Array.isArray(services) || services.length === 0) return; // Keep the built-in service highlights as a fallback.
    grid.replaceChildren();
    services.forEach(service => {
      const card = document.createElement('article');
      card.className = 'service-card';
      if (service.image_url) {
        const image = document.createElement('img');
        image.src = service.image_url;
        image.alt = service.name || 'Galaxy Computer service';
        image.loading = 'lazy';
        image.className = 'managed-service-image';
        card.append(image);
      } else {
        const icon = document.createElement('span');
        icon.className = 'service-icon';
        icon.textContent = '⚙';
        card.append(icon);
      }
      const title = document.createElement('h3');
      title.textContent = service.name || 'Computer Service';
      const description = document.createElement('p');
      description.textContent = service.description || '';
      card.append(title, description);
      grid.append(card);
    });
  } catch (error) {
    console.warn('Managed services could not be loaded; showing default services.', error);
  }
}
loadManagedServices();

// Category drawer
const categoryDrawer = $('categoryDrawer');
const categoryOverlay = $('categoryOverlay');
function openCategoryMenu() {
  categoryDrawer?.classList.add('active');
  categoryOverlay?.classList.add('active');
  categoryDrawer?.setAttribute('aria-hidden', 'false');
  $('openCategories')?.setAttribute('aria-expanded', 'true');
  $('categorySearch')?.focus();
}
function closeCategoryMenu() {
  categoryDrawer?.classList.remove('active');
  categoryOverlay?.classList.remove('active');
  categoryDrawer?.setAttribute('aria-hidden', 'true');
  $('openCategories')?.setAttribute('aria-expanded', 'false');
}
$('openCategories')?.addEventListener('click', openCategoryMenu);
$('closeCategories')?.addEventListener('click', closeCategoryMenu);
categoryOverlay?.addEventListener('click', closeCategoryMenu);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMainMenu();
    closeCategoryMenu();
  }
});
document.querySelectorAll('.category-item').forEach(button => {
  button.addEventListener('click', () => {
    const submenu = button.nextElementSibling;
    const symbol = button.querySelector('span');
    if (!submenu) return;
    submenu.classList.toggle('open');
    if (symbol) symbol.textContent = submenu.classList.contains('open') ? '−' : '+';
  });
});
$('categorySearch')?.addEventListener('input', event => {
  const query = event.target.value.toLowerCase().trim();
  document.querySelectorAll('.category-group').forEach(group => {
    group.style.display = group.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});
document.querySelectorAll('.category-submenu a').forEach(link => link.addEventListener('click', () => {
  const term = link.textContent.trim();
  if ($('productSearch')) $('productSearch').value = term;
  filterProducts(term);
  closeCategoryMenu();
}));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Service worker registration failed:', error)));
}
