// amc13seshbrowser.js

window.Seshbro = {
  Models: {},
  Collections: {},
  Views: {}
};

window.app = {};

// in case we move
app.docroot = "";

Seshbro.Router = Backbone.Router.extend({
  initialize : function() {
    this.route( "", "tidize" );
    this.route( /^tids\[(.*?)\]$/, "tidize" );
    this.route( /^cats=(.*?)$/, "tidize" );
    this.route( /^(?!...s.*)/, "tidize" );
  },
  tidize : function( tids ) {
    var this_router = this;
    // browse sessions
    app.seshbro = new Seshbro.Views.SessionBrowser();
    if ( tids ) {
      var dothings = function() { this_router.load_from_tids( tids ); };
    } else {
      var dothings = function() {  };
    }
    app.seshbro.sessionsView.collection.bind( "reset", dothings );
    app.seshbro.render();
  },
  load_from_tids : function( tids ) {
    if ( tids && tids.length > 1 ) {
      tids = tids.split( "," );
      $( ".categories input" ).each(function() { $(this).prop({ checked : false }); });
      _.map( tids, function( tid ) {
        app.seshbro.categoriesView.collection.get(tid).set({ selected : true });
        $( "#term-" + tid ).prop({ checked: true });
      });
      $( '#categories input' ).parent().styleForm();
      _.each( $( ".categories"), function( cat ) {
        $par = $(cat);
        $par.prepend( "<div class='cat-teaser'>" + app.seshbro.categoriesView.get_nuisance_of_cats( $par ) + "</div>" );
      });
    }
  }
});

Seshbro.Models.Category = Backbone.Model.extend({
  idAttribute : "tid",
  initialize : function() {
    this.bind( "change:selected", function() {
      var stringOfPearls = _.map(
        this.collection.where({ selected : true }),
        function( m ) { return m.get("tid"); }
      );
      app.router.navigate( "cats=" + stringOfPearls.toString() + "" );
      app.seshbro.sessionsView.filter( app.seshbro.categoriesView.collection );
    });
  }
});

Seshbro.Models.Session = Backbone.Model.extend({
  idAttribute : "nid"
});

Seshbro.Models.Seshflag = Backbone.Model.extend({
  idAttribute : "nid"
});

Seshbro.Models.Hashtwitcount = Backbone.Model.extend({
  idAttribute : "key" // hashtag, sans #
});

Seshbro.Collections.Categories = Backbone.Collection.extend({
  model : Seshbro.Models.Category,
  url : app.docroot + "/amc2013/sessions/taxonomy-js?callback=?",
  comparator : function ( term ) {
    // we display terms by section, so no need for a sophistasorter
    return term.get("weight");
  }
});

Seshbro.Collections.Seshflags = Backbone.Collection.extend({
  model : Seshbro.Models.Seshflag,
  url : app.docroot + "/amc2013/sessions/flag-json?callback=?"
});

Seshbro.Collections.Hashtwitcounts = Backbone.Collection.extend({
  model : Seshbro.Models.Hashtwitcount,
  url : "http://jackpine.theworkdept.com:5984/dfgleanings/_design/bytag/_view/count_by_tag?reduce=true&group=true&callback=?",
  parse : function(response) {
    return response.rows;
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
      return app.docroot + "/backbone/rest/node/" + _.pluck( models, id ) + ".jsonp?callback=?";
    } else {
      return app.docroot + "/backbone/rest/views/2013sesh_backbone_user.jsonp?callback=?";
    }
  },
  comparator : function ( sesh ) {
    if ( sesh.get("field_2013sched")[0].value > 0 ) {
      var term = app.seshbro.categoriesView.collection.get( sesh.get("field_2013sched")[0].value );
      if ( 642 == term.get("tid") ) {
        return -9000 + sesh.get("nid") * .1;
      } else {
        var p_term = app.seshbro.categoriesView.collection.get( term.get("parents")[0] );
        var weight = ( ( p_term.get("weight") * 100 ) + term.get("weight") + sesh.get("nid") * .1 );
        return weight;
      }
    } else {
      return 99999;
    }
  }
});

