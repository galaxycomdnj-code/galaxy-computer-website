const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));let english=false;document.getElementById('languageBtn')?.addEventListener('click',()=>{english=!english;document.documentElement.lang=english?'en':'bn';document.querySelectorAll('[data-bn][data-en]').forEach(el=>el.textContent=english?el.dataset.en:el.dataset.bn);document.getElementById('languageBtn').textContent=english?'বাংলা':'EN';});document.getElementById('year').textContent=new Date().getFullYear();

const SUPABASE_URL = "https://wfuvzfiwnpbgbzzeygei.supabase.co";
const SUPABASE_KEY = "sb_publishable_FMsWzO2LqaTzM8tem94M2w_i3HhnWHR";

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description,price,image_url,category&is_active=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Products could not be loaded");
    }

    const products = await response.json();
    grid.innerHTML = "";

    if (products.length === 0) {
      grid.textContent = "এখনো কোনো পণ্য যোগ করা হয়নি।";
      return;
    }

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "product-card";

      if (product.image_url) {
        const img = document.createElement("img");
        img.src = product.image_url;
        img.alt = product.name;
        img.style.width = "100%";
        img.style.height = "180px";
        img.style.objectFit = "cover";
        card.appendChild(img);
      }

      const title = document.createElement("h3");
      title.textContent = product.name;
      card.appendChild(title);

      const description = document.createElement("p");
      description.textContent = product.description || "";
      card.appendChild(description);

      if (product.price !== null) {
        const price = document.createElement("p");
        price.textContent = "৳ " + product.price;
        card.appendChild(price);
      }

      const link = document.createElement("a");
      link.href = "https://wa.me/8801621422327?text=" +
        encodeURIComponent(product.name + " অর্ডার করতে চাই");
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = link.textContent = "অর্ডার করতে →";
      card.appendChild(link);

      grid.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    grid.textContent = "পণ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।";
  }
}

loadProducts();

// Galaxy Computer Category Menu
const categoryDrawer = document.getElementById('categoryDrawer');
const categoryOverlay = document.getElementById('categoryOverlay');

document.getElementById('openCategories')?.addEventListener('click', () => {
  categoryDrawer.classList.add('active');
  categoryOverlay.classList.add('active');
});

function closeCategoryMenu() {
  categoryDrawer.classList.remove('active');
  categoryOverlay.classList.remove('active');
}

document.getElementById('closeCategories')?.addEventListener('click', closeCategoryMenu);
categoryOverlay?.addEventListener('click', closeCategoryMenu);

// Category Search
document.getElementById('categorySearch')?.addEventListener('input', function() {
  const search = this.value.toLowerCase();

  document.querySelectorAll('.category-item').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(search)
      ? 'flex'
      : 'none';
  });
});

/* Category Button */
.category-open-btn {
  background: #ff791a;
  color: #fff;
  border: 0;
  border-radius: 7px;
  padding: 11px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s;
}

.category-open-btn:hover {
  background: #e85d00;
}

/* Subcategories */
.category-submenu {
  display: none;
  background: #171717;
  padding: 5px 12px;
  border-left: 2px solid #ff791a;
}

.category-submenu.open {
  display: block;
}

.category-submenu a {
  display: block;
  color: #ccc;
  text-decoration: none;
  padding: 10px 5px;
  border-bottom: 1px solid #292929;
  font-size: 14px;
}

.category-submenu a:hover {
  color: #ff791a;
}
