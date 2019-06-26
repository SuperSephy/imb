'use strict';

const _ = require('underscore');

const {
    encode_table,
    add,
    divideModulus,
    multiplyAndAdd,
    charactersToText,
    calculateFrameCheck,
    cleanString
} = require('./lib/formatting');

/**
 *
 * @param {object}      imb_fields
 * @param {string}      imb_fields.zip             5 digit number or string of numbers
 * @param {string}      imb_fields.plus4           4 digit number or string of numbers
 * @param {string}      imb_fields.delivery_pt     2 digit number or string of numbers
 * @param {string}      imb_fields.barcode_id      2 digit number or string of numbers, second number < 5
 * @param {string}      imb_fields.service_type    3 digit number or string of numbers
 * @param {string}      imb_fields.mailer_id       6 || 9 digit number or string of numbers
 * @param {string}      imb_fields.serial_num      6 || 9 digit number or string of numbers, depends on mailer_id
 * @param {function}    [callback]
 * @returns {*}
 */
module.exports = function encode(imb_fields, callback) {
    let message = check_encode_input(imb_fields);
    if (message) {
        console.error("Encode Error", message);
        if (callback) return callback(message);
        throw new Error(message);
    }

    return encode_fields(imb_fields, callback);
};

/**
 *
 * @param {object}      encode_input
 * @param {function}    [callback]
 * @returns {string|null}
 */
function check_encode_input(encode_input, callback) {
    _.mapObject(encode_input, cleanString);

    // Zip Code is optional, but must be 5 | 9 digits
    if (encode_input.zip) {
        if (!checkDigits(encode_input.zip, 5))
            return "Zip code must be 5 digits";
    } else {
        encode_input.zip = "";
    }

    // Zip Code may have separate plus four field
    if (encode_input.plus4) {
        if (encode_input.zip === "")
            return "Zip code is required if Zip Code plus4 is provided";
        if (!checkDigits(encode_input.plus4, 4))
            return "plus4 must be 4 digits";
    } else {
        encode_input.plus4 = "";
    }

    // Delivery Point Must be 2 digits
    if (encode_input.delivery_pt) {
        if (!checkDigits(encode_input.delivery_pt, 2))
            return "Delivery Point must be 2 digits";
    } else {
        encode_input.delivery_pt = "";
    }

    // Barcode ID must be 2 digits, second digit must be less than 4
    if (!checkDigits(encode_input.barcode_id, 2))
        return "Barcode ID must be 2 digits";
    if (encode_input.barcode_id.charAt(1) >= "5")
        return "Second digit of Barcode ID must be 0-4";

    if (!checkDigits(encode_input.service_type, 3))
        return "Service Type must be 3 digits";

    if (!checkDigits(encode_input.mailer_id, 6, 9))
        return "Mailer ID must be 6 or 9 digits";

    if (!checkDigits(encode_input.serial_num) || encode_input.mailer_id.length + encode_input.serial_num.length !== 15)
        return "Mailer ID and Serial Number together must be 15 digits";

    function checkDigits(str,n, n2) {
        if (/\D/.test(str)) return false;
        return !n || str.length === n || str.length === n2;
    }

    return null;
}



function encode_fields(imb_fields, callback) {
    let n;
    let num     = [0,0,0,0,0,0,0,0,0,0];
    let marker  = 0;

    if (imb_fields.zip !== "") {
        num[9] = parseInt(imb_fields.zip, 10);
        marker += 1;
    }
    if (imb_fields.plus4 !== "") {
        multiplyAndAdd(num, 10000, parseInt(imb_fields.plus4,10));
        marker += 100000;
    }
    if (imb_fields.delivery_pt !== "") {
        multiplyAndAdd(num, 100, parseInt(imb_fields.delivery_pt,10));
        marker += 1000000000;
    }
    add(num, marker);

    multiplyAndAdd(num, 10, parseInt(imb_fields.barcode_id.charAt(0),10));
    multiplyAndAdd(num, 5, parseInt(imb_fields.barcode_id.charAt(1),10));
    multiplyAndAdd(num, 1000, parseInt(imb_fields.service_type,10));

    if (imb_fields.mailer_id.length === 6) {
        multiplyAndAdd(num, 1000000, parseInt(imb_fields.mailer_id,10));
        multiplyAndAdd(num, 100000, 0);  // multiply in two steps to avoid overflow
        multiplyAndAdd(num, 10000, parseInt(imb_fields.serial_num, 10));
    }
    else {
        multiplyAndAdd(num, 10000, 0);
        multiplyAndAdd(num, 100000, parseInt(imb_fields.mailer_id, 10));
        multiplyAndAdd(num, 1000000, parseInt(imb_fields.serial_num, 10));
    }

    const fcs = calculateFrameCheck(num);

    let cw = new Array(10);
    cw[9] = divideModulus(num, 636) << 1;

    for (n = 8; n > 0; n--) {
        cw[n] = divideModulus(num, 1365);
    }

    cw[0] = (num[8]<<11) | num[9];
    if (fcs & (1 << 10)) cw[0] += 659;

    const chars = new Array(10);
    for (n = 0; n < 10; n++) {
        chars[n] = encode_table[cw[n]];
        if (fcs & (1 << n)) chars[n] ^= 8191;
    }

    const imb_string = charactersToText(chars);

    return callback
        ? callback(null, imb_string)
        : imb_string;
}