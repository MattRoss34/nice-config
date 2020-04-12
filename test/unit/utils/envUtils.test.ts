import { assert } from 'chai';
import { SPRING_CLOUD_ENV_PROPS } from '../../../src/readers/remote/springCloudConfigReader/constants';
import { getAndParsePropsFromEnv, getApplicationJsonFromEnv } from '../../../src/utils';

describe('envUtils', function() {

	describe('#getApplicationJsonFromEnv', function () {

        afterEach(function() {
			delete process.env.APPLICATION_JSON;
		});

		it('should return empty if undefined', function (done: Function) {
            assert.deepEqual(getApplicationJsonFromEnv(), {});
            done();
        });

		it('should return empty if empty', function (done: Function) {
            process.env.APPLICATION_JSON = '{}';
            assert.deepEqual(getApplicationJsonFromEnv(), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.APPLICATION_JSON = '{ "testProp": "testValue" }';
            assert.deepEqual(getApplicationJsonFromEnv(), { 'testProp': 'testValue' });
            done();
        });

    });

	describe('#getAndParsePropsFromEnv', function () {

        afterEach(function() {
			delete process.env.SPRING_CONFIG_ENDPOINT;
		});

		it('should return empty if all are undefined', function (done: Function) {
            assert.deepEqual(getAndParsePropsFromEnv(SPRING_CLOUD_ENV_PROPS), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.SPRING_CONFIG_ENDPOINT = 'https://sometesturl:8888';
            assert.deepEqual(
                getAndParsePropsFromEnv(SPRING_CLOUD_ENV_PROPS),
                { spring: { cloud: { config: { endpoint: 'https://sometesturl:8888' }}}}
            );
            done();
        });

    });

});