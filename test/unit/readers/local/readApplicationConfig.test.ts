import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { ConfigObject, NiceConfigOptions } from '../../../../src';
import { readApplicationConfig } from '../../../../src/readers/local';

chai.use(chaiAsPromised);
chai.should();

describe('readApplicationConfig', function() {

	it('should read application config without profile-specific yaml', async function() {
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/readAppConfig/singleAppYaml',
			activeProfiles: ['dev1']
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
			assert.deepEqual(config.testUrl, 'http://www.default.com');
			assert.deepEqual(config.featureFlags.feature1, false);
			assert.deepEqual(config.featureFlags.feature2, false);
		});
	});

	it('should read application config without profiles', async function() {
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/readAppConfig/multiAppYaml',
			activeProfiles: []
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
			assert.deepEqual(config.testUrl, 'http://www.default.com');
			assert.deepEqual(config.featureFlags.feature1, false);
			assert.deepEqual(config.featureFlags.feature2, false);
		});
	});

	it('should read multi application config with profiles', async function() {
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/readAppConfig/multiAppYaml',
			activeProfiles: ['dev2']
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
			assert.deepEqual(config.testUrl, 'http://www.dev2.com');
			assert.deepEqual(config.featureFlags.feature1, true);
			assert.deepEqual(config.featureFlags.feature2, false);
		});
	});

	it('should fail without app config path', async function() {
		// @ts-ignore
		const options: NiceConfigOptions = {
			activeProfiles: []
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.rejected;
	});

	it('should fail without activeProfiles', async function() {
		// @ts-ignore
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/load/config',
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.rejected;
	});

	it('should fail with invalid app config path', async function() {
		const options: NiceConfigOptions = {
			configPath: './badPath/fixtures/load/config',
			activeProfiles: []
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.rejected;
	});

	it('should load default configs with no profile', async function() {
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/load/config',
			activeProfiles: []
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
			assert.deepEqual(config.testUrl, 'http://www.default.com');
		});
	});

	it('should load dev configs with dev profile', async function() {
		const options: NiceConfigOptions = {
			configPath: './test/fixtures/load/config',
			activeProfiles: ['dev2']
		};

		const load: Promise<ConfigObject> =  readApplicationConfig(options.configPath, options.activeProfiles);
		return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
			assert.deepEqual(config.testUrl, 'http://www.dev.com');
		});
	});

});