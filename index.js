const EXPRESS = require("express");
const FS = require("fs");
const QS = require("querystring");
const PATH = require("path");
const REQUEST = require("request");

// create app
const APP = EXPRESS();
const PORT = 3000;

// OpenWeather API key is needed https://openweathermap.org/api
const API_KEY = "{API_KEY}";

function ktoc(k) {
  return Math.round(k - 273.15, 0);
}

APP.use(EXPRESS.static(PATH.join(__dirname, "public"))); // Set Up public

APP.get("/", function (req, res) {
  res.writeHead(200, { "content-type": "text/html" });
  FS.createReadStream("views/index.html").pipe(res);
});

APP.post("/results", function (req, res) {
  if (req.method === "POST") {
    var body = "";

    req.on("data", function (data) {
      body += data;

      if (body.length > 1e6) req.destroy();
    });

    req.on("end", function () {
      const POST = QS.parse(body);

      const LOCATION = POST.townCity.toLocaleLowerCase();

      const URL = `https://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&appid=${API_KEY}`;
      try {
        REQUEST(URL, function (error, response, body) {
          const WEATHER_DETAILS = JSON.parse(body);

          const WEATHER = WEATHER_DETAILS["weather"];
          const WEATHER_MAIN = WEATHER[0]["main"];
          const WEATHER_DESC = WEATHER[0]["description"];
          const WEATHER_ICON = WEATHER[0]["icon"];

          const IMG_LINK = `http://openweathermap.org/img/wn/${WEATHER_ICON}@2x.png`;

          const TEMP = ktoc(parseFloat(WEATHER_DETAILS["main"]["temp"]));

          // Loads html
          var content = FS.readFileSync("views/results.html").toString();

          // Adds the dynamic content
          content = content.replace(/{{ LOCATION }}/g, LOCATION);
          content = content.replace("{{ WEATHER_MAIN }}", WEATHER_MAIN);
          content = content.replace("{{ WEATHER_DESC }}", WEATHER_DESC);
          content = content.replace("{{ IMG_LINK }}", IMG_LINK);
          content = content.replace("{{ TEMP }}", TEMP);
          res.writeHead(200, { "content-type": "text/html" });

          // Serves content
          res.end(content);
        });
      } catch (error) {
        // Loads html
        var content = FS.readFileSync("views/results.html").toString();

        // Adds the dynamic content
        content = content.replace(/{{ LOCATION }}/g, "");
        content = content.replace(
          "{{ WEATHER_MAIN }}",
          `Unable to find details for ${LOCATION}`
        );
        content = content.replace("{{ WEATHER_DESC }}", "");
        content = content.replace("{{ IMG_LINK }}", "");
        content = content.replace("{{ TEMP }}", "");
        res.writeHead(200, { "content-type": "text/html" });

        // Serves content
        res.end(content);
      }
    });
  }
});

APP.listen(PORT, function () {
  console.log(`App running on port ${PORT}`);
});
