"use strict";

const encode = require('../src/_encode');

module.exports = (function () {
    console.log("Loaded Sample Encode");

    // Control Based on:
    // Barcode ID = 01
    // Service Type = 234
    // Mailer ID = 567094
    // Serial Number = 987654321
    const controlEncode = "ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT";
    console.log("Control:", controlEncode);

    const TEST_OBJECT = {
        delivery_pt:    "",
        zip:            "",
        plus4:          "",
        barcode_id:     "12",
        service_type:   "234",
        mailer_id:      "567094",
        serial_num:     "987654321"
    };

    const testEncode = encode(TEST_OBJECT);
    console.log("Test:   ", testEncode);
    console.log("Equal:  ", controlEncode === testEncode ? "ok" : "fail");

    encode(TEST_OBJECT, (err, imb_string) => {
        if (err)
            throw new Error(err);

        console.log("\nCallback", imb_string);
        console.log("Equal:  ", controlEncode === imb_string ? "ok" : "fail");

    });

})();
