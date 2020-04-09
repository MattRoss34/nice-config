import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import decache from 'decache';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject } from '../../src';
import { NiceConfig } from '../../src/NiceConfig';
import * as remoteConfigReaders from '../../src/readers/remote';

chai.use(chaiAsPromised);
chai.should();

const setEnvVars = (vars: Record<string, string>) => {
	process.env = {
		...process.env,
		...vars
	};
};

describe('NiceConfig', function() {
	let nodeEnv = process.env;
	let sandbox = sinon.createSandbox();
	const defaultProfileConfig: ConfigObject = {
		testUrl: 'http://www.default-local.com',
		featureFlags: {
			feature1: true,
			feature2: false
		}
	};
	const devProfileConfig: ConfigObject = {
		testUrl: 'http://www.dev-cloud.com',
		featureFlags: {
			feature1: true,
			feature2: false
		}
	};
	let niceConfig: NiceConfig;
	let getConfigFromServerStub: SinonStub;

	const getNewNiceConfig = () => {
		return new NiceConfig();
	};

	describe('#load()', function() {

		beforeEach(async function() {
			getConfigFromServerStub = sandbox.stub(remoteConfigReaders, 'springCloudConfigReader');
			niceConfig = getNewNiceConfig();
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
			process.env = nodeEnv;
		});

		it('should read application config without profile-specific yaml', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/cloudDisabled',
				CONFIG_PATH: './test/fixtures/readAppConfig/singleAppYaml',
				ACTIVE_PROFILES: 'dev1',
				LOG_LEVEL: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read application config without profiles', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/cloudDisabled',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read multi application config with profiles', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/cloudDisabled',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: 'dev2',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should throw error if cloud config service throws an error', function() {
			getConfigFromServerStub.rejects(new Error('some error'));

			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: ConfigObject = niceConfig.load();
			return load.should.eventually.be.rejectedWith('some error');
		});

		it('should succeed if cloud config service succeeds', async function() {
			getConfigFromServerStub.resolves(defaultProfileConfig);

			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should reload config on second call', async function() {
			const updatedConfig = {
				...defaultProfileConfig,
				anotherProp: true
			};
			getConfigFromServerStub
				.onFirstCall().resolves(defaultProfileConfig)
				.onSecondCall().resolves(updatedConfig);

			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load().then(() => niceConfig.load());
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
				assert.deepEqual(config.anotherProp, true);
			});
		});

		it('should fail without app config path', async function() {
			// @ts-ignore
			setEnvVars({
				ACTIVE_PROFILES: ''
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should fail without activeProfiles', async function() {
			// @ts-ignore
			setEnvVars({
				CONFIG_PATH: './test/fixtures/load/config',
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid bootstrap path', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './badPath/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: ''
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid app config path', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './badPath/fixtures/load/config',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should fail with bad bootstrap config', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/badBootstrap',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: ''
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should succeed with no bootstrap path and same config folder', async function() {
			getConfigFromServerStub.returns({});
			setEnvVars({
				CONFIG_PATH: './test/fixtures/load/configSameFolder',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with no profile', async function() {
			getConfigFromServerStub.returns({});
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with app name override', async function() {
			getConfigFromServerStub.returns({});
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/appNameConfig',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'custom-app-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			});
		});

		it('should load dev configs with dev profile', async function() {
			getConfigFromServerStub.returns({});
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: 'dev2',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
			});
		});

		it('should load cloud configs with default profile', async function() {
			getConfigFromServerStub.returns(defaultProfileConfig);
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: 'default',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should load cloud configs with dev profile', async function() {
			getConfigFromServerStub.returns(devProfileConfig);
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: 'dev1',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev-cloud.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});
	});

	describe('#instance()', function() {

		beforeEach(async function() {
			getConfigFromServerStub = sandbox.stub(remoteConfigReaders, 'springCloudConfigReader');
			niceConfig = getNewNiceConfig();
		});

		afterEach(async function() {
			sandbox.restore();
			process.env = nodeEnv;
		});

		it('should not throw error if not loaded yet', function(done: Function) {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/cloudDisabled',
				CONFIG_PATH: './test/fixtures/readAppConfig/singleAppYaml',
				ACTIVE_PROFILES: 'dev1',
				LOG_LEVEL: 'debug'
			});

			assert.deepEqual(niceConfig.instance(), {});
			done();
		});

		it('should return instance with defaults', async function() {
			setEnvVars({
				CONFIG_BOOTSTRAP_PATH: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: '',
				logLevel: 'debug'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return chai.expect(load).to.eventually.be.fulfilled.then(async () => {
				const theConfig: ConfigObject =  await niceConfig.instance();
				assert.deepEqual(theConfig.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(theConfig.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
			});
		});

	});

});