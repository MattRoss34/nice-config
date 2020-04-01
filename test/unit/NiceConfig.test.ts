import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import decache from 'decache';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject, NiceConfigOptions } from '../../src';
import { NiceConfig } from '../../src/NiceConfig';
import * as remoteConfigReaders from '../../src/readers/remote';

chai.use(chaiAsPromised);
chai.should();

describe('NiceConfig', function() {
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
		});

		it('should read application config without profile-specific yaml', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/cloudDisabled',
				configPath: './test/fixtures/readAppConfig/singleAppYaml',
				activeProfiles: ['dev1'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read application config without profiles', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/cloudDisabled',
				configPath: './test/fixtures/readAppConfig/multiAppYaml',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read multi application config with profiles', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/cloudDisabled',
				configPath: './test/fixtures/readAppConfig/multiAppYaml',
				activeProfiles: ['dev2'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should throw error if cloud config service throws an error', function() {
			getConfigFromServerStub.rejects(new Error('some error'));
			
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/readAppConfig/multiAppYaml',
				activeProfiles: [],
				level: 'debug'
			};

			const load: ConfigObject = niceConfig.load(options);
			return load.should.eventually.be.rejectedWith('some error');
		});

		it('should succeed if cloud config service succeeds', async function() {
			getConfigFromServerStub.resolves(defaultProfileConfig);

			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/readAppConfig/multiAppYaml',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should fail without app config path', async function() {
			// @ts-ignore
			const options: NiceConfigOptions = {
				activeProfiles: []
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail without activeProfiles', async function() {
			// @ts-ignore
			const options: NiceConfigOptions = {
				configPath: './test/fixtures/load/config',
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid bootstrap path', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './badPath/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid app config path', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './badPath/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with bad bootstrap config', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/badBootstrap',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should succeed with no bootstrap path and same config folder', async function() {
			getConfigFromServerStub.returns({});
			const options: NiceConfigOptions = {
				configPath: './test/fixtures/load/configSameFolder',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with no profile', async function() {
			getConfigFromServerStub.returns({});
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with app name override', async function() {
			getConfigFromServerStub.returns({});
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/appNameConfig',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'custom-app-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			});
		});

		it('should load dev configs with dev profile', async function() {
			getConfigFromServerStub.returns({});
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev2'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
			});
		});

		it('should load cloud configs with default profile', async function() {
			getConfigFromServerStub.returns(defaultProfileConfig);
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['default'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
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
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev1'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
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
		});

		it('should throw error if not loaded yet', async function() {
			return chai.expect(() =>  niceConfig.instance()).to.throw('NiceConfig hasn\'t been loaded yet. Call \'load\' function first.');
		});

		it('should return instance with defaults', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  niceConfig.load(options);
			return chai.expect(load).to.eventually.be.fulfilled.then(() => {
				const theConfig: ConfigObject =  niceConfig.instance();
				assert.deepEqual(theConfig.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(theConfig.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
			});
		});

	});

});