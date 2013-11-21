Spinal Tap
==========

Yet another simple Javascript model framework.  If you use Rails, you'll feel right at home with this one.

Note this is all very new and probably shouldn't be used in production until it has tests.

Dependencies
------------

* [jQuery] [1]
* [Underscore.js] [2]

  [1]: http://jquery.com
  [2]: http://underscorejs.org

An example of how to use it
---------------------------

I'll have a better/more generic example here eventually, but this is a dump of what I've been using to test:

````javascript
  Prospect = new SpinalTap.Model({url: "http://localhost:3000/prospects"});
  Prospect.extend({
    events: {
      "initialization": function(e)       { console.log("init"); },
      "beforeSave":     function(e, opts) { console.log("before save", opts); },
      "afterSave":      function(e, data) { console.log("after save", data); },
    },

    attributesToWire: function(attributes) {
      return {prospect: attributes};
    },

    // id is actually called ‘token’ for prospects
    getID: function() {
      return this.a.token;
    },

    // Only allow some attributes to be sent to the server
    getSaveableAttributes: function() {
      var data = this.getChangedAttributes(),
          acceptedKeys = ['first_name', 'last_name', 'selected_network_area_id'],
          result = {};

      _.each(acceptedKeys, function(key) { if (key in data) result[key] = data[key]; });
      return result;
    },

    // Define your own validations in here; call resolve() on deferred if you want to continue
    validate: function(deferred) {
      if (!this.isNew() && !this.a.selected_network_area_id) {
        deferred.reject("A selected network area ID must be set.");
      }
      else {
        deferred.resolve();
      }
    },
  });

  // Create a new prospect (with no data) to get a token, and then update it with a selected network area.
  Prospect.create().then(function(prospect) {
    console.log('created', prospect);
    prospect.a.selected_network_area_id = 5;
    return prospect.save();
  }).done(function(prospect) {
    console.log('now in state', prospect.attributes.state);
  }).fail(function(obj, msg) {
    console.log("fail", obj, msg);
  });
````
