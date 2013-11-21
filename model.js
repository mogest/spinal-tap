(function() {
  this.SpinalTap = {
    $: jQuery,

    Persistence: {
      load: function(opts) {
        opts = _.extend({dataType: "json"}, opts);
        return SpinalTap.$.ajax(opts);
      },

      save: function(opts) {
        opts = _.extend({dataType: "json"}, opts);
        return SpinalTap.$.ajax(opts);
      }
    },

    Model: function(object) {
      this.recordClass = this.makeRecordClass();
      _.extend(this, object);
    }
  };


  /* */


  _.extend(SpinalTap.Model.prototype, {
    extend: function(object) {
      _.extend(this.recordClass.prototype, object);
      return this;
    },

    makeRecordClass: function() {
      var model = this;
      var recordClass = function() {
        var args = Array.prototype.slice(arguments);
        SpinalTap.Record.apply(this, [model].concat(args));
      };

      recordClass.prototype = new SpinalTap.Record();
      recordClass.prototype.constructor = recordClass;
      return recordClass;
    },

    all: function(opts) {
      var self = this;

      opts = _.extend({url: this.url}, opts);
      return SpinalTap.Persistence.load(opts).then(function(data) {
        var attributesArray = self.recordClass.prototype.wireToAttributesArray(data);
        return _.map(attributesArray, function(attributes) {
          return new self.recordClass(attributes, {persisted: true});
        });
      });
    },

    first: function(opts) {
      var self = this;

      opts = _.extend({url: this.url}, opts);
      return SpinalTap.Persistence.load(opts).then(function(data) {
        var attributes = self.recordClass.prototype.wireToAttributes(data);
        return new self.recordClass(attributes, {persisted: true});
      });
    },

    find: function(id, opts) {
      return this.first(_.extend({url: this.url + "/" + id}, opts));
    },

    create: function(attributes) {
      var record = new this.recordClass(attributes);
      return record.save();
    }
  });

  /* */

  this.SpinalTap.Record = function(model, attributes, opts) {
    if (!model) return; // we get called with no arguments as part of cloning

    this.model = model;
    this.eventSink = SpinalTap.$(this);
    this.opts = opts === void 0 ? {} : opts;

    this.registerEvents();
    this.eventSink.trigger("initialization");
    this.setAttributes(attributes, {reset: true, persisted: this.opts.persisted});
  };

  _.extend(SpinalTap.Record.prototype, {
    events: {},

    registerEvents: function() {
      _.each(this.events, function(object, eventName) { this.eventSink.on(eventName, object); }, this);
    },

    getID: function() {
      return this.attributes.id;
    },

    getURL: function() {
      return this.isNew() ? this.model.url : this.model.url + "/" + encodeURIComponent(this.getID());
    },

    isNew: function() {
      return !this.getID();
    },

    getChangedAttributes: function() {
      var changed = {}, attribs = this.attributes, persisted = this.persistedAttributes;

      _.each(attribs, function(value, key) { if (value !== persisted[key]) changed[key] = value; });

      return changed;
    },

    getSaveableAttributes: function() {
      return this.getChangedAttributes();
    },

    reload: function(opts) {
      var self = this;
      opts = _.extend({url: this.getURL()}, opts);
      return SpinalTap.Persistence.load(opts).then(function(data) {
        var attributes = self.wireToAttributes(data);
        self.setAttributes(attributes, {persisted: true});
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
      opts = _.extend({
        url:    this.getURL(),
        method: this.isNew() ? "POST" : "PUT",
        data:   this.attributesToWire(this.getSaveableAttributes()),
      }, opts);

      this.eventSink.trigger("beforeSave", opts);

      return SpinalTap.Persistence.save(opts).then(_.bind(this.processSaveResults, this));
    },

    processSaveResults: function(data) {
      var attributes = this.wireToAttributes(data);
      this.setAttributes(attributes, {persisted: true, reset: true});
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
    },

    updateAttributes: function(attributes, opts) {
      this.setAttributes(attributes, opts);
      return this.save();
    },

    /* Converting between attributes hashes and what we send/receive on the wire */

    wireToAttributesArray: function(wireData) {
      return _.map(wireData, this.wireToAttributes, this);
    },

    wireToAttributes: function(wireData) {
      return wireData;
    },

    attributesToWire: function(attributes) {
      return attributes;
    },

    // TODO : destroy
  });
}).call(this);
