import { assert } from 'chai';
import { getApplicationJsonFromEnv, getAndParsePropsFromEnv } from '../../../src/utils';
import { PREDEFINED_ENV_PROPERTIES } from '../../../src/constants';

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
            assert.deepEqual(getAndParsePropsFromEnv(PREDEFINED_ENV_PROPERTIES), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.SPRING_CONFIG_ENDPOINT = 'https://sometesturl:8888';
            assert.deepEqual(
                getAndParsePropsFromEnv(PREDEFINED_ENV_PROPERTIES),
                { spring: { cloud: { config: { endpoint: 'https://sometesturl:8888' }}}}
            );
            done();
        });

    });

});