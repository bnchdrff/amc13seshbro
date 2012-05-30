// amc12seshbrowser.js

window.Seshbro = {
  Models: {},
  Collections: {},
  Views: {}
};

Seshbro.Router = Backbone.Router.extend({
  initialize : function() {
    this.route(/^tids\[(.*?)\]$/, "tidize");
  },
  tidize : function(tids) {
    tids = tids.split(',');
  }
});

Seshbro.Models.Category = Backbone.Model.extend({
  idAttribute : "tid",
  initialize : function() {
    this.bind( "change:selected", function() {
      console.log('something changed!');
      console.log(this.get("name") + ": " + this.get("selected"));
    });
  }
});

Seshbro.Models.Session = Backbone.Model.extend({
  idAttribute : "nid"
});

Seshbro.Models.TaxonomyId = Backbone.Model.extend({});

Seshbro.Collections.Categories = Backbone.Collection.extend({
  model : Seshbro.Models.Category,
  url : "http://talk.alliedmedia.org/amc2012/sessions/taxonomy-js?callback=?",
  comparator : function ( term ) {
    // we display terms by section, so no need for a sophistasorter
    return term.get("weight");
  }
});

Seshbro.Collections.Sessions = Backbone.Collection.extend({
  model : Seshbro.Models.Session,
  url : function( models ) {
    if ( models ) {
      // XXX: this doesn't work because Drupal Services can only serve one
      // node at a time. wtf. anyways, there isn't really a case where we'd
      // load a partial set, since we're downloading the whole blob of
      // sessions at once.
      return "http://talk.alliedmedia.org/backbone/rest/node/" + _.pluck( models, id ) + ".jsonp?callback=?";
    } else {
      return "http://talk.alliedmedia.org/backbone/rest/views/2012sesh_backbone_user.jsonp?callback=?";
    }
  },
  comparator : function ( sesh ) {
    if ( sesh.get("field_2012sched")[0].value > 0 ) {
      term = seshbrodude.categoriesView.collection.get( sesh.get("field_2012sched")[0].value );
      if ( 514 == term.get("tid") ) {
        return -9000 + sesh.get("nid") * .1;
      } else {
        p_term = seshbrodude.categoriesView.collection.get( term.get("parents")[0] );
        return ( p_term.get("weight") * 10 + term.get("weight") + sesh.get("nid") * .1 );
      }
    } else {
      return 99999;
    }
  }
});

Seshbro.Collections.Filters = Backbone.Collection.extend({
});

Seshbro.Views.Categories = Backbone.View.extend({
  initialize : function() {
    _.bindAll( this, "render" );
    this.collection = new Seshbro.Collections.Categories();
    this.collection.on( "reset", this.render );
    this.collection.fetch();
  },
  template : doT.template( $( "#seshbro-tpl-categories" ).html() ),
  render : function() {
    var allblocks = this.collection.where({ vid : "15" });
    var blocks = {
      ongoing : _.filter( allblocks, function( model ) {
        return model.get("tid") == "514";
      }),
      thursday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 427;
      }),
      friday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 432;
      }),
      saturday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 443;
      }),
      sunday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 453;
      })
    };
    var allt_ps_ng = this.collection.where({ vid : "10" });
    var t_ps_ng = {
      t : _.filter( allt_ps_ng, function( model ) {
        return model.get("parents")[0] == 517;
      }),
      ps : _.filter( allt_ps_ng, function ( model ) {
        return model.get("parents")[0] == 518;
      }),
      ng : _.filter( allt_ps_ng, function( model ) {
        return model.get("tid") == 519;
      })
    };
    var categories = {
      t_ps_ng : t_ps_ng,
      blocks : blocks,
      locations : this.collection.where({ vid : "16" })
    };
    $( "#categories" ).html( this.template( categories ) );
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
  template : doT.template( $( "#seshbro-tpl-seshes" ).html() ),
  render : function() {
    $( "#seshes" ).html( this.template( { seshes : this.collection.toJSON() } ) );
    return this;
  },
  filter : function( catsColl ) {
    // for each vocabulary group (t_ps_ng, locations, and schedblocks),
    // do an OR search
    // then display the intersection of those result sets
    var seshes = this.collection.models;
    var sesh_groups_or_res = {
      t_ps_ng : [],
      locations : [],
      blocks : []
    };
    var sesh_groups_intersection = [];
    var groups = {
      t_ps_ng : catsColl.where({ vid : "10", selected: true }),
      locations : catsColl.where({ vid : "16", selected: true }),
      blocks : catsColl.where({ vid : "15", selected: true })
    };
    for ( var group in groups ) {
      _.each (
        groups[group],
        function ( term ) {
          var filtered = _.filter( seshes, function( sesh ) {
            return sesh.get("taxonomy").hasOwnProperty(term.get("tid")) === true;
          });
          sesh_groups_or_res[group].push( filtered );
        }
      );
      sesh_groups_or_res[group] = _.flatten( sesh_groups_or_res[group] );
      // if it's empty, just fill it up, ya bimbo
      if ( sesh_groups_or_res[group].length === 0 ) {
        sesh_groups_or_res[group] = seshes;
      }
    }
    sesh_groups_intersection = _.intersection(
      sesh_groups_or_res.t_ps_ng,
      sesh_groups_or_res.locations,
      sesh_groups_or_res.blocks
    );
    this.render_filter( sesh_groups_intersection );
  },
  render_filter : function( collection ) {
    //This will re-render the view based on the collection given to it.
    //This should update the lower session view based on what is clicked so it's stateless right now.
    collection = new Seshbro.Collections.Sessions(collection);
    $( "#seshes" ).html( this.template({ seshes : collection.toJSON() }) );
  }
});

Seshbro.Views.SessionBrowser = Backbone.View.extend({
  events : {
    "change input[type=checkbox]" : "select_track",
    "click #select-all" : "select_all",
    "click #select-none" : "select_none"
  },
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
    // this isn't the right place for what i'm trying to do, just playin at
    // this point
    this.router = new Seshbro.Router();
    Backbone.history.start({ pushState : false });
  },
  template :  doT.template( $( "#seshbro-tpl-seshbro" ).html() ),
  render : function( categoriesCollection, sessionsCollection ) {
    $( this.el ).html( this.template() );
    return this;
  },
  select_track : function( e ) {
    // store selected state as a property right smack dab in the middle of the category model
    var this_tid = $( e.currentTarget ).val();
    var this_state = $( e.currentTarget ).prop( 'checked' );
    this.categoriesView.collection.where({ tid : this_tid })[0].set({ selected : this_state });
    this.sessionsView.filter( this.categoriesView.collection );
  },
  select_all : function( e ) {
    this.$el.find( 'input' ).prop( 'checked', true );
  },
  select_none : function ( e ) {
    this.$el.find( 'input' ).prop( 'checked', false );
  }
});

$(function() {
  $( document ).ready(function() {
    window.seshbrodude = new Seshbro.Views.SessionBrowser();
    $( "#app" ).html( seshbrodude.render().el );
  });
});

