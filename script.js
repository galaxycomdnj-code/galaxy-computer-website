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

let english = true;
function applySiteLanguage(refreshProducts = true) {
  document.documentElement.lang = english ? 'en' : 'bn';
  document.querySelectorAll('[data-bn][data-en]').forEach(element => {
    element.textContent = english ? element.dataset.en : element.dataset.bn;
  });
  if ($('languageBtn')) $('languageBtn').textContent = english ? 'বাংলা' : 'EN';
  const search = $('productSearch');
  if (search) search.placeholder = english ? 'Search products...' : 'পণ্য খুঁজুন...';
  if (refreshProducts && typeof productsCache !== 'undefined') { populateCategoryFilter(); filterProducts(search?.value || ''); }
}
applySiteLanguage(false);
// Keep the Hero, About, and Contact sections in Bengali on the initial page load.
// The language button still switches the entire site between Bengali and English.
['#home', '#about', '#contact', '.service-promo'].forEach(sectionSelector => {
  document.querySelectorAll(`${sectionSelector} [data-bn][data-en]`).forEach(element => {
    element.textContent = element.dataset.bn;
  });
});
$('languageBtn')?.addEventListener('click', () => {
  english = !english;
  applySiteLanguage();
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
  $('checkoutForm').hidden = false;
  $('orderSuccess').hidden = true;
  $('customerOrderId').textContent = '';
  $('orderCopyMessage').textContent = '';
});
$('copyOrderId')?.addEventListener('click', async () => {
  const orderId = $('customerOrderId')?.textContent || '';
  if (!orderId) return;
  try {
    await navigator.clipboard.writeText(orderId);
    $('orderCopyMessage').textContent = english ? 'Order ID copied.' : 'Order ID কপি হয়েছে।';
  } catch {
    $('orderCopyMessage').textContent = english ? 'Please select and copy the Order ID above.' : 'উপরের Order ID সিলেক্ট করে কপি করুন।';
  }
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
    payment_method: $('paymentMethod').value,
    payment_status: 'unpaid',
    final_price: null,
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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_customer_order`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_order: payload })
    });
    if (!response.ok) {
      let detail = '';
      try { const result = await response.json(); detail = result.message || result.details || result.hint || ''; } catch {}
      throw new Error(detail || `Order submission failed (${response.status})`);
    }
    const publicOrderId = await response.json();
    orderSubmitted = true;
    form.reset();
    const hasUnpricedItems = cartItems.some(item => item.price === null);
    const orderTotalText = formatBDT(subtotal);
    form.hidden = true;
    $('orderSuccess').hidden = false;
    $('customerOrderId').textContent = publicOrderId;
    const selectedPayment = payload.payment_method === 'bkash' ? 'bKash' : payload.payment_method === 'nagad' ? 'Nagad' : 'Cash on Delivery';
    $('orderSuccessSummary').textContent = english
      ? `Subtotal: ${orderTotalText}${hasUnpricedItems ? ' (some item prices will be confirmed by Galaxy Computer).' : ''} Preferred payment: ${selectedPayment}. We will confirm stock, final price and delivery charge before asking for payment.`
      : `সাবটোটাল: ${orderTotalText}${hasUnpricedItems ? ' (কিছু পণ্যের দাম Galaxy Computer থেকে নিশ্চিত করা হবে)।' : ''} পেমেন্ট পদ্ধতি: ${payload.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : selectedPayment}। পেমেন্টের আগে স্টক, চূড়ান্ত দাম ও ডেলিভারি চার্জ নিশ্চিত করা হবে।`;
    $('orderCopyMessage').textContent = '';
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
const featuredProductsGrid = $('featuredProductsGrid');
let productsCache = [];
let allProductsCache = [];
let selectedSpecificationFilters = {};

function showProductMessage(message, className = 'product-empty', targetGrid = productGrid) {
  if (!targetGrid) return;
  targetGrid.replaceChildren();
  targetGrid.setAttribute('aria-busy', 'false');
  const messageBox = document.createElement('div');
  messageBox.className = className;
  messageBox.textContent = message;
  targetGrid.append(messageBox);
}


let compareSelectedProducts = [];
function getCompareProduct(id) {
  return [...allProductsCache, ...productsCache].find(item => String(item.id) === String(id));
}
function ensureCompareUI() {
  if (!document.getElementById('compareDock')) {
    const dock = document.createElement('div');
    dock.id = 'compareDock'; dock.className = 'compare-dock'; dock.hidden = true;
    dock.innerHTML = '<div class="compare-dock-inner"><div><strong>Compare Products</strong><span id="compareSelectedCount">0/4 selected</span></div><div class="compare-dock-actions"><button type="button" id="clearCompare">Clear</button><button type="button" id="openCompare" disabled>Compare Now</button></div></div>';
    document.body.append(dock);
    dock.querySelector('#clearCompare').addEventListener('click', () => { compareSelectedProducts=[]; updateCompareUI(); });
    dock.querySelector('#openCompare').addEventListener('click', showProductComparison);
  }
  if (!document.getElementById('compareDialog')) {
    const dialog = document.createElement('div');
    dialog.id='compareDialog'; dialog.className='compare-dialog'; dialog.hidden=true;
    dialog.innerHTML='<div class="compare-dialog-backdrop" data-close-compare></div><section class="compare-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="compareDialogTitle"><div class="compare-dialog-head"><h2 id="compareDialogTitle">Product Comparison</h2><button type="button" aria-label="Close comparison" data-close-compare>×</button></div><div id="compareTableWrap" class="compare-table-wrap"></div></section>';
    document.body.append(dialog);
    dialog.querySelectorAll('[data-close-compare]').forEach(el=>el.addEventListener('click',()=>{dialog.hidden=true;}));
  }
}
function updateCompareUI() {
  ensureCompareUI();
  const dock=document.getElementById('compareDock');
  dock.hidden=compareSelectedProducts.length===0;
  document.getElementById('compareSelectedCount').textContent=compareSelectedProducts.length+'/4 selected';
  document.getElementById('openCompare').disabled=compareSelectedProducts.length<2;
  document.querySelectorAll('.compare-product-btn').forEach(btn=>{
    const selected=compareSelectedProducts.includes(String(btn.dataset.productId));
    btn.classList.toggle('is-selected',selected);
    btn.textContent=selected?'✓ Added to Compare':'⇄ Compare';
  });
}
function toggleProductCompare(product) {
  const id=String(product.id);
  if(compareSelectedProducts.includes(id)) compareSelectedProducts=compareSelectedProducts.filter(item=>item!==id);
  else if(compareSelectedProducts.length>=4) { alert('You can compare up to 4 products at a time.'); return; }
  else compareSelectedProducts.push(id);
  updateCompareUI();
}
function getComparisonSpecs(product) {
  const specs={};
  const structured=product.specifications_data&&typeof product.specifications_data==='object'?product.specifications_data:{};
  Object.entries(structured).forEach(([key,value])=>{const cleanKey=String(key).replace(/^\\s*[-–—]\\s*/,'').trim();specs[cleanKey]=Array.isArray(value)?value.join(', '):String(value??'');});
  String(product.specifications||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).forEach(line=>{
    const at=line.indexOf(':'); if(at>0){const key=line.slice(0,at).replace(/^\\s*[-–—]\\s*/,'').trim();if(!specs[key])specs[key]=line.slice(at+1).trim();}
  });
  return specs;
}
function showProductComparison() {
  const selected=compareSelectedProducts.map(getCompareProduct).filter(Boolean);
  if(selected.length<2)return;
  const keys=[...new Set(selected.flatMap(getComparisonSpecs).flatMap(spec=>Object.keys(spec)))].sort((a,b)=>a.localeCompare(b));
  const wrap=document.getElementById('compareTableWrap');wrap.replaceChildren();
  const table=document.createElement('table');table.className='compare-table';
  const head=document.createElement('tr');const first=document.createElement('th');first.textContent='Specification';head.append(first);
  selected.forEach(product=>{const th=document.createElement('th');th.textContent=product.name||'Product';head.append(th);});
  const thead=document.createElement('thead');thead.append(head);table.append(thead);
  const body=document.createElement('tbody');
  const addRow=(label,values)=>{const tr=document.createElement('tr');const th=document.createElement('th');th.textContent=label;tr.append(th);values.forEach(value=>{const td=document.createElement('td');td.textContent=value||'—';tr.append(td);});body.append(tr);};
  addRow('Price',selected.map(p=>p.price===null||p.price===undefined||p.price===''?'Contact for Price':'৳ '+Number(p.price).toLocaleString('en-BD')));
  addRow('Availability',selected.map(p=>({available_on_order:'Available on Order',out_of_stock:'Out of Stock',price_on_request:'Price on Request'}[p.stock_status||'available_on_order']||'Available on Order')));
  keys.forEach(key=>addRow(key,selected.map(p=>getComparisonSpecs(p)[key]||'')));
  table.append(body);wrap.append(table);
  document.getElementById('compareDialog').hidden=false;
}

function renderProducts(products, targetGrid = productGrid, countTarget = $('productCount'), emptyMessage = null) {
  if (!targetGrid) return;
  targetGrid.replaceChildren();
  targetGrid.setAttribute('aria-busy', 'false');
  if (!products.length) {
    showProductMessage(emptyMessage || (english ? 'No matching products found. Contact us and we will help you find it.' : 'কোনো পণ্য পাওয়া যায়নি। পণ্য খুঁজে পেতে আমাদের সঙ্গে যোগাযোগ করুন।'), 'product-empty', targetGrid);
    if (countTarget) countTarget.textContent = english ? '0 products' : '০টি পণ্য';
    return;
  }

  if (countTarget) countTarget.textContent = english ? `${products.length} product${products.length === 1 ? '' : 's'}` : `${products.length}টি পণ্য`;
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
    // Keep featured cards compact; show only a few key specifications in the main catalogue.
    productLink.append(imageWrap, title);
    if (targetGrid === productGrid) {
      const shortSpecs = Object.entries(getComparisonSpecs(product))
        .filter(([key, value]) => String(key).trim() && String(value).trim())
        .slice(0, 4);
      if (shortSpecs.length) {
        const specList = document.createElement('ul');
        specList.className = 'product-card-specs';
        shortSpecs.forEach(([key, value]) => {
          const item = document.createElement('li');
          const specText = `${key}: ${value}`;
          item.textContent = specText.length > 105 ? specText.slice(0, 102).trimEnd() + '…' : specText;
          specList.append(item);
        });
        productLink.append(specList);
      }
    }

    if (product.stock_status !== 'price_on_request' && product.price !== null && product.price !== undefined && product.price !== '') {
      const price = document.createElement('div');
      price.className = 'product-price';
      price.textContent = `৳ ${Number(product.price).toLocaleString('en-BD')}`;
      productLink.append(price);
    }
    card.append(productLink);

    const stockStatus = product.stock_status || 'available_on_order';
    const stockLabels = { available_on_order: english ? 'Available on Order' : 'অর্ডার করা যাবে', out_of_stock: english ? 'Out of Stock' : 'স্টক শেষ', price_on_request: english ? 'Price on Request' : 'দাম জানতে' };
    const stockBadge = document.createElement('span');
    stockBadge.className = 'product-stock-status ' + stockStatus;
    stockBadge.textContent = stockLabels[stockStatus] || stockLabels.available_on_order;
    card.append(stockBadge);

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'cart-add-btn';
    cartButton.textContent = stockStatus === 'out_of_stock' ? (english ? 'Out of Stock' : 'স্টক শেষ') : stockStatus === 'price_on_request' ? (english ? 'Contact for Price' : 'দাম জানতে যোগাযোগ') : (english ? 'Add to Cart' : 'কার্টে যোগ করুন');
    cartButton.disabled = stockStatus === 'out_of_stock' || stockStatus === 'price_on_request';
    cartButton.addEventListener('click', () => addToCart(product));

    const detailsButton = document.createElement('button');
    detailsButton.type = 'button';
    detailsButton.className = 'product-details-btn';
    detailsButton.textContent = english ? 'View Details' : 'বিস্তারিত দেখুন';
    detailsButton.addEventListener('click', () => { window.location.href = productUrl; });

    card.append(cartButton, detailsButton);
    targetGrid.append(card);
  });
  updateCompareUI();
}


let activeCategoryTerms = [];
let activeSubcategory = '';
let activeBrandTerm = '';
const normalizeCategoryText = value => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
function selectSubcategory(term) {
  activeSubcategory = String(term || '').trim();
  activeCategoryTerms=[];activeBrandTerm='';selectedSpecificationFilters={};
  if ($('productSearch')) $('productSearch').value = '';
  if ($('productCategoryFilter')) $('productCategoryFilter').value = '';
  renderDynamicSpecFilters();filterProducts('');
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
function renderDynamicSpecFilters(){
 const host=$('dynamicSpecFilters');if(!host)return;host.replaceChildren();
 const category=($('productCategoryFilter')?.value||'').trim().toLowerCase();
 const base=productsCache.filter(product=>{
  const categoryMatch=!category||String(product.category||'').toLowerCase()===category;
  const subMatch=!activeSubcategory||normalizeCategoryText(product.subcategory)===normalizeCategoryText(activeSubcategory);
  const shortcutMatch=!activeCategoryTerms.length||activeCategoryTerms.some(word=>[product.name,product.category,product.subcategory].filter(Boolean).join(' ').toLowerCase().includes(word));
  return categoryMatch&&subMatch&&shortcutMatch;
 });
 const facets=new Map();
 base.forEach(product=>{
  const specs=product.specifications_data&&typeof product.specifications_data==='object'?product.specifications_data:{};
  Object.entries(specs).forEach(([key,raw])=>{
   const values=(Array.isArray(raw)?raw:String(raw??'').split(',')).map(value=>String(value).trim()).filter(Boolean);
   if(!facets.has(key))facets.set(key,new Set());values.forEach(value=>facets.get(key).add(value));
  });
 });
 const preferredFacetOrder = ['availability','cpu socket','cpu sockets','ram type','form factor','formfactor','special features','specialfeature','special features'];
 const facetRank = key => {
  const normalized = normalizeCategoryText(key);
  const index = preferredFacetOrder.findIndex(name => normalizeCategoryText(name) === normalized);
  return index < 0 ? 100 : index;
 };
 [...facets.entries()].sort(([a],[b])=>facetRank(a)-facetRank(b) || a.localeCompare(b)).forEach(([key,values])=>{
  const group=document.createElement('details');group.className='filter-group';group.open=true;
  const heading=document.createElement('summary');heading.textContent=key;group.append(heading);
  [...values].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'})).forEach(value=>{
   const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.value=value;input.dataset.specKey=key;input.checked=(selectedSpecificationFilters[key]||[]).includes(value);
   input.addEventListener('change',()=>{const chosen=new Set(selectedSpecificationFilters[key]||[]);if(input.checked)chosen.add(value);else chosen.delete(value);selectedSpecificationFilters[key]=[...chosen];if(!selectedSpecificationFilters[key].length)delete selectedSpecificationFilters[key];filterProducts($('productSearch')?.value||'');});
   label.append(input,document.createTextNode(' '+value));group.append(label);
  });host.append(group);
 });
}
function filterProducts(term) {
  const catalogLayout = document.querySelector('.catalog-layout');
  const hasCategoryContext = Boolean(
    activeCategoryTerms.length || activeSubcategory || activeBrandTerm ||
    ($('productCategoryFilter')?.value || '').trim()
  );
  catalogLayout?.classList.toggle('has-category-context', hasCategoryContext);
  document.querySelector('#products.products-section')?.classList.toggle('has-category-context', hasCategoryContext);
  const query = (term || '').trim().toLowerCase();
  const selectedCategory = ($('productCategoryFilter')?.value || '').trim().toLowerCase();
  let filtered = productsCache.filter(product => {
    const searchable = [product.name, product.description, product.category, product.subcategory].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = !selectedCategory || String(product.category || '').toLowerCase() === selectedCategory;
    const matchesShortcut = !activeCategoryTerms.length || activeCategoryTerms.some(word => searchable.includes(word));
    const normalizedFilter = normalizeCategoryText(activeSubcategory);
    const productType = normalizeCategoryText(product.subcategory || '');
    const productCategory = normalizeCategoryText(product.category || '');
    const matchesSubcategory = !activeSubcategory || productType === normalizedFilter || productCategory === normalizedFilter;
    const brandSearchable = normalizeCategoryText([product.brand, product.name].filter(Boolean).join(' '));
    const normalizedBrand = normalizeCategoryText(activeBrandTerm);

    const matchesBrand = !activeBrandTerm || brandSearchable.includes(normalizedBrand);
    const price=product.price===null||product.price===undefined||product.price===''?null:Number(product.price);
    const minText=$('filterMinPrice')?.value.trim()||'',maxText=$('filterMaxPrice')?.value.trim()||'';
    const matchesMin=!minText||(price!==null&&Number.isFinite(price)&&price>=Number(minText));
    const matchesMax=!maxText||(price!==null&&Number.isFinite(price)&&price<=Number(maxText));
    const chosenStock=[...document.querySelectorAll('.stock-filter:checked')].map(input=>input.value);
    const matchesStock=!chosenStock.length||chosenStock.includes(product.stock_status||'available_on_order');
    const specs=product.specifications_data&&typeof product.specifications_data==='object'?product.specifications_data:{};
    const matchesSpecs=Object.entries(selectedSpecificationFilters).every(([key,values])=>{
      const raw=specs[key];const productValues=(Array.isArray(raw)?raw:String(raw??'').split(',')).map(value=>String(value).trim());
      return values.some(value=>productValues.includes(value));
    });
    return matchesQuery && matchesCategory && matchesShortcut && matchesSubcategory && matchesBrand && matchesMin && matchesMax && matchesStock && matchesSpecs;
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

  const total=filtered.length;
  const limit=$('productLimit')?.value||'20';
  const visible=limit==='all'?filtered:filtered.slice(0,Number(limit)||20);
  renderProducts(visible);
  if ($('productCount')) {
    const categoryTitle = activeBrandTerm || activeSubcategory || (activeCategoryTerms.length ? activeCategoryTerms.join(' / ') : selectedCategory);
    $('productCount').textContent = hasCategoryContext && categoryTitle
      ? categoryTitle
      : (english ? (total+' product'+(total===1?'':'s')) : (total+'টি পণ্য'));
  }
  $('clearProductSearch').hidden = !(query || selectedCategory || activeCategoryTerms.length || activeSubcategory || activeBrandTerm || $('filterMinPrice')?.value || $('filterMaxPrice')?.value || Object.keys(selectedSpecificationFilters).length || document.querySelector('.stock-filter:checked'));
}

async function loadProducts() {
  if (!productGrid && !featuredProductsGrid) return;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,brand,model,description,price,image_url,category,subcategory,stock_status,created_at,is_featured,featured_order,specifications_data&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Product request failed (${response.status})`);
    const products = await response.json();
    productsCache = Array.isArray(products) ? products : [];
    allProductsCache = productsCache;
    const featuredProducts = productsCache
      .filter(product => product.is_featured === true)
      .sort((a, b) => Number(a.featured_order || 1) - Number(b.featured_order || 1) || String(b.created_at || '').localeCompare(String(a.created_at || '')));
    renderProducts(featuredProducts, featuredProductsGrid, null, english ? 'No featured products selected yet.' : 'এখনো কোনো Featured Product নির্বাচন করা হয়নি।');
    populateDynamicCategorySubmenus();
    populateCategoryFilter();
    renderDynamicSpecFilters();
    filterProducts($('productSearch')?.value || '');
  } catch (error) {
    console.error('Could not load products:', error);
    showProductMessage(english ? 'Products could not be loaded right now. Please contact us on WhatsApp.' : 'এই মুহূর্তে পণ্য লোড করা যায়নি। WhatsApp-এ যোগাযোগ করুন।');
    showProductMessage(english ? 'Featured products could not be loaded.' : 'Featured পণ্য লোড করা যায়নি।', 'product-empty', featuredProductsGrid);
    if ($('productCount')) $('productCount').textContent = english ? 'Products unavailable' : 'পণ্য লোড হয়নি';
  }
}

