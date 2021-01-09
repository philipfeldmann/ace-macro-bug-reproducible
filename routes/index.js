module.exports = function (app, addon) {
  // Root route. This route will serve the `atlassian-connect.json` unless the
  // documentation url inside `atlassian-connect.json` is set
  app.get("/", function (req, res) {
    res.format({
      // If the request content-type is text-html, it will decide which to serve up
      "text/html": function () {
        res.redirect("/atlassian-connect.json");
      },
      // This logic is here to make sure that the `atlassian-connect.json` is always
      // served up when requested by the host
      "application/json": function () {
        res.redirect("/atlassian-connect.json");
      },
    });
  });

  // Render the macro by returning html generated from the hello-world template.
  // The hello-world template is defined in /views/hello-world.hbs.
  app.get("/macro", addon.authenticate(), function (req, res) {
    res.render("hello-world", {
      title: "Atlassian Connect",
    });
  });

  app.get("/wrapper", addon.authenticate(), function (req, res) {
    // Get the macro variables passed in via the URL
    const pageId = req.query["pageId"],
      pageVersion = req.query["pageVersion"],
      macroId = req.query["macroId"];

    // Get the clientKey and use it to create an HTTP client for the REST API call
    const clientKey = req.context.clientKey;
    const httpClient = addon.httpClient({
      clientKey: clientKey,
    });

    // Call the REST API: Get macro body by macro ID
    httpClient.get(
      "/rest/api/content/" + pageId + "/history/" + pageVersion + "/macro/id/" + macroId,
      function (err, response, contents) {
        if (err || response.statusCode < 200 || response.statusCode > 299) {
          res.render("wrapper", {
            body: "Oopsi, no bueno",
          });
        }

        const parsed = JSON.parse(contents);

        httpClient.post(
          {
            url: "/rest/api/contentbody/convert/view",
            headers: {
              "X-Atlassian-Token": "nocheck",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              value: parsed.body,
              representation: "storage",
            }),
          },
          function (err, response, body) {
            if (err) {
              return "NO BUENO";
            }
            const converted = JSON.parse(body);

            return res.render("wrapper", {
              body: converted.value,
            });
          }
        );
      }
    );
  });

  // Add any additional route handlers you need for views or REST resources here...

  // load any additional files you have in routes and apply those to the app
  {
    var fs = require("fs");
    var path = require("path");
    var files = fs.readdirSync("routes");
    for (var index in files) {
      var file = files[index];
      if (file === "index.js") continue;
      // skip non-javascript files
      if (path.extname(file) != ".js") continue;

      var routes = require("./" + path.basename(file));

      if (typeof routes === "function") {
        routes(app, addon);
      }
    }
  }
};
