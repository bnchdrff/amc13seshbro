(function($) {

$(document).ready(function() {

$.getJSON('http://dev.talk070512.phy3.thermitic.net/backbone/rest/views/2012sesh_backbone_user.jsonp?callback=?', function(res) {
  console.log(res);
});

$.getJSON('http://dev.talk070512.phy3.thermitic.net/amc2012/sessions/taxonomy-js?callback=?', function(res) {
  console.log(res);
});

});

})(this.jQuery);