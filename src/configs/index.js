const { REACT_APP_DOMAIN_SERVER, REACT_APP_APP_DOMAIN_NAME } = process.env;
const doamin_server =
  process.env.NODE_ENV === "production"
    ? REACT_APP_DOMAIN_SERVER
    : "http://192.168.1.117:3000";
const react_app_domain =
  process.env.NODE_ENV === "production"
    ? REACT_APP_APP_DOMAIN_NAME
    : "http://localhost:4000";
console.log("🚀 ~ file: index.js:2 ~ doamin_server:", doamin_server);
const configs = {
  WS_BASE_URL: doamin_server + "/api/",
  DOMAIN_SERVER: doamin_server,
  APP_DOMAIN_NAME: react_app_domain,
  DEMO: true,
};

export default configs;
