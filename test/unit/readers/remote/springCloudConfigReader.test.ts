import 'reflect-metadata';

import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as CloudConfigClient from 'cloud-config-client';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject, ConfigReaderOptions } from '../../../../src';
import SpringCloudConfigReader from '../../../../src/readers/remote/springCloudConfigReader/SpringCloudConfigReader';
import { setEnvVars } from '../../../utils';

chai.use(chaiAsPromised);
chai.should();

const defaultSpringConfig = {
	"spring": {
		"cloud": {
			"config": {
				"enabled": true,
				"endpoint": "http://localhost:8888",
				"fail-fast": false,
				"label": "master",
				"name": "the-application-name",
				"profiles": [],
				"rejectUnauthorized": true,
				"retry": {
					"enabled": false,
				}
			}
		}
	}
}

describe('SpringCloudConfigReader', function() {
	let nodeEnv = process.env;
	const sandbox = sinon.createSandbox();

	let configClientLoadStub: SinonStub;
	let configReaderOptions: ConfigReaderOptions;
	let springCloudConfigReader: SpringCloudConfigReader;

	describe('#invoke()', function() {

		beforeEach(async function() {
			configClientLoadStub = sandbox.stub(CloudConfigClient, 'load');
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.default.yml',
			});
			configReaderOptions = {
				activeProfiles: [],
				applicationConfig: {},
				defaultConfigPath: './test/fixtures/springCloudConfig',
			};
			springCloudConfigReader = new SpringCloudConfigReader();
		});

		afterEach(async function() {
			sandbox.restore();
			process.env = nodeEnv;
		});

		it('should skip cloud config when bootstrap not specified', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: '',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should use default app path when bootstrap not specified', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: '',
			});
			configClientLoadStub.resolves(undefined);
			configReaderOptions.defaultConfigPath = './test/fixtures/springCloudConfig/defaultPath'

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				console.log(`$$$ ${JSON.stringify(config)}`);
				assert.deepEqual(config.spring.cloud.config.name, 'the-default-path-app');
			});
		});

		it('should throw error when bootstrap specified but missing', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.doesntexist.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should skip cloud config when not used', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: '',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should skip cloud config when not enabled', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.disabled.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should skip cloud config when client returns undefined', async function() {
			configClientLoadStub.resolves(undefined);

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, defaultSpringConfig);
			});
		});

		it('should skip cloud config when client throws error (without fail-fast)', async function() {
			configClientLoadStub.throws(new Error('some error'));

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should throw error when client throws error and fail-fast is true, retry disabled', async function() {
			configClientLoadStub.throws(new Error('some error'));
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.failfast.noretry.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should throw error when client throws error after max retry attempts is exceeded', async function() {
			configClientLoadStub.throws(new Error('some error'));
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.failfast.retry.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.rejectedWith('Error retrieving remote configuration: Maximum retries exceeded.');
		});

		it('should succeed if remote configuration retrieval succeeds', async function() {
			configClientLoadStub.returns(
				Promise.resolve({
					forEach(callback: Function, aBoolValue: boolean) {
						callback('testUrl', 'http://www.default-local.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.failfast.noretry.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
			});
		});

		it('should succeed if retry succeeds', async function() {
			configClientLoadStub
				.onFirstCall().throws(new Error('some error'))
				.onSecondCall().throws(new Error('some error'))
				// tslint:disable-next-line: no-empty
				.onThirdCall().returns(Promise.resolve({forEach(callback: Function, aBoolValue: boolean) {}}));
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.failfast.retry.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled;
		});

		it('should throw error when bootstrap read fails', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.invalidyaml.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should throw error when bootstrap props fail validation', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.invalidprops.yml',
			});

			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should override application name', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/springCloudConfig/bootstrap.default.yml',
			});
			configReaderOptions.applicationConfig.spring = { cloud: { config: {
				name: 'the-application-name-overridden'
			}}};
			const getConfigFromServer: Promise<ConfigObject> = springCloudConfigReader.invoke(configReaderOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name-overridden');
			});;
		});

	});

});