Seshbro.Views.Categories = Backbone.View.extend({
  initialize : function() {
    _.bindAll( this, "render" );
    this.collection = new Seshbro.Collections.Categories();
    this.collection.on( "reset", this.render );
    this.collection.fetch();
  },
  id : "categories",
  template : doT.template( $( "#seshbro-tpl-categories" ).html() ),
  render : function() {
    var allblocks = this.collection.where({ vid : "21" });
    var blocks = {
      ongoing : _.filter( allblocks, function( model ) {
        return model.get("tid") == "642";
      }),
      thursday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 643;
      }),
      friday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 644;
      }),
      saturday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 645;
      }),
      sunday : _.filter( allblocks, function( model ) {
        return model.get("parents")[0] == 646;
      })
    };
    var allt_ps_ng = this.collection.where({ vid : "17" });
    var t_ps_ng = {
      t : _.filter( allt_ps_ng, function( model ) {
        return model.get("parents")[0] == 538;
      }),
      ps : _.filter( allt_ps_ng, function ( model ) {
        return model.get("parents")[0] == 537;
      }),
      ng : _.filter( allt_ps_ng, function( model ) {
        return model.get("tid") == 536;
      })
    };
    var categories = {
      t_ps_ng : t_ps_ng,
      blocks : blocks,
      locations : this.collection.where({ vid : "22" })
    };
    $( "#categories" ).html( this.template( categories ) );
    this.setElement( $( "#categories" ) );
    $( "input", this.$el ).parent().styleForm()
    return this;
  },
  events : {
    "change input.tid" : "select_track",
    "click #select-none" : "select_none",
    "click .expandocat" : "adjust_cat_eyes_for_available_light",
    "change input.checkgroup" : "checkgroup",
    "change input#toggle-flagged" : "toggle_flagged"
  },
  select_track : function( e ) {
    // store selected state as a property right smack dab in the middle of the category model
    var this_tid = $( e.currentTarget ).val();
    var this_state = $( e.currentTarget ).prop( "checked" );
    this.collection.get( this_tid ).set({ selected : this_state });
  },
  select_none : function ( e ) {
    e.preventDefault();
    app.router.navigate( "cats=", { trigger : true } );
  },
  adjust_cat_eyes_for_available_light : function ( e ) {
    e.preventDefault();
    var $cat = $( e.currentTarget );
    var $par = $cat.parent();
    if ( $par.hasClass( "dilated" ) ) {
      this.contract_cat( $cat, $par );
    } else {
      this.dilate_cat( $cat, $par );
    }
  },
  dilate_cat : function ( $cat, $par ) {
    $par.addClass( "dilated" );
    $( ".cat-teaser", $par ).remove();
  },
  contract_cat : function ( $cat, $par ) {
    $par.removeClass( "dilated" );
    $par.prepend( "<div class='cat-teaser'>" + this.get_nuisance_of_cats( $par ) + "</div>" );
  },
  get_nuisance_of_cats : function ( $par ) {
    return $( ".cchecked", $par ).siblings().text();
  },
  checkgroup : function ( e ) {
    var this_state = $( e.currentTarget ).prop( "checked" );
    var this_coll = this.collection;
    _.each( $( e.currentTarget ).parent().parent().find( "input.tid" ), function ( el ) {
      $( el ).prop( "checked", this_state );
      this_coll.get( $( el ).val() ).set({ selected : this_state });
    });
  },
  toggle_flagged : function ( e ) {
    app.seshbro.considerBkmks = $( e.currentTarget ).prop( "checked" );
    app.seshbro.sessionsView.filter( app.seshbro.categoriesView.collection );
  }
});

