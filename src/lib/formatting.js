
const _ = require('underscore');

// Custom Libs
const {
    asc_bit,
    asc_char,
    desc_bit,
    desc_char
} = require('./barcodeToBit');

const formatting = {

    // Holding tables of 13-bit codewords - populated by buildCodeWords;
    encode_table:   new Array(1365),
    decode_table:   new Array(8192),
    fcs_table:      new Array(8192),
    /**
     * Build tables of 13-bit codewords
     * @param bits
     * @param low
     * @param hi
     */
    buildCodeWords: function build_codewords(bits, low, hi) {

        // loop through all possible 13-bit codewords
        for (let fwd = 0; fwd < 8192; fwd++) {
            // build reversed codeword and count population of 1-bits

            let pop = 0;
            let rev = 0;
            let tmp = fwd;

            for (let bit = 0; bit < 13; bit++) {
                pop += tmp & 1;
                rev = (rev << 1) | (tmp & 1);
                tmp >>= 1;
            }
            if (pop !== bits) continue;

            if (fwd === rev) {
                // palindromic codes go at the end of the table
                formatting.encode_table[hi] = fwd;
                formatting.decode_table[fwd] = hi;
                formatting.decode_table[fwd ^ 8191] = hi;
                formatting.fcs_table[fwd] = 0;
                formatting.fcs_table[fwd ^ 8191] = 1;
                hi--;
            }
            else if (fwd < rev) {
                // add forward code to front of table
                formatting.encode_table[low] = fwd;
                formatting.decode_table[fwd] = low;
                formatting.decode_table[fwd ^ 8191] = low;
                formatting.fcs_table[fwd] = 0;
                formatting.fcs_table[fwd ^ 8191] = 1;
                low++;

                // add reversed code to front of table
                formatting.encode_table[low] = rev;
                formatting.decode_table[rev] = low;
                formatting.decode_table[rev ^ 8191] = low;
                formatting.fcs_table[rev] = 0;
                formatting.fcs_table[rev ^ 8191] = 1;
                low++;
            }
        }
    },

    cleanString: function cleanString(str) {
        if (str == null) str = '';
        return str.toUpperCase().replace(/\s/g, '');
    },

    /**
     * This function checks if num is Zero
     * @param   {array}     num     Array of 11-bit words representing a multiple-precision number.
     * @returns {boolean}
     */
    isZero: function isZero(num) {
        for (let n = num.length - 1; n >= 0; n--) {
            if (num[n] !== 0) {
                return false;
            }
        }
        return true;
    },

    /**
     *
     * @param {array}   num         Array of 11-bit words representing a multiple-precision number.
     * @param {number}  add         Value to  "add" to num.
     */
    add: function add(num, add) {
        for (let n = num.length - 1; n >= 0 && add !== 0; n--) {
            let x = num[n] + add;
            add = x >> 11;
            num[n] = x & 0x7ff;
        }
    },


    /**
     * Assuming 32-bit integers, the largest multiplier can be without overflowing is about 2**20, approximately one million.
     * @param {array}   num         Array of 11-bit words representing a multiple-precision number.
     * @param {number}  multiplier  Multiply num by "multiplier" and add "add".
     * @param {number}  add
     */
    multiplyAndAdd: function multiplyAndAdd(num, multiplier, add) {
        for (let n = num.length - 1; n >= 0; n--) {
            let x = num[n] * multiplier + add;
            add = x >> 11;
            num[n] = x & 0x7ff;
        }
    },


    /**
     *
     * @param   {array}     num     Array of 11-bit words representing a multiple-precision number.
     * @param   {number}    divisor Divide num by "divisor" and return remainder. Div is limited the same way as multiplier above.
     * @returns {number}            Remainder
     */
    divideModulus: function divideModulus(num, divisor) {
        let mod = 0;
        let len = num.length;
        let q;

        for (let n = 0; n < len; n++) {
            let x = num[n] + (mod << 11);
            num[n] = q = Math.floor(x / divisor);
            mod = x - q * divisor;
        }
        return mod;
    },


    /**
     * calculate 11-bit frame check sequence for an array of 11-bit words.
     * @param   {array} num         Array of 11-bit words representing a multiple-precision number.
     * @returns {number}
     */
    calculateFrameCheck: function calculateFrameCheck(num) {
        let fcs = 0x1f0;
        let len = num.length;

        for (let n = 0; n < len; n++) {
            fcs ^= num[n];
            for (let bit = 0; bit < 11; bit++) {
                fcs <<= 1;
                if (fcs & 0x800) fcs ^= 0xf35;
            }
        }
        return fcs;
    },


    /**
     * Converts the computed array to a string representation of the barcode
     * @param   {array}  chars  Array of 11-bit words representing a multiple-precision number.
     * @returns {string}        F-D-A-T based string
     */
    charactersToText: function charactersToText(chars) {
        let barcode = "";

        for (let n = 0; n < 65; n++) {
            if (chars[desc_char[n]] & desc_bit[n]) {
                if (chars[asc_char[n]] & asc_bit[n])
                    barcode += "F";
                else
                    barcode += "D";
            }
            else {
                if (chars[asc_char[n]] & asc_bit[n])
                    barcode += "A";
                else
                    barcode += "T";
            }
        }
        return barcode;
    },

    textToCharacters: function textToCharacters(barcode, strict) {
        // convert barcode text to "characters" by applying bit permutation
        barcode = formatting.cleanString(barcode);
        let chars = [0,0,0,0,0,0,0,0,0,0];
        let n;

        for (n = 0; n < 65; n++) {
            switch (barcode.charAt(n)) {
                case 'T':  case 'S':  // track bar
                    break;
                case 'D':  // descending bar
                    chars[desc_char[n]] |= desc_bit[n];
                    break;
                case 'A':  // ascending bar
                    chars[asc_char[n]]  |= asc_bit[n];
                    break;
                case 'F':  // full bar
                    chars[desc_char[n]] |= desc_bit[n];
                    chars[asc_char[n]]  |= asc_bit[n];
                    break;
                default:
                    if (strict) return null;
            }
        }
        return chars;
    },

    /**
     * Only for client side rendering
     * requires HTML table
     *
     * <script type="text/javascript">
     *    document.write('<table id="barCodeTable" cellspacing="0" border="0">');
     *
     *    var i, j;
     *    for (i = 0; i < 3; i++) {
     *       document.write('<tr id="row' + i + '">');
     *       for (j = 0; j < 129; j++) {
     *           document.write('<td style="width: 2px; height: 8px"></td>');
     *       }
     *       document.write("</tr>");
     *    }
     *    document.write("</table>");
     * </script>
     *
     * @param   {string} barcode    USPS IMB barcode string
     * @returns {*}
     */
    showBarCode: function showBarCode(barcode) {
        const top = document.getElementById('row0').cells;
        const mid = document.getElementById('row1').cells;
        const btm = document.getElementById('row2').cells;

        let len = barcode.length;
        if (len > 65) len = 65;

        for (let i = 0; i < len; i++) {
            let j = 2 * i;
            switch (barcode.charAt(i)) {
                case 'A':
                    top[j].style.backgroundColor = '#000';
                    mid[j].style.backgroundColor = '#000';
                    btm[j].style.backgroundColor = 'transparent';
                    break;
                case 'D':
                    top[j].style.backgroundColor = 'transparent';
                    mid[j].style.backgroundColor = '#000';
                    btm[j].style.backgroundColor = '#000';
                    break;
                case 'F':
                    top[j].style.backgroundColor = '#000';
                    mid[j].style.backgroundColor = '#000';
                    btm[j].style.backgroundColor = '#000';
                    break;
                case 'T':
                case 'S':
                    top[j].style.backgroundColor = 'transparent';
                    mid[j].style.backgroundColor = '#000';
                    btm[j].style.backgroundColor = 'transparent';
                    break;
                default:
                    top[j].style.backgroundColor = '#f00';
                    mid[j].style.backgroundColor = '#f00';
                    btm[j].style.backgroundColor = '#f00';
                    break;
            }
        }

        for (let i = len; i < 65; i++) {
            let j = 2 * i;
            top[j].style.backgroundColor = 'transparent';
            mid[j].style.backgroundColor = '#ccc';
            btm[j].style.backgroundColor = 'transparent';
        }

        return barcode.length;
    }

};

// Populate the CodeWord Tables
formatting.buildCodeWords(5,    0, 1286);
formatting.buildCodeWords(2, 1287, 1364);

module.exports = formatting;