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
      var self = this;

      opts = _.extend(this.defaultLoadOpts(), opts);

      return SpinalTap.Persistence.load(opts).then(function(data) {
        var attributesArray = self.recordClass.prototype.wireToAttributesArray(data);
        return _.map(attributesArray, function(attributes) {
          return self.newRecord(attributes, {persisted: true});
        });
      });
    },

    first: function(opts) {
      var self = this;

      opts = _.extend(this.defaultLoadOpts(), opts);

      return SpinalTap.Persistence.load(opts).then(function(data) {
        var attributes = self.recordClass.prototype.wireToAttributes(data);
        return self.newRecord(attributes, {persisted: true});
      });
    },

    find: function(id, opts) {
      return this.first(_.extend({url: this.url + "/" + id}, opts));
    },

    newRecord: function(attributes, opts) {
      return new this.recordClass(attributes, opts);
    },

    create: function(attributes, opts) {
      return this.newRecord(attributes, opts).save();
    },

    defaultLoadOpts: function() {
      return {url: this.url};
    },
  });
}).call(this);
