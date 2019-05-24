(function(d,w,_RB) {

  var d = d
    , w = w
    , RB = _RB;

  w.RB = _RB;

  RB.logs = [];

  RB.initErrorHandler = function(err) {
    var a = d.createElement("script");  
    a.type="text/javascript"; 
    a.async=!0; 
    f=d.getElementsByTagName("script")[0]; 
    f.parentNode.insertBefore(a,f);
    a.onload = function() {
      RB.bugsnagClient = bugsnag('ea41baf0449e82ae968680854e7690eb');
      if (err) RB.bugsnagClient.notify(err);
    }
    a.src="//d2wy8f7a9ursnm.cloudfront.net/v6/bugsnag.min.js"; 
  }
  
  var wrapError = function(fn) {
    return function() {
      try {
        return fn.apply(null, arguments)
      } catch(e) {
        RB.bugsnagClient ? RB.bugsnagClient.notify(e) : RB.initErrorHandler(e);
      }
    }
  }

  var wrapErrorObj = function(obj) {
    Object.keys(obj).map(function(key) {
      if (typeof(obj[key]) === 'function') {
        obj[key] = wrapError(obj[key]);
      }
    })
  }
  

  Array.prototype.map = Array.prototype.map || function(fn){
    var y = []; var length = this.length; for (var i = 0; i < length; i++) { y.push(fn(this[i],i)); }
    return y
  }

  Object.keys = Object.keys || function(obj) {
    var theKeys = []; for (var name in obj) { theKeys.push(name); }
    return theKeys
  }

  var base64 = {};
  base64.PADCHAR = '=';
  base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  base64.makeDOMException = function() { return "base64.decode issue" }

  base64.decode = function(s) {
    var s = '' + s;
    var getbyte64 = function(s,i) {
      var idx = base64.ALPHA.indexOf(s.charAt(i));
      if (idx === -1) {
          throw base64.makeDOMException();
      }
      return idx;
    };
    var pads, i, b10;

    if (s.length % 4 !== 0) {
      s = s + Array((4 - (s.length % 4)) + 1).join("=")
    }

    var imax = s.length
    if (imax === 0) {
      return s;
    }

    if (imax % 4 !== 0) {
      throw base64.makeDOMException();
    }

    pads = 0
    if (s.charAt(imax - 1) === base64.PADCHAR) {
      pads = 1;
      if (s.charAt(imax - 2) === base64.PADCHAR) {
          pads = 2;
      }
      // either way, we want to ignore this last block
      imax -= 4;
    }

    var x = [];
    for (i = 0; i < imax; i += 4) {
      b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
          (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
      x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
    }

    switch (pads) {
    case 1:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
        break;
    case 2:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
        x.push(String.fromCharCode(b10 >> 16));
        break;
    }
    return x.join('');
  }

  var atob = atob || base64.decode;


  var init = function() {
    var sources = atob(RB.source).split("|")
      , baseUrl = "https://getrockerbox.com/rb?"
      , anURL = "https://secure.adnxs.com/px?"
      , source = sources[0]
      , encReferrer = encodeURIComponent(w.location.href)
      , processSource = function(x) {
          var s = x.split(":")
          if (s.length == 1) return { an_seg: s[0] , type: "imp" }
          if (s.length == 2) return { seg: s[0] , id: s[1] , type: "conv" }
        }
      , mappings = {}
      , _ = "view|purchase|signup|login".split("|").map(function(type,i) {
          mappings[type] = processSource(sources[i+1])
        })
      , extend = function(base,ext) {
          Object.keys(ext).map(function(k){ base[k] = ext[k] })
        }
      , HTTPBuildQuery = function(values, arg_separator) {
          var key, use_val, use_key
            , tmp_arr = []
            , arg_separator = arg_separator || "&";

          Object.keys(JSON.parse(JSON.stringify(values))).map(function(key) {
            var val = values[key];
            if (val !== "" && val !== null) {
              use_val = encodeURIComponent(val.toString());
              use_key = encodeURIComponent(key);
              tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
            }
          });

          return tmp_arr.join(arg_separator);
        }
      , fire = function(href) {
          var ping = new Image();
          ping.src = href;
        }
      , trackConv = function(v) {
          var obj = { t: 2 };
          ["id","seg","order_id","value"].map(function(k){
            if (v[k]) obj[k] = v[k]
          });

          var valuesString = HTTPBuildQuery(obj)
            , url = anURL + valuesString;

          fire(url);
        }

      function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      RB.getSession = function() {
        try {
          if (!w.sessionStorage) return {};
          var sessionId = sessionStorage.getItem("RB.sessionId");
          if (!sessionId) {
            sessionId = uuidv4();
            sessionStorage.setItem("RB.sessionId", sessionId);
          }
          return {"sessionId": sessionId}
        } catch(e) {
          return {}
        }
      }
      var VERSION = {"script_version":"xyz.js"}
        , COOKIE_KEY = "rbuid"
        , setUID = {
            local: function(uid) {
              try {
                if (!!w.localStorage) localStorage.setItem("RB.uid", uid);
              } catch(e) { console.log("could not access localStorage")}
            }
          , session: function(uid) {
              try {
                if (!!w.sessionStorage) sessionStorage.setItem("RB.uid", uid);
              } catch(e) { console.log("could not access sessionStorage")}
            }
          , cookie: function(uid) {
              var cookieStr = COOKIE_KEY + "=" + uid + ";"
              var d = new Date();
              d.setTime(d.getTime() + (30*24*60*60*1000));
              var expires = "expires="+ d.toUTCString();
              document.cookie = cookieStr + expires + ";path=/";
            }
          , all: function(uid) {
              if (uid) {
                setUID.local(uid);
                setUID.session(uid);
                setUID.cookie(uid);
              }
              return uid;
            }
        }
        , getUID = {
            local: function() {
              try {
                if (!w.localStorage) return false;
                var uid = localStorage.getItem("RB.uid");
                if (uid) return uid;
              } catch(e) { console.log("could not access localStorage")}
              return false
            }
          , session: function() {
              try {
                if (!w.sessionStorage) return false;
                var uid = sessionStorage.getItem("RB.uid");
                if (uid) return uid;
              } catch(e) { console.log("could not access sessionStorage")}
              return false
            }
          , cookie: function() {
              var index = document.cookie.indexOf(COOKIE_KEY);
              if (index == -1) return false;
              return document.cookie.slice(index + COOKIE_KEY.length + 1).split(";")[0]
            }
          , jsonP: function() {
              var jsonP = document.createElement('script');
              jsonP.src = "https://getrockerbox.com/jpuid?jsonp=RB.jsonPUID";
              var firstScript = document.getElementsByTagName('script')[0];
              var target = firstScript && firstScript.parentNode || document.head;
              target.appendChild(jsonP);
            }
          , addCallback: function(cb) {
              RB.cbQueue.push(cb)
            }
          , runCallbacks: function() {
              var uid = setUID.all(getUID.local() || getUID.cookie() || getUID.session());
              if (!uid) return false;
              RB.cbQueue.map(function(cb) { return cb({"uid": uid}) });
              RB.cbQueue = [];
              return true;
            }
          , all: function(cb) {
              if (cb) getUID.addCallback(cb);
              if (getUID.runCallbacks()) return;
              getUID.jsonP();
            }
        };

      RB.cbQueue = [];
      RB.jsonPUID = function(msg) {
        setUID.all(msg.rbuid)
        getUID.all()
      }

      var Integrations = {
          integrations: {
              "Invoca": {
                  key: "invoca_id"
                , getId: function() {
                    var session = w.Invoca._Cache.get().session;
                    if (session) return { "invoca_id" : session.invoca_id };
                    return false
                  }
                , fn: function() {
                    if (!w.Invoca.PNAPI) return;

                    if (window.Invoca._Cache.ready) {
                      var obj = Integrations.integrations.Invoca.getId();
                      if (obj && obj.invoca_id) return Integrations.set(obj, true);
                      return;
                    }
                    var cb = w.Invoca.PNAPI.currentPageSettings.onComplete
                    w.Invoca.PNAPI.currentPageSettings.onComplete = (function(cb) {
                      return function(msg) {
                        var obj = Integrations.integrations.Invoca.getId();
                        if (obj) Integrations.set(obj, true);
                        if (cb) cb(msg);
                      }
                    })(cb);
                  }
              }
            , "branch": {
                  key: "branch_id"
                , getId: function() {
                    var branchObj = JSON.parse(branch.c.get("branch_session_first") || branch.c.get("branch_session") || "{}")
                      , branch_id = branchObj['identity_id']
                      , branch_browser_id = branchObj['browser_fingerprint_id'];
                    if (branch_id) return { "branch_id": branch_id, "branch_browser_id": branch_browser_id }
                    return false
                  }
                , fn: function() {
                    if (!w.branch.c || !w.branch.c.get) return;
                    if (!!w.branch.c) {
                      var obj = Integrations.integrations.branch.getId()
                      if (obj && obj.branch_id) return Integrations.set(obj, true);
                    }

                    branch.addListener(function(event) {
                      if (Integrations.ids['branch_id']) return;
                      var obj = Integrations.integrations.branch.getId();
                      if (obj && obj.branch_id) return Integrations.set(obj, true);
                    });
                  }
              }
          }
        , check: function(k) {
            if(!!w[k]) {
              if (Integrations.detected.indexOf(k) == -1) Integrations.detected.push(k);
              RB.logs.push(k);
              return !Integrations.ids[Integrations.integrations[k]['key']];
            }
            return false
          }
        , detected: []
        , detect: function() {
            var integrations = Integrations.integrations;
            Object.keys(integrations).map(function(key) {

              if (Integrations.check(key)) integrations[key]['fn']();
            });
          }
        , supportedIds: ["segment_anonymous_id", "invoca_id", "branch_id", "branch_browser_id"]
        , ids: {}
        , set: function(obj, identify) {
            Integrations.supportedIds.map(function(k) {
              if (obj[k]) Integrations.ids[k] = obj[k];
            });
            if (identify) RB.track("identify");
          }
      }



      var SPA = {
          previousLocation: document.referrer
        , currentLocation: document.location.href
        , updateSPA: function() {
            if (SPA.currentLocation != document.location.href) {
              SPA.previousLocation = SPA.currentLocation;
              SPA.currentLocation = document.location.href;
            }
          }
      }

      var T = {
          getWithDefault: function(obj, key, _default) { 
            return obj[key] || _default 
          }
        , stringifyNestedObject: function(obj) {
            var p = {};
            Object.keys(JSON.parse(JSON.stringify(obj))).map(function(k) {
              var val = obj[k];
              if (val !== "") p[k] = typeof(val) == "object" ? JSON.stringify(val) : val;
              return p;
            })
            return p;
          }
      }

      Integrations.detect()
      setTimeout(Integrations.detect,2000)

      RB.track = function(action, values) {

        SPA.updateSPA();
        Integrations.detect();

        var values = values || {}
          , session = RB.getSession()
          , caller = T.getWithDefault(RB.track, "caller",{})
          , _args = T.getWithDefault(caller, "arguments", [])
          , args = T.getWithDefault(_args, 0, {})
          , callerObj = T.getWithDefault(args, "obj", {})
          , properties  = T.getWithDefault(callerObj, "properties", {})
          , traits = T.getWithDefault(callerObj, "traits", {})
          , v = {
              pageReferrer: SPA.previousLocation
            , action: action
            , source : source
            , rb_source : source
            , segment_anonymous_id: callerObj.anonymousId
            , segmentmessageId: callerObj.messageId
            , segmentUserId: callerObj.userId
          }
          , obj = mappings[action] || {};

        if (action == "identify") extend(v,Integrations.ids);
        extend(v,VERSION);
        extend(v,session);
        extend(v,obj);
        extend(v,values);
        extend(v,properties);
        extend(v,traits);
        v = T.stringifyNestedObject(v);
        Integrations.set(v);

        getUID.all(function(uid) {
          extend(v,uid);
          var valuesString = HTTPBuildQuery(v)
            , url = baseUrl + valuesString;

          fire(url);
          if (v.type == "conv") trackConv(v);
        })

      }

    if (!RB.disablePushState) RB.track("view");
    RB.queue.map(function(args){ RB.track(args[0],args[1]) });
    RB.queue = [];
    RB.loaded = true;

    wrapErrorObj(getUID);
    wrapErrorObj(setUID);
    wrapErrorObj(T);
    wrapErrorObj(Integrations);

  }

  wrapError(init)()

})(document,window,window.RB || {})
