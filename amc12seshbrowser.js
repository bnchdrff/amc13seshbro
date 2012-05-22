$(function() {
	var VocabModel = Backbone.Model.extend({
		url : 'http://dev.talk070512.phy3.thermitic.net/amc2012/sessions/taxonomy-js?callback=?'
	});

	var BackboneUserCollection = Backbone.Collection.extend({
		url : 'http://dev.talk070512.phy3.thermitic.net/backbone/rest/views/2012sesh_backbone_user.jsonp?callback=?'
	});

	var VocabView = Backbone.View.extend({
		initialize : function()
		{
			_.bindAll(this,'render');
			this.model = new VocabModel();
			this.model.on("change", this.render);
			this.model.fetch();
		},
		render : function()
		{
			$("#tracks").html(JSON.stringify(this.model));
			return this;
		}
	});

	var BackboneUserCollectionView = Backbone.View.extend({
		initialize : function()
		{
			_.bindAll(this,'render');
			this.collection = new BackboneUserCollection();
			this.collection.on("reset", this.render);
			this.collection.fetch();
		},
		render : function()
		{
			$("#sessions").html(JSON.stringify(this.collection));
			return this;
		}
	});

	var AppView = Backbone.View.extend({
		initialize : function()
		{
			this.vocabModelView = new VocabView();
			this.backboneCollView = new BackboneUserCollectionView();
		},
		template : function()
		{
			var appTemplate = _.template("<div id='tracks'></div><br/><br/><div id='sessions'></div>");
			return appTemplate();
		},
		render : function(vocabModel, backboneUserCollection)
		{	
			$(this.el).html(this.template());
			return this;
		}
	});

	$(document).ready(function() {
	    var app = new AppView();
	    $("#app").html(app.render().el);
	});
});

