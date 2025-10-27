/* java.js - catálogo, tallas, carrito, checkout y PDF (envío fijo $25,000, pago = transferencia) */
document.addEventListener('DOMContentLoaded', () => {

  const BRAND_GREEN = '#00B140';
  const SHIPPING_FEE = 25000;
  const STORAGE_KEY = 'mz_cart_final_alid';

  // DOM refs
  const navBtns = document.querySelectorAll('.nav-btn');
  const searchInput = document.getElementById('search');
  const background = document.getElementById('background');
  const inicio = document.getElementById('inicio');

  const sections = { mujer: document.getElementById('mujer'), hombre: document.getElementById('hombre'), ninos: document.getElementById('ninos') };
  const grids = { mujer: document.getElementById('cat-mujer'), hombre: document.getElementById('cat-hombre'), ninos: document.getElementById('cat-ninos') };

  const cartToggle = document.getElementById('cart-toggle');
  const cartAside = document.getElementById('cart-aside');
  const cartClose = document.getElementById('cart-close');
  const cartItemsEl = document.getElementById('cart-items');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnClear = document.getElementById('btn-clear');

  const detailModal = document.getElementById('detail-modal');
  const detailClose = document.getElementById('detail-close');
  const detailImg = document.getElementById('detail-img');
  const detailName = document.getElementById('detail-name');
  const detailDesc = document.getElementById('detail-desc');
  const detailPrice = document.getElementById('detail-price');
  const detailStock = document.getElementById('detail-stock');
  const detailKind = document.getElementById('detail-kind');
  const detailSizes = document.getElementById('detail-sizes');
  const detMinus = document.getElementById('det-minus');
  const detPlus = document.getElementById('det-plus');
  const detQty = document.getElementById('det-qty');
  const detAddBtn = document.getElementById('det-add');
  const detClose2 = document.getElementById('det-close-2');

  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutSubEl = document.getElementById('checkout-sub');
  const checkoutTotalEl = document.getElementById('checkout-total');

  const invoiceModal = document.getElementById('invoice-modal');
  const invoicePreview = document.getElementById('invoice-preview');
  const invoiceClose = document.getElementById('invoice-close');
  const downloadInvoiceBtn = document.getElementById('download-invoice');
  const closeInvoiceBtn = document.getElementById('close-invoice');

  // checkout selects
  const deptSelect = document.getElementById('c-dept');
  const citySelect = document.getElementById('c-city');

  // state
  let products = { mujer: [], hombre: [], ninos: [] };
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let currentSection = 'inicio';
  let activeProduct = null;
  let activeSelectedSize = null;

  const currency = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);

  // ---------- Departments & cities (Colombia) ----------
  // Not exhaustive for every municipality, but includes main cities for each department.
  const REGION_DATA = {
    "Amazonas": ["Leticia"],
    "Antioquia": ["Medellín","Bello","Itagüí","Envigado","Rionegro"],
    "Arauca": ["Arauca"],
    "Atlántico": ["Barranquilla","Soledad"],
    "Bolívar": ["Cartagena","Magangué"],
    "Boyacá": ["Tunja","Sogamoso","Duitama"],
    "Caldas": ["Manizales"],
    "Caquetá": ["Florencia"],
    "Casanare": ["Yopal"],
    "Cauca": ["Popayán","Guapi"],
    "Cesar": ["Valledupar"],
    "Chocó": ["Quibdó","Istmina"],
    "Córdoba": ["Montería","Lorica"],
    "Cundinamarca": ["Bogotá","Fusagasugá","Soacha","Girardot"],
    "Guainía": ["Inírida"],
    "Guaviare": ["San José del Guaviare"],
    "Huila": ["Neiva","Pitalito"],
    "La Guajira": ["Riohacha","Maicao","Uribia","fonseca","dibulla"],
    "Magdalena": ["Santa Marta","Ciénaga"],
    "Meta": ["Villavicencio","Acacías"],
    "Nariño": ["Pasto","Ipiales"],
    "Norte de Santander": ["Cúcuta","Ocaña"],
    "Putumayo": ["Mocoa"],
    "Quindío": ["Armenia"],
    "Risaralda": ["Pereira"],
    "San Andrés y Providencia": ["San Andrés"],
    "Santander": ["Bucaramanga","Floridablanca"],
    "Sucre": ["Sincelejo"],
    "Tolima": ["Ibagué","Purificación"],
    "Valle del Cauca": ["Cali","Palmira","Buenaventura"],
    "Vaupés": ["Mitú"],
    "Vichada": ["Puerto Carreño"],
    "Casanare*": ["Yopal"]
  };
  // Fill dept select
  (function populateDepartments(){
    Object.keys(REGION_DATA).sort().forEach(d=>{
      const opt = document.createElement('option'); opt.value = d; opt.textContent = d; deptSelect.appendChild(opt);
    });
    // initial cities
    deptSelect.value = "Cundinamarca";
    updateCities("Cundinamarca");
  })();
  function updateCities(dept){
    citySelect.innerHTML = '';
    const list = REGION_DATA[dept] || [];
    list.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; citySelect.appendChild(o); });
  }
  deptSelect.addEventListener('change', (e)=> updateCities(e.target.value));

  // ---------- Banks list ----------
  const BANKS = ["Bancolombia","Davivienda","BBVA","Daviplata","Nequi","Banco de Bogotá","Banco Popular","Movii","Lulo Bank","Banco Agrario"];

  // ---------- sample descriptions (rotating) ----------
  const DESCRIPTIONS = [
    "Confort superior y diseño moderno, perfecto para uso diario.",
    "Material resistente, plantilla acolchada y suela antideslizante.",
    "Estilo urbano con máxima durabilidad y soporte.",
    "Ligero, transpirable y cómodo para largas caminatas.",
    "Acabado premium, ideal para ocasiones especiales o trabajo."
  ];

  // ---------- generate products (25 each, 5 agotados) ----------
  function randPrice(){ // between 57,000 and 200,000
    return Math.floor(57000 + Math.random() * (200000 - 57000));
  }
  function sampleImage(cat,i){ return `IMG/${cat}${i}.jpg`; }
  function generateProducts(){
    const defs = {
      mujer:{kinds:['Tacón','Sandalia','Sneaker','Botín','Mule']},
      hombre:{kinds:['Tenis','Casual','Deportivo','Oxford','Botín']},
      ninos:{kinds:['Deportivo','Colegial','Sandalia','MiniSneaker']}
    };
    Object.keys(defs).forEach(cat=>{
      products[cat] = [];
      const agotadosIndices = new Set();
      // pick 5 distinct indexes to be agotado (1..25)
      while(agotadosIndices.size < 5) agotadosIndices.add(Math.ceil(Math.random()*25));
      for(let i=1;i<=25;i++){
        const kind = defs[cat].kinds[Math.floor(Math.random()*defs[cat].kinds.length)];
        const name = `${kind} ${cat.charAt(0).toUpperCase()+cat.slice(1)} ${i}`;
        const price = randPrice();
        const stock = agotadosIndices.has(i) ? 0 : Math.floor(Math.random()*8)+1; // 1..8
        const desc = DESCRIPTIONS[i % DESCRIPTIONS.length];
        products[cat].push({ id:`${cat}-${i}`, category:cat, name, kind, price, stock, img: sampleImage(cat,i), description: desc });
      }
    });
  }
  generateProducts();

  // ---------- render section ----------
  function renderSection(cat, filterText = '') {
    currentSection = cat;
    inicio.style.display = (cat === 'inicio') ? 'flex' : 'none';
    background.style.display = (cat === 'inicio') ? 'block' : 'none';
    Object.keys(sections).forEach(k=>{
      if(k === cat) { sections[k].classList.remove('hidden'); sections[k].setAttribute('aria-hidden','false'); }
      else { sections[k].classList.add('hidden'); sections[k].setAttribute('aria-hidden','true'); }
    });

    if(cat === 'inicio') return;

    const list = products[cat].filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));
    const grid = grids[cat];
    grid.innerHTML = '';
    list.forEach(p=>{
      const card = document.createElement('article'); card.className = 'product-card';
      const stockHtml = p.stock === 0 ? `<div class="product-stock">AGOTADO</div>` : `<div class="product-stock">${p.stock} disponibles</div>`;
      card.innerHTML = `
        <div class="product-img"><img src="${p.img}" alt="${p.name}" onerror="this.src='IMG/default.jpg'"></div>
        <div class="product-title">${p.name}</div>
        <div class="product-price">${currency(p.price)}</div>
        ${stockHtml}
        <div class="controls">
          <button class="btn btn-primary btn-add" ${p.stock===0 ? 'disabled' : ''}>Añadir</button>
          <button class="btn btn-ghost btn-view">Ver</button>
        </div>
      `;
      // events
      card.querySelector('.btn-view').addEventListener('click', ()=> openDetail(p));
      card.querySelector('.btn-add').addEventListener('click', ()=> openAddModal(p));
      grid.appendChild(card);
    });
  }

  // search within current section
  searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim();
    if(currentSection === 'inicio'){ return; }
    renderSection(currentSection, q);
  });

  // ---------- detail modal ----------
  function openDetail(p){
    activeProduct = p;
    detailImg.src = p.img; detailImg.onerror = ()=>{detailImg.src='IMG/default.jpg'};
    detailName.textContent = p.name;
    detailDesc.textContent = p.description;
    detailPrice.textContent = currency(p.price);
    detailStock.textContent = p.stock > 0 ? `En stock: ${p.stock}` : 'AGOTADO';
    detailKind.textContent = `Tipo: ${p.kind}`;

    detailSizes.innerHTML = '';
    const sizes = sizesForCategory(p.category);
    sizes.forEach(s=>{
      const b = document.createElement('button'); b.className = 'btn btn-ghost'; b.textContent = s; b.dataset.size = s;
      b.onclick = ()=> { detailSizes.querySelectorAll('button').forEach(x=> x.style.boxShadow=''); b.style.boxShadow = '0 6px 18px rgba(0,255,128,0.12)'; activeSelectedSize = s; };
      detailSizes.appendChild(b);
    });

    detQty.value = 1; detQty.min = 1; detQty.max = Math.max(1, p.stock);

    if(p.stock === 0){
      detMinus.disabled = true; detPlus.disabled = true; detQty.disabled = true; detAddBtn.disabled = true;
    } else {
      detMinus.disabled = false; detPlus.disabled = false; detQty.disabled = false; detAddBtn.disabled = false;
    }

    detailModal.classList.remove('hidden'); detailModal.setAttribute('aria-hidden','false');
  }
  detailClose.addEventListener('click', closeDetailModal);
  detClose2.addEventListener('click', closeDetailModal);
  function closeDetailModal(){ detailModal.classList.add('hidden'); detailModal.setAttribute('aria-hidden','true'); activeSelectedSize = null; activeProduct = null; }

  detMinus && detMinus.addEventListener('click', ()=> { detQty.value = Math.max(1, Number(detQty.value||1) - 1); });
  detPlus && detPlus.addEventListener('click', ()=> { detQty.value = Math.min(Number(detQty.max||1), Number(detQty.value||1) + 1); });

  detAddBtn && detAddBtn.addEventListener('click', ()=> {
    if(!activeProduct) return;
    if(!activeSelectedSize) return alert('Selecciona la talla antes de añadir.');
    const qty = Math.max(1, Math.min(Number(detQty.max||1), Number(detQty.value||1)));
    addToCart(activeProduct.id, activeSelectedSize, qty);
    closeDetailModal();
  });

  // ---------- add modal helper (quick add) ----------
  function openAddModal(p){
    // open detail modal but auto select first size
    openDetail(p);
    const firstBtn = detailSizes.querySelector('button');
    if(firstBtn){ firstBtn.click(); }
  }

  // sizes per category
  function sizesForCategory(cat){
    if(cat === 'mujer') return [36,37,38,39,40,41];
    if(cat === 'hombre') return [37,38,39,40,41];
    if(cat === 'ninos') return [28,29,30,31,32,33,34,35];
    return [36,37,38,39,40,41];
  }

  // ---------- CART logic ----------
  function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

  function addToCart(productId, size, qty){
    const [cat] = productId.split('-');
    const prod = products[cat].find(x=>x.id === productId);
    if(!prod) return alert('Producto no encontrado');
    if(prod.stock <= 0) return alert('Producto agotado');

    const q = Math.min(qty, prod.stock);
    const existing = cart.find(it => it.id === productId && it.size === String(size));
    if(existing){ existing.qty = Math.min(30, existing.qty + q); }
    else { cart.push({ id: productId, size: String(size), qty: q }); }

    prod.stock = Math.max(0, prod.stock - q);
    saveCart(); updateCartUI(); renderSection(currentSection); animateCartToggle();
  }

  function removeFromCart(index){
    const item = cart[index];
    if(!item) return;
    const [cat] = item.id.split('-');
    const prod = products[cat].find(x=>x.id === item.id);
    if(prod) prod.stock += item.qty;
    cart.splice(index,1); saveCart(); updateCartUI(); renderSection(currentSection);
  }

  function changeCartQty(index, delta){
    const it = cart[index];
    if(!it) return;
    const [cat] = it.id.split('-');
    const prod = products[cat].find(x=>x.id === it.id);
    if(delta > 0){
      if(prod.stock <= 0) return alert('No hay más stock.');
      it.qty += 1; prod.stock -= 1;
    } else {
      it.qty -= 1; prod.stock += 1;
      if(it.qty <= 0){ removeFromCart(index); return; }
    }
    saveCart(); updateCartUI(); renderSection(currentSection);
  }

  function updateCartUI(){
    let subtotal = 0;
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){
      cartItemsEl.innerHTML = '<div style="padding:12px;color:#ccc">Tu carrito está vacío.</div>';
      cartSubtotalEl.textContent = currency(0);
      cartTotalEl.textContent = currency(0);
      cartCountEl.textContent = 0;
      btnCheckout.disabled = true;
      return;
    }
    cart.forEach((it, idx)=>{
      const [cat] = it.id.split('-');
      const prod = products[cat].find(x=>x.id === it.id);
      if(!prod) return;
      const lineTotal = prod.price * it.qty;
      subtotal += lineTotal;

      const row = document.createElement('div');
      row.style.padding = '8px 0'; row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      row.innerHTML = `
        <div style="font-weight:800">${prod.name}</div>
        <div style="font-size:13px;color:#ccc">Talla: <strong style="color:${BRAND_GREEN}">${it.size}</strong> · ${currency(prod.price)} x ${it.qty} = <strong style="color:${BRAND_GREEN}">${currency(lineTotal)}</strong></div>
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="qty-btn cart-inc" data-idx="${idx}">+</button>
          <button class="qty-btn cart-dec" data-idx="${idx}">−</button>
          <button class="btn btn-ghost cart-rem" data-idx="${idx}">Eliminar</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

    cartSubtotalEl.textContent = currency(subtotal);
    cartTotalEl.textContent = currency(subtotal + SHIPPING_FEE);
    cartCountEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
    btnCheckout.disabled = false;

    cartItemsEl.querySelectorAll('.cart-inc').forEach(b=> b.onclick = ()=> changeCartQty(Number(b.dataset.idx), +1));
    cartItemsEl.querySelectorAll('.cart-dec').forEach(b=> b.onclick = ()=> changeCartQty(Number(b.dataset.idx), -1));
    cartItemsEl.querySelectorAll('.cart-rem').forEach(b=> b.onclick = ()=> { if(confirm('Eliminar este producto?')) removeFromCart(Number(b.dataset.idx)) });
  }

  function animateCartToggle(){ cartToggle.animate([{ transform:'scale(1.06)'},{ transform:'scale(1)' }],{ duration:200 }); }

  cartToggle.addEventListener('click', ()=> { cartAside.classList.toggle('open'); updateCartUI(); });
  cartClose.addEventListener('click', ()=> cartAside.classList.remove('open'));

  btnClear.addEventListener('click', ()=> {
    if(!cart.length) return;
    if(confirm('Vaciar carrito?')){
      cart.forEach(it=> { const [cat] = it.id.split('-'); const prod = products[cat].find(x=>x.id===it.id); if(prod) prod.stock += it.qty; });
      cart = []; saveCart(); updateCartUI(); renderSection(currentSection);
    }
  });

  // ---------- Checkout flow ----------
  btnCheckout.addEventListener('click', ()=> {
    const subtotal = cart.reduce((s,it)=>{
      const [cat] = it.id.split('-'); const prod = products[cat].find(x=>x.id===it.id); return s + (prod.price * it.qty);
    },0);
    checkoutSubEl.textContent = currency(subtotal);
    checkoutTotalEl.textContent = currency(subtotal + SHIPPING_FEE);
    checkoutModal.classList.remove('hidden'); checkoutModal.setAttribute('aria-hidden','false');
  });

  checkoutClose.addEventListener('click', ()=> { checkoutModal.classList.add('hidden'); checkoutModal.setAttribute('aria-hidden','true'); });
  document.getElementById('checkout-cancel').addEventListener('click', ()=> { checkoutModal.classList.add('hidden'); checkoutModal.setAttribute('aria-hidden','true'); });

  checkoutForm && checkoutForm.addEventListener('submit', async (ev)=> {
    ev.preventDefault();
    const name = document.getElementById('c-name').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const city = document.getElementById('c-city').value.trim();
    const state = document.getElementById('c-dept').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const bank = document.getElementById('c-bank').value || 'N/A';
    if(!name||!address||!city||!state||!phone||!email) return alert('Completa todos los datos.');

    const items = cart.map(it=>{
      const [cat] = it.id.split('-'); const prod = products[cat].find(x=>x.id===it.id);
      return { name: prod.name, qty: it.qty, price: prod.price, subtotal: prod.price * it.qty, size: it.size };
    });
    const subtotal = items.reduce((s,i)=>s+i.subtotal,0);
    const total = subtotal + SHIPPING_FEE;
    const folio = generateFolio();

    // build invoice HTML preview
    let html = `<div style="font-family:Arial,Helvetica,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div><div style="font-weight:900;color:${BRAND_GREEN};font-size:20px">MISS ZHAPATOS</div><div style="font-size:12px;color:#666">Recibo / Factura</div></div>
        <div style="text-align:right"><div style="font-weight:800">Folio: <span style="color:${BRAND_GREEN}">${folio}</span></div><div style="font-size:12px;color:#666">${new Date().toLocaleString()}</div></div>
      </div><hr style="border:none;border-top:1px solid #eee;margin:8px 0" />
      <div style="display:flex;gap:12px;justify-content:space-between"><div style="flex:1"><div style="font-weight:700">Datos del cliente</div>
      <div>Nombre: ${name}</div><div>Dirección: ${address}</div><div>Ciudad - Departamento: ${city} - ${state}</div><div>Tel: ${phone}</div><div>Email: ${email}</div></div></div>
      <hr style="border:none;border-top:1px solid #eee;margin:8px 0" />
      <div><div style="font-weight:800;margin-bottom:6px">Productos</div>
      ${items.map((it,idx)=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #f0f0f0"><div style="max-width:70%">${idx+1}. ${it.name} x${it.qty} (Talla: ${it.size})</div><div style="font-weight:800">${currency(it.subtotal)}</div></div>`).join('')}
      </div><div style="margin-top:8px;border-top:1px solid #eee;padding-top:8px">
      <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div style="font-weight:800">${currency(subtotal)}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Envío</div><div style="font-weight:800">${currency(SHIPPING_FEE)}</div></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:18px;color:${BRAND_GREEN};font-weight:900"><div>TOTAL</div><div>${currency(total)}</div></div></div>
      <div style="margin-top:12px;text-align:left;font-size:13px;color:#666"><div>Método de pago: transferencia</div><div>Banco seleccionado: ${bank}</div></div>
      <div style="margin-top:20px;text-align:left;font-size:13px;color:#666">Firma digital – Alid / MISS ZHAPATOS</div></div>`;

    invoicePreview.innerHTML = html;
    invoiceModal.classList.remove('hidden'); invoiceModal.setAttribute('aria-hidden','false');

    downloadInvoiceBtn.onclick = async ()=> {
      await generatePDFInvoice({ folio, date: new Date(), name, city, state, address, phone, email, payment: 'transferencia', bank, items, subtotal, total });
      // clear cart after generating
      cart = []; saveCart(); updateCartUI(); cartAside.classList.remove('open'); checkoutModal.classList.add('hidden'); checkoutModal.setAttribute('aria-hidden','true');
      invoiceModal.classList.add('hidden'); invoiceModal.setAttribute('aria-hidden','true');
      alert('Factura descargada.');
    };

    closeInvoiceBtn.onclick = ()=> {
      invoiceModal.classList.add('hidden'); invoiceModal.setAttribute('aria-hidden','true');
    };
  });

  // ---------- PDF generation ----------
  function generateFolio(){ return `MZ-2025-${String(Date.now()%1000000).padStart(6,'0')}`; }

  async function imageToDataURL(url){
    return new Promise((resolve,reject)=>{
      const img = new Image(); img.crossOrigin="Anonymous";
      img.onload = function(){ const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; canvas.getContext('2d').drawImage(img,0,0); resolve(canvas.toDataURL('image/png')); };
      img.onerror = ()=> reject('NOLOAD'); img.src = url;
    });
  }

  async function generatePDFInvoice(data){
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit:'pt', format:'a4' });
      const left = 40; let y = 40;

      // optional logo if exists
      let logoData = null;
      try { logoData = await imageToDataURL('IMG/logo.png'); } catch(e){ logoData = null; }
      if(logoData){
        const imgProps = doc.getImageProperties(logoData);
        const w = 250; const h = (imgProps.height * w) / imgProps.width;
        try { doc.setGState && doc.setGState(new doc.GState({ opacity:0.08 })); } catch(e){}
        doc.addImage(logoData,'PNG',(doc.internal.pageSize.getWidth()-w)/2,200,w,h);
        try { doc.setGState && doc.setGState(new doc.GState({ opacity:1 })); } catch(e){}
      }

      doc.setFontSize(20); doc.setTextColor(BRAND_GREEN); doc.setFont('helvetica','bold');
      doc.text('MISS ZHAPATOS', left, y); y+=26;
      doc.setFontSize(10); doc.setTextColor('#000'); doc.setFont('helvetica','normal');
      doc.text(`Recibo / Factura — Folio: ${data.folio}`, left, y);
      doc.text(`${data.date.toLocaleString()}`, 420, y);
      y+=18;
      doc.setDrawColor(220); doc.setLineWidth(0.5); doc.line(left, y, 560, y); y+=14;
      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('Datos del cliente', left, y); y+=14;
      doc.setFont('helvetica','normal'); doc.text(`Nombre: ${data.name}`, left, y); y+=12;
      doc.text(`Dirección: ${data.address}`, left, y); y+=12;
      doc.text(`Ciudad - Departamento: ${data.city} - ${data.state}`, left, y); y+=12;
      doc.text(`Tel: ${data.phone}`, left, y); y+=12;
      doc.text(`Email: ${data.email}`, left, y); y+=18;

      doc.setFont('helvetica','bold'); doc.text('Productos', left, y); y+=14;
      doc.setFont('helvetica','normal');
      data.items.forEach((it, idx) => {
        const line = `${idx+1}. ${it.name} x${it.qty} (Talla: ${it.size})`;
        doc.text(line, left, y);
        doc.text(currency(it.subtotal), 500, y, { align: 'right' });
        y += 14;
        if(y > 720){ doc.addPage(); y = 40; }
      });

      y += 8;
      doc.setDrawColor(220); doc.setLineWidth(0.5); doc.line(left, y, 560, y); y+=14;
      doc.setFont('helvetica','bold'); doc.text('Subtotal:', 380, y); doc.text(currency(data.subtotal), 500, y, { align: 'right' }); y+=14;
      doc.text('Envío:', 380, y); doc.text(currency(SHIPPING_FEE), 500, y, { align: 'right' }); y+=14;
      doc.setFontSize(13); doc.setTextColor(BRAND_GREEN); doc.text('TOTAL:', 380, y); doc.text(currency(data.total), 500, y, { align: 'right' }); y+=28;
      doc.setTextColor('#000'); doc.setFont('helvetica','normal'); doc.setFontSize(10);
      doc.text(`Método de pago: transferencia`, left, y); y+=16;
      doc.text(`Banco: ${data.bank}`, left, y); y+=16;
      doc.text('Firma digital – Alid / MISS ZHAPATOS', left, y+10);

      const fname = `Factura_${data.folio}.pdf`;
      doc.save(fname);
      return true;
    } catch(err){
      console.error('PDF error', err);
      alert('Ocurrió un error generando la factura PDF.');
      return null;
    }
  }

  // ---------- nav events ----------
  navBtns.forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      ev.preventDefault();
      navBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      if(cat === 'inicio'){ renderSection('inicio'); }
      else { renderSection(cat); }
    });
  });

  // ---------- init ----------
  (function init(){
    renderSection('inicio');
    updateCartUI();
  })();

}); // DOMContentLoaded end
