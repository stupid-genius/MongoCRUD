require('../../app/server/app');
const chai = require('chai');
const httpMocks = require('node-mocks-http');
const Logger = require('log-ng');
Logger.setLogLevel('error');
// const path = require('path');
const {parseMongoQuery} = require('../../app/server/routeHelpers');

const expect = chai.expect;
// const logger = new Logger(path.basename(__filename));

describe('RouteHelper Unit Tests', function(){
	describe('parseMongoQuery', function(){
		it('should handle an empty query string', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({});
				done();
			});
		});

		it('should correctly handle fields without operator', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'username': 'john_doe',
					'age': '25'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					username: 'john_doe',
					age: 25
				});
				done();
			});
		});

		it('should correctly parse boolean and string values', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'isActive': 'true',
					'username': 'john_doe'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					isActive: true,
					username: 'john_doe'
				});
				done();
			});
		});

		it('should correctly parse __gt, __lt, __gte, __lte operators', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'age__gt': '20',
					'age__lt': '30',
					'experience__gte': '5',
					'experience__lte': '10'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					age: {$gt: 20, $lt: 30},
					experience: {$gte: 5, $lte: 10}
				});
				done();
			});
		});

		it('should correctly parse __ne, __in, __nin operators', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'username__ne': 'admin',
					'role__in': 'user,moderator',
					'role__nin': 'admin,superuser'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					username: {$ne: 'admin'},
					role: {$in: ['user', 'moderator'], $nin: ['admin', 'superuser']}
				});
				done();
			});
		});

		it('should correctly parse __exists operator', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'email__exists': 'true'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					email: {$exists: true}
				});
				done();
			});
		});

		it('should correctly parse __and operator', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'__and': 'age__gt=20;experience__gte=5'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					$and: [
						{age: {$gt: 20}},
						{experience: {$gte: 5}}
					]
				});
				done();
			});
		});

		it('should correctly parse __or operator', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'__or': 'role__in=user,moderator;department__eq=engineering'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					$or: [
						{role: {$in: ['user', 'moderator']}},
						{department: 'engineering'}
					]
				});
				done();
			});
		});

		it('should correctly parse __regex operator', function(done){
			const req = httpMocks.createRequest({
				method: 'GET',
				url: '/users',
				query: {
					'username__regex': '^john'
				}
			});
			const res = httpMocks.createResponse();
			parseMongoQuery(req, res, () => {
				expect(req.mongoQuery).to.deep.equal({
					username: {$regex: '^john'}
				});
				done();
			});
		});
	});
});
