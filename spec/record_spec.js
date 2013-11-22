describe("SpinalTap.Record", function() {
  var model;

  beforeEach(function() {
    model = new SpinalTap.Model({url: "dummy://url"});
  });

  describe("constructor", function() {
    var afterInitialized;

    beforeEach(function() {
      afterInitialized = null;
      model.extend({
        events: {afterInitialize: function(e) { afterInitialized = e; }}
      });
    });

    it("links the new record to the model", function() {
      var record = model.newRecord();
      expect(record.model).toEqual(model);
    });
    
    it("sets the attributes passed to the constructor", function() {
      var record = model.newRecord({hello: "there", this_is: "spinal tap"});
      expect(record.attributes).toEqual({hello: "there", this_is: "spinal tap"});
      expect(record.persistedAttributes).toEqual({});
    });

    it("sets the attributes as persisted when the persisted option is true", function() {
      var record = model.newRecord({hello: "there", this_is: "spinal tap"}, {persisted: true});
      expect(record.attributes).toEqual({hello: "there", this_is: "spinal tap"});
      expect(record.persistedAttributes).toEqual(record.attributes);
    });

    it("fires the initializer event", function() {
      var record = model.newRecord();
      expect(afterInitialized).toBeTruthy();
      expect(afterInitialized.target).toEqual(record);
    });
  });

  describe("getID", function() {
    it("gets the ID from the attributes object", function() {
      expect(model.newRecord({id: 123, data: "excellent"}).getID()).toEqual(123);
    });
  });

  describe("getURL", function() {
    it("uses the model's URL for new records", function() {
      expect(model.newRecord({data: "excellent"}).getURL()).toEqual("dummy://url");
    });

    it("uses the model's URL with the ID appended for non-new records", function() {
      expect(model.newRecord({id: 123, data: "excellent"}).getURL()).toEqual("dummy://url/123");
    });
  });

  describe("isNew", function() {
    it("returns true if there is no ID set", function() {
      expect(model.newRecord({data: "excellent"}).isNew()).toEqual(true);
    });

    it("returns false if there is an ID set", function() {
      expect(model.newRecord({id: 123, data: "excellent"}).isNew()).toEqual(false);
    });
  });

  describe("getChangedAttributes", function() {
    it("returns the attributes that are different from those stored in persistedAttributes", function() {
      var record = model.newRecord({name: "Joe Bloggs", age: 34, city: "Wellington", preference: "yellow"}, {persisted: true});
      record.setAttributes({age: 35, city: "Wellington", preference: "blue", dessert: "custard"});

      expect(record.getChangedAttributes()).toEqual({age: 35, preference: "blue", dessert: "custard"});
    });
  });

  describe("getSaveableAttributes", function() {
    it("returns the changed attributes", function() {
      var record = model.newRecord();
      spyOn(record, "getChangedAttributes").andReturn("I am the changed attributes");
      expect(record.getSaveableAttributes()).toEqual("I am the changed attributes");
    });
  });

  describe("reload", function() {
    it("sets a default URL, and passes that and the other opts to the persistence layer", function() {
      var record = model.newRecord({id: 123});
      spyOn(SpinalTap.Persistence, "load").andReturn(jQuery.Deferred());

      record.reload({more: "options"});
      expect(SpinalTap.Persistence.load).toHaveBeenCalledWith({url: "dummy://url/123", more: "options"});
    });

    it("calls wireToAttributes on the returned data and sets it using setAttributes", function() {
      var record = model.newRecord({id: 123, something: "else"});
      spyOn(SpinalTap.Persistence, "load").andReturn(jQuery.Deferred().resolve({id: 123, data: "new data"}));
      spyOn(record, "wireToAttributes").andReturn({id: 123, data: "wireToAttributes new data"});

      var latch = false;

      runs(function() {
        record.reload().done(function() {
          latch = true;
          expect(record.attributes).toEqual({id: 123, data: "wireToAttributes new data"});
          expect(record.persistedAttributes).toEqual(record.attributes);
        });
      });

      waitsFor(function() { return latch; }, "expired waiting for done() to execute", 500);
    });
  });

  describe("validate", function() {
    it("calls resolve on the argument passed in", function() {
      var deferred = jasmine.createSpyObj('deferred', ['resolve']);

      model.newRecord().validate(deferred);
      expect(deferred.resolve).toHaveBeenCalled();
    });
  });

  describe("save", function() {
    it("runs the validator and calls saveWithoutValidation on success", function() {
      var record = model.newRecord(), latch = false;

      spyOn(record, "saveWithoutValidation").andReturn(jQuery.Deferred().resolve("successful"));

      runs(function() {
        record.save().done(function(message) {
          latch = true;
          expect(message).toEqual("successful");
        });
      });

      waitsFor(function() { return latch; }, "expired waiting for done() to execute", 500);
    });

    it("runs the validator and fails on failure", function() {
      var record = model.newRecord(), latch = false;

      spyOn(record, "validate").andCallFake(function(deferred) { deferred.reject("failure") });

      runs(function() {
        record.save().fail(function(message) {
          latch = true;
          expect(message).toEqual("failure");
        });
      });

      waitsFor(function() { return latch; }, "expired waiting for fail() to execute", 500);
    });
  });

  describe("saveWithoutValidation", function() {
    it("uses the persistence layer to save the record, sending the result to processSaveResults", function() {
      var record = model.newRecord(), latch = false;

      spyOn(SpinalTap.Persistence, "save").andReturn(jQuery.Deferred().resolve({data: "old data"}));
      spyOn(record, 'processSaveResults').andReturn(jQuery.Deferred().resolve("saved"));

      runs(function() {
        record.saveWithoutValidation({some: "opts"}).done(function(message) {
          latch = true;
          expect(message).toEqual("saved");
        });
      });

      waitsFor(function() { return latch; }, "expired waiting for done() to execute", 500);

      runs(function() {
        expect(record.processSaveResults).toHaveBeenCalledWith({data: "old data"});
        expect(SpinalTap.Persistence.save).toHaveBeenCalledWith(record, {some: "opts"});
      });
    });
  });

  describe("processSaveResults", function() {
    it("sets the attributes with the result", function() {
      var record = model.newRecord({old: "old data"});

      spyOn(record, 'wireToAttributes').andReturn({data: "new data"});

      var result = record.processSaveResults({data: "wire data"});

      expect(result).toEqual(record);
      expect(record.wireToAttributes).toHaveBeenCalledWith({data: "wire data"});
      expect(record.attributes).toEqual({data: "new data"});
      expect(record.persistedAttributes).toEqual(record.attributes);
    });

    it("triggers an afterSave event", function() {
      var afterSaveData;
      var record = model.extend({events: {afterSave: function(e, data) { afterSaveData = data; }}}).newRecord({old: "old data"});

      record.processSaveResults({data: "wire data"});
      expect(afterSaveData).toEqual({data: "wire data"});
    });
  });

  describe("setAttributes", function() {
    var record;

    beforeEach(function() {
      record = model.newRecord({name: "Joe Bloggs", age: 23, food: "cheese"}, {persisted: true});
      record.attributes.furniture = "table";
    });

    it("by default adds to existing attributes, and does not mark persisted", function() {
      record.setAttributes({age: 25, animal: "rat"});

      expect(record.attributes).toEqual({name: "Joe Bloggs", age: 25, food: "cheese", furniture: "table", animal: "rat"});
      expect(record.persistedAttributes).toEqual({name: "Joe Bloggs", age: 23, food: "cheese"});
    });

    it("resets the attributes object if told to", function() {
      record.setAttributes({age: 25, animal: "rat"}, {reset: true});

      expect(record.attributes).toEqual({age: 25, animal: "rat"});
      expect(record.persistedAttributes).toEqual({});
    });

    it("marks the new attributes as persisted if told to", function() {
      record.setAttributes({age: 25, animal: "rat"}, {persisted: true});

      expect(record.attributes).toEqual({name: "Joe Bloggs", age: 25, food: "cheese", furniture: "table", animal: "rat"});
      expect(record.persistedAttributes).toEqual({name: "Joe Bloggs", age: 25, food: "cheese", animal: "rat"});
    });
  });

  describe("updateAttributes", function() {
    it("set attributes and saves", function() {
      var record = model.newRecord();

      spyOn(record, "setAttributes").andReturn(record);
      spyOn(record, "save").andReturn("result");

      var result = record.updateAttributes({hello: "there"});

      expect(result).toEqual("result");
      expect(record.setAttributes).toHaveBeenCalledWith({hello: "there"}, undefined);
    });
  });

  describe("wireToAttributesArray", function() {
    it("returns what's passed to it", function() {
      expect(model.newRecord().wireToAttributesArray("test")).toEqual("test");
    });
  });

  describe("wireToAttributes", function() {
    it("returns what's passed to it", function() {
      expect(model.newRecord().wireToAttributes("test")).toEqual("test");
    });
  });

  describe("attributesToWire", function() {
    it("returns what's passed to it", function() {
      expect(model.newRecord().attributesToWire("test")).toEqual("test");
    });
  });

  describe("registerEvents", function() {
    it("registers each event in the events object", function() {
      var record = model.newRecord();

      var testFired, notestFired;
      record.registerEvents({test: function() { testFired = true; }, notest: function() { notestFired = true; }});
      record.eventSink.trigger("test");
      expect(testFired).toEqual(true);
      expect(notestFired).toBeUndefined();
    });
  });
});
