const CACHE_NAME = 'tookmue-v13';
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
  './images/Chicken_curry_with_dill_8c703e30.jpg',
  './images/Cooking_minced_pork_with_kaffir_cfdfaf74.jpg',
  './images/Crab_curry_with_betel_leaves_b058d550.jpg',
  './images/Crispy_fried_pork_with_spices_64eda245.jpg',
  './images/Deep-fried_sandfish_with_crispy_…_2d232736.jpg',
  './images/Fried_basil_pork_with_egg_c63d8ff2.jpg',
  './images/Grilled_Thai_fermented_sausage_b…_158c5396.jpg',
  './images/Grilled_beef_brisket_with_sauce_ab77e30d.jpg',
  './images/Grilled_catfish_with_sweet_sauce_e3cfe552.jpg',
  './images/Isan_bamboo_shoot_salad_ccafdc88.jpg',
  './images/Khanom_Chin_Nam_Ngiew_noodles_b08b7eed.jpg',
  './images/Nam_Prik_Noom_with_egg_6f1ba251.jpg',
  './images/Nam_Prik_Ong_chili_dip_6b213df6.jpg',
  './images/Northern_Thai_chicken_curry_0727e84b.jpg',
  './images/Northern_Thai_chicken_salad_soup_cd254ce4.jpg',
  './images/Northern_Thai_minced_pork_salad_98d6dfdb.jpg',
  './images/Papaya_salad_with_pork_cracklings_9e03d007.jpg',
  './images/Photographing_chicken_khao_soi_21455315.jpg',
  './images/Phuket_Moo_Hong_braised_pork_406dd3c6.jpg',
  './images/Pork_belly_curry_cooking_921b9d55.jpg',
  './images/Pork_hot_pot_set_served_218f1a58.jpg',
  './images/Pork_rib_soup_with_greens_91d67156.jpg',
  './images/Pounded_young_jackfruit_salad_ad5b06f7.jpg',
  './images/Sai_Oua_on_charcoal_grill_8298a6a0.jpg',
  './images/Som_Tum_Pu_Pla_Ra_60a75733.jpg',
  './images/Southern_Thai_chili_paste_with_eb2f2830.jpg',
  './images/Southern_Thai_mullet_fish_soup_41553041.jpg',
  './images/Southern_Thai_pork_rib_curry_368b3e50.jpg',
  './images/Southern_Thai_rice_salad_served_81be84e6.jpg',
  './images/Southern_Thai_spicy_fish_curry_8298afd2.jpg',
  './images/Southern_Thai_turmeric_chicken_soup_dbd4f836.jpg',
  './images/Southern_Thai_yellow_curry_with_1a910d52.jpg',
  './images/Spicy_cucumber_salad_with_eggs_487327fb.jpg',
  './images/Spicy_grilled_pork_salad_8dda1ad1.jpg',
  './images/Stir-fried_Liang_leaves_with_eggs_45076ccf.jpg',
  './images/Stir-fried_chicken_with_herbs_3bcf88a4.jpg',
  './images/Stir-fried_crispy_catfish_with_b…_82d442cc.jpg',
  './images/Stir-fried_parkia_beans_with_pork_5a1ad437.jpg',
  './images/Stir-fried_stink_beans_with_prawns_275b30f1.jpg',
  './images/Sweet_leaf_soup_with_ant_ade050eb.jpg',
  './images/Thai_crispy_grilled_chicken_platter_6e826650.jpg',
  './images/Thai_grilled_pork_neck_dipping_188436cc.jpg',
  './images/Thai_jellified_pork_curry_cubes_08113afe.jpg',
  './images/Thai_minced_pork_salad_da9730bf.jpg',
  './images/Thai_mixed_mushroom_soup_in_d30b2ab8.jpg',
  './images/Thai_papaya_salad_with_salted_740ace44.jpg',
  './images/Thai_red_curry_with_river_13db95b8.jpg',
  './images/Thai_rice_noodle_salad_with_ec85c9de.jpg',
  './images/Thai_spicy_minced_beef_salad_48a6c91b.jpg',
  './images/Thai_spicy_minced_duck_salad_7f727f8d.jpg',
  './images/Thai_spicy_minced_pork_salad_5b63ddb3.jpg',
  './images/Thai_sweet_corn_salad_preparation_4f67533e.jpg',
  './images/Tom_Saap_pork_soup_f21ee761.jpg',
  './images/Tom_Yum_Gai_Baan_soup_9ecff701.jpg',
  './images/กระเพราเนื้อสับไข่ดาว_1420900b.jpg',
  './images/ก๋วยเตี๋ยวเรือหมูน้ำตก_cccb704f.jpg',
  './images/ขนมจีนน้ำยากะทิลูกชิ้นปลา_90fea462.jpg',
  './images/ข้าวกันจิ๊น_rice_dish_served_4a39d1c2.jpg',
  './images/ข้าวต้มหมูสับทรงเครื่อง_78f405eb.jpg',
  './images/ข้าวผัดอเมริกันไก่ทอดไข่ดาว_94e0ec7b.jpg',
  './images/ข้าวหมูแดงหมูกรอบ_5a0247b2.jpg',
  './images/ข้าวอบสับปะรดกุ้งสดโรยหมูหยอง_c8767677.jpg',
  './images/ข้าวเนื้ออบซอสพริกไทยดำ_a7e99805.jpg',
  './images/ต้มจืดเต้าหู้หมูสับสาหร่าย_33ecadf6.jpg',
  './images/ต้มยำกุ้งน้ำข้น_8e29e0a6.jpg',
  './images/ปลาทูทอดน้ำพริกกะปิผักสด_88a7fc1a.jpg',
  './images/ผัดซีอิ้วหมูเส้นใหญ่_d0cb51b1.jpg',
  './images/ผัดผักรวมมิตรใส่กุ้งสด_95e3dcae.jpg',
  './images/ผัดไทยกุ้งสด_a337965d.jpg',
  './images/พะแนงหมูใบมะกรูด_539be35b.jpg',
  './images/มะระผัดไข่ใส่กระเทียม_6ae4f4c8.jpg',
  './images/มัสมั่นไก่น่องโตมันฝรั่ง_1cef08da.jpg',
  './images/มาม่าผัดขี้เมาทะเลเครื่องแน่น_b7612fae.jpg',
  './images/ยำวุ้นเส้นโบราณหมูสับกุ้งแห้ง_3547fa3b.jpg',
  './images/สุกี้ยากี้น้ำหมูวุ้นเส้น_7004529f.jpg',
  './images/ห่อหมกปลาช่อนใบยอ_0329efc7.jpg',
  './images/เย็นตาโฟทะเลเครื่องแน่น_fe17990d.jpg',
  './images/แกงเขียวหวานไก่ยอดมะพร้าว_79f2a8eb.jpg',
  './images/แกงเทโพหมูสามชั้นผักบุ้งไทย_b16f5b31.jpg',
  './images/แกงเลียงกุ้งสดผักรวม_4f0d7fb1.jpg',
  './images/แกงโฮะวุ้นเส้นผักรวม_6d10da83.jpg',
  './images/ไข่พะโล้หมูสามชั้นเต้าหู้_7e9ebf63.jpg',
  './images/ไข่เจียวหมูสับฟูกรอบ_aeaef79d.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          }
          return caches.match(event.request) || caches.match('./index.html') || caches.match('./');
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
