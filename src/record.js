(function() {
  this.SpinalTap.Record = function(model, attributes, opts) {
    if (!model) return; // we get called with no arguments as part of cloning

    this.model = model;
    this.eventSink = SpinalTap.$(this);
    this.opts = opts === void 0 ? {} : opts;

    this.registerEvents();
    this.setAttributes(attributes, {reset: true, persisted: this.opts.persisted});
    this.eventSink.trigger("afterInitialize");
  };

  _.extend(SpinalTap.Record.prototype, {
    events: {},

    getID: function() {
      return this.attributes.id;
    },

    getURL: function() {
      return this.isNew() ? 
        this.model.url :
        this.model.url + "/" + encodeURIComponent(this.getID());
    },

    isNew: function() {
      return !this.getID();
    },

    getChangedAttributes: function() {
      var changed   = {},
          attribs   = this.attributes,
          persisted = this.persistedAttributes;

      _.each(attribs, 
             function(value, key) { if (value !== persisted[key]) changed[key] = value; });

      return changed;
    },

    getSaveableAttributes: function() {
      return this.getChangedAttributes();
    },

    reload: function(opts) {
      var self = this;

      opts = _.extend({url: this.getURL()}, opts);

      return SpinalTap.Persistence.load(opts).then(function(data) {
        self.setAttributes(self.wireToAttributes(data), {reset: true, persisted: true});
      });
    },

    validate: function(deferred) {
      deferred.resolve();
    },

    save: function(opts) {
      var validator = SpinalTap.$.Deferred();

      this.validate(validator);

      return validator.then(_.bind(this.saveWithoutValidation, this, opts));
    },

    saveWithoutValidation: function(opts) {
      return SpinalTap.Persistence.save(this, opts).then(_.bind(this.processSaveResults, this));
    },

    processSaveResults: function(data) {
      this.setAttributes(this.wireToAttributes(data), {persisted: true, reset: true});
      this.eventSink.trigger("afterSave", data);
      return this;
    },

    setAttributes: function(attributes, opts) {
      if (opts && opts.reset) {
        this.attributes = this.a = {};
        this.persistedAttributes = {};
      }

      if (attributes !== void 0) {
        _.extend(this.attributes, attributes);

        if (opts && opts.persisted) {
          _.extend(this.persistedAttributes, attributes);
        }
      }

      return this;
    },

    updateAttributes: function(attributes, opts) {
      return this.setAttributes(attributes, opts).save();
    },

    /* Converting between attributes hashes and what we send/receive on the wire */

    wireToAttributesArray: function(wireData) {
      return wireData;
    },

    wireToAttributes: function(wireData) {
      return wireData;
    },

    attributesToWire: function(attributes) {
      return attributes;
    },

    registerEvents: function() {
      _.each(this.events,
             function(object, eventName) { this.eventSink.on(eventName, object); },
             this);
    },

    // TODO : destroy
  });
}).call(this);
