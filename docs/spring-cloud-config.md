# Spring Cloud Config Reader

Depends on [cloud-config-client](https://www.npmjs.com/package/cloud-config-client) for the config server client functionality.

### Description

Enable the use of spring cloud config via the bootstrap property `spring.cloud.config.enabled: true`.

The properties from your spring cloud config server will be merged with your `application.yml`, with the remote propertis taking higher precedence.

#### Cloud Config Client Fail Fast

If you need nice-config to throw an error when it can't reach the cloud config server, set the bootstrap property `spring.cloud.config.fail-fast: true`. Combine this with enabling retry (see below) to provide some resiliency to your cloud configuration retrieval.

#### Cloud Config Client Retry

If you'd like spring-cloud-config to retry connecting to your cloud config server after a failure, set the bootstrap property `spring.cloud.config.retry.enabled: true`, in addition to setting `fail-fast` to true (see above). When retry is enabled, spring-cloud-config will retry the config server connection based on the retry configuration you provide, or based on the default configuration.  Below are the retry properties and their defaults. See the API specs further down for details.

- `spring.cloud.config.retry.enabled`: false
- `spring.cloud.config.retry.max-attempts`: 6
- `spring.cloud.config.retry.max-interval`: 1500 (ms)
- `spring.cloud.config.retry.initial-interval`: 1000 (ms)
- `spring.cloud.config.retry.multiplier`: 1.1

## Config Options

### Environment Variables

| Env Variable Name | Type | Usage |
| --- | --- | --- |
| SPRING_CONFIG_ENDPOINT | string | Maps to `spring.cloud.config.endpoint`.<p>Example: `SPRING_CONFIG_ENDPOINT=http://test:8888 node index.js` |
| SPRING_CONFIG_AUTH_USER | string | Maps to `spring.cloud.config.auth.user`.<p>Example: `SPRING_CONFIG_AUTH_USER=user1 node index.js` |
| SPRING_CONFIG_AUTH_PASS | string | Maps to `spring.cloud.config.auth.pass`.<p>Example: `SPRING_CONFIG_AUTH_PASS=user1password node index.js` |

### `bootstrap.yml` Cloud Config Options
Option | Type | Description
------ | -------- | -----------
profiles | string | (Optional) Comma separated string of profiles. Indicates which profiles the properties in the current yaml document apply to.
spring.cloud.config | object | (Required) The config options to use for fetching remote properties from a Spring Cloud Config Server.
spring.cloud.config.enabled | boolean | (Required) Enable/disable the usage of remote properties via a Spring Cloud Config Server.
spring.cloud.config.fail-fast | boolean | (Optional, Default: false) Enable/disable throwing an error when remote config retrieval fails.
spring.cloud.config.retry | object | (Optional) Controls the retry logic for remote configuration retrieval.
spring.cloud.config.retry.enabled | boolean | (Optional, Default: false) Enable/disable retry. If enabled, retrieval of remote configuration properties will be retried if it fails. See additional properties below.
spring.cloud.config.retry.max-attempts | number | (Optional, Default: 6) Maximum times to retry.
spring.cloud.config.retry.max-interval | number | (Optional, Default: 1500) Maximum interval in milliseconds to wait between retries.
spring.cloud.config.retry.initial-interval | number | (Optional, Default: 1000) Initial interval in milliseconds to wait before the first retry.
spring.cloud.config.retry.multiplier | number | (Optional, Default: 1.1) Factor by which the retry interval will increase between retries.
spring.cloud.config.endpoint | String | (Optional, Default: http://localhost:8888) The url endpoint of the Spring Cloud Config Server.
spring.cloud.config.label | String | (Optional, Default: master) The cloud config label to use.
spring.cloud.config.rejectUnauthorized | boolean | (Optional, Default: true) if false accepts self-signed certificates
spring.cloud.config.auth | Object | (Optional) Basic Authentication for config server (e.g.: { user: "username", pass: "password"}). endpoint accepts also basic auth (e.g. http://user:pass@localhost:8888).
spring.cloud.config.auth.user | string | (Required) username if using auth
spring.cloud.config.auth.pass | string | (Required) password if using auth

### `application.yml` Application Config Properties
Option | Type | Description
------ | -------- | -----------
spring.cloud.config.name | String | (Optional) You can override/specify your application name here, or in bootstrap.yml. This is an option so that you can share bootstrap.yml with other applications but still use your own application name.
