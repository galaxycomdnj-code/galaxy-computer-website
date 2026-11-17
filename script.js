const $ = (id) => document.getElementById(id);
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMainMenu() {
  navLinks?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open menu');
}
menuButton?.addEventListener('click', () => {
  if (typeof openCategoryMenu === 'function') {
    if (categoryDrawer?.classList.contains('active')) closeCategoryMenu();
    else openCategoryMenu();
  }
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
  if (typeof productsCache !== 'undefined') { populateCategoryFilter(); filterProducts(search?.value || ''); }
});
if ($('year')) $('year').textContent = new Date().getFullYear();

// Cart: stores the shopper's cart locally; website checkout submits orders to Supabase.
const CART_STORAGE_KEY = 'galaxy-computer-cart-v1';
let cartItems = [];
let orderSubmitted = false;
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
    minus.disabled = orderSubmitted;
    minus.addEventListener('click', () => changeCartQuantity(item.id, -1));
    const qty = document.createElement('span'); qty.textContent = String(item.quantity);
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase quantity');
    plus.disabled = orderSubmitted;
    plus.addEventListener('click', () => changeCartQuantity(item.id, 1));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = english ? 'Remove' : 'বাদ দিন';
    remove.disabled = orderSubmitted;
    remove.addEventListener('click', () => removeCartItem(item.id));
    controls.append(minus, qty, plus, remove);
    row.append(name, price, controls);
    list.append(row);
  });
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0);
  if ($('cartSubtotal')) $('cartSubtotal').textContent = formatBDT(subtotal);
  const checkout = $('checkoutForm');
  if (checkout) {
    const disabled = cartItems.length === 0 || orderSubmitted;
    checkout.querySelectorAll('input,textarea,button').forEach(control => control.disabled = disabled);
  }
}
$('openCart')?.addEventListener('click', () => { renderCart(); $('cartDialog')?.showModal(); });
$('closeCart')?.addEventListener('click', () => $('cartDialog')?.close());
$('cartDialog')?.addEventListener('close', () => {
  if (!orderSubmitted) return;
  orderSubmitted = false;
  cartItems = [];
  saveCart();
  const feedback = $('checkoutMessage');
  if (feedback) feedback.textContent = '';
});
$('checkoutForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!cartItems.length) return;
  const form = $('checkoutForm');
  const submit = form.querySelector('button[type="submit"]');
  const name = $('customerName').value.trim();
  const phone = $('customerPhone').value.trim();
  const address = $('customerAddress').value.trim();
  const note = $('customerNote').value.trim();
  if (!name || !phone || !address) return;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price === null ? 0 : item.price * item.quantity), 0);
  const payload = {
    customer_name: name,
    customer_phone: phone,
    delivery_address: address,
    customer_note: note || null,
    items: cartItems.map(item => ({id:String(item.id),name:String(item.name),price:item.price===null?null:Number(item.price),quantity:Number(item.quantity)})),
    subtotal: Number(subtotal.toFixed(2)),
    status: 'Pending'
  };
  submit.disabled = true;
  submit.textContent = english ? 'Submitting order…' : 'অর্ডার জমা হচ্ছে…';
  let feedback = $('checkoutMessage');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.id = 'checkoutMessage';
    feedback.className = 'cart-note';
    feedback.setAttribute('role','status');
    form.append(feedback);
  }
  feedback.textContent = '';
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let detail = '';
      try { const result = await response.json(); detail = result.message || result.details || result.hint || ''; } catch {}
      throw new Error(detail || `Order submission failed (${response.status})`);
    }
    orderSubmitted = true;
    form.reset();
    const hasUnpricedItems = cartItems.some(item => item.price === null);
    const orderTotalText = formatBDT(subtotal);
    feedback.textContent = english
      ? `Your order has been submitted successfully. Subtotal: ${orderTotalText}${hasUnpricedItems ? ' (some item prices will be confirmed by Galaxy Computer).' : ''} Galaxy Computer will contact you shortly. Delivery charge, if applicable, will be confirmed separately.`
      : `আপনার অর্ডার সফলভাবে জমা হয়েছে। Subtotal: ${orderTotalText}${hasUnpricedItems ? ' (কিছু পণ্যের দাম Galaxy Computer থেকে নিশ্চিত করা হবে)।' : ''} ডেলিভারি চার্জ প্রযোজ্য হলে আলাদাভাবে নিশ্চিত করা হবে। Galaxy Computer থেকে শিগগিরই যোগাযোগ করা হবে।`;
    feedback.style.color = '#187044';
  } catch (error) {
    feedback.textContent = (english ? 'Order could not be submitted: ' : 'অর্ডার জমা হয়নি: ') + error.message;
    feedback.style.color = '#b42318';
  } finally {
    submit.disabled = cartItems.length === 0 || orderSubmitted;
    submit.textContent = english ? 'Place Order' : 'অর্ডার জমা দিন';
    renderCart();
  }
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
  productGrid.setAttribute('aria-busy', 'false');
  const messageBox = document.createElement('div');
  messageBox.className = className;
  messageBox.textContent = message;
  productGrid.append(messageBox);
}

