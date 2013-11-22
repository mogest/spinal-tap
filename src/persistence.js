(function() {
  this.SpinalTap.Persistence = {
    // load

    load: function(opts) {
      opts = _.extend({dataType: "json"}, opts);
      return SpinalTap.$.ajax(opts);
    },

    // save

    save: function(record, opts) {
      opts = _.extend(this.defaultSaveOptions(record), opts);
      record.eventSink.trigger("beforeSave", opts);
      return SpinalTap.$.ajax(opts);
    },

    defaultSaveOptions: function(record) {
      return {
        url:      record.getURL(),
        method:   record.isNew() ? "POST" : "PUT",
        data:     record.attributesToWire(record.getSaveableAttributes()),
        dataType: "json"
      };
    },
  };
}).call(this);