Seshbro.Views.Sessions = Backbone.View.extend({
  initialize : function() {
    _.bindAll( this, "render" );
    this.collection = new Seshbro.Collections.Sessions();
    // hashtwitcounts
    this.hashTwitCountColl = new Seshbro.Collections.Hashtwitcounts();
    // is user?
    /* NO FLAGS FOR NOW!
    if ( $( "#container" ).hasClass( "logged-in" ) ) {
      this.flagColl = new Seshbro.Collections.Seshflags();
      this.flagColl.fetch();
    }
    */
    // hashtwitcounts
    this.hashTwitCountColl = new Seshbro.Collections.Hashtwitcounts();
    this.hashTwitCountColl.fetch();
    this.collection.on( "reset", this.render );
    var that = this;
    $.when( this.hashTwitCountColl.fetch() ).then( function() {
      that.collection.fetch();
    });
  },
  id : "seshes",
  template : doT.template( $( "#seshbro-tpl-seshes" ).html() ),
  render : function() {
    $( "#seshes" ).html( this.template( { seshes : this.collection.toJSON() } ) );
    this.setElement( $( "#seshes" ) );
    app.seshbro.sessionsView.filter( app.seshbro.categoriesView.collection );
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
      blocks : [],
      bkmks : []
    };
    var sesh_groups_intersection = [];
    var cat_groups = {
      t_ps_ng : catsColl.where({ vid : "17", selected: true }),
      locations : catsColl.where({ vid : "22", selected: true }),
      blocks : catsColl.where({ vid : "21", selected: true })
    };
    for ( var group in cat_groups ) {
      _.each (
        cat_groups[group],
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
    if ( this.flagColl && app.seshbro.considerBkmks === true ) {
      var flagged_seshes = [];
      _.each(app.seshbro.sessionsView.flagColl.where({ flagStatus : "flagged" }), function(mod) { flagged_seshes.push(mod.id); });
      // this whole multiple-collections thing is pretty inefficient :(
      var flagged_sesh_coll = _.filter( seshes, function ( sesh ) {
        return _.include( flagged_seshes, sesh.get("nid") );
      });
      sesh_groups_or_res.bkmks = flagged_sesh_coll;
    } else {
      var flagged_seshes = [];
      sesh_groups_or_res.bkmks = seshes;
    }
    sesh_groups_intersection = _.intersection(
      sesh_groups_or_res.t_ps_ng,
      sesh_groups_or_res.locations,
      sesh_groups_or_res.blocks,
      sesh_groups_or_res.bkmks
    );
    this.render_filter( sesh_groups_intersection );
  },
  render_filter : function( collection ) {
    //This will re-render the view based on the collection given to it.
    //This should update the lower session view based on what is clicked so it's stateless right now.
    collection = new Seshbro.Collections.Sessions(collection);
    $( "#seshes" ).html( this.template({ seshes : collection.toJSON() }) );
    this.theme();
  },
  theme : function() {
    $('.seshes', this.$el).find("li[data-day='0']").first().prepend('<h2>ONGOING</h2>');
    $('.seshes', this.$el).find("li[data-day='643']").first().prepend('<h2>THURSDAY</h2>');
    $('.seshes', this.$el).find("li[data-day='644']").first().prepend('<h2>FRIDAY</h2>');
    $('.seshes', this.$el).find("li[data-day='645']").first().prepend('<h2>SATURDAY</h2>');
    $('.seshes', this.$el).find("li[data-day='646']").first().prepend('<h2>SUNDAY</h2>');
    // add flag link events
    Drupal.flagLink($('.seshes', this.$el));
  },
  events : {
    "click .expandosesh" : "expandosesh",
    "click .noflagsesh" : "noflagsesh"
  },
  expandosesh : function ( e ) {
    e.preventDefault();
    $( e.currentTarget ).parent().parent().toggleClass("expandoed");
  },
  noflagsesh : function ( e ) {
    $('#block-user-0').addClass('makeitobvious');
  }
});

Seshbro.Views.SessionBrowser = Backbone.View.extend({
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
  },
  id : "amc13seshbro",
  template :  doT.template( $( "#seshbro-tpl-seshbro" ).html() ),
  render : function( done ) {
    var view = this;
    $( "#amc13seshbro" ).html( this.template() );
    this.setElement( $( "#amc13seshbro" ) );
    if ( _.isFunction ( done ) ) {
      done(view.el);
    }
    return this;
  }
});

$(function() {
  $( document ).ready(function() {
    // this isn't the right place for what i'm trying to do, just playin at
    // this point
    app.router = new Seshbro.Router();
    Backbone.history.start({ pushState : false });

    // special sauce
    $(document.documentElement).keypress(function(e) {
      if ( event.keyCode === 69 ) {
        $( '.session' ).each( function() {
          $(this).addClass( "expandoed" );
        });
      }
      if ( event.keyCode === 101 ) {
        $( '.session' ).each( function() {
          $(this).removeClass( "expandoed" );
        });
      }
    })
  });
});

