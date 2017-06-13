/**
 * @Author: Mohammad M. AlBanna
 * Copyright © 2017 Jungle Scout
 *
 * Parse the content of Amazon pages
 */

var Parser = function(data){
	//----------------------------------------------------//
	//Product Title
	var getProductTitle = function(){
		var productTitle = $(data, "body").find("#productTitle").text() ||
		$(data, "body").find("#btAsinTitle").text() || $(data, "body").find("#aiv-content-title").text() ||
		$(data, "body").find("#title_feature_div").text() || $(data, "body").find(".AAG_ProductTitle a").attr("title")
		|| $(data, "body").find("#item_name").text() || $(data, "body").find("#ebooksProductTitle").text() || $(data, "body").find("#mediaProductTitle").text();

		if(productTitle){
			productTitle = productTitle.trim();
			productTitle = productTitle.length == 0 ? "N.A." : productTitle;
		}else{
			productTitle = "N.A.";
		}
		return productTitle;
	}
	//----------------------------------------------------//
	//Brand
	var getBrand = function(passingData){
		var brand = null;
		if(typeof passingData != "undefined" && typeof passingData.brand != "undefined" && passingData.brand != null){
			brand = passingData.brand;
		}else{
			brand = $(data, "body").find("#brand").text() || $(data, "body").find("span.author a:first").text() ||
			$(data, "body").find("#product-title_feature_div").text().match(brandRegex) ||
			$(data, "body").find(".parseasinTitle").siblings("span").last().text().match(brandRegex) || $(data, "body").find("#olpProductByline").text().match(brandRegex)
			|| $(data, "body").find("#brandByline_feature_div").text().match(brandRegex) || $(data, "body").find("#brandBylineWrapper").text().match(brandRegex)
			|| $(data, "body").find("#mocaBBSoldByAndShipsFrom a").text() || $("#byline a:first").text();
		}

        if(brand){
        	brand = typeof brand == "object" ? brand[0].replace(/by\s?/,"") : brand.replace(/by\s?/,"");
        	brand = brand.trim();
			brand = brand.length == 0 ? "N.A." : brand;
        }else{
        	brand = "N.A.";
        }

        return brand;
	}
	//----------------------------------------------------//
	//BB seller
	var getBbSeller = function(){
		var merchantInfo = $(data, "body").find("#merchant-info").text() || $(data, "body").find("#availability_feature_div").text()
		|| $(data, "body").find("#mocaBBSoldByAndShipsFrom").text() || $(data, "body").find("table .buying").text() || $(data, "body").find("#buybox_feature_div").text();

      	var amzRegex = /((ships|dispatched)\s+from\s+and\s+sold\s+by\s+amazon)|(Expédié\s+et\s+vendu\s+par\s+Amazon)|(Verkauf\s+und\s+Versand\s+durch\s+Amazon)|(Vendido\s+y\s+enviado\s+por\s+Amazon)|(Venduto\s+e\s+spedito\s+da\s+Amazon)/i;
      	var amz = amzRegex.test(merchantInfo);

      	var fbaRegex = /(fulfilled\s+by\s+amazon)|(expédié\s+par\s+amazon)|(Versand\s+durch\s+Amazon)|(enviado\s+por\s+Amazon)|(gestionado\s+por\s+Amazon)|(spedito\s+da\s+Amazon)/i;
      	var fba = fbaRegex.test(merchantInfo);

      	var merchRegex = /((ships|dispatched)\s+from\s+and\s+sold\s+by)|(Expédié\s+et\s+vendu\s+par)|(Verkauf\s+und\s+Versand\s+durch)|(Vendido\s+y\s+enviado\s+por)|(Venduto\s+e\s+spedito\s+da)/i;
      	var merch = merchRegex.test(merchantInfo);

      	var bbSeller = "N.A.";

      	if(amz){
      		bbSeller = "AMZ";
      	}else if(fba){
      		bbSeller = "FBA";
      	}else if(merch){
      		bbSeller = "Merch";
      	}

      	return bbSeller;
	}
	//----------------------------------------------------//
	//Get Price
	var getPrice = function(passingData){
      	var price = $(data, "body").find("#actualPriceValue").text() || $(data, "body").find("#priceblock_ourprice").text() ||
      	$(data, "body").find("#priceblock_saleprice").text() || $(data, "body").find("#priceblock_dealprice").text() || $(data, "body").find("#priceBlock .priceLarge").text() ||
      	$(data, "body").find("#buyNewSection .a-color-price.offer-price").text() || $(data, "body").find("#prerderDelaySection .a-color-price").text() ||
      	$(data, "body").find("#mocaSubtotal .a-color-price").text() || $(data, "body").find("#tmmSwatches .a-color-price").text() ||
      	$(data, "body").find("#mediaTab_content_landing .a-color-price.header-price").text() || $(data, "body").find("#unqualifiedBuyBox .a-color-price").text() ||
      	$(data, "body").find("#mediaTab_content_landing .a-color-price").text() || $(data, "body").find("#wineTotalPrice").text() || $(data, "body").find("#buybox_feature_div .a-color-price").text();

      	price = price.match(priceRegex) ? price.match(priceRegex)[0] : null;
  		if(price){
  			price = price.replace(currencyRegex,""); //Take it just a number
        	price = price.replace(thousandSeparatorRegex,"$1"); //remove any thousand separator
	        price = price.replace(",","."); //Because of Germany and French stores
  		} else {
  			price = "N.A.";
  		}

      	if(price == "N.A." && typeof passingData != "undefined" && typeof passingData.price != "undefined"){
      		price = passingData.price;
      	}

      	return price;
	}
	//----------------------------------------------------//
	//Get Product Image
	var getProductImage = function(){
		var productImage = $(data, "body").find("#landingImage, #imgBlkFront").attr("data-a-dynamic-image");
      	if(productImage){
      		productImage = JSON.parse(productImage);
      		productImage = Object.keys(productImage)[0] ? Object.keys(productImage)[0].trim() : null;
      	}else{
      		//Check main image src
      		productImage = $(data, "body").find("#main-image").attr("src");
      		if(!productImage){
      			productImage = null;
      		}
      	}
      	return productImage;
	}
	//----------------------------------------------------//
	//Get rank category
	var getRankAndCategory = function(bestSellerRankText){
		var rankAndCategory = $(data, "body").find("#SalesRank").clone().find("ul,style,li").remove().end().text() ||
		$(data,"body").find("#prodDetails th:contains('"+bestSellerRankText+"')").next().text();

		//Get the category
		var category = rankAndCategory ? (rankAndCategory = rankAndCategory.replace(bestSellerRankText,'') , rankAndCategory.match(/(in\s|en\s)[\s\u00BF-\u1FFF\u2C00-\uD7FF\w\&\,\-]+[\(\>]?/g)) : null;
		category = category ? category[0] : null ;
  		if(category && category.indexOf(">") == -1){
  			category = category.replace(/^(in|en)|(\()/g,"");
      	}else{
      		category = "N.A.";
      	}

      	//Get the rank
      	var rank = rankAndCategory ? rankAndCategory.match(/((\#)|(Nr.\s)|(nº)|(n.\s?))?[0-9,.]+|(\>)/gi) : null;
  		if(rank && ($.inArray(">", rank) == -1 || $.inArray(">", rank) > 1)){
  			rank = rank[0].replace(/(\#)|(Nr.)|(\,)|(\.)|(nº)|(n.)/gi,"");
  		}else{
  			rank = "N.A.";
  		}
      	return {category:category.trim(), rank:rank.trim()};
	}
	//----------------------------------------------------//
	//Get rating
	var getRating = function(){
  		var rating = $(data, "body").find("#averageCustomerReviews .a-icon-star").attr("class") ||
  		$(data, "body").find("span.asinReviewsSummary .swSprite").attr("class") ||
  		$(data, "body").find("#reviewStars").attr("class");
		if(rating){
		  rating = rating.match(/[1-9]/g);
		  rating = rating[1] ? rating[0] + "." + rating[1] : rating[0];
		}else{
			rating = "N.A.";
		}
      	return rating;
	}
	//----------------------------------------------------//
	//Get reviews
	var getReviews = function(){
		var reviews =  $(data, "body").find("#acrCustomerWriteReviewLink:first").text() || $(data, "body").find("#acrCustomerReviewText:first").text() ||
		$(data, "body").find("#reviewLink:first").text() || $(data, "body").find("span.asinReviewsSummary:first").next().text();

		reviews = reviews && reviews.match(/[0-9.,]+/) ? reviews.match(/[0-9.,]+/)[0] : "0";
		reviews = reviews.replace(/[\,\.]/,""); //Because of Germany and French stores
		if(reviews == "0"){
			reviews = "N.A."
		}
		return reviews.trim();
	}
	//----------------------------------------------------//
	//Return
	return {
		getProductTitle:getProductTitle,
		getBrand:getBrand,
		getBbSeller:getBbSeller,
		getPrice:getPrice,
		getProductImage:getProductImage,
		getRankAndCategory:getRankAndCategory,
		getRating:getRating,
		getReviews:getReviews,
	}
}
