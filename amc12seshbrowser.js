// amc12seshbrowser.js

window.Seshbro = {
  Models: {},
  Collections: {},
  Views: {}
};

Seshbro.Models.Category = Backbone.RelationalModel.extend({
  url : "http://dev.talk070512.phy3.thermitic.net/amc2012/sessions/taxonomy-js?callback=?"
});

Seshbro.Models.Session = Backbone.RelationalModel.extend({
  idAttribute : "nid",
  relations : [
    {
      type : "HasMany",
      key : "categories",
      relatedModel : "Seshbro.Models.Category",
      collectionType: "Seshbro.Colletions.Categories"
    }
  ]
});

Seshbro.Collections.Sessions = Backbone.Collection.extend({
  url : function( models ) {
    if ( models ) {
      // XXX: this doesn't work because Drupal Services can only serve one
      // node at a time. wtf. anyways, there isn't really a case where we'd
      // load a partial set, since we're downloading the whole blob of
      // sessions at once.
      return "http://dev.talk070512.phy3.thermitic.net/backbone/rest/node/" + _.pluck( models, id ) + ".jsonp?callback=?";
    } else {
      return "http://dev.talk070512.phy3.thermitic.net/backbone/rest/views/2012sesh_backbone_user.jsonp?callback=?";
    }
  }
});

Seshbro.Views.Categories = Backbone.View.extend({
  initialize : function() {
    _.bindAll( this, "render" );
    this.model = new Seshbro.Models.Category();
    this.model.on( "change", this.render );
    this.model.fetch();
  },
  template : _.template( $( "#seshbro-tpl-categories" ).html() ),
  render : function() {
    $( "#categories" ).html( this.template( this.model.toJSON() ) );
    return this;
  }
});

Seshbro.Views.Sessions = Backbone.View.extend({
  initialize : function() {
    _.bindAll( this, "render" );
    this.collection = new Seshbro.Collections.Sessions();
    this.collection.on( "reset", this.render );
    this.collection.fetch();
  },
  template : _.template( $( "#seshbro-tpl-seshes" ).html() ),
  render : function() {
    $( "#seshes" ).html( this.template( { seshes : this.collection.toJSON() } ) );
    return this;
  }
});

Seshbro.Views.SessionBrowser = Backbone.View.extend({
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
  },
  template : function() {
    var appTemplate = _.template( "<div id='categories'></div><br/><br/><div id='seshes'></div>" );
    return appTemplate();
  },
  render : function( categoryModel, sessionsCollection ) {
    $( this.el ).html( this.template() );
    return this;
  }
});

$(function() {
  $( document ).ready(function() {
    var app = new Seshbro.Views.SessionBrowser();
    $( "#app" ).html( app.render().el );
  });
});

