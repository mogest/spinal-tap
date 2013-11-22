describe("SpinalTap.Persistence", function() {
  describe("load", function() {
    it("extends the provided options with defaultLoadOptions and passes them to $.ajax", function() {
      spyOn(SpinalTap.Persistence, 'defaultLoadOptions').andReturn({base: "opts"});
      spyOn(SpinalTap.$, 'ajax').andReturn("ajaxed");

      var result = SpinalTap.Persistence.load("record", {more: "opts"});
      expect(result).toEqual("ajaxed");
      expect(SpinalTap.Persistence.defaultLoadOptions).toHaveBeenCalledWith("record");
      expect(SpinalTap.$.ajax).toHaveBeenCalledWith({base: "opts", more: "opts"});
    });
  });

  describe("defaultLoadOptions", function() {
    it("gets the url of a model", function() {
      var model = new SpinalTap.Model({url: "dummy://url"});
      
      var result = SpinalTap.Persistence.defaultLoadOptions(model);
      expect(result).toEqual({url: "dummy://url", dataType: "json"});
    });

    it("gets the url of a record", function() {
      var record = new SpinalTap.Model({url: "dummy://url"}).newRecord({id: 123});
      
      var result = SpinalTap.Persistence.defaultLoadOptions(record);
      expect(result).toEqual({url: "dummy://url/123", dataType: "json"});
    });
  });
  
  describe("save", function() {
    beforeEach(function() {
      record = new SpinalTap.Model({url: "dummy://url"}).newRecord({id: 123}); 
    });

    it("extends the provided options with defaultSaveOptions and passes them to $.ajax", function() {
      spyOn(SpinalTap.Persistence, 'defaultSaveOptions').andReturn({base: "opts"});
      spyOn(SpinalTap.$, 'ajax').andReturn("ajaxed");

      var result = SpinalTap.Persistence.save(record, {more: "opts"});
      expect(result).toEqual("ajaxed");
      expect(SpinalTap.Persistence.defaultSaveOptions).toHaveBeenCalledWith(record);
      expect(SpinalTap.$.ajax).toHaveBeenCalledWith({base: "opts", more: "opts"});
    });

    it("triggers a beforeSave event", function() {
      spyOn(SpinalTap.$, 'ajax');

      var triggered;
      record.registerEvents({beforeSave: function() { triggered = true; }});

      var result = SpinalTap.Persistence.save(record, {more: "opts"});
      expect(triggered).toEqual(true);
    });
  });

  describe("defaultSaveOptions", function() {
    var record;
      
    beforeEach(function() {
      record = new SpinalTap.Model({url: "dummy://url"}).newRecord({id: 123}); 
    });

    it("uses POST for a new record", function() {
      record.a.id = null;
      var result = SpinalTap.Persistence.defaultSaveOptions(record);
      expect(result.url).toEqual("dummy://url");
      expect(result.method).toEqual("POST");
    });

    it("uses PUT for an existing record", function() {
      var result = SpinalTap.Persistence.defaultSaveOptions(record);
      expect(result.url).toEqual("dummy://url/123");
      expect(result.method).toEqual("PUT");
    });

    it("gets the saveable attributes and runs them through attributesToWire", function() {
      spyOn(record, "getSaveableAttributes").andReturn("gsa");
      spyOn(record, "attributesToWire").andReturn("wired");

      var result = SpinalTap.Persistence.defaultSaveOptions(record);
      expect(result.data).toEqual("wired");
      expect(record.attributesToWire).toHaveBeenCalledWith("gsa");
    });

    it("sets dataType to json", function() {
      var result = SpinalTap.Persistence.defaultSaveOptions(record);
      expect(result.dataType).toEqual("json");
    });
  });
});
