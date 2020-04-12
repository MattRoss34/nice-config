import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import decache from 'decache';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject } from '../../src';
import { NiceConfig } from '../../src/NiceConfig';
import springCloudConfigReader from '../../src/readers/remote/springCloudConfigReader';
import { setEnvVars } from '../utils';

chai.use(chaiAsPromised);
chai.should();

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
	let springConfigReaderStub: SinonStub;

	const getNewNiceConfig = () => {
		return new NiceConfig();
	};

	describe('#load()', function() {

		beforeEach(async function() {
			springConfigReaderStub = sandbox.stub(springCloudConfigReader, 'invoke');
			niceConfig = getNewNiceConfig();
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
			process.env = nodeEnv;
		});

		it('should read application config without profile-specific yaml', async function() {
			setEnvVars({
				CONFIG_PATH: './test/fixtures/readAppConfig/singleAppYaml',
				ACTIVE_PROFILES: 'dev1',
				LOG_LEVEL: 'fatal'
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
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
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
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: 'dev2',
				LOG_LEVEL: 'fatal'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should throw error if remote config reader throws an error', function() {
			springConfigReaderStub.rejects(new Error('some error'));

			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
			});

			const load: ConfigObject = niceConfig.load();
			return load.should.eventually.be.rejectedWith('some error');
		});

		it('should succeed when remote config reader succeeds', async function() {
			springConfigReaderStub.resolves(defaultProfileConfig);

			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
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
			springConfigReaderStub
				.onFirstCall().resolves(defaultProfileConfig)
				.onSecondCall().resolves(updatedConfig);

			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './test/fixtures/readAppConfig/multiAppYaml',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
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

		it('should not fail without activeProfiles', async function() {
			// @ts-ignore
			setEnvVars({
				CONFIG_PATH: './test/fixtures/load/config',
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled;
		});

		it('should fail with invalid app config path', async function() {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/commonConfig',
				CONFIG_PATH: './badPath/fixtures/load/config',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.rejected;
		});

		it('should load default configs with no profile', async function() {
			springConfigReaderStub.returns({});
			setEnvVars({
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should load dev configs with dev profile', async function() {
			springConfigReaderStub.returns({});
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/commonConfig/bootstrap.yml',
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: 'dev2',
				LOG_LEVEL: 'fatal'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

	});

	describe('#instance()', function() {

		beforeEach(async function() {
			springConfigReaderStub = sandbox.stub(springCloudConfigReader, 'invoke');
			niceConfig = getNewNiceConfig();
		});

		afterEach(async function() {
			sandbox.restore();
			process.env = nodeEnv;
		});

		it('should not throw error if not loaded yet', function(done: Function) {
			setEnvVars({
				SPRING_CONFIG_BOOTSTRAP_FILE: './test/fixtures/load/cloudDisabled/bootstrap.yml',
				CONFIG_PATH: './test/fixtures/readAppConfig/singleAppYaml',
				ACTIVE_PROFILES: 'dev1',
				LOG_LEVEL: 'fatal'
			});

			assert.deepEqual(niceConfig.instance(), {});
			done();
		});

		it('should return instance with defaults', async function() {
			springConfigReaderStub.resolves({});
			setEnvVars({
				CONFIG_PATH: './test/fixtures/load/config',
				ACTIVE_PROFILES: '',
				LOG_LEVEL: 'fatal'
			});

			const load: Promise<ConfigObject> =  niceConfig.load();
			return chai.expect(load).to.eventually.be.fulfilled.then(async () => {
				const theConfig: ConfigObject =  await niceConfig.instance();
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
				assert.deepEqual(theConfig.featureFlags.feature1, false);
				assert.deepEqual(theConfig.featureFlags.feature2, false);
			});
		});

	});

});