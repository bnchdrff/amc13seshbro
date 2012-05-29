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

Seshbro.Models.Category = Backbone.RelationalModel.extend({
  idAttribute : "tid"
});

Seshbro.Models.Session = Backbone.RelationalModel.extend({
  idAttribute : "nid"
});

Seshbro.Models.TaxonomyId = Backbone.Model.extend({});

Seshbro.Collections.Categories = Backbone.Collection.extend({
  url : "http://talk.alliedmedia.org/amc2012/sessions/taxonomy-js?callback=?",
  comparator : function ( term ) {
    // we display terms by section, so no need for a sophistasorter
    return term.get("weight");
  }
});

Seshbro.Collections.Sessions = Backbone.Collection.extend({
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
  comparator : function( sesh1, sesh2 ) {
    if ( sesh1.get('field_2012sched')[0].value > 0 && sesh2.get('field_2012sched')[0].value > 0 ) {
      var term1 = seshbrodude.categoriesView.collection.where({ tid : sesh1.get('field_2012sched')[0].value })[0];
      var term2 = seshbrodude.categoriesView.collection.where({ tid : sesh2.get('field_2012sched')[0].value })[0];
      // ongoing goes to the top
      if ( 514 == term1.get("tid") == term2.get("tid") ) {
        return 0;
      }
      if ( term1.get("tid") == 514 ) {
        return -1;
      }
      if ( term2.get("tid") == 514 ) {
        return 1;
      }
      // if both terms have parents, then compare the parents first
      if ( term1.get("parents")[0] > 0 && term2.get("parents")[0] > 0 ) {
        var term1_p = seshbrodude.categoriesView.collection.where({ tid : term1.get("parents")[0] })[0];
        var term2_p = seshbrodude.categoriesView.collection.where({ tid : term2.get("parents")[0] })[0];
        // sesh1 should come after sesh2 if sesh1's parent weighs more
        if ( term1_p.get("weight") > term2_p.get("weight") ) {
          return 1;
        } else if ( term1_p.get("weight") < term2_p.get("weight") ) {
          return -1;
        } else if ( term1_p.get("tid") == term2_p.get("tid") ) {
          // but if they're the same weight (i.e. the same term) then we compare child term weights
          return term1.get("weight") - term2.get("weight");
        } else {
          console.log('broken #1! bad!');
        }
      } else if ( term1.get("parents")[0] > 0 && term2.get("parents")[0] == 0 ) {
        console.log("term1 has parents but term2 doesn't");
        var term1_p = seshbrodude.categoriesView.collection.where({ tid : term1.get("parents")[0] })[0];
        return term1_p.get("weight") - term2.get("weight");
      } else if ( term1.get("parents")[0] == 0 && term2.get("parents")[0] > 0 ) {
        console.log("term1 doesn't have parents but term2 does");
        var term2_p = seshbrodude.categoriesView.collection.where({ tid : term2.get("parents")[0] })[0];
        return term1.get("weight") - term2_p.get("weight");
      } else if ( term1.get("parents")[0] == 0 && term2.get("parents")[0] == 0 ) {
        console.log("neither term1 nor term2 have parents. sad.");
        return term1.get("weight") - term2.get("weight");
      } else {
        console.log('broken #2! bad!');
      }
    // now let's handle sessions without a schedblock defined
    } else if ( sesh1.get('field_2012sched')[0].value > 0 && sesh2.get('field_2012sched')[0].value == 0 ) {
      return -1;
    } else if ( sesh1.get('field_2012sched')[0].value == 0 && sesh2.get('field_2012sched')[0].value > 0 ) {
      return 1;
    } else {
      return 0;
    }
/*
    if ( sesh1.get('field_2012sched')[0].value > 0 && sesh2.get('field_2012sched')[0].value > 0 ) {
      var sesh1_b = seshbrodude.categoriesView.collection.where({ tid : sesh1.get('field_2012sched')[0].value })[0];
      var sesh2_b = seshbrodude.categoriesView.collection.where({ tid : sesh2.get('field_2012sched')[0].value })[0];
      if ( sesh1_b.get("parents")[0] > 0 && sesh2_b.get("parents")[0] > 0 ) {
        var sesh1_pb = seshbrodude.categoriesView.collection.where({ tid : sesh1_b.get("parents")[0] })[0];
        var sesh2_pb = seshbrodude.categoriesView.collection.where({ tid : sesh2_b.get("parents")[0] })[0];
        // sesh1 should come after sesh2 if sesh1's parent weighs more
        if ( sesh1_pb.get("weight") > sesh2_pb.get("weight") ) {
          return 1;
        } else if ( sesh1_pb.get("weight") < sesh2_pb.get("weight") ) {
          return -1;
        } else if ( sesh1_pb.get("tid") === sesh2_pb.get("tid") ) {
          // but if they're the same weight (i.e. the same term) then we compare child term weights
          if ( sesh1_b.get("weight") > sesh2_b.get("weight") ) {
            return 1;
          } else if ( sesh1_b.get("weight") < sesh2_b.get("weight") ) {
            return -1;
          } else {
            return 0;
          }
        } else {
          console.log('broken! bad!');
          console.log(sesh1_b);
          console.log(sesh2_b);
          console.log(sesh1_pb);
          console.log(sesh2_pb);
        }
      }
    }
*/
  }
});

Seshbro.Collections.Filters = Backbone.Collection.extend({});

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
  filter : function(tidCollection){
    //this is going to filter based on click and re-render stuff.
    var filteredColl = _.reduce(tidCollection, 
    function(memo, tid){
      //every reduce step we filter the collection even more.
      var filtered = _.filter(memo, function(session){ 
        //replace this filtering logic here. 
        return session.get("taxonomy").hasOwnProperty(tid.get("tid")) === true;
      });
      return filtered;
    }, this.collection.models);
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
    "click input[type=checkbox]" : "select_track"
  },
  initialize : function() {
    this.categoriesView = new Seshbro.Views.Categories();
    this.sessionsView = new Seshbro.Views.Sessions();
    this.filterCriteria = new Seshbro.Collections.Filters();
    this.router = new Seshbro.Router();
    // this isn't the right place for what i'm trying to do, just playin at
    // this point
    this.filterCriteria
      .on( "add", function(tid) {
        seshbrodude.router.navigate("tids[" + tid.collection.pluck('tid').toString() + "]");
      })
      .on( "remove", function(tid) {
        seshbrodude.router.navigate("tids[" + tid.collection.pluck('tid').toString() + "]");
      })
    ;
    Backbone.history.start({ pushState : false });
  },
  template :  doT.template( $( "#seshbro-tpl-seshbro" ).html() ),
  render : function( categoriesCollection, sessionsCollection ) {
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
    window.seshbrodude = new Seshbro.Views.SessionBrowser();
    $( "#app" ).html( seshbrodude.render().el );
  });
});

