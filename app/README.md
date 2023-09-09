# dns-frontend

## Project setup
Install Node.js

Command-Line
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### To build and deploy with the back-end code
```
npm run build
```

The built files will be placed in the parallel back-end project at DnsForItLearningLabs/c.

If your changes to the Vue project result in new files being added to the deployment project you must add them to the deployment package:

1. In Visual Studio, load the DnsForItLearningLabs solution.
2. In the **Solution Explorer** pane, find the newly added files under the `/c` directory.
3. Click on one of the new files.
4. In the **Properties** pane, set `Copy to Output Directory` to `Copy if newer`.
5. Repeat steps 3 and 4 for all other newly added files.
6. Use Visual Studio to build and publish according to the instructions in the README for that repo.

### Configuration and Environment

The only setting in the environment is the URL of the back-end server. It's not a secret so the settings are included in the GitHub repo. The URL is different in development and production. See [the vue documentation for modes and environment variables](https://cli.vuejs.org/guide/mode-and-env.html) for better understanding.

Short summary:
* Vue always loads .env
* Vue loads `.env.development` when when you use "npm run serve"
* Vue loads `.env.production` when you use "npm run build"

In `.env.development`, **VUE_APP_API_ORIGIN** is set to the development back-end server at `https://dnsforittest.azurewebsites.net`.

In `.env.production`, **VUE_APP_API_ORIGIN** is set to empty string so that the front end calls the API on its own server.