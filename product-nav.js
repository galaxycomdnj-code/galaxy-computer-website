(() => {
  const nav = document.querySelector('#productPrimaryNav .nav-links');
  const source = document.querySelector('.product-category-source #categoryList');
  if (!nav || !source) return;

  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const groups = [...source.querySelectorAll(':scope > .category-group')];
  const footerYear = document.querySelector('.premium-footer #year');
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  // Product detail pages use a compact, expandable mobile navigation.
  const menuButton = document.querySelector('.product-page .menu-toggle');
  menuButton?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open menu');
  }));

  nav.querySelectorAll('a[data-nav-category]').forEach(link => {
    const group = groups.find(item => {
      const name = item.querySelector(':scope > .category-item')?.childNodes[0]?.textContent?.trim() ||
        item.querySelector(':scope > .category-item')?.textContent?.replace(/[+−]/g, '').trim();
      return normalize(name) === normalize(link.dataset.navCategory);
    });
    const sourceMenu = group?.querySelector(':scope > .category-submenu');
    if (!sourceMenu) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-category';
    link.parentNode.insertBefore(wrapper, link);
    wrapper.append(link);

    const dropdown = document.createElement('div');
    dropdown.className = 'nav-category-dropdown';
    dropdown.setAttribute('aria-label', link.textContent.trim() + ' subcategories');

    [...sourceMenu.querySelectorAll(':scope > a, :scope > .category-nested-group')].forEach(item => {
      if (item.classList.contains('category-nested-group')) {
        const sourceButton = item.querySelector(':scope > .category-item');
        const type = (sourceButton?.childNodes[0]?.textContent || sourceButton?.textContent || '').replace(/[+−]/g, '').trim();
        if (!type) return;
        const nested = document.createElement('div');
        nested.className = 'nav-category-nested';
        const typeLink = document.createElement('a');
        typeLink.className = 'nav-category-type-link';
        typeLink.href = 'index.html#products';
        typeLink.textContent = type + '  ›';
        nested.append(typeLink);

        const sourceBrands = item.querySelector(':scope > .category-submenu');
        if (sourceBrands) {
          const brands = document.createElement('div');
          brands.className = 'nav-category-brand-dropdown';
          brands.setAttribute('aria-label', type + ' brands');
          [...sourceBrands.querySelectorAll(':scope > a')].forEach(sourceBrand => {
            const brand = document.createElement('a');
            brand.href = 'index.html#products';
            brand.textContent = sourceBrand.textContent.trim();
            brands.append(brand);
          });
          if (brands.childElementCount) nested.append(brands);
        }
        dropdown.append(nested);
      } else {
        const option = document.createElement('a');
        option.href = 'index.html#products';
        option.textContent = item.textContent.trim();
        dropdown.append(option);
      }
    });
    wrapper.append(dropdown);
  });
})();
