(function() {
  this.SpinalTap.Model = function(object) {
    this.recordClass = this.makeRecordClass();
    _.extend(this, object);
  }

  _.extend(SpinalTap.Model.prototype, {
    extend: function(object) {
      _.extend(this.recordClass.prototype, object);
      return this;
    },

    makeRecordClass: function() {
      var model = this;
      var recordClass = function() {
        var args = Array.prototype.slice.call(arguments);
        SpinalTap.Record.apply(this, [model].concat(args));
      };

      recordClass.prototype = new SpinalTap.Record();
      recordClass.prototype.constructor = recordClass;
      return recordClass;
    },

    all: function(opts) {
      return SpinalTap.Persistence.load(opts).then(_.bind(this.processLoadArrayResults, this, opts));
    },

    one: function(opts) {
      return SpinalTap.Persistence.load(opts).then(_.bind(this.processLoadRecordResults, this, opts));
    },

    find: function(id, opts) {
      return this.one(_.extend({url: this.url + "/" + id}, opts));
    },

    processLoadArrayResults: function(opts, data) {
      var attributesArray = (opts && opts.resultProcessor || this.wireToAttributesArray)(data);

      return _.map(attributesArray, 
                   function(attributes) { return this.newRecord(attributes, {persisted: true}); },
                   this);
    },

    processLoadRecordResults: function(opts, data) {
      var attributes = (opts && opts.resultProcessor || this.wireToAttributes)(data);
      return this.newRecord(attributes, {persisted: true});
    },

    newRecord: function(attributes, opts) {
      return new this.recordClass(attributes, opts);
    },

    create: function(attributes, opts) {
      return this.newRecord(attributes, opts).save();
    },

    wireToAttributesArray: function(wireData) {
      return wireData;
    },

    wireToAttributes: function(wireData) {
      return wireData;
    },
  });
}).call(this);
