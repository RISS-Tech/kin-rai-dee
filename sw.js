const CACHE_NAME = 'tookmue-v13-root';
const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './menus.json',
  './manifest.json',
  './privacy.html',
  './promptpay-qr.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './Chicken_curry_with_dill_8c703e30.jpg',
  './Cooking_minced_pork_with_kaffir_cfdfaf74.jpg',
  './Crab_curry_with_betel_leaves_b058d550.jpg',
  './Crispy_fried_pork_with_spices_64eda245.jpg',
  './Deep-fried_sandfish_with_crispy_…_2d232736.jpg',
  './Fried_basil_pork_with_egg_c63d8ff2.jpg',
  './Grilled_Thai_fermented_sausage_b…_158c5396.jpg',
  './Grilled_beef_brisket_with_sauce_ab77e30d.jpg',
  './Grilled_catfish_with_sweet_sauce_e3cfe552.jpg',
  './Isan_bamboo_shoot_salad_ccafdc88.jpg',
  './Khanom_Chin_Nam_Ngiew_noodles_b08b7eed.jpg',
  './Nam_Prik_Noom_with_egg_6f1ba251.jpg',
  './Nam_Prik_Ong_chili_dip_6b213df6.jpg',
  './Northern_Thai_chicken_curry_0727e84b.jpg',
  './Northern_Thai_chicken_salad_soup_cd254ce4.jpg',
  './Northern_Thai_minced_pork_salad_98d6dfdb.jpg',
  './Papaya_salad_with_pork_cracklings_9e03d007.jpg',
  './Photographing_chicken_khao_soi_21455315.jpg',
  './Phuket_Moo_Hong_braised_pork_406dd3c6.jpg',
  './Pork_belly_curry_cooking_921b9d55.jpg',
  './Pork_hot_pot_set_served_218f1a58.jpg',
  './Pork_rib_soup_with_greens_91d67156.jpg',
  './Pounded_young_jackfruit_salad_ad5b06f7.jpg',
  './Sai_Oua_on_charcoal_grill_8298a6a0.jpg',
  './Som_Tum_Pu_Pla_Ra_60a75733.jpg',
  './Southern_Thai_chili_paste_with_eb2f2830.jpg',
  './Southern_Thai_mullet_fish_soup_41553041.jpg',
  './Southern_Thai_pork_rib_curry_368b3e50.jpg',
  './Southern_Thai_rice_salad_served_81be84e6.jpg',
  './Southern_Thai_spicy_fish_curry_8298afd2.jpg',
  './Southern_Thai_turmeric_chicken_soup_dbd4f836.jpg',
  './Southern_Thai_yellow_curry_with_1a910d52.jpg',
  './Spicy_cucumber_salad_with_eggs_487327fb.jpg',
  './Spicy_grilled_pork_salad_8dda1ad1.jpg',
  './Stir-fried_Liang_leaves_with_eggs_45076ccf.jpg',
  './Stir-fried_chicken_with_herbs_3bcf88a4.jpg',
  './Stir-fried_crispy_catfish_with_b…_82d442cc.jpg',
  './Stir-fried_parkia_beans_with_pork_5a1ad437.jpg',
  './Stir-fried_stink_beans_with_prawns_275b30f1.jpg',
  './Sweet_leaf_soup_with_ant_ade050eb.jpg',
  './Thai_crispy_grilled_chicken_platter_6e826650.jpg',
  './Thai_grilled_pork_neck_dipping_188436cc.jpg',
  './Thai_jellified_pork_curry_cubes_08113afe.jpg',
  './Thai_minced_pork_salad_da9730bf.jpg',
  './Thai_mixed_mushroom_soup_in_d30b2ab8.jpg',
  './Thai_papaya_salad_with_salted_740ace44.jpg',
  './Thai_red_curry_with_river_13db95b8.jpg',
  './Thai_rice_noodle_salad_with_ec85c9de.jpg',
  './Thai_spicy_minced_beef_salad_48a6c91b.jpg',
  './Thai_spicy_minced_duck_salad_7f727f8d.jpg',
  './Thai_spicy_minced_pork_salad_5b63ddb3.jpg',
  './Thai_sweet_corn_salad_preparation_4f67533e.jpg',
  './Tom_Saap_pork_soup_f21ee761.jpg',
  './Tom_Yum_Gai_Baan_soup_9ecff701.jpg',
  './กระเพราเนื้อสับไข่ดาว_1420900b.jpg',
  './ก๋วยเตี๋ยวเรือหมูน้ำตก_cccb704f.jpg',
  './ขนมจีนน้ำยากะทิลูกชิ้นปลา_90fea462.jpg',
  './ข้าวกันจิ๊น_rice_dish_served_4a39d1c2.jpg',
  './ข้าวต้มหมูสับทรงเครื่อง_78f405eb.jpg',
  './ข้าวผัดอเมริกันไก่ทอดไข่ดาว_94e0ec7b.jpg',
  './ข้าวหมูแดงหมูกรอบ_5a0247b2.jpg',
  './ข้าวอบสับปะรดกุ้งสดโรยหมูหยอง_c8767677.jpg',
  './ข้าวเนื้ออบซอสพริกไทยดำ_a7e99805.jpg',
  './ต้มจืดเต้าหู้หมูสับสาหร่าย_33ecadf6.jpg',
  './ต้มยำกุ้งน้ำข้น_8e29e0a6.jpg',
  './ปลาทูทอดน้ำพริกกะปิผักสด_88a7fc1a.jpg',
  './ผัดซีอิ้วหมูเส้นใหญ่_d0cb51b1.jpg',
  './ผัดผักรวมมิตรใส่กุ้งสด_95e3dcae.jpg',
  './ผัดไทยกุ้งสด_a337965d.jpg',
  './พะแนงหมูใบมะกรูด_539be35b.jpg',
  './มะระผัดไข่ใส่กระเทียม_6ae4f4c8.jpg',
  './มัสมั่นไก่น่องโตมันฝรั่ง_1cef08da.jpg',
  './มาม่าผัดขี้เมาทะเลเครื่องแน่น_b7612fae.jpg',
  './ยำวุ้นเส้นโบราณหมูสับกุ้งแห้ง_3547fa3b.jpg',
  './สุกี้ยากี้น้ำหมูวุ้นเส้น_7004529f.jpg',
  './ห่อหมกปลาช่อนใบยอ_0329efc7.jpg',
  './เย็นตาโฟทะเลเครื่องแน่น_fe17990d.jpg',
  './แกงเขียวหวานไก่ยอดมะพร้าว_79f2a8eb.jpg',
  './แกงเทโพหมูสามชั้นผักบุ้งไทย_b16f5b31.jpg',
  './แกงเลียงกุ้งสดผักรวม_4f0d7fb1.jpg',
  './แกงโฮะวุ้นเส้นผักรวม_6d10da83.jpg',
  './ไข่พะโล้หมูสามชั้นเต้าหู้_7e9ebf63.jpg',
  './ไข่เจียวหมูสับฟูกรอบ_aeaef79d.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((res) => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then((ch) => ch.put(event.request, c)); } return res; }).catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html') || caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => { const fp = fetch(event.request).then((nr) => { if (nr && nr.ok) { const c = nr.clone(); caches.open(CACHE_NAME).then((ch) => ch.put(event.request, c)); } return nr; }).catch(() => cached); return cached || fp; }));
});
