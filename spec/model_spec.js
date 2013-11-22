describe("SpinalTap.Model", function() {
  var model;

  beforeEach(function() {
    model = new SpinalTap.Model({url: "dummy://url"});
  });

  describe("constructor", function() {
    it("makes a new record class and sets recordClass", function() {
      expect(typeof model.recordClass).toEqual("function");
      expect(model.recordClass.prototype.save).not.toBeUndefined();
    });

    it("extends itself with the opts argument", function() {
      model = new SpinalTap.Model({test: "parameter"});
      expect(model.test).toEqual("parameter");
    });
  });

  describe("makeRecordClass", function() {
    it("creates a new 'class' inheriting from SpinalTap.Record", function() {
      spyOn(SpinalTap, 'Record');

      var rc = model.makeRecordClass();
      expect(SpinalTap.Record).toHaveBeenCalledWith();

      var record = new rc(1, 2);
      expect(SpinalTap.Record).toHaveBeenCalledWith(model, 1, 2);
    });
  });

  describe("all", function() {
    it("uses the persistence loader and passes the results to processLoadArrayResults", function() {
      spyOn(SpinalTap.Persistence, "load").andReturn(jQuery.Deferred().resolve([{some: "data"}]));

      var latch;

      runs(function() {
        model.all({some: "args"}).done(function(result) {
          latch = true;
          expect(SpinalTap.Persistence.load).toHaveBeenCalledWith({some: "args"});
          expect(result.length).toEqual(1);
          expect(result[0].attributes).toEqual({some: "data"});
        });
      });

      waitsFor(function() { return latch; }, "timed out", 500);
    });

    it("uses the result processor, if one is specified", function() {
      var resolver = jQuery.Deferred().resolve({records: [{some: "data"}]});
      spyOn(SpinalTap.Persistence, "load").andReturn(resolver);

      var latch;

      runs(function() {
        var result = model.all({some: "args", resultProcessor: function(x) { return x.records; }});
        result.done(function(result) {
          latch = true;
          expect(result.length).toEqual(1);
          expect(result[0].attributes).toEqual({some: "data"});
        });
      });

      waitsFor(function() { return latch; }, "timed out", 500);
    });
  });

  describe("one", function() {
    it("uses the persistence loader and passes the results to processLoadRecordResults", function() {
      spyOn(SpinalTap.Persistence, "load").andReturn(jQuery.Deferred().resolve({some: "data"}));

      var latch;

      runs(function() {
        model.one({some: "args"}).done(function(result) {
          latch = true;
          expect(SpinalTap.Persistence.load).toHaveBeenCalledWith({some: "args"});
          expect(result.attributes).toEqual({some: "data"});
        });
      });

      waitsFor(function() { return latch; }, "timed out", 500);
    });

    it("uses the result processor, if one is specified", function() {
      spyOn(SpinalTap.Persistence, "load").andReturn(jQuery.Deferred().resolve({record: {some: "data"}}));

      var latch;

      runs(function() {
        var result = model.one({some: "args", resultProcessor: function(x) { return x.record; }});
        result.done(function(result) {
          latch = true;
          expect(result.attributes).toEqual({some: "data"});
        });
      });

      waitsFor(function() { return latch; }, "timed out", 500);
    });
  });

  describe("find", function() {
    it("calls one with a URL option", function() {
      spyOn(model, "one").andReturn("OK");

      var result = model.find(50, {hello: "world"});
      expect(result).toEqual("OK");
      expect(model.one).toHaveBeenCalledWith({url: "dummy://url/50", hello: "world"});
    });
  });

  describe("processLoadArrayResults", function() {
    it("calls wireToAttributesArray and then makes a new record for each member of the array", function() {
      spyOn(model, "wireToAttributesArray").andCallFake(function(data) {
        return data.namespace;
      });

      var result = model.processLoadArrayResults({}, {namespace: [{test: "data"}, {hello: "world"}]});

      expect(result.length).toEqual(2);
      expect(result[0].attributes).toEqual({test: "data"});
      expect(result[1].attributes).toEqual({hello: "world"});
    });
  });

  describe("processLoadRecordResults", function() {
    it("calls wireToAttributes and then make a new record with the data", function() {
      spyOn(model, "wireToAttributes").andCallFake(function(data) {
        return data.namespace;
      });

      var result = model.processLoadRecordResults({}, {namespace: {test: "data"}});
      expect(result.attributes).toEqual({test: "data"});
    });
  });

  describe("newRecord", function() {
    it("makes a new record object", function() {
      var record = model.newRecord({test: "data"});
      expect(record.attributes).toEqual({test: "data"});
      expect(record.persistedAttributes).toEqual({});
    });

    it("passes opts to the record constructor", function() {
      var record = model.newRecord({test: "data"}, {persisted: true});
      expect(record.attributes).toEqual({test: "data"});
      expect(record.persistedAttributes).toEqual(record.attributes);
    });
  });

  describe("create", function() {
    it("makes a new record object and then saves it", function() {
      var record = jasmine.createSpyObj('record', ['save']);
      spyOn(model, 'newRecord').andReturn(record);
      record.save.andReturn("save result");

      var result = model.create({test: "data"}, {some: "option"});
      expect(result).toEqual("save result");
      expect(model.newRecord).toHaveBeenCalledWith({test: "data"}, {some: "option"});
    });
  });

  describe("wireToAttributesArray", function() {
    it("returns what's passed to it", function() {
      expect(model.wireToAttributesArray("test")).toEqual("test");
    });
  });

  describe("wireToAttributes", function() {
    it("returns what's passed to it", function() {
      expect(model.wireToAttributes("test")).toEqual("test");
    });
  });
});