$('productSearchForm')?.addEventListener('submit', event => {
  event.preventDefault();
  filterProducts($('productSearch').value);
  $('products').scrollIntoView({ behavior: 'smooth' });
});
$('productSearch')?.addEventListener('input', event => { activeCategoryTerms = []; activeSubcategory = ''; activeBrandTerm = '';renderDynamicSpecFilters();filterProducts(event.target.value); });
$('productCategoryFilter')?.addEventListener('change', () => { activeCategoryTerms = []; activeSubcategory = ''; activeBrandTerm = ''; selectedSpecificationFilters={};renderDynamicSpecFilters();filterProducts($('productSearch')?.value || ''); });
$('productSort')?.addEventListener('change', () => filterProducts($('productSearch')?.value || ''));
$('clearProductSearch')?.addEventListener('click', () => {
  $('productSearch').value = '';
  $('productCategoryFilter').value = '';
  $('filterMinPrice').value='';$('filterMaxPrice').value='';document.querySelectorAll('.stock-filter').forEach(input=>input.checked=false);selectedSpecificationFilters={};
  activeCategoryTerms = [];
  activeSubcategory = '';
  activeBrandTerm = '';
  renderDynamicSpecFilters();filterProducts('');
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
    activeBrandTerm = '';
    activeCategoryTerms = aliases[category] || [category];
    $('productSearch').value = '';
    $('productCategoryFilter').value = '';

    selectedSpecificationFilters={};renderDynamicSpecFilters();filterProducts('');
  });
});
function setupPriceRangeSliders() {
 const minRange=$('filterMinRange'), maxRange=$('filterMaxRange');
 const minInput=$('filterMinPrice'), maxInput=$('filterMaxPrice');
 const minLabel=$('filterMinRangeValue'), maxLabel=$('filterMaxRangeValue');
 if(!minRange||!maxRange||!minInput||!maxInput)return;
 const prices=productsCache.map(p=>Number(p.price)).filter(p=>Number.isFinite(p)&&p>=0);
 const floor=prices.length?Math.floor(Math.min(...prices)/100)*100:0;
 const ceiling=prices.length?Math.ceil(Math.max(...prices)/100)*100:200000;
 [minRange,maxRange].forEach(range=>{range.min=String(floor);range.max=String(Math.max(ceiling,floor+100));});
 minRange.step=maxRange.step='100';
 minRange.value=String(floor);maxRange.value=String(Math.max(ceiling,floor+100));
 const refresh=changed=>{
  let low=Number(minRange.value),high=Number(maxRange.value);
  if(low>high){if(changed==='min')minRange.value=String(high);else maxRange.value=String(low);low=Number(minRange.value);high=Number(maxRange.value);}
  minInput.value=low<=floor?'':String(low);
  maxInput.value=high>=Number(maxRange.max)?'':String(high);
  minLabel.textContent='৳ '+low.toLocaleString('en-BD');
  maxLabel.textContent='৳ '+high.toLocaleString('en-BD');
  filterProducts($('productSearch')?.value||'');
 };
 minRange.addEventListener('input',()=>refresh('min'));
 maxRange.addEventListener('input',()=>refresh('max'));
 minInput.addEventListener('input',()=>{
  const value=minInput.value===''?floor:Math.min(Number(minInput.value),Number(maxRange.value));
  minRange.value=String(Math.max(floor,value));
  minLabel.textContent='৳ '+Number(minRange.value).toLocaleString('en-BD');
  filterProducts($('productSearch')?.value||'');
 });
 maxInput.addEventListener('input',()=>{
  const value=maxInput.value===''?Number(maxRange.max):Math.max(Number(maxInput.value),Number(minRange.value));
  maxRange.value=String(Math.min(Number(maxRange.max),value));
  maxLabel.textContent='৳ '+Number(maxRange.value).toLocaleString('en-BD');
  filterProducts($('productSearch')?.value||'');
 });
}
['filterMinPrice','filterMaxPrice'].forEach(id=>$(id)?.addEventListener('change',()=>filterProducts($('productSearch')?.value||'')));
setupPriceRangeSliders();
document.querySelectorAll('.stock-filter').forEach(input=>input.addEventListener('change',()=>filterProducts($('productSearch')?.value||'')));
$('productLimit')?.addEventListener('change',()=>filterProducts($('productSearch')?.value||''));
$('mobileFilterToggle')?.addEventListener('click',()=>{const body=$('catalogFilterBody');const open=body.classList.toggle('is-open');$('mobileFilterToggle').setAttribute('aria-expanded',String(open));});
loadProducts();

