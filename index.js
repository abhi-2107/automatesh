import querySelector from "query-selector";
import { JSDOM } from "jsdom";

async function main() {
  console.log("fetching products list...");
  const doc = await getPageDom(
    "testUrl"
  );

  const products = [...doc.querySelectorAll(".wd-product")].map((product) => {
    return {
      link: product.querySelector(".product-image-link").href,
      id: product.getAttribute("data-id"),
    };
  });
  console.log(products);

  const productsInfo = products.map(async ({ id, link }) => {
    const pg = await getPageDom(link);
    const shippingDetails = await getShippingInfo(id);
    const res = {
      shippingCost: shippingDetails,
      amount: pg
        .querySelector(".woobt-price-" + id)
        ?.textContent?.trim()
        ?.split(" ")
        .slice(-1)
        ?.toString(),
      sku: pg.querySelector(".sku")?.textContent?.trim(),
    };
    console.log(res);
    return res;
  });
}

main();

async function getPageDom(link) {
  const result = await fetch(link).then((res) => res.text());
  const dom = new JSDOM(result);
  return dom.window.document;
}

async function getShippingInfo(id) {
  return await fetch("https://solar-hook-etm.de/?wc-ajax=pisol_cal_shipping", {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `calc_shipping_country=DE&calc_shipping_state=DE-HH&calc_shipping_city=&calc_shipping_postcode=&pisol-woocommerce-shipping-calculator-nonce=74fcc1a01b&_wp_http_referer=%2Fprodukt%2F1000w-balkonkraftwerk-komplettset-inkl-neu-generation-upgradfaehiger-800w-deye-wechselrichter-mit-relais-2%2F&product_id=${id}&quantity=1&calc_shipping=x&action=pisol_cal_shipping&action_auto_load=true`,
    method: "POST",
    mode: "cors",
  })
    .then((res) => res.text())
    .then((data) => JSON.parse(data))
    .then((obj) => {
      const html = obj?.shipping_methods ?? "";
      return new JSDOM(html).window.document.querySelector(".amount")
        ?.textContent;
    });
}
