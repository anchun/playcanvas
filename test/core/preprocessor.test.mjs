import { Preprocessor } from '../../src/core/preprocessor.js';

import { expect } from 'chai';

describe('Preprocessor', () => {

    const includes = new Map([
        ['inc1', `
            block1
            #ifdef FEATURE2
                nested
            #endif
        `],
        ['inc2', 'block2']
    ]);

    const srcData = `
        
        #define FEATURE1
        #define FEATURE2

        #ifdef FEATURE1
            TEST1
            #include "inc1"
        #endif

        #if defined(FEATURE1)
            TEST2
        #endif

        #ifdef FEATURE1
            #if defined(FEATURE2)
                TEST3
            #endif
        #endif

        #ifndef UNKNOWN
            TEST4
        #endif

        #if defined (UNKNOWN)
            TEST5
            #include "inc2"
        #else
            TEST6
        #endif

        $// comment

        // TEST7

        /*
        TEST8
        */

        #ifdef UNKNOWN
            TEST9
        #elif FEATURE2
            TEST10
        #else
            TEST11
        #endif

        #undef FEATURE1
        #ifdef FEATURE1
            TEST12
        #endif

        #ifndef FEATURE1
            TEST13
        #endif

        #ifdef (UNKNOWN)
            #define TEST14  // this should not be defined
        #endif
    `;

    it('returns false for MORPH_A', () => {
        expect(Preprocessor.run(srcData, includes).includes('MORPH_A')).to.equal(false);
    });

    it('returns false for MORPH_B', () => {
        expect(Preprocessor.run(srcData, includes).includes('MORPH_B')).to.equal(false);
    });

    it('returns true for $', () => {
        expect(Preprocessor.run(srcData, includes).includes('$')).to.equal(true);
    });

    it('returns true for TEST1', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST1')).to.equal(true);
    });

    it('returns true for TEST2', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST2')).to.equal(true);
    });

    it('returns true for TEST3', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST3')).to.equal(true);
    });

    it('returns true for TEST4', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST4')).to.equal(true);
    });

    it('returns false for TEST5', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST5')).to.equal(false);
    });

    it('returns true for TEST6', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST6')).to.equal(true);
    });

    it('returns false for TEST7', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST7')).to.equal(false);
    });

    it('returns false for TEST8', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST8')).to.equal(false);
    });

    it('returns false for TEST9', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST9')).to.equal(false);
    });

    it('returns true for TEST10', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST10')).to.equal(true);
    });

    it('returns false for TEST11', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST11')).to.equal(false);
    });

    it('returns false for TEST12', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST12')).to.equal(false);
    });

    it('returns true for TEST13', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST13')).to.equal(true);
    });

    it('returns false for TEST14', () => {
        expect(Preprocessor.run(srcData, includes).includes('TEST14')).to.equal(false);
    });

    it('returns true for INC1', () => {
        expect(Preprocessor.run(srcData, includes).includes('block1')).to.equal(true);
    });

    it('returns false for INC2', () => {
        expect(Preprocessor.run(srcData, includes).includes('block2')).to.equal(false);
    });

    it('returns true for nested', () => {
        expect(Preprocessor.run(srcData, includes).includes('nested')).to.equal(true);
    });
});
