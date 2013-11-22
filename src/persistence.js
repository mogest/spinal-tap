(function() {
  this.SpinalTap.Persistence = {
    // load

    load: function(model_or_record, opts) {
      opts = _.extend(this.defaultLoadOptions(model_or_record), opts);
      return SpinalTap.$.ajax(opts);
    },

    defaultLoadOptions: function(model_or_record) {
      return {
        url:      model_or_record.getURL ? model_or_record.getURL() : model_or_record.url, 
        dataType: "json"
      };
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
