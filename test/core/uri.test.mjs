import { createURI, URI } from '../../src/core/uri.js';

import { expect } from 'chai';

describe('URI', () => {

    describe('#constructor', () => {

        it('handles all sections', () => {
            const s = 'http://a/b/c/d;p?q=r#l';

            const uri = new URI(s);

            expect(uri.scheme).to.equal('http');
            expect(uri.authority).to.equal('a');
            expect(uri.path).to.equal('/b/c/d;p');
            expect(uri.query).to.equal('q=r');
            expect(uri.fragment).to.equal('l');
        });

        it('handles no scheme', () => {
            const s = '//a/b/c/d;p?q=r#l';
            const uri = new URI(s);

            expect(uri.scheme).to.be.undefined;
            expect(uri.authority).to.equal('a');
            expect(uri.path).to.equal('/b/c/d;p');
            expect(uri.query).to.equal('q=r');
            expect(uri.fragment).to.equal('l');
        });

        it('handles no authority', () => {
            const s = '/b/c/d;p?q=r#l';
            const uri = new URI(s);

            expect(uri.scheme).to.be.undefined;
            expect(uri.authority).to.be.undefined;
            expect(uri.path).to.equal('/b/c/d;p');
            expect(uri.query).to.equal('q=r');
            expect(uri.fragment).to.equal('l');
        });

        it('handles no query', () => {
            const s = 'http://a/b/c/d;p#l';
            const uri = new URI(s);

            expect(uri.scheme).to.equal('http');
            expect(uri.authority).to.equal('a');
            expect(uri.path).to.equal('/b/c/d;p');
            expect(uri.query).to.be.undefined;
            expect(uri.fragment).to.equal('l');
        });

        it('handles no fragment', () => {
            const s = 'http://a/b/c/d;p?q=r';
            const uri = new URI(s);

            expect(uri.scheme).to.equal('http');
            expect(uri.authority).to.equal('a');
            expect(uri.path).to.equal('/b/c/d;p');
            expect(uri.query).to.equal('q=r');
            expect(uri.fragment).to.be.undefined;
        });

    });

    describe('#toString', () => {

        it('matches the URI passed to the constructor', () => {
            const s = 'http://a/b/c/d;p?q=r#l';
            const uri = new URI(s);
            const r = uri.toString();

            expect(s).to.equal(r);
        });

        it('handles an edit to the query', () => {
            const s = 'http://example.com';
            const uri = new URI(s);
            uri.query = 'q=abc';

            expect(uri.toString()).to.equal('http://example.com?q=abc');

            uri.query = '';
            expect(uri.toString()).to.equal(s);
        });

    });

    describe('#getQuery', () => {

        it('correctly parses the query string', () => {
            const s = 'http://example.com/test?a=1&b=string&c=something%20spaced';
            const uri = new URI(s);

            const q = uri.getQuery();

            expect(q.a).to.equal('1');
            expect(q.b).to.equal('string');
            expect(q.c).to.equal('something spaced');
        });

        it('handles an empty query string', () => {
            const s = 'http://example.com/test';
            const uri = new URI(s);

            const q = uri.getQuery();

            expect(Object.keys(q).length).to.equal(0);
        });

    });

    describe('#setQuery', () => {

        it('adds a query string', () => {
            const uri = new URI('http://example.com/test');
            const q = {
                key: 'value'
            };

            uri.setQuery(q);
            expect('key=value').to.equal(uri.query);
        });


        it('adds a query string with spaces and quotes', () => {
            const uri = new URI('http://example.com/test');
            const q = {
                'key': 'value',
                'with space': '\"'
            };

            uri.setQuery(q);
            expect('key=value&with%20space=%22').to.equal(uri.query);
        });
    });

});

describe('createURI', () => {

    it('correctly constructs URIs', () => {
        let uri;

        uri = createURI({
            scheme: 'http',
            authority: 'example.com',
            path: '/abc',
            fragment: 'f'
        });
        expect('http://example.com/abc#f').to.equal(uri);

        uri = createURI({
            host: 'http://example.com',
            path: '/abc'
        });
        expect('http://example.com/abc').to.equal(uri);

        uri = createURI({
            hostpath: 'http://example.com/abc'
        });
        expect('http://example.com/abc').to.equal(uri);

        uri = createURI({
            hostpath: 'http://example.com/abc',
            query: 'a=b&c=d'
        });
        expect('http://example.com/abc?a=b&c=d').to.equal(uri);

    });

    it('throws exceptions', () => {
        expect(() => {
            createURI({
                scheme: 'http',
                host: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                authority: 'http',
                host: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                scheme: 'http',
                hostpath: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                authority: 'http',
                hostpath: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                scheme: 'http',
                authority: 'e.com',
                host: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                scheme: 'abc',
                authority: 'http',
                hostpath: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                host: 'http://test.com',
                hostpath: 'http://test.com'
            });
        }).to.throw();

        expect(() => {
            createURI({
                path: '/abc',
                hostpath: 'http://test.com/abc'
            });
        }).to.throw();
    });

});
