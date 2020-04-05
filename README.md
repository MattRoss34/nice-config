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
Create an application.yml, or a group of application.yml and application-{profile}.yml files.

**config/application.yml**
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
If you're looking to add remote property sources at runtime, create a bootstrap.yml file.

**bootstrap.yml**
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
```javascript
const NiceConfig = require('nice-config');

const configOptions = {
    configPath: `${__dirname}/config`,
    activeProfiles: ['dev1'],
    logLevel: 'debug'
};

let myConfig;
NiceConfig.load(configOptions).then(theConfig => {
   myConfig = theConfig;
   // now run your application with the loaded config props.
   // do this by saving the returned config object somewhere,
   // or by using the NiceConfig.instance() helper.
);
```

### Step 4
Use the config later on in your code.
```javascript
const NiceConfig = require('nice-config');

const myConfig = NiceConfig.instance();
console.log(`My Mongo DB URL: ${myConfig.db.mongo.url}`);
```

Using typescript? No problem...
```javascript
import { Config, NiceConfigOptions, ConfigObject } from 'nice-config';

const niceConfigOptions: NiceConfigOptions = {
    configPath: `${__dirname}/config`,
    activeProfiles: ['dev1'],
    logLevel: 'debug'
};

let myConfig: ConfigObject;

Config.load(niceConfigOptions).then((theConfig: ConfigObject) => {
   myConfig = theConfig;
   // now run your application with the loaded config props.
   // do this by saving the returned config object somewhere,
   // or by using the Config.instance() helper.
);
```

Now you can use the config properties later on.
```javascript
import { Config } from 'nice-config';

console.log(`My Mongo DB URL: ${Config.instance().db.mongo.url}`);
```

## Things Explained

### The Yaml Files

As mentioned above, this module uses Yaml files to configure your application properties. You need to supply folder paths where it can expect to find your config files: `application.yml` and `bootstrap.yml` (optional). The `application` yaml defines your application's configuration properties. The `bootstrap` yaml defines your remote property sources (like spring cloud config server).

Note for Spring Cloud Config users: Optionally, you can specify your application's name in application.yml instead of in bootstrap.yml, using the `spring.cloud.config.name` property. Doing so gives you the option of using a shared bootstrap.yml (i.e. shared with other apps) but still be able to specify your individual application's name.

### Support for Profiles in Multi-Document Yaml

You can include multiple documents in a single Yaml file, using `---` as a separator. Additionally, you can use documents to scope certain properties to specific environments.

Here's how:
1. Use the `profiles` property in your yaml document to specify which environment/profile the properties should be used for.
2. Set your `configOptions.activeProfiles` to the value corresponding to the current environment.

For example, say you set `configOptions.activeProfiles` to `dev2` and define the below config in `application.yml`:
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

This module supports the `Not` operator (!) on profiles to provide for excluding configuration properties from specific profiles. Just prepend an '!' to the profile name you want to exclude the given yaml doc from, like `profiles: dev1,!dev2`.

### Support for Profile-Specific File Names

If your application supports a wide range of profiles and/or properties then you might consider using profile-specific file names for your application.yml. Wherever you keep your application.yml, just add more yaml files named with this pattern: `application-{profile}.yml`.

#### Examples
```text
application.yml
application-local.yml
application-dev.yml
application-dev2.yml
application-prod.yml
```

### Node Env Property Sources

This module supports some pre-defined properties/property sources from the Node env. This enables you to exclude sensitive data from your repository files and instead provide them using environment variables.  For example, you might want to exclude the username and password used for authenticating with your remote config server from your git repo.

When set, node env variables will be mapped to their respective config properties during the bootstrap phase. Be aware, env variables take highest precedence so they'll override whatever value is provided from other sources.

#### Environment Variables

| Env Variable Name | Type | Usage |
| --- | --- | --- |
| APPLICATION_JSON | Stringified JSON Object | When `APPLICATION_JSON` is set in Node env, the value will be read into the application's configuration as a high priority set of properties.<p>Example: `APPLICATION_JSON='{ "testProp": "testValue" }' node index.js` |

### Remote Property Sources

You can enable the use of remote property sources in your `bootstrap.yml`. For example, enable Spring Cloud Config Server via the bootstrap property `spring.cloud.config.enabled: true`.

When using remote property sources the properties from your remote config will be merged with your `application.yml`, with the remote sources taking higher precedence.

#### Remote Property Source Options

- Spring Cloud Config Server - [Documentation](docs/spring-cloud-config.md)

## API
### `load` function

Reads all defined property sources, including remote cloud config properties (if enabled), and returns the merged configuration properties object.

Parameter | Type | Description
--------- | ---- | -----------
options | Object | (Required) Holds the options properties that help you configure the behavior of this module.
options.bootstrapPath | String | (Optional) The folder path to your bootstrap config file. If not provided, then options.configPath location must contain both bootstrap.yml and application.yml.
options.configPath | String | (Required) The folder path to your yaml config file(s).
options.activeProfiles | String[] | (Required) Profile names to filter your local yaml documents, as well as your remote property sources, by.
options.level | String | (Optional) Logging level to use.

### `instance` function

Returns the current configuration properties object. Use the `load` function prior to using this.

### `application.yml` Application Config Properties
Option | Type | Description
------ | -------- | -----------
profiles | string | (Optional) Comma separated string of profiles. Indicates which profiles the properties in the current yaml document apply to.
any.property.you.need | ? | This is where you define whatever properties your application needs to be awesome!