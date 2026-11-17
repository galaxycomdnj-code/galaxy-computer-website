(() => {
  const SUPABASE_URL = 'https://wfuvzfiwnpbgbzzeygei.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_FMsWzO2LqaTzM8tem94M2w_i3HhnWHR';
  const root = document.getElementById('productPageContent');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const money = value => {
    if (value === null || value === undefined || String(value).trim() === '') return '';
    const number = Number(value);
    return Number.isFinite(number) ? `৳ ${number.toLocaleString('en-BD')}` : String(value);
  };
  const showMessage = message => {
    root.className = 'product-page-message';
    root.textContent = message;
  };
  async function loadProduct() {
    if (!productId) {
      showMessage('Product link is incomplete. Please return to the product list.');
      return;
    }
    try {
      const url = `${SUPABASE_URL}/rest/v1/products?select=id,name,description,price,image_url,category&id=eq.${encodeURIComponent(productId)}&limit=1`;
      const response = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!response.ok) throw new Error('Product request failed');
      const rows = await response.json();
      const product = Array.isArray(rows) ? rows[0] : null;
      if (!product) {
        showMessage('This product is no longer available. Please browse our latest products.');
        return;
      }
      document.title = `${product.name || 'Product Details'} | Galaxy Computer`;
      root.className = '';
      root.replaceChildren();
      const card = document.createElement('article');
      card.className = 'product-page-card';
      const imageWrap = document.createElement('div');
      imageWrap.className = 'product-page-image-wrap';
      const image = document.createElement('img');
      image.className = 'product-page-image';
      image.src = product.image_url || 'logo-mark.png';
      image.alt = product.name || 'Galaxy Computer product';
      image.onerror = () => { image.src = 'logo-mark.png'; };
      imageWrap.append(image);
      const details = document.createElement('div');
      if (product.category) {
        const category = document.createElement('span');
        category.className = 'product-page-category';
        category.textContent = product.category;
        details.append(category);
      }
      const title = document.createElement('h1');
      title.className = 'product-page-title';
      title.textContent = product.name || 'Product Details';
      details.append(title);
      if (product.price !== null && product.price !== undefined && String(product.price).trim() !== '') {
        const price = document.createElement('strong');
        price.className = 'product-page-price';
        price.textContent = money(product.price);
        details.append(price);
      }
      if (product.description) {
        const description = document.createElement('p');
        description.className = 'product-page-description';
        description.textContent = product.description;
        details.append(description);
      }
      const actions = document.createElement('div');
      actions.className = 'product-page-actions';
      const contact = document.createElement('a');
      contact.className = 'product-page-contact';
      contact.href = `https://wa.me/8801621422327?text=${encodeURIComponent((product.name || 'Product') + ' সম্পর্কে জানতে চাই')}`;
      contact.target = '_blank';
      contact.rel = 'noopener';
      contact.textContent = 'Ask on WhatsApp ↗';
      const back = document.createElement('a');
      back.className = 'product-page-back-link';
      back.href = 'index.html#products';
      back.textContent = '← Back to Products';
      actions.append(contact, back);
      details.append(actions);
      card.append(imageWrap, details);
      root.append(card);
    } catch (error) {
      console.error('Could not load product details:', error);
      showMessage('Product details could not be loaded. Please try again or contact us on WhatsApp.');
    }
  }
  loadProduct();
})();