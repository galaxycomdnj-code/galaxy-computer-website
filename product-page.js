(() => {
  const SUPABASE_URL = 'https://wfuvzfiwnpbgbzzeygei.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_FMsWzO2LqaTzM8tem94M2w_i3HhnWHR';
  const root = document.getElementById('productPageContent');
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const money = value => {
    if (value === null || value === undefined || String(value).trim() === '') return '';
    const number = Number(value);
    return Number.isFinite(number) ? '৳ ' + number.toLocaleString('en-BD') : String(value);
  };
  const label = value => String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const textValue = value => {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ');
    if (typeof value === 'object') return Object.entries(value).map(([k,v]) => label(k) + ': ' + (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' · ');
    return String(value);
  };
  const firstValue = (product, keys) => {
    for (const key of keys) if (product[key] !== null && product[key] !== undefined && String(product[key]).trim() !== '') return product[key];
    return '';
  };
  const makeSection = (id, heading, content) => {
    const section = document.createElement('section');
    section.className = 'product-info-section';
    section.id = id;
    const title = document.createElement('h2');
    title.textContent = heading;
    section.append(title, content);
    return section;
  };
  const showMessage = message => {
    root.className = 'product-page-message';
    root.textContent = message;
  };
  async function loadProduct() {
    if (!productId) return showMessage('Product link is incomplete. Please return to the product list.');
    try {
      const url = SUPABASE_URL + '/rest/v1/products?select=*&id=eq.' + encodeURIComponent(productId) + '&limit=1';
      const response = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
      if (!response.ok) throw new Error('Product request failed (' + response.status + ')');
      const rows = await response.json();
      const product = Array.isArray(rows) ? rows[0] : null;
      if (!product) return showMessage('This product is no longer available. Please browse our latest products.');
      document.title = (product.name || 'Product Details') + ' | Galaxy Computer';
      root.className = 'product-detail-layout';
      root.replaceChildren();

      const top = document.createElement('article');
      top.className = 'product-detail-top';
      const gallery = document.createElement('div');
      gallery.className = 'product-detail-gallery';
      const imageListValue = firstValue(product, ['gallery_images','image_gallery','images']);
      let imageList = [];
      if (Array.isArray(imageListValue)) imageList = imageListValue;
      else if (typeof imageListValue === 'string' && imageListValue.trim()) {
        try { const parsed = JSON.parse(imageListValue); imageList = Array.isArray(parsed) ? parsed : [imageListValue]; }
        catch { imageList = [imageListValue]; }
      }
      const images = [...new Set([product.image_url, ...imageList].filter(value => typeof value === 'string' && /^https?:\/\//i.test(value)))];
      const mainImage = document.createElement('img');
      mainImage.className = 'product-detail-main-image';
      mainImage.src = images[0] || 'logo-mark.png';
      mainImage.alt = product.name || 'Galaxy Computer product';
      mainImage.onerror = () => { mainImage.onerror = null; mainImage.src = 'logo-mark.png'; };
      gallery.append(mainImage);
      if (images.length > 1) {
        const thumbs = document.createElement('div');
        thumbs.className = 'product-detail-thumbnails';
        images.forEach((src,index) => {
          const thumb = document.createElement('button');
          thumb.type = 'button';
          thumb.className = 'product-detail-thumbnail' + (index === 0 ? ' active' : '');
          thumb.setAttribute('aria-label','View product image ' + (index + 1));
          const image = document.createElement('img');
          image.src = src; image.alt = '';
          thumb.append(image);
          thumb.addEventListener('click', () => {
            mainImage.src = src;
            thumbs.querySelectorAll('button').forEach(button => button.classList.remove('active'));
            thumb.classList.add('active');
          });
          thumbs.append(thumb);
        });
        gallery.append(thumbs);
      }

      const summary = document.createElement('div');
      summary.className = 'product-detail-summary';
      const eyebrow = document.createElement('span');
      eyebrow.className = 'product-detail-eyebrow';
      eyebrow.textContent = 'GALAXY COMPUTER • PRODUCT DETAILS';
      summary.append(eyebrow);
      if (product.category) {
        const category = document.createElement('span');
        category.className = 'product-page-category';
        category.textContent = product.category;
        summary.append(category);
      }
      const title = document.createElement('h1');
      title.className = 'product-page-title';
      title.textContent = product.name || 'Product Details';
      summary.append(title);

      const quickMeta = document.createElement('div');
      quickMeta.className = 'product-detail-quick-meta';
      const metaItems = [
        ['Brand', firstValue(product,['brand','manufacturer'])],
        ['Model', firstValue(product,['model','model_number','part_number'])],
        ['Warranty', firstValue(product,['warranty','warranty_period'])],
        ['Availability', firstValue(product,['stock_status','availability','stock'])]
      ].filter(([,value]) => value !== '');
      metaItems.forEach(([name,value]) => {
        const item = document.createElement('div');
        item.className = 'product-detail-meta-item';
        const key = document.createElement('span'); key.textContent = name;
        const val = document.createElement('strong'); val.textContent = textValue(value);
        item.append(key,val); quickMeta.append(item);
      });
      if (metaItems.length) summary.append(quickMeta);

      const price = document.createElement('strong');
      price.className = 'product-page-price';
      price.textContent = product.price !== null && product.price !== undefined && String(product.price).trim() !== '' ? money(product.price) : 'Contact for Price';
      summary.append(price);
      const reassurance = document.createElement('p');
      reassurance.className = 'product-detail-note';
      reassurance.textContent = 'Availability and final price will be confirmed by Galaxy Computer.';
      summary.append(reassurance);
      const actions = document.createElement('div');
      actions.className = 'product-page-actions';
      const contact = document.createElement('a');
      contact.className = 'product-page-contact';
      contact.href = 'https://wa.me/8801621422327?text=' + encodeURIComponent('আসসালামু আলাইকুম, ' + (product.name || 'এই পণ্যটি') + ' অর্ডার করতে / বিস্তারিত জানতে চাই।');
      contact.target = '_blank'; contact.rel = 'noopener';
      contact.textContent = 'Order on WhatsApp ↗';
      contact.id = 'buy';
      const call = document.createElement('a');
      call.className = 'product-page-call';
      call.href = 'tel:01621422327';
      call.textContent = 'Call: 01621422327';
      actions.append(contact,call);
      summary.append(actions);
      top.append(gallery,summary);
      root.append(top);

      const nav = document.createElement('nav');
      nav.className = 'product-detail-tabs';
      nav.setAttribute('aria-label','Product information');
      [['overview','Overview'],['specifications','Specifications'],['description','Description']].forEach(([id,name]) => {
        const a = document.createElement('a'); a.href = '#' + id; a.textContent = name; nav.append(a);
      });
      root.append(nav);

      const lower = document.createElement('div');
      lower.className = 'product-detail-lower';
      const overview = document.createElement('div');
      overview.className = 'product-overview-copy';
      const overviewText = document.createElement('p');
      overviewText.textContent = product.description || 'For product details, availability and assistance, please contact Galaxy Computer.';
      overview.append(overviewText);
      lower.append(makeSection('overview','Product Overview',overview));

      const specs = document.createElement('div');
      specs.className = 'product-spec-table';
      const excluded = new Set(['id','name','description','price','image_url','category','created_at','updated_at','slug','gallery_images','image_gallery','images']);
      const entries = Object.entries(product).filter(([key,value]) => !excluded.has(key) && value !== null && value !== undefined && value !== '');
      if (product.category) entries.unshift(['category',product.category]);
      if (entries.length) entries.forEach(([key,value]) => {
        const row = document.createElement('div'); row.className = 'product-spec-row';
        const k = document.createElement('strong'); k.textContent = label(key);
        const v = document.createElement('span'); v.textContent = textValue(value);
        row.append(k,v); specs.append(row);
      });
      else {
        const empty = document.createElement('p'); empty.className = 'product-detail-muted';
        empty.textContent = 'Detailed technical specifications have not been added for this product yet. Contact us for assistance.';
        specs.append(empty);
      }
      lower.append(makeSection('specifications','Specifications',specs));

      const description = document.createElement('div');
      description.className = 'product-overview-copy';
      const descriptionText = document.createElement('p');
      descriptionText.textContent = product.description || 'No additional description is available for this product yet.';
      description.append(descriptionText);
      lower.append(makeSection('description','Product Description',description));
      root.append(lower);

      const help = document.createElement('aside');
      help.className = 'product-detail-help';
      const helpText = document.createElement('div');
      const helpTitle = document.createElement('h2'); helpTitle.textContent = 'Need help choosing this product?';
      const helpCopy = document.createElement('p'); helpCopy.textContent = 'Talk to Galaxy Computer for product availability, compatibility and expert guidance.';
      helpText.append(helpTitle,helpCopy);
      const helpLink = document.createElement('a'); helpLink.href = contact.href; helpLink.target = '_blank'; helpLink.rel = 'noopener'; helpLink.textContent = 'Chat on WhatsApp ↗';
      help.append(helpText,helpLink); root.append(help);
    } catch (error) {
      console.error('Could not load product details:',error);
      showMessage('Product details could not be loaded. Please try again or contact us on WhatsApp.');
    }
  }
  loadProduct();
})();