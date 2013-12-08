(function() {
  this.SpinalTap.Record = function(model, attributes, opts) {
    if (!model) return; // we get called with no arguments as part of cloning

    this.model = model;
    this.eventSink = SpinalTap.$(this);
    this.opts = opts === void 0 ? {} : opts;

    this.registerEvents(this.events);
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
          persisted = this.persistedAttributes;

      _.each(this.attributes, 
             function(value, key) { if (value !== persisted[key]) changed[key] = value; });

      return changed;
    },

    getSaveableAttributes: function() {
      return this.getChangedAttributes();
    },

    reload: function(opts) {
      opts = _.extend({url: this.getURL()}, opts);

      var handleResults = function(newRecord) {
        return this.setAttributes(newRecord.attributes, {reset: true, persisted: true});
      };

      return this.model.one(opts).then(_.bind(handleResults, this));
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
      return SpinalTap.Persistence.save(this, opts).then(_.bind(this.processSaveResults, this, opts));
    },

    processSaveResults: function(opts, data) {
      var attribs = (opts && opts.resultProcessor || this.model.wireToAttributes)(data);
      this.setAttributes(attribs, {persisted: true, reset: true});
      this.eventSink.trigger("afterSave", data);
      return this;
    },

    setAttributes: function(attributes, opts) {
      var initialAttributes = this.attributes || {};

      if (opts && opts.reset) {
        this.attributes = this.a = {};
        this.persistedAttributes = {};
      }

      if (attributes !== void 0) {
        for (var property in attributes) {
          var oldValue = initialAttributes[property];

          this.attributes[property] = attributes[property];

          if (oldValue !== attributes[property]) {
            this.eventSink.trigger("attributeChange", {attribute: property, oldValue: oldValue});
          }
        }

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

    attributesToWire: function(attributes) {
      return attributes;
    },

    registerEvents: function(events) {
      _.each(events,
             function(object, eventName) { this.eventSink.on(eventName, object); },
             this);
    },

    // TODO : destroy
  });

  SpinalTap.Record.prototype.set    = SpinalTap.Record.prototype.setAttributes;
  SpinalTap.Record.prototype.update = SpinalTap.Record.prototype.updateAttributes;
}).call(this);
