const xlsx = require('node-xlsx');
const fs = require('fs');
const data = require('../scraper/all.json');

function getTotalEst(subCategory) {
  return subCategory.products.reduce((a, p) => a + (parseInt(p.sales) || 5), 0);
}

function getTotalProfit(subCategory) {
  return subCategory
    .products
    .reduce((a, p) => a + ((parseInt(p.sales) || 5) * (parseInt(p.price, 10) || 1)), 0);
}

function processSubcategory(subCategory, totalSales, totalProfit) {
  const subCategoryName = subCategory.title;
  return subCategory.products.map(p => ([
    subCategoryName,
    p.title,
    parseInt(p.price) || 'N/A',
    parseInt(p.sales) || 5,
    getTotalEst(subCategory),
    totalSales,
    getTotalProfit(subCategory),
    totalProfit,
    p.brand,
    p.url,
    subCategory.url,
    p.image
  ]));
}

function processSheet(category) {
  const data = [['Sub-category', 'Product', 'Price', 'Monthly units',
    'Sub-category units', 'Category units', 'Sub-category revenue', 'Category revenue',
    'Brand', 'Url', 'Category URL', 'Image'
  ]];
  return category.subCategories.reduce((p, subCategory) =>
    p.concat(
      processSubcategory(
        subCategory,
        category.subCategories.reduce((p, c) => p + getTotalEst(c), 0),
        category.subCategories.reduce((p, c) => p + getTotalProfit(c), 0)
      )
    ), data);
}

const usedNames = {};
function getValidName(name) {
  name = name.replace(/[^\w\d]/g, '');
  let i = 1;
  let cName = name;
  while (usedNames[cName] && i < 100) {
    cName = name + ' ' + i.toString();
    i += 1;
  }
  if (i >= 100) {
    console.error('Invalid name');
    process.exit(1);
  }
  usedNames[cName] = true;
  return cName;
}

function processSheets(categories) {
  return categories
    .filter(c => !!c.subCategories)
    .map(c => ({ name: getValidName(c.title), data: processSheet(c) }));
}

var buffer = xlsx.build(processSheets(data));

fs.writeFileSync('report.xlsx', buffer);
