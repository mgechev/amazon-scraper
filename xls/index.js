const xlsx = require('node-xlsx');
const fs = require('fs');
const data = require('../scraper/all.json');

function processSubcategory(subCategory) {
  const subCategoryName = subCategory.title;
  return subCategory.products.map(p => ([
    subCategoryName, p.title, p.price, parseInt(p.sales) || 5, p.brand, p.url, subCategory.url, p.image ]));
}

function processSheet(category) {
  const data = [['Sub-category', 'Product', 'Price', 'Est. sales', 'Brand', 'Url', 'Category URL', 'Image']];
  return category.subCategories.reduce((p, subCategory) =>
    p.concat(processSubcategory(subCategory)), data);
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
