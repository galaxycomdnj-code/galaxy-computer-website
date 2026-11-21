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

  let detailCompareItems=[];
  function detailSpecs(item){
    const out={};const structured=item.specifications_data&&typeof item.specifications_data==='object'?item.specifications_data:{};
    Object.entries(structured).forEach(([k,v])=>{const cleanKey=String(k).replace(/^\\s*[-–—]\\s*/,'').trim();out[cleanKey]=Array.isArray(v)?v.join(', '):String(v??'');});
    String(item.specifications||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(line=>{const i=line.indexOf(':');if(i>0){const key=line.slice(0,i).replace(/^\\s*[-–—]\\s*/,'').trim();if(!out[key])out[key]=line.slice(i+1).trim();}});
    return out;
  }
  function ensureDetailCompare(){
    if(document.getElementById('detailCompareDock'))return;
    const dock=document.createElement('div');dock.id='detailCompareDock';dock.className='compare-dock';dock.hidden=true;
    dock.innerHTML='<div class="compare-dock-inner"><div><strong>Compare Products</strong><span id="detailCompareCount">0/4 selected</span></div><div class="compare-dock-actions"><button type="button" id="detailCompareClear">Clear</button><button type="button" id="detailCompareOpen" disabled>Compare Now</button></div></div>';
    document.body.append(dock);dock.querySelector('#detailCompareClear').addEventListener('click',()=>{detailCompareItems=[];updateDetailCompare();});dock.querySelector('#detailCompareOpen').addEventListener('click',showDetailCompare);
    const modal=document.createElement('div');modal.id='detailCompareModal';modal.className='compare-dialog';modal.hidden=true;
    modal.innerHTML='<div class="compare-dialog-backdrop" data-detail-close></div><section class="compare-dialog-panel" role="dialog" aria-modal="true"><div class="compare-dialog-head"><h2>Product Comparison</h2><button type="button" data-detail-close aria-label="Close">×</button></div><div id="detailCompareTable" class="compare-table-wrap"></div></section>';
    document.body.append(modal);modal.querySelectorAll('[data-detail-close]').forEach(el=>el.addEventListener('click',()=>modal.hidden=true));
  }
  function updateDetailCompare(){
    ensureDetailCompare();document.getElementById('detailCompareDock').hidden=!detailCompareItems.length;
    document.getElementById('detailCompareCount').textContent=detailCompareItems.length+'/4 selected';
    document.getElementById('detailCompareOpen').disabled=detailCompareItems.length<2;
    document.querySelectorAll('.detail-compare-item').forEach(btn=>{const yes=detailCompareItems.some(x=>String(x.id)===String(btn.dataset.id));btn.classList.toggle('is-selected',yes);btn.textContent=yes?'✓ Added':'＋ Add to Compare';});
  }
  function toggleDetailCompare(item){
    const exists=detailCompareItems.some(x=>String(x.id)===String(item.id));
    if(exists)detailCompareItems=detailCompareItems.filter(x=>String(x.id)!==String(item.id));
    else if(detailCompareItems.length>=4){alert('You can compare up to 4 products.');return;}
    else detailCompareItems.push(item);
    updateDetailCompare();
  }
  function showDetailCompare(){
    if(detailCompareItems.length<2)return;
    const keys=[...new Set(detailCompareItems.flatMap(x=>Object.keys(detailSpecs(x))))].sort();
    const wrap=document.getElementById('detailCompareTable');wrap.replaceChildren();
    const table=document.createElement('table');table.className='compare-table';
    const head=document.createElement('tr');const first=document.createElement('th');first.textContent='Specification';head.append(first);
    detailCompareItems.forEach(item=>{const th=document.createElement('th');th.textContent=item.name||'Product';head.append(th);});
    const thead=document.createElement('thead');thead.append(head);table.append(thead);
    const body=document.createElement('tbody');
    const add=(label,values)=>{const tr=document.createElement('tr');const th=document.createElement('th');th.textContent=label;tr.append(th);values.forEach(v=>{const td=document.createElement('td');td.textContent=v||'—';tr.append(td);});body.append(tr);};
    add('Price',detailCompareItems.map(x=>money(x.price)||'Contact for Price'));add('Availability',detailCompareItems.map(x=>stockLabel(x.stock_status)));
    keys.forEach(key=>add(key,detailCompareItems.map(x=>detailSpecs(x)[key]||'')));
    table.append(body);wrap.append(table);document.getElementById('detailCompareModal').hidden=false;
  }

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
      const compare=document.createElement('button');compare.type='button';compare.className='detail-compare-item';compare.dataset.id=String(item.id);compare.textContent='＋ Add to Compare';compare.addEventListener('click',()=>toggleDetailCompare(item));card.append(compare);
      const status=document.createElement('span');status.className='product-stock-status '+(item.stock_status||'available_on_order');status.textContent=stockLabel(item.stock_status||'available_on_order');card.append(status);
      const details=document.createElement('a');details.className='similar-product-link';details.href=link.href;details.textContent='View Details';card.append(details);
      grid.append(card);
    });
    section.append(grid);container.append(section);updateDetailCompare();
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

      const summaryMeta = document.createElement('div');
      summaryMeta.className = 'product-detail-price-panel';
      const priceTable = document.createElement('div');
      priceTable.className = 'product-detail-price-table';
      const regularPrice = firstValue(product,['regular_price','original_price','list_price','mrp']);
      const productCode = firstValue(product,['product_code','sku','product_sku','code','part_number']);
      const brandName = firstValue(product,['brand','manufacturer']);
      const addPriceRow = (name, value, className = '') => {
        if (value === '' || value === null || value === undefined) return;
        const row = document.createElement('div');
        row.className = 'product-detail-price-row' + (className ? ' ' + className : '');
        const key = document.createElement('span'); key.textContent = name;
        const val = document.createElement('strong'); val.textContent = value;
        row.append(key, val); priceTable.append(row);
      };
      const currentPrice = (product.stock_status === 'price_on_request' || product.price === null || product.price === undefined || String(product.price).trim() === '') ? 'Contact for Price' : money(product.price);
      addPriceRow('Price', currentPrice, 'current-price-row');
      if (regularPrice !== '') addPriceRow('Regular Price', money(regularPrice));
      addPriceRow('Status', stockLabel(product.stock_status || 'available_on_order'));
      if (productCode !== '') addPriceRow('Product Code', textValue(productCode));
      if (brandName !== '') addPriceRow('Brand', textValue(brandName));
      summaryMeta.append(priceTable);
      const reassurance = document.createElement('p');
      reassurance.className = 'product-detail-note';
      reassurance.textContent = 'Availability and final price will be confirmed by Galaxy Computer.';
      summaryMeta.append(reassurance);
      summary.append(summaryMeta);

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
      const compareButton=document.createElement('button');
      compareButton.type='button';compareButton.className='product-page-compare-btn';compareButton.textContent='＋ Add to Compare';
      compareButton.addEventListener('click',()=>toggleDetailCompare(product));
      actions.append(contact,buyNow,call,compareButton);
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
      const enteredSpecs = String(product.specifications || '').trim();
      const structuredSpecs = detailSpecs(product);
      const keyFeatureSource = firstValue(product,['key_features','features','highlights']);
      let keyFeatures = [];
      if (Array.isArray(keyFeatureSource)) keyFeatures = keyFeatureSource.map(textValue).filter(Boolean);
      else if (typeof keyFeatureSource === 'string' && keyFeatureSource.trim()) keyFeatures = keyFeatureSource.split(/\\r?\\n|•|;/).map(x=>x.replace(/^\\s*[-–—]\\s*/, '').trim()).filter(Boolean);
      if (!keyFeatures.length) keyFeatures = Object.entries(structuredSpecs).map(([key,value]) => key + ': ' + value).filter(Boolean).slice(0,5);
      const features = document.createElement('ul');
      features.className = 'product-key-features-list';
      keyFeatures.slice(0,5).forEach(feature => { const li=document.createElement('li'); li.textContent=feature; features.append(li); });
      if (!keyFeatures.length) { const li=document.createElement('li'); li.textContent='Key features will be updated soon. Contact us for details.'; features.append(li); }
      infoColumn.append(makeSection('key-features','Key Features',features));

      const specs = document.createElement('div');
      specs.className = 'product-spec-table';
      Object.entries(structuredSpecs).forEach(([name,value]) => {
        const row = document.createElement('div'); row.className = 'product-spec-row';
        const key = document.createElement('strong'); key.textContent = name;
        const val = document.createElement('span'); val.textContent = value;
        row.append(key, val); specs.append(row);
      });
      if (!Object.keys(structuredSpecs).length) {
        const empty = document.createElement('p'); empty.className = 'product-detail-muted';
        empty.textContent = 'Detailed technical specifications have not been added for this product yet. Contact us for assistance.';
        specs.append(empty);
      }
      const specsSection = makeSection('specifications','Full Specifications',specs);
      const specsToggle = document.createElement('button');
      specsToggle.type = 'button';
      specsToggle.className = 'product-more-info-toggle';
      specsToggle.textContent = 'View More Info';
      specsToggle.setAttribute('aria-expanded','false');
      specs.hidden = true;
      specsSection.querySelector('h2').hidden = true;
      specsSection.insertBefore(specsToggle, specs);
      specsToggle.addEventListener('click', () => {
        const expanded = specsToggle.getAttribute('aria-expanded') === 'true';
        specsToggle.setAttribute('aria-expanded', String(!expanded));
        specs.hidden = expanded;
        specsToggle.textContent = expanded ? 'View More Info' : 'Hide Full Specifications';
      });
      infoColumn.append(specsSection);

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