function addServiceReadMore(grid) {
  if (!grid) return;
  grid.querySelectorAll('.service-card p').forEach(description => {
    if (description.dataset.readMoreReady) return;
    description.dataset.readMoreReady = 'true';
    if ((description.textContent || '').trim().length <= 90) return;
    description.classList.add('service-description-collapsed');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'service-read-more';
    button.textContent = 'আরও পড়ুন';
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const expanded = description.classList.toggle('service-description-expanded');
      description.classList.toggle('service-description-collapsed', !expanded);
      button.textContent = expanded ? 'কম দেখুন' : 'আরও পড়ুন';
      button.setAttribute('aria-expanded', String(expanded));
    });
    description.after(button);
  });
}

async function loadManagedServices() {
  const grid = $('serviceGrid');
  if (!grid) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/services?select=name,description,image_url`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) throw new Error(`Service request failed (${response.status})`);
    const services = await response.json();
    if (!Array.isArray(services) || services.length === 0) { addServiceReadMore(grid); return; } // Keep built-in service highlights as a fallback.
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
    addServiceReadMore(grid);
  } catch (error) {
    console.warn('Managed services could not be loaded; showing default services.', error);
  }
}
loadManagedServices();


/* Build category menus from the catalogue so new Admin categories appear automatically. */
function refreshDesktopCategoryDropdowns(){
  const nav=document.querySelector('.nav-links');
  const list=$('categoryList');
  if(!nav||!list) return;
  [...list.querySelectorAll('.category-group')].forEach(group=>{
    const label=group.querySelector('.category-item')?.textContent.replace(/[+−]/g,'').trim()||'';
    const submenu=group.querySelector('.category-submenu');
    if(!label||!submenu) return;
    let link=[...nav.querySelectorAll('a[data-nav-category]')].find(a=>normalizeCategoryText(a.dataset.navCategory)===normalizeCategoryText(label)||normalizeCategoryText(a.textContent)===normalizeCategoryText(label));
    if(!link){
      const wrapper=document.createElement('div');
      wrapper.className='nav-category';
      link=document.createElement('a');
      link.href='#products';
      link.dataset.navCategory=label;
      link.textContent=label;
      wrapper.append(link);
      nav.append(wrapper);
    }else{
      let wrapper=link.closest('.nav-category');
      if(!wrapper){wrapper=document.createElement('div');wrapper.className='nav-category';link.parentNode.insertBefore(wrapper,link);wrapper.append(link);}
    }
    const wrapper=link.closest('.nav-category');
    let dropdown=wrapper.querySelector('.nav-category-dropdown');
    if(!dropdown){dropdown=document.createElement('div');dropdown.className='nav-category-dropdown';wrapper.append(dropdown);}
    dropdown.replaceChildren();
    dropdown.setAttribute('aria-label',label+' subcategories');
    [...submenu.querySelectorAll(':scope > a, :scope > .category-nested-group')].forEach(item=>{
      if(item.classList.contains('category-nested-group')){
        const typeButton=item.querySelector(':scope > .category-item');
        const brandMenu=item.querySelector(':scope > .category-submenu');
        const type=(typeButton?.childNodes[0]?.textContent||typeButton?.textContent||'').replace(/[+−]/g,'').trim();
        if(!type)return;
        const nested=document.createElement('div');
        nested.className='nav-category-nested';
        const option=document.createElement('a');
        option.href='#products';
        option.className='nav-category-type-link';
        option.textContent=type+'  ›';
        option.addEventListener('click',event=>{event.preventDefault();activeBrandTerm='';selectSubcategory(type);});
        nested.append(option);
        if(brandMenu){
          const brands=document.createElement('div');
          brands.className='nav-category-brand-dropdown';
          brands.setAttribute('aria-label',type+' brands');
          [...brandMenu.querySelectorAll(':scope > a')].forEach(brandLink=>{
            const brand=document.createElement('a');
            brand.href='#products';
            brand.textContent=brandLink.textContent.trim();
            brand.addEventListener('click',event=>{
              event.preventDefault();
              activeSubcategory=type;
              activeBrandTerm=(brandLink.dataset.filter||brandLink.textContent||'').trim();
              activeCategoryTerms=[];
              if($('productSearch'))$('productSearch').value='';
              if($('productCategoryFilter'))$('productCategoryFilter').value='';
              filterProducts('');
              $('products')?.scrollIntoView({behavior:'smooth'});
            });
            brands.append(brand);
          });
          if(brands.childElementCount)nested.append(brands);
        }
        dropdown.append(nested);
      }else{
        const option=document.createElement('a');
        option.href='#products';
        option.textContent=item.textContent.trim();
        option.addEventListener('click',event=>{event.preventDefault();selectSubcategory(option.textContent.trim());});
        dropdown.append(option);
      }
    });
  });
}
function populateDynamicCategorySubmenus(){
  const list=$('categoryList');
  if(!list) return;
  const groups=[...list.querySelectorAll(':scope > .category-group')];
  const groupByKey=new Map(groups.map(group=>{
    const label=group.querySelector(':scope > .category-item')?.textContent.replace(/[+−]/g,'').trim()||'';
    return [normalizeCategoryText(label),group];
  }));
  const hiddenLegacyCategories=new Set(['ram','storage']);
  [...new Set(allProductsCache.map(product=>String(product.category||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b)).forEach(label=>{
      const key=normalizeCategoryText(label);
      if(groupByKey.has(key)||hiddenLegacyCategories.has(key)) return;
      const group=document.createElement('div');group.className='category-group';
      const button=document.createElement('button');button.type='button';button.className='category-item';button.textContent=label;
      const symbol=document.createElement('span');symbol.textContent='+';button.append(symbol);
      const submenu=document.createElement('div');submenu.className='category-submenu';
      group.append(button,submenu);list.append(group);groupByKey.set(key,group);
    });
  groupByKey.forEach((group,key)=>{
    const submenu=group.querySelector(':scope > .category-submenu');
    if(!submenu) return;
    const nestedGroups=[...submenu.querySelectorAll(':scope > .category-nested-group')];
    if(nestedGroups.length){
      nestedGroups.forEach(nested=>{
        const typeButton=nested.querySelector(':scope > .category-item');
        const type=(typeButton?.childNodes[0]?.textContent||typeButton?.textContent||'').replace(/[+−]/g,'').trim();
        const brandMenu=nested.querySelector(':scope > .category-submenu');
        if(!brandMenu||!type)return;
        const brands=[...new Set(allProductsCache
          .filter(product=>
            normalizeCategoryText(product.category)===key &&
            normalizeCategoryText(product.subcategory)===normalizeCategoryText(type) &&
            String(product.brand||'').trim()
          )
          .map(product=>String(product.brand).trim())
        )].sort((a,b)=>a.localeCompare(b));
        brandMenu.replaceChildren();
        brands.forEach(brand=>{
          const anchor=document.createElement('a');
          anchor.href='#products';anchor.dataset.filter=brand;anchor.textContent=brand;
          brandMenu.append(anchor);
        });
      });
      return;
    }
    const values=new Map();
    submenu.querySelectorAll(':scope > a').forEach(anchor=>{const value=anchor.textContent.trim();if(value)values.set(normalizeCategoryText(value),value);});
    allProductsCache.forEach(product=>{
      if(normalizeCategoryText(product.category)!==key)return;
      const value=String(product.subcategory||'').trim();
      if(value&&!values.has(normalizeCategoryText(value)))values.set(normalizeCategoryText(value),value);
    });
    submenu.replaceChildren();
    [...values.values()].sort((a,b)=>a.localeCompare(b)).forEach(value=>{
      const anchor=document.createElement('a');anchor.href='#products';anchor.textContent=value;
      anchor.addEventListener('click',event=>{event.preventDefault();selectSubcategory(value);closeCategoryMenu();});
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
categoryDrawer?.addEventListener('click',event=>{
  const button=event.target.closest('.category-item');
  if(button&&categoryDrawer.contains(button)){
    const target=button.nextElementSibling;
    if(target?.classList.contains('category-submenu')){
      const opened=target.classList.toggle('open');
      button.setAttribute('aria-expanded',String(opened));
      const symbol=button.querySelector('span');if(symbol)symbol.textContent=opened?'−':'+';
    }
    return;
  }
  const link=event.target.closest('.category-submenu a');
  if(link&&categoryDrawer.contains(link)){
    event.preventDefault();
    const nestedGroup = link.closest('.category-nested-group');
    if (nestedGroup) {
      const typeButton = nestedGroup.querySelector(':scope > .category-item');
      activeSubcategory = (typeButton?.childNodes[0]?.textContent || typeButton?.textContent || '').replace(/[+−]/g,'').trim();
      activeBrandTerm = (link.dataset.filter || link.textContent || '').trim();
      activeCategoryTerms = [];selectedSpecificationFilters={};
      if ($('productSearch')) $('productSearch').value = '';
      if ($('productCategoryFilter')) $('productCategoryFilter').value = '';
      renderDynamicSpecFilters();filterProducts('');
      $('products')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      activeBrandTerm = '';
      selectSubcategory(link.dataset.filter||link.textContent.trim());
    }
    closeCategoryMenu();
  }
});
$('categorySearch')?.addEventListener('input',event=>{
  const query=event.target.value.toLowerCase().trim();
  document.querySelectorAll('.category-group').forEach(group=>{
    group.style.display=group.textContent.toLowerCase().includes(query)?'':'none';
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Service worker registration failed:', error)));
}


// Open the cart automatically when a shopper chooses Buy Now from a product page.
if (new URLSearchParams(window.location.search).get('buyNow') === '1') {
  renderCart();
  const cartDialog = $('cartDialog');
  if (cartDialog && !cartDialog.open) cartDialog.showModal();
  // Consume the one-time Buy Now flag so Home navigation and reload do not reopen checkout.
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('buyNow');
  window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
}
