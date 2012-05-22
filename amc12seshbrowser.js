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
    console.log( this.model.toJSON()[0] );
    $( "#categories" ).html( this.template( this.model.toJSON()[0] ) );
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
  render : function() {
    $( "#sessions" ).html( JSON.stringify( this.collection ) );
    return this;
  }
});

Seshbro.Views.SessionBrowser = Backbone.View.extend({
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
  },
  template : function() {
    var appTemplate = _.template( "<div id='categories'></div><br/><br/><div id='sessions'></div>" );
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

