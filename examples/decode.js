"use strict";

const _ = require('underscore');
const decode = require('../src/_decode');

module.exports = (function () {
    console.log("Loaded");

    const controlDecode = _.pick({
        delivery_pt:    "",
        zip:            "",
        plus4:          "",
        barcode_id:     "12",
        service_type:   "234",
        mailer_id:      "567094",
        serial_num:     "987654321"
    }, _.identity);
    console.log("Control:", controlDecode);

    const TEST_STRING = "ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT";

    const testDecode = decode(TEST_STRING);
    console.log("Test:   ", testDecode);
    console.log("Equal:  ", _.isEqual(controlDecode, testDecode) ? "ok" : "fail");

    decode(TEST_STRING, (err, imb_object) => {
        if (err)
            throw new Error(err);

        console.log("\nCallback", imb_object);
        console.log("Equal:  ", _.isEqual(controlDecode, imb_object) ? "ok" : "fail");

    });
})();
