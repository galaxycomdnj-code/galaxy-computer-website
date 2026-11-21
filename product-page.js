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
  const stockLabel = value => ({available_on_order:'Available on Order',out_of_stock:'Out of Stock',price_on_request:'Price on Request'}[value] || 'Available on Order');
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
  async function loadRelatedProducts(product,container){
    if(!product.subcategory)return;
    const query=SUPABASE_URL+'/rest/v1/products?select=id,name,price,image_url,stock_status,category,subcategory&id=not.is.null&category=eq.'+encodeURIComponent(product.category||'')+'&subcategory=eq.'+encodeURIComponent(product.subcategory)+'&order=created_at.desc&limit=4';
    let rows=[];
    try{const response=await fetch(query,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(response.ok){const data=await response.json();if(Array.isArray(data))rows=data;}}
    catch(error){console.warn('Similar products could not be loaded:',error)}
    const others=rows.filter(item=>String(item.id)!==String(product.id));
    if(!others.length)return;
    rows=[product,...others].slice(0,4);
    const section=document.createElement('aside');section.className='similar-products-section';
    const heading=document.createElement('div');heading.className='similar-products-heading';
    const title=document.createElement('h2');title.textContent='Similar Products';
    heading.append(title);section.append(heading);
    const grid=document.createElement('div');grid.className='similar-products-list';
    rows.forEach(item=>{
      const card=document.createElement('article');card.className='similar-product-card';
      const link=document.createElement('a');link.className='product-main-link';link.href='product.html?id='+encodeURIComponent(item.id);
      const imageWrap=document.createElement('div');imageWrap.className='similar-product-image';
      if(item.image_url){const img=document.createElement('img');img.src=item.image_url;img.alt=item.name||'Product';img.loading='lazy';imageWrap.append(img)}
      else{const placeholder=document.createElement('span');placeholder.className='product-placeholder';placeholder.textContent='▣';imageWrap.append(placeholder)}
      const name=document.createElement('h3');name.textContent=item.name||'Product';link.append(imageWrap,name);
      if(item.stock_status!=='price_on_request'&&item.price!==null&&item.price!==undefined&&item.price!==''){const price=document.createElement('div');price.className='product-price';price.textContent=money(item.price);link.append(price)}
      card.append(link);
      const status=document.createElement('span');status.className='product-stock-status '+(item.stock_status||'available_on_order');status.textContent=stockLabel(item.stock_status||'available_on_order');card.append(status);
      const details=document.createElement('a');details.className='similar-product-link';details.href=link.href;details.textContent='View Details';card.append(details);
      grid.append(card);
    });
    section.append(grid);container.append(section);
  }
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
      const breadcrumb = document.createElement('nav');
      breadcrumb.className = 'product-breadcrumb';
      breadcrumb.setAttribute('aria-label', 'Breadcrumb');
      const crumbs = [
        { label: 'Home', href: 'index.html' },
        { label: 'Product', href: 'index.html#products' }
      ];
      if (product.category) crumbs.push({ label: product.category, href: 'index.html#products' });
      if (product.subcategory) crumbs.push({ label: product.subcategory, href: 'index.html#products' });
      crumbs.forEach((crumb, index) => {
        if (index) {
          const separator = document.createElement('span');
          separator.className = 'product-breadcrumb-separator';
          separator.textContent = '/';
          breadcrumb.append(separator);
        }
        const link = document.createElement('a');
        link.href = crumb.href;
        link.textContent = crumb.label;
        breadcrumb.append(link);
      });
      summary.append(breadcrumb);
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
        const val = document.createElement('strong'); val.textContent = name === 'Availability' ? stockLabel(value) : textValue(value);
        item.append(key,val); quickMeta.append(item);
      });
      if (metaItems.length) summary.append(quickMeta);

      const price = document.createElement('strong');
      price.className = 'product-page-price';
      price.textContent = (product.stock_status === 'price_on_request' || product.price === null || product.price === undefined || String(product.price).trim() === '') ? 'Contact for Price' : money(product.price);
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
      const buyNow = document.createElement('button');
      buyNow.type = 'button';
      buyNow.className = 'product-page-buy-now';
      buyNow.textContent = product.stock_status === 'out_of_stock' ? 'Out of Stock' : product.stock_status === 'price_on_request' ? 'Contact for Price' : 'Buy Now';
      buyNow.disabled = product.stock_status === 'out_of_stock' || product.stock_status === 'price_on_request';
      buyNow.addEventListener('click', () => {
        try {
          const key = 'galaxy-computer-cart-v1';
          const saved = JSON.parse(localStorage.getItem(key) || '[]');
          const cart = Array.isArray(saved) ? saved : [];
          const id = String(product.id || product.name);
          const existing = cart.find(item => String(item.id) === id);
          if (existing) existing.quantity = (Number(existing.quantity) || 0) + 1;
          else cart.push({
            id,
            name: product.name || 'Product',
            price: product.price !== null && product.price !== undefined && String(product.price).trim() !== '' && Number.isFinite(Number(product.price)) ? Number(product.price) : null,
            image_url: product.image_url || '',
            quantity: 1
          });
          localStorage.setItem(key, JSON.stringify(cart));
          window.location.href = 'index.html?buyNow=1#products';
        } catch (error) {
          console.error('Could not start direct purchase:', error);
          alert('Buy Now চালু করা যাচ্ছে না। অনুগ্রহ করে WhatsApp-এ Order করুন।');
        }
      });
      const call = document.createElement('a');
      call.className = 'product-page-call';
      call.href = 'tel:01621422327';
      call.textContent = 'Call: 01621422327';
      actions.append(contact,buyNow,call);
      summary.append(actions);
      top.append(gallery,summary);
      root.append(top);

      const nav = document.createElement('nav');
      nav.className = 'product-detail-tabs';
      nav.setAttribute('aria-label','Product information');
      [['description','Description'],['specifications','Specifications']].forEach(([id,name]) => {
        const a = document.createElement('a'); a.href = '#' + id; a.textContent = name; nav.append(a);
      });
      const lower = document.createElement('div');
      lower.className = 'product-detail-lower';
      const infoColumn = document.createElement('div');
      infoColumn.className = 'product-detail-info-column';
      infoColumn.append(nav);
      const specs = document.createElement('div');
      specs.className = 'product-spec-table';
      const enteredSpecs = String(product.specifications || '').trim();
      if (enteredSpecs) enteredSpecs.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
        const row = document.createElement('div'); row.className = 'product-spec-row';
        const separator = line.indexOf(':');
        const key = document.createElement('strong'); key.textContent = separator > 0 ? line.slice(0, separator).trim() : 'Specification';
        const value = document.createElement('span'); value.textContent = separator > 0 ? line.slice(separator + 1).trim() : line;
        row.append(key, value); specs.append(row);
      });
      if (!enteredSpecs) {
        const empty = document.createElement('p'); empty.className = 'product-detail-muted';
        empty.textContent = 'Detailed technical specifications have not been added for this product yet. Contact us for assistance.';
        specs.append(empty);
      }
      infoColumn.append(makeSection('specifications','Specifications',specs));

      const description = document.createElement('div');
      description.className = 'product-overview-copy product-description-copy';
      const descriptionText = document.createElement('p');
      descriptionText.textContent = product.description || 'No additional description is available for this product yet.';
      description.append(descriptionText);
      infoColumn.append(makeSection('description','Product Description',description));
      lower.append(infoColumn);
      root.append(lower);
      await loadRelatedProducts(product,lower);

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