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

Seshbro.Models.TaxonomyId = Backbone.Model.extend({});

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

Seshbro.Collections.Filters = Backbone.Collection.extend({});

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
  },
  filter : function(tidCollection){
    //this is going to filter based on click and re-render stuff.
    var filteredColl = _.reduce(tidCollection, function(memo, tid)
      {
        var filtered = _.filter(memo, function(session){ 
          //replace this filtering logic here. 
          return session.get("taxonomy").hasOwnProperty(tid.get("tid")) === true;
        });
        return filtered;
      }, this.collection.models);
    console.log(filteredColl);
    this.render_filter(filteredColl);
  },
  render_filter : function(collection){
    //This will re-render the view based on the collection given to it.
    //This should update the lower session view based on what is clicked so it's stateless right now.
    collection = new Seshbro.Collections.Sessions(collection);
    $( "#seshes" ).html( this.template( { seshes : collection.toJSON() } ) );
  }
});

Seshbro.Views.SessionBrowser = Backbone.View.extend({
  events : {
    "click .track_selection" : "select_track"
  },
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
    this.filterCriteria = new Seshbro.Collections.Filters();
  },
  template : function() {
    var appTemplate = _.template( "<div id='categories'></div><br/><br/><div id='seshes'></div>" );
    return appTemplate();
  },
  render : function( categoryModel, sessionsCollection ) {
    $( this.el ).html( this.template() );
    return this;
  },
  select_track : function(e){
    //$(e.currentTarget).val() grabs the current value of the checkbox being clicked. I made the value the
    //TID of the model.
    var singleFilter = $(e.currentTarget).val();
    var removableFilter = this.filterCriteria.where({tid:singleFilter.toString()});
    if(removableFilter.length === 0){
      this.filterCriteria.add(new Seshbro.Models.TaxonomyId({tid:singleFilter}));
    } 
    else{
      this.filterCriteria.remove(removableFilter[0]);
    }
    //console.log(this.filterCriteria.models);
    this.sessionsView.filter(this.filterCriteria.models);
  }
});

$(function() {
  $( document ).ready(function() {
    var app = new Seshbro.Views.SessionBrowser();
    $( "#app" ).html( app.render().el );
  });
});

