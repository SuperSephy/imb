'use strict';

const _ = require('underscore');

const {
    decode_table,
    fcs_table,
    isZero,
    add,
    divideModulus,
    multiplyAndAdd,
    charactersToText,
    textToCharacters,
    calculateFrameCheck,
    cleanString
} = require('./lib/formatting');

/**
 *
 * @param {string}      imb_string                  65 character string of the characters "D-A-T-F"
 * @param {function}    [callback]                  (err, imb_object)
 * @returns {*}
 */
module.exports = function decode(imb_string, callback) {
    const decoded_imb = decode_barcode(imb_string);

    return callback
        ? callback(null, decoded_imb)
        : decoded_imb;
};


function decode_barcode(barcode) {
    let chars, inf;

    barcode = cleanString(barcode);

    if (barcode.length === 65) {
        chars = textToCharacters(barcode, true);

        if (chars) {
            inf = decodeCharacters(chars);
            if (inf) return inf;  // decoded with no errors
        }
    }

    barcode = repairBarcode(barcode);
    if (barcode.length !== 65) {
        if (callback) return callback("Barcode must be 65 characters long");
        throw new Error("Barcode must be 65 characters long");
    }

    chars   = textToCharacters(barcode, false);
    inf     = repairCharacters(chars);

    if (inf) {
        if (inf.suggest)
            inf.highlight = findDiffs(barcode, inf.suggest);
        return inf;
    }

    barcode = flipBarcode(barcode);
    chars   = textToCharacters(barcode, false);
    inf     = repairCharacters(chars);
    if (inf && inf.barcode_id) {
        if (callback) return callback("Barcode seems to be upside down");
        throw new Error("Barcode seems to be upside down");
    }

    if (callback) return callback("Invalid barcode");
    throw new Error("Invalid barcode");
}

function decodeCharacters(chars) {
    // decode characters to codewords.
    // this is the core of the barcode processing.

    let fcs = 0;
    let cw  = new Array(10);

    for (let n = 0; n < 10; n++) {
        cw[n] = decode_table[chars[n]];
        if (cw[n] === undefined) return null;
        fcs |= fcs_table[chars[n]] << n;
    }

    // codewords valid?
    if (cw[0] > 1317 || cw[9] > 1270)
        return;

    // If the barcode is upside down, cw[9] will always be odd.
    // This is due to properties of the bit permutation and the
    // codeword table.
    if (cw[9] & 1)
        return null;

    cw[9] >>= 1;
    if (cw[0] > 658) {
        cw[0] -= 659;
        fcs |= 1 << 10;
    }

    // convert codewords to binary
    const num = [0,0,0,0,0,0,0,0,0,cw[0]];
    for (let n = 1; n < 9; n++) {
        multiplyAndAdd(num, 1365, cw[n]);
    }

    multiplyAndAdd(num, 636, cw[9]);

    if (calculateFrameCheck(num) !== fcs)
        return null;

    // decode tracking information
    const track = new Array(20);
    for (let n = 19; n >= 2; n--) {
        track[n] = divideModulus(num, 10);
    }

    track[1] = divideModulus(num, 5);
    track[0] = divideModulus(num, 10);

    // decode routing information (zip code, etc)
    let sz;
    let pos = 11;
    const route = new Array(11);

    for (sz = 5; sz >= 2; sz--) {
        if (sz === 3)
            continue;

        if (isZero(num))
            break;

        add(num, -1);
        for (let n = 0; n < sz; n++){
            route[--pos] = divideModulus(num, 10);
        }
    }

    if (sz < 2 && !isZero(num))
        return null;

    // finally finished decoding
    const decoded_imb = {};
    decoded_imb.barcode_id = track.slice(0,2).join('');
    decoded_imb.service_type = track.slice(2,5).join('');

    if (track[5] === 9) {
        decoded_imb.mailer_id = track.slice(5,14).join('');
        decoded_imb.serial_num = track.slice(14,20).join('');

    } else {
        decoded_imb.mailer_id = track.slice(5,11).join('');
        decoded_imb.serial_num = track.slice(11,20).join('');
    }

    if (pos <= 6)   decoded_imb.zip = route.slice(pos,pos+5).join('');
    if (pos <= 2)   decoded_imb.plus4 = route.slice(pos+5,pos+9).join('');
    if (pos === 0)  decoded_imb.delivery_pt = route.slice(9,11).join('');
    return decoded_imb;
}

function tryRepair(possible, chars, pos) {
    let inf = null, newinf;

    for (let n = 0; n < possible[pos].length; n++) {
        chars[pos] = possible[pos][n];
        if (pos < 9)
            newinf = tryRepair(possible, chars, pos+1);
        else {
            newinf = decodeCharacters(chars);
            if (newinf) {
                newinf.suggest = charactersToText(chars);
                newinf.message = "Damaged barcode";
            }
        }
        if (newinf) {
            // abort if multiple solutions are found.
            if (inf) return { message: "Invalid barcode" };
            inf = newinf;
        }
    }
    return inf;
}

function repairCharacters(chars) {
    let prod = 1;
    let possible = new Array(10);

    for (let n = 0; n < 10; n++) {
        possible[n] = [];
        let c = chars[n];

        if (decode_table[c] === undefined) {
            for (let bit = 0; bit < 13; bit++) {
                let d = c ^ (1 << bit);
                if (decode_table[d] !== undefined)
                    possible[n].push(d);
            }
        }
        else {
            possible[n].push(c);
        }

        // Don't let the number of possible combinations get too high --
        // it will take too long to run, and it won't find a unique
        // solution anyway.
        prod *= possible[n].length;
        if (prod === 0 || prod > 1000) return null;
    }
    let newChars = new Array(10);
    return tryRepair(possible, newChars, 0);
}

function flipBarcode(barcode) {
    return _.map(barcode, character => {
        switch(character) {
            case "A":
                return "D";
            case "D":
                return "A";
            default:
                return character;
        }
    }).join('');
}

function repairBarcode(barcode) {
    let longer;

    if (barcode.length === 64) {
        longer = true;
    } else if (barcode.length === 66) {
        longer = false;
    } else{
        return barcode;
    }

    let errs,
        testCode,
        best        = barcode,
        best_errs   = 5;  // don't try to repair if we can't get more than 5 right

    for (let pos = 0; pos < 66; pos++) {

        testCode = longer
            ? barcode.substring(0, pos) + "X" + barcode.substring(pos)
            : barcode.substring(0, pos) + barcode.substring(pos+1);

        const chars = textToCharacters(testCode, false);
        errs = 0;
        for (let n = 0; n < 10; n++)
            if (decode_table[chars[n]] === undefined)
                errs++;

        if (errs < best_errs) {
            best_errs = errs;
            best = testCode;
        }
    }

    return best;
}

function findDiffs(str1, str2) {
    const len = Math.min(str1.length, str2.length);
    const diffs = new Array(len);

    for (let n = 0; n < len; n++){
        diffs[n] = str1.charAt(n) !== str2.charAt(n);
    }

    return diffs;
}
