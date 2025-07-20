const catalogMap = {
  uñas: "https://your-cdn.com/catalogs/uñas-flyer.jpg",
  pestañas: "https://your-cdn.com/catalogs/pestanas-flyer.jpg",
  cejas: "https://your-cdn.com/catalogs/cejas-flyer.jpg",
  enzimas: "https://your-cdn.com/catalogs/enzimas-flyer.jpg",
  cabello: "https://your-cdn.com/catalogs/cabello-flyer.jpg",
  micropigmentación: "https://your-cdn.com/catalogs/micro-flyer.jpg",
  relleno: "https://your-cdn.com/catalogs/labios-flyer.jpg",
  depilación: "https://your-cdn.com/catalogs/depilacion-flyer.jpg",
  hidralips: "https://your-cdn.com/catalogs/hydralips-flyer.jpg",
};

function getCatalogImageForService(serviceKeyword) {
  const match = Object.keys(catalogMap).find((key) =>
    serviceKeyword.includes(key)
  );
  return match ? catalogMap[match] : null;
}

module.exports = {
  getCatalogImageForService,
};
