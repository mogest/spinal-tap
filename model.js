SpinalTap = {
  $: jQuery,
  extend: function(object) {
    _.each(object, function(value, key) { this.prototype[key] = value; }, this);
  }
};

SpinalTap.Persistence = {
  load: function(opts) {
    opts = _.extend({dataType: "json"}, opts);
    return SpinalTap.$.ajax(opts);
  },

  save: function(opts) {
    opts = _.extend({dataType: "json"}, opts);
    return SpinalTap.$.ajax(opts);
  }
};

SpinalTap.Model = function(url) {
  this.url = url;
  this.recordClass = this.makeRecordClass();
};

SpinalTap.Model.prototype.makeRecordClass = function() {
  var model = this;
  var recordClass = function() {
    var args = Array.prototype.slice(arguments);
    SpinalTap.Record.apply(this, [model].concat(args));
  };

  recordClass.extend = SpinalTap.extend;
  recordClass.prototype = new SpinalTap.Record();
  recordClass.prototype.constructor = recordClass;
  return recordClass;
};

SpinalTap.Model.prototype.all = function(opts) {
  var self = this;

  opts = _.extend({url: this.url}, opts);
  return SpinalTap.Persistence.load(opts).then(function(data) {
    var attributesArray = self.recordClass.prototype.wireToAttributesArray(data);
    return _.map(attributesArray, function(attributes) {
      return new self.recordClass(attributes, {persisted: true});
    });
  });
};

SpinalTap.Model.prototype.first = function(opts) {
  var self = this;

  opts = _.extend({url: this.url}, opts);
  console.log('first', opts);
  return SpinalTap.Persistence.load(opts).then(function(data) {
    var attributes = self.recordClass.prototype.wireToAttributes(data);
    return new self.recordClass(attributes, {persisted: true});
  });
};

SpinalTap.Model.prototype.find = function(id, opts) {
  return this.first(_.extend({url: this.url + "/" + id}, opts));
};

SpinalTap.Model.prototype.create = function(attributes) {
  var record = new this.recordClass(attributes);
  return record.save();
};

/* */

SpinalTap.Record = function(model, attributes, opts) {
  console.log("new", model, attributes, opts);
  this.model = model;
  this.attributes = attributes === void 0 ? {} : attributes;
  this.opts = opts === void 0 ? {} : opts;
  this.persistedAttributes = this.opts.persisted ? _.extend({}, this.attributes) : {};
  this.initialize(); // TODO : fire initialize event instead?
};

SpinalTap.Record.prototype.getID = function() {
  return this.attributes.id;
};

SpinalTap.Record.prototype.getURL = function() {
  return this.getID() ? this.model.url + "/" + encodeURIComponent(this.getID()) : this.model.url;
};

SpinalTap.Record.prototype.isNewRecord = function() {
  return !this.getID();
};

SpinalTap.Record.prototype.getChangedAttributes = function() {
  var changed = {}, attribs = this.attributes, persisted = this.persistedAttributes;

  _.each(attribs, function(value, key) { if (value !== persisted[key]) changed[key] = value; });

  return changed;
};

SpinalTap.Record.prototype.getSaveableAttributes = function() {
  return this.getChangedAttributes();
};

SpinalTap.Record.prototype.initialize = function() { };

SpinalTap.Record.prototype.reload = function(opts) {
  var self = this;
  opts = _.extend({url: this.getURL()}, opts);
  return SpinalTap.Persistence.load(opts).then(function(data) {
    var attributes = self.wireToAttributes(data);
    self.setAttributes(attributes, {persisted: true});
  });
};

SpinalTap.Record.prototype.save = function(opts) {
  var self = this;

  opts = _.extend({
    url:    this.getURL(),
    method: this.isNewRecord() ? "POST" : "PUT",
    data:   this.attributesToWire(this.getSaveableAttributes()),
  }, opts);

  console.log(".save", opts);

  return SpinalTap.Persistence.save(opts).then(function(data) {
    self.processSaveResults(data);
    return self;
  });
};

SpinalTap.Record.prototype.processSaveResults = function(data) {
  console.log("save returned", data);
  var attributes = this.wireToAttributes(data);
  this.setAttributes(attributes, {persisted: true, reset: true});
}

SpinalTap.Record.prototype.setAttributes = function(attributes, opts) {
  if (opts && opts.reset) {
    this.attributes = {};
    this.persistedAttributes = {};
  }
  _.extend(this.attributes, attributes);
  if (opts && opts.persisted) {
    _.extend(this.persistedAttributes, attributes);
  }
};

SpinalTap.Record.prototype.updateAttributes = function(attributes, opts) {
  this.setAttributes(attributes, opts);
  return this.save();
};

/*
 * Converting between attributes hashes and what we send/receive on the wire
 *
 */

SpinalTap.Record.prototype.wireToAttributesArray = function(wireData) {
  var self = this;
  return _.map(wireData, function(object) { return self.wireToAttributes(object); });
};

SpinalTap.Record.prototype.wireToAttributes = function(wireData) {
  return wireData;
};

SpinalTap.Record.prototype.attributesToWire = function(attributes) {
  return attributes;
};

// TODO : destroy, validations, events
