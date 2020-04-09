# Yaml Config + Remote Property Sources for NodeJS Applications

[![NPM Version](https://img.shields.io/npm/v/nice-config.svg?style=flat)](https://www.npmjs.com/package/nice-config)
[![Build Status](https://travis-ci.org/MattRoss34/nice-config.svg?branch=master)](https://travis-ci.org/MattRoss34/nice-config)
[![Coverage Status](https://coveralls.io/repos/github/MattRoss34/nice-config/badge.svg)](https://coveralls.io/github/MattRoss34/nice-config)

You get to define your configuration in yaml!  Plus, you can override configuration at runtime using remote property sources, like Spring Cloud Config Server.  Hellooo feature flags!

## Getting Started

Install the package
```bash
npm install nice-config
```

### Step 1
Create an application.yml in `/config`, or a group of application.yml and application-{profile}.yml files.

**/config/application.yml**
```yaml
spring.cloud.config.name: my-application-name
db:
   mongo:
      url: http://localhost:27017
---
profiles: dev1,dev2
db:
   mongo:
      url: http://dev-mongo-server:27017
---
profiles: staging,prod
db:
   mongo:
      url: http://prod-mongo-server:27017
```

### Step 2 (optional)
If you're looking to add remote property sources at runtime, create a bootstrap.yml in `/config`.

**/config/bootstrap.yml**
```yaml
spring:
   cloud:
      config:
         enabled: true
         endpoint: http://localhost:8888
         label: master
---
profiles: dev1,dev2
spring.cloud.config.endpoint: http://dev-config-server:8888
---
profiles: staging,prod
spring.cloud.config.endpoint: http://prod-config-server:8888
```

### Step 3
Load your configuration during startup/initialization.

**/initialize.js**
```javascript
const Config = require('nice-config');

export const initialize = async () => {
   await Config.load();
   // ... other initializations
}
```

### Step 4
Use the config later on in your code.
```javascript
const Config = require('nice-config');

const myConfig = Config.instance();
console.log(`My Mongo DB URL: ${myConfig.db.mongo.url}`);
```

Using typescript? No problem...

**/initialize.ts**
```javascript
import { Config } from 'nice-config';

export const initialize = async () => {
   await Config.load();
   // ... other initializations
}
```

Now you can use the config properties later on.
```javascript
import { Config } from 'nice-config';

const { db } = Config.instance();
console.log(`My Mongo DB URL: ${db.mongo.url}`);
```

## Things Explained

### The Yaml Files

As mentioned above, this module uses Yaml files to configure your application properties. By default, the module will look in `/config` for your config files: `application.yml` (required) and `bootstrap.yml` (optional). You can customize the location of these files using environment variables (see specs below).  The `application` yaml defines your application's configuration properties. The `bootstrap` yaml defines your remote property sources (like spring cloud config server).

Note for Spring Cloud Config users: Optionally, you can specify your application's name in application.yml instead of in bootstrap.yml, using the `spring.cloud.config.name` property. Doing so gives you the option of using a shared bootstrap.yml (i.e. shared with other apps) but still be able to specify your individual application's name.

### Support for Profiles in Multi-Document Yaml

You can include multiple Yaml documents in a single Yaml file, using `---` as the document separator. Additionally, you can use documents to scope certain properties to specific environments.

Here's how:
1. Use the `profiles` property in your yaml document to specify which environment/profile the properties should be used for.
2. Set the `ACTIVE_PROFILES` environment variable to the value corresponding to the current environment(s).

For example, say you set `process.env.ACTIVE_PROFILES` to `dev2` and define the below config in `application.yml`:
```yaml
spring.cloud.config.name: my-application-name
db:
   mongo:
      url: http://localhost:27017
---
profiles: dev1,dev2,!local
db:
   mongo:
      url: http://dev-mongo-server:27017
```

The resulting configuration will look like this:
```javascript
{
   spring: {
      cloud: {
         config: {
            name: 'my-application-name'
         }
      }
   },
   db: {
      mongo: {
         url: 'http://dev-mongo-server:27017'
      }
   }
}
```
#### Applying Yaml Docs to Multiple Profiles

You can apply the properties of a Yaml doc to multiple application profiles. Just provide a comma separated string of profile names in the doc's `profiles` property, like `profiles: dev1,dev2`.

#### Excluding Yaml Docs from Profiles

This module supports the `Not` operator (!) on profiles, which helps to exclude configuration properties from specific profiles. Just prepend an '!' to the profile name you want to exclude the given yaml doc from, like `profiles: !prod,!staging`.

### Support for Profile-Specific File Names

If your application supports a wide range of profiles and/or properties then you might consider using profile-specific file names for your application.yml. Wherever you keep your application.yml, just add more yaml files named with this pattern: `application-{profile}.yml`.

#### Examples
```text
config/application.yml
config/application-local.yml
config/application-dev.yml
config/application-dev2.yml
config/application-prod.yml
```

### Node Env Properties

This module supports some pre-defined properties/property sources from the Node env. This enables you to exclude sensitive data from your repository files and instead provide them using environment variables.  For example, you might want to exclude the username and password used for authenticating with your remote config server from your git repo.

When set, node env variables will be mapped to their respective config properties during the bootstrap phase. Be aware, env variables take highest precedence so they'll override whatever value is provided from other sources.

#### Environment Variables

| Env Variable Name | Type | Usage |
| --- | --- | --- |
| CONFIG_BOOTSTRAP_PATH | string | The folder path to your bootstrap config file. Default: `/config` |
| CONFIG_PATH | string | The folder path to your application config file(s). Default: `/config` |
| ACTIVE_PROFILES | string | Comma-separated string of profile names to use. Default: none |
| LOG_LEVEL | debug, info, warn, error | The logging level to be used by nice-config. Default: warn |
| APPLICATION_JSON | Stringified JSON Object | When `APPLICATION_JSON` is set in Node env, the value will be read into the application's configuration as a high priority set of properties.<p>Example: `APPLICATION_JSON='{ "testProp": "testValue" }' node index.js` |

### Remote Property Sources

You can enable the use of remote property sources in your `bootstrap.yml`. For example, enable Spring Cloud Config Server via the bootstrap property `spring.cloud.config.enabled: true`.

When using remote property sources the properties from your remote config will be merged with your `application.yml`, with the remote sources taking higher precedence.

#### Remote Property Source Options

- Spring Cloud Config Server - [Documentation](docs/spring-cloud-config.md)

## API
### `load` function (async)

Reads all defined property sources, including remote cloud config properties (if enabled), and returns the merged configuration properties object.

### `instance` function

Returns the current configuration properties object. Use the `load` function prior to using this.

### `application.yml` Application Config Properties
Option | Type | Description
------ | -------- | -----------
profiles | string | (Optional) Comma separated string of profiles. Indicates which profiles the properties in the current yaml document apply to.
any.property.you.need | ? | This is where you define whatever properties your application needs to be awesome!