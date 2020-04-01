import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { ConfigObject, NiceConfigOptions } from '../../../../src';
import { readBootstrapConfig } from '../../../../src/readers/local';

chai.use(chaiAsPromised);
chai.should();

describe('readBootstrapConfig', function() {

		it('should fail without activeProfiles', async function() {
			// @ts-ignore
			const options: NiceConfigOptions = {
				configPath: './test/fixtures/load/config',
			};

			const load: Promise<ConfigObject> =  readBootstrapConfig(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid bootstrap path', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './badPath/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> =  readBootstrapConfig(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with bad bootstrap config', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/badBootstrap',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> =  readBootstrapConfig(options);
			return load.should.eventually.be.rejected;
		});

		it('should load default configs with no profile', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  readBootstrapConfig(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			});
		});

		it('should load dev configs with dev profile', async function() {
			const options: NiceConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev2'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> =  readBootstrapConfig(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			});
		});

});