function renderProducts(products) {
  if (!productGrid) return;
  productGrid.replaceChildren();
  productGrid.setAttribute('aria-busy', 'false');
  if (!products.length) {
    showProductMessage(english ? 'No matching products found. Contact us and we will help you find it.' : 'কোনো পণ্য পাওয়া যায়নি। পণ্য খুঁজে পেতে আমাদের সঙ্গে যোগাযোগ করুন।');
    $('productCount').textContent = english ? '0 products' : '০টি পণ্য';
    return;
  }

  $('productCount').textContent = english ? `${products.length} product${products.length === 1 ? '' : 's'}` : `${products.length}টি পণ্য`;
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.search = [product.name, product.description, product.category, product.subcategory].filter(Boolean).join(' ').toLowerCase();

    const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const productLink = document.createElement('a');
    productLink.className = 'product-main-link';
    productLink.href = productUrl;
    productLink.setAttribute('aria-label', `View ${product.name || 'product'} details`);

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
    productLink.append(imageWrap, title, description);

    if (product.price !== null && product.price !== undefined && product.price !== '') {
      const price = document.createElement('div');
      price.className = 'product-price';
      price.textContent = `৳ ${Number(product.price).toLocaleString('en-BD')}`;
      productLink.append(price);
    }
    card.append(productLink);

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'cart-add-btn';
    cartButton.textContent = english ? 'Add to Cart' : 'কার্টে যোগ করুন';
    cartButton.addEventListener('click', () => addToCart(product));

    const detailsButton = document.createElement('button');
    detailsButton.type = 'button';
    detailsButton.className = 'product-details-btn';
    detailsButton.textContent = english ? 'View Details' : 'বিস্তারিত দেখুন';
    detailsButton.addEventListener('click', () => { window.location.href = productUrl; });

    card.append(cartButton, detailsButton);
    productGrid.append(card);
  });
}


