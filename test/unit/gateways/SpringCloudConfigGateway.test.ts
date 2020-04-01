import 'reflect-metadata';

import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as CloudConfigClient from 'cloud-config-client';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigClientOptions, ConfigObject } from '../../../src';
import { SpringCloudConfigGateway } from '../../../src/gateways';

chai.use(chaiAsPromised);
chai.should();

describe('SpringCloudConfigGatewayImpl', function() {
	const sandbox = sinon.createSandbox();
	const springCloudConfigGateway = new SpringCloudConfigGateway();
	const defaultOptions: ConfigClientOptions = {
		enabled: true,
		'fail-fast': true
	};
	let cloudLoadStub: SinonStub;

	describe('#getConfigFromServer()', function() {

		beforeEach(async function() {
			cloudLoadStub = sandbox.stub(CloudConfigClient, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
		});

		it('should throw error if cloud config client throws error', async function() {
			cloudLoadStub.throws(new Error('some error'));

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGateway.getConfigFromServer(defaultOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should succeed if cloud config client succeeds without properties', async function() {
			cloudLoadStub.returns(
				Promise.resolve(undefined)
			);

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGateway.getConfigFromServer(defaultOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should succeed if cloud config client succeeds with properties', async function() {
			cloudLoadStub.returns(
				Promise.resolve({
					forEach(callback: Function, aBoolValue: boolean) {
						callback('testUrl', 'http://www.default-local.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGateway.getConfigFromServer(defaultOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

	});

});