let activeCategoryTerms = [];
let activeSubcategory = '';
const normalizeCategoryText = value => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
function selectSubcategory(term) {
  activeSubcategory = String(term || '').trim();
  if ($('productSearch')) $('productSearch').value = '';
  if ($('productCategoryFilter')) $('productCategoryFilter').value = '';
  filterProducts('');
  $('products')?.scrollIntoView({ behavior: 'smooth' });
}
function populateCategoryFilter() {
  const select = $('productCategoryFilter');
  if (!select) return;
  const current = select.value;
  const categories = [...new Set(productsCache.map(product => String(product.category || '').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  select.replaceChildren();
  const all = document.createElement('option'); all.value = ''; all.textContent = english ? 'All categories' : 'সব ক্যাটাগরি'; select.append(all);
  categories.forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; select.append(option); });
  select.value = categories.includes(current) ? current : '';
}
function filterProducts(term) {
  const query = (term || '').trim().toLowerCase();
  const selectedCategory = ($('productCategoryFilter')?.value || '').trim().toLowerCase();
  let filtered = productsCache.filter(product => {
    const searchable = [product.name, product.description, product.category, product.subcategory].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = !selectedCategory || String(product.category || '').toLowerCase() === selectedCategory;
    const matchesShortcut = !activeCategoryTerms.length || activeCategoryTerms.some(word => searchable.includes(word));
    const matchesSubcategory = !activeSubcategory || normalizeCategoryText(product.subcategory) === normalizeCategoryText(activeSubcategory) || (!product.subcategory && normalizeCategoryText(searchable).includes(normalizeCategoryText(activeSubcategory)));
    return matchesQuery && matchesCategory && matchesShortcut && matchesSubcategory;
  });
  const sort = $('productSort')?.value || 'newest';
  const getPrice = product => {
    if (product.price === null || product.price === undefined || String(product.price).trim() === '') return null;
    const price = Number(product.price);
    return Number.isFinite(price) ? price : null;
  };
  const comparePrice = (a, b, direction) => {
    const priceA = getPrice(a);
    const priceB = getPrice(b);
    if (priceA === null && priceB === null) return 0;
    if (priceA === null) return 1;
    if (priceB === null) return -1;
    return (priceA - priceB) * direction;
  };
  if (sort === 'price-asc') filtered.sort((a, b) => comparePrice(a, b, 1));
  else if (sort === 'price-desc') filtered.sort((a, b) => comparePrice(a, b, -1));
  else if (sort === 'name-asc') filtered.sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
  else filtered.sort((a,b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  renderProducts(filtered);
  $('clearProductSearch').hidden = !(query || selectedCategory || activeCategoryTerms.length || activeSubcategory);
}

async function loadProducts() {
  if (!productGrid) return;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description,price,image_url,category,subcategory,created_at&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Product request failed (${response.status})`);
    const products = await response.json();
    productsCache = Array.isArray(products) ? products : [];
    populateDynamicCategorySubmenus();
    populateCategoryFilter();
    filterProducts($('productSearch')?.value || '');
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
$('productSearch')?.addEventListener('input', event => { activeCategoryTerms = []; activeSubcategory = ''; filterProducts(event.target.value); });
$('productCategoryFilter')?.addEventListener('change', () => { activeCategoryTerms = []; activeSubcategory = ''; filterProducts($('productSearch')?.value || ''); });
$('productSort')?.addEventListener('change', () => filterProducts($('productSearch')?.value || ''));
$('clearProductSearch')?.addEventListener('click', () => {
  $('productSearch').value = '';
  $('productCategoryFilter').value = '';
  activeCategoryTerms = [];
  activeSubcategory = '';
  filterProducts('');
});
document.querySelectorAll('.category-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    const category = tile.dataset.category || '';
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
    activeSubcategory = '';
    activeCategoryTerms = aliases[category] || [category];
    $('productSearch').value = '';
    $('productCategoryFilter').value = '';
    filterProducts('');
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


/* Keep desktop hover menus in sync with the mobile category drawer. */
function refreshDesktopCategoryDropdowns(){
  const nav=document.querySelector('.nav-links');
  const list=document.querySelector('#categoryList');
  if(!nav||!list) return;
  const sourceNames={
    laptop:'Laptop',desktop:'Desktop',components:'Components',ram:'RAM',
    storage:'Storage',monitor:'Monitor',accessories:'Accessories',
    networking:'Networking',printer:'Printer & Office',power:'Power & UPS'
  };
  nav.querySelectorAll('a[data-nav-category]').forEach(link=>{
    const key=link.dataset.navCategory;
    const source=[...list.querySelectorAll('.category-group')].find(group=>
      normalizeCategoryText(group.querySelector('.category-item')?.textContent.replace(/[+]/g,''))
      ===normalizeCategoryText(sourceNames[key])
    );
    const submenu=source?.querySelector('.category-submenu');
    if(!submenu) return;
    let wrapper=link.closest('.nav-category');
    if(!wrapper){
      wrapper=document.createElement('div');
      wrapper.className='nav-category';
      link.parentNode.insertBefore(wrapper,link);
      wrapper.append(link);
    }
    let dropdown=wrapper.querySelector('.nav-category-dropdown');
    if(!dropdown){
      dropdown=document.createElement('div');
      dropdown.className='nav-category-dropdown';
      wrapper.append(dropdown);
    }
    dropdown.replaceChildren();
    dropdown.setAttribute('aria-label',sourceNames[key]+' subcategories');
    [...submenu.querySelectorAll('a')].forEach(item=>{
      const option=item.cloneNode(true);
      option.addEventListener('click',event=>{
        event.preventDefault();
        selectSubcategory(option.textContent.trim());
      });
      dropdown.append(option);
    });
  });
}
function populateDynamicCategorySubmenus(){
  const list=$('categoryList');
  if(!list) return;
  const groups=[...list.querySelectorAll('.category-group')];
  groups.forEach(group=>{
    const label=group.querySelector('.category-item')?.textContent.replace(/[+]/g,'').trim()||'';
    const key=normalizeCategoryText(label);
    const submenu=group.querySelector('.category-submenu');
    if(!submenu) return;
    const values=new Map();
    submenu.querySelectorAll('a').forEach(anchor=>{
      const value=anchor.textContent.trim();
      if(value) values.set(normalizeCategoryText(value),value);
    });
    productsCache.forEach(product=>{
      if(normalizeCategoryText(product.category)!==key) return;
      const value=String(product.subcategory||'').trim();
      if(value&&!values.has(normalizeCategoryText(value))) values.set(normalizeCategoryText(value),value);
    });
    submenu.replaceChildren();
    [...values.values()].sort((a,b)=>a.localeCompare(b)).forEach(value=>{
      const anchor=document.createElement('a');
      anchor.href='#products';
      anchor.textContent=value;
      anchor.addEventListener('click',event=>{
        event.preventDefault();
        selectSubcategory(value);
        closeCategoryMenu();
      });
      submenu.append(anchor);
    });
  });
  refreshDesktopCategoryDropdowns();
}
refreshDesktopCategoryDropdowns();

// Category drawer
const categoryDrawer = $('categoryDrawer');
const categoryOverlay = $('categoryOverlay');
if (categoryDrawer) categoryDrawer.inert = true;
function openCategoryMenu() {
  if (!categoryDrawer) return;
  categoryDrawer.inert = false;
  categoryDrawer.classList.add('active');
  categoryOverlay?.classList.add('active');
  categoryDrawer.setAttribute('aria-hidden', 'false');
  $('openCategories')?.setAttribute('aria-expanded', 'true');
  menuButton?.setAttribute('aria-expanded', 'true');
  menuButton?.setAttribute('aria-label', 'Close categories');
  $('categorySearch')?.focus();
}
function closeCategoryMenu() {
  if (!categoryDrawer) return;
  const wasOpen = categoryDrawer.classList.contains('active');
  categoryDrawer.classList.remove('active');
  categoryOverlay?.classList.remove('active');
  categoryDrawer.setAttribute('aria-hidden', 'true');
  categoryDrawer.inert = true;
  $('openCategories')?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open categories');
  if (wasOpen) $('openCategories')?.focus();
}
$('openCategories')?.addEventListener('click', openCategoryMenu);
$('closeCategories')?.addEventListener('click', closeCategoryMenu);
categoryOverlay?.addEventListener('click', closeCategoryMenu);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMainMenu();
    closeCategoryMenu();
    return;
  }
  if (event.key === 'Tab' && categoryDrawer?.classList.contains('active')) {
    const focusable = [...categoryDrawer.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
      .filter(element => element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
document.querySelectorAll('.category-item').forEach((button, index) => {
  const submenu = button.nextElementSibling;
  if (submenu) {
    const submenuId = `category-submenu-${index + 1}`;
    submenu.id = submenuId;
    button.setAttribute('aria-controls', submenuId);
    button.setAttribute('aria-expanded', 'false');
  }
  button.addEventListener('click', () => {
    const target = button.nextElementSibling;
    const symbol = button.querySelector('span');
    if (!target) return;
    const isOpen = target.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
    if (symbol) symbol.textContent = isOpen ? '−' : '+';
  });
});
$('categorySearch')?.addEventListener('input', event => {
  const query = event.target.value.toLowerCase().trim();
  document.querySelectorAll('.category-group').forEach(group => {
    group.style.display = group.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});
document.querySelectorAll('.category-submenu a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  selectSubcategory(link.textContent.trim());
  closeCategoryMenu();
}));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Service worker registration failed:', error)));
}


// Open the cart automatically when a shopper chooses Buy Now from a product page.
if (new URLSearchParams(window.location.search).get('buyNow') === '1') {
  renderCart();
  const cartDialog = $('cartDialog');
  if (cartDialog && !cartDialog.open) cartDialog.showModal